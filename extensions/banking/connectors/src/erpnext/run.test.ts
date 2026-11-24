// The connector's steps on an in-memory ERPNext and realm. Example IBANs only (published documentation examples), made-up
// names.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import { readOrderFile } from '../../../frontend-rt/src/lib/review.ts';
import type { ErpNext } from './client.ts';
import { motionOf, outcomeOf, RUN, STATUS, step, type Env } from './run.ts';

type Doc = Record<string, any>;
let docs: Map<string, Doc[]>;
let calls: string[];
let proposals: Map<string, { status: string; yes: number }>;
let dispatches: { id: string; title: string }[];
let attached: { name: string; text: string }[];
let failAttach: boolean;

function matches(doc: Doc, [a, b, c, d]: any[]): boolean {
	if (d !== undefined) return (doc.links ?? []).some((l: Doc) => l[b] === d); // a child-table filter: [table, field, op, value]
	return doc[a] === c || (c === 1 && doc[a] === true);
}

const erp: ErpNext = {
	async list(doctype, filters) {
		return (docs.get(doctype) ?? []).filter((d) => filters.every((f) => matches(d, f as any[])));
	},
	async get(doctype, name) {
		const doc = (docs.get(doctype) ?? []).find((d) => d.name === name);
		if (!doc) throw new Error(`no ${doctype} ${name}`);
		return structuredClone(doc);
	},
	async update(doctype, name, values) {
		calls.push(`update ${Object.keys(values).join(',')}`);
		Object.assign((docs.get(doctype) ?? []).find((d) => d.name === name)!, values);
		return {};
	},
	async attach(_doctype, name, _file, text) {
		calls.push('attach');
		if (failAttach) throw new Error('ERPNext is down');
		attached.push({ name, text });
		return {};
	},
};

const realm = {
	async read(name: string, args: any = {}) {
		if (name !== 'proposal_get') throw new Error(name);
		const p = proposals.get(args.proposal)!;
		return { ok: true, proposal: { id: args.proposal, status: p.status }, tally: { yes: p.yes, no: 0 }, eligible: 2 };
	},
	async run(name: string, args: any) {
		calls.push(name);
		if (name === 'proposal_create') {
			const id = `P-${proposals.size + 10}`;
			proposals.set(id, { status: 'voting', yes: 0 });
			return { ok: true, proposal: id, args };
		}
		if (name === 'notification_send') {
			dispatches.push({ id: `DSP-${dispatches.length + 1}`, title: args.title });
			return { ok: true, dispatch: dispatches.at(-1)!.id };
		}
		throw new Error(name);
	},
};

const env: Env = {
	erp,
	realm,
	treasury: 'Treasury',
	software: { name: 'Realms ERPNext connector', version: '0.1.0' },
	now: () => new Date('2026-11-24T15:00:00Z'),
	log: () => {},
};

const address = (doctype: string, name: string, city: string, country = 'Switzerland') =>
	({ address_line1: 'Example Street 1', pincode: '3000', city, country, links: [{ link_doctype: doctype, link_name: name }] });

beforeEach(() => {
	calls = [];
	proposals = new Map();
	dispatches = [];
	attached = [];
	failAttach = false;
	docs = new Map<string, Doc[]>([
		[RUN, [{
			name: 'RPR-00001', company: 'Example Realm Association', currency: 'CHF', execution_date: '2026-11-27',
			realm_status: STATUS.ready,
			items: [
				{ supplier: 'SUP-0001', purchase_invoice: 'ACC-PINV-2026-00001', amount: 4200, currency: 'CHF' },
				{ supplier: 'SUP-0002', purchase_invoice: 'ACC-PINV-2026-00002', amount: 1250, currency: 'CHF',
					reference_kind: 'QRR', reference: '210000000003139471430009017' },
			],
		}]],
		['Bank Account', [
			{ is_company_account: 1, company: 'Example Realm Association', iban: 'CH9300762011623852957', bank: '' },
			{ party_type: 'Supplier', party: 'SUP-0001', iban: 'CH5604835012345678009', bank: '', is_default: 1 },
			{ party_type: 'Supplier', party: 'SUP-0002', iban: 'CH4431999123000889012', bank: '', is_default: 1 },
		]],
		['Supplier', [{ name: 'SUP-0001', supplier_name: 'Ada Example' }, { name: 'SUP-0002', supplier_name: 'Example Printing Ltd' }]],
		['Address', [
			address('Company', 'Example Realm Association', 'Bern'),
			address('Supplier', 'SUP-0001', 'Zürich'),
			address('Supplier', 'SUP-0002', 'Biel/Bienne'),
		]],
		['Country', [{ name: 'Switzerland', code: 'ch' }]],
	]);
});

const run = () => docs.get(RUN)![0];

describe('the motion', () => {
	it('lists ids and amounts, never a name or an IBAN', () => {
		const { title, description } = motionOf(run());
		assert.equal(title, 'Approve ERPNext payment run RPR-00001: 2 payments, CHF 5,450.00');
		assert.match(description, /RPR-00001-01 · ACC-PINV-2026-00001 · CHF 4,200.00/);
		for (const personal of ['Ada', 'Printing', 'CH56', 'CH44']) assert.ok(!description.includes(personal), personal);
	});

	it('reads a proposal status as pending, approved or rejected', () => {
		assert.deepEqual(['voting', 'accepted', 'executed', 'rejected', 'expired', 'withdrawn'].map(outcomeOf),
			['pending', 'approved', 'approved', 'rejected', 'rejected', 'rejected']);
	});
});

describe('a run through the realm', () => {
	it('is filed, waits for the vote, and once approved commits the hash before ERPNext gets the file', async () => {
		await step(env);
		assert.equal(run().realm_status, STATUS.awaiting);
		assert.equal(run().realm_proposal, 'P-10');

		await step(env);
		assert.equal(run().realm_status, STATUS.awaiting, 'still voting');
		assert.equal(run().realm_votes, '0 yes, 0 no of 2 seats (voting)');
		assert.equal(dispatches.length, 0);

		proposals.set('P-10', { status: 'executed', yes: 2 });
		calls = [];
		await step(env);
		assert.equal(run().realm_status, STATUS.released);
		assert.ok(calls.indexOf('notification_send') < calls.indexOf('attach'), 'the hash is committed before the file goes out');
		const [file] = attached;
		const sha = createHash('sha256').update(file.text).digest('hex');
		assert.equal(dispatches[0].title, `ERPNext payment run RPR-00001 approved by P-10 sha256:${sha}`);
		assert.equal(run().file_sha256, sha);
		const summary = readOrderFile(file.text);
		assert.equal(summary.messageId, 'RPR-00001');
		assert.deepEqual(summary.lines.map((l) => [l.id, l.name, l.iban, l.amount]), [
			['RPR-00001-01', 'Ada Example', 'CH5604835012345678009', '4200.00'],
			['RPR-00001-02', 'Example Printing Ltd', 'CH4431999123000889012', '1250.00'],
		]);
	});

	it('writes no file when the realm rejects the run', async () => {
		await step(env);
		proposals.set('P-10', { status: 'rejected', yes: 0 });
		await step(env);
		assert.equal(run().realm_status, STATUS.rejected);
		assert.deepEqual([dispatches.length, attached.length], [0, 0]);
	});

	it('stops at a problem, with no file and no commitment', async () => {
		docs.get('Bank Account')!.splice(1, 1);
		await step(env);
		proposals.set('P-10', { status: 'executed', yes: 2 });
		await step(env);
		assert.equal(run().realm_status, STATUS.problem);
		assert.match(run().realm_note, /SUP-0001 has no bank account/);
		assert.deepEqual([dispatches.length, attached.length], [0, 0]);
	});

	it('after a failure writes the same file again and commits it only once', async () => {
		await step(env);
		proposals.set('P-10', { status: 'executed', yes: 2 });
		failAttach = true;
		await step(env);
		assert.equal(run().realm_status, STATUS.awaiting);
		assert.equal(dispatches.length, 1);
		failAttach = false;
		await step(env);
		assert.equal(run().realm_status, STATUS.released);
		assert.equal(dispatches.length, 1);
		assert.equal(createHash('sha256').update(attached[0].text).digest('hex'), run().file_sha256);
	});
});
