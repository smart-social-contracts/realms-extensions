// The Odoo connector's steps on an in-memory Odoo and realm. Example IBANs only; made-up names.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { beforeEach, describe, it } from 'node:test';
import { formatById } from '../../../frontend-rt/src/lib/formats.ts';
import type { PaymentOrder } from '../../../frontend-rt/src/lib/order.ts';
import type { Odoo } from './client.ts';
import { digestOf, motionOf, ORDER, STATUS, step, type Env, type Payment } from './run.ts';

type Rec = Record<string, any>;
let db: Record<string, Rec[]>;
let calls: string[];
let proposals: Map<string, { status: string; description: string }>;
let dispatches: { title: string }[];

function matches(rec: Rec, [field, op, value]: [string, string, any]): boolean {
	const v = rec[field] ?? false;
	return op === '=' ? v === value : op === 'in' ? value.includes(v) : false;
}

const odoo: Odoo = {
	async call(model, method, args, kwargs = {}) {
		calls.push(`${model}.${method}`);
		const table = db[model] ?? [];
		if (method === 'search_read') return table.filter((r) => (args[0] as any[]).every((d) => matches(r, d))).slice(0, (kwargs.limit as number) ?? 1000);
		if (method === 'read') return (args[0] as number[]).map((id) => table.find((r) => r.id === id));
		if (method === 'write') return Object.assign(table.find((r) => r.id === (args[0] as number[])[0])!, args[1]);
		const order = table.find((r) => r.id === (args[0] as number[])[0])!;
		if (method === 'validate_tier') return (order.validation_status = 'validated');
		if (method === 'reject_tier') return (order.validation_status = 'rejected');
		throw new Error(`${model}.${method}`);
	},
};

const realm = {
	async read(_name: string, args: any) {
		const p = proposals.get(args.proposal)!;
		return { ok: true, proposal: { id: args.proposal, status: p.status, description: p.description }, tally: { yes: 0, no: 0 }, eligible: 2 };
	},
	async run(name: string, args: any) {
		calls.push(name);
		if (name === 'proposal_create') {
			const id = `P-${proposals.size + 1}`;
			proposals.set(id, { status: 'voting', description: args.description });
			return { ok: true, proposal: id };
		}
		dispatches.push({ title: args.title });
		return { ok: true, dispatch: `DSP-${dispatches.length}` };
	},
};

const env: Env = { odoo, realm, treasury: 'Treasury', log: () => {} };

const PAYEES = [
	{ name: 'Ada Example', iban: 'CH5604835012345678009', amount: 4200 },
	{ name: 'Bruno Sample', iban: 'CH5800791123000889012', amount: 3850.5 },
];

/** The file Odoo would write for the order: the Banking extension's SPS writer stands in for OCA's. */
function odooFile(ibans = PAYEES.map((p) => p.iban)): string {
	const order: PaymentOrder = {
		messageId: 'PAY0001', createdAt: '2026-11-24T16:00:00+00:00', executionDate: '2026-11-25',
		software: { name: 'Odoo', version: '18' },
		debtor: { name: 'Example Realm Association', iban: 'CH9300762011623852957', bic: 'EXMPCHZZ', address: { town: 'Bern', country: 'CH' } },
		lines: PAYEES.map((p, i) => ({ id: String(10 + i), payee: { name: p.name, iban: ibans[i], address: { town: 'Basel', country: 'CH' } },
			amount: Math.round(p.amount * 100), currency: 'CHF' })),
	};
	return formatById('sps-2025').write(order);
}

const order = () => db[ORDER][0];
function generate(xml: string) {
	order().state = 'generated';
	db['ir.attachment'].push({ id: 1, res_model: ORDER, res_id: 1, name: 'sct_PAY0001.xml', datas: Buffer.from(xml).toString('base64') });
}

beforeEach(() => {
	calls = [];
	proposals = new Map();
	dispatches = [];
	db = {
		[ORDER]: [{ id: 1, name: 'PAY0001', state: 'draft', validation_status: 'waiting', payment_line_ids: [10, 11], x_realm_proposal: false }],
		'account.payment.line': PAYEES.map((p, i) => ({ id: 10 + i, amount_currency: p.amount, currency_id: [5, 'CHF'], partner_bank_id: [20 + i, p.iban] })),
		'res.partner.bank': PAYEES.map((p, i) => ({ id: 20 + i, acc_number: p.iban.replace(/(.{4})/g, '$1 ').trim() })),
		'ir.attachment': [],
	};
});

describe('the motion', () => {
	it('names the payments by Odoo id and amount and binds their accounts by a digest, never showing them', async () => {
		const payments: Payment[] = PAYEES.map((p, i) => ({ id: String(10 + i), amount: Math.round(p.amount * 100), currency: 'CHF', iban: p.iban }));
		const { title, description } = motionOf({ name: 'PAY0001' }, payments, await digestOf(payments));
		assert.equal(title, 'Approve Odoo payment order PAY0001: 2 payments, CHF 8,050.50');
		assert.match(description, /Payments digest: [0-9a-f]{64}/);
		for (const personal of ['Ada', 'CH56', 'CH58']) assert.ok(!description.includes(personal), personal);
	});

	it('gives the same digest whatever the order of the payments, or their splitting per account', async () => {
		const a: Payment = { id: '1', amount: 100, currency: 'CHF', iban: 'CH5604835012345678009' };
		const b: Payment = { id: '2', amount: 250, currency: 'CHF', iban: 'CH5800791123000889012' };
		assert.equal(await digestOf([a, b]), await digestOf([b, a]));
		assert.equal(await digestOf([a, b]), await digestOf([{ ...a, amount: 60 }, b, { ...a, id: '3', amount: 40 }]));
		assert.notEqual(await digestOf([a, b]), await digestOf([a, { ...b, iban: 'CH9300762011623852957' }]));
	});
});

describe('an order through the realm', () => {
	it('is filed, approved in the realm, approved in Odoo, and its file committed once it matches', async () => {
		await step(env);
		assert.deepEqual([order().x_realm_status, order().x_realm_proposal], [STATUS.awaiting, 'P-1']);

		proposals.get('P-1')!.status = 'accepted';
		await step(env);
		assert.equal(order().validation_status, 'validated', 'the realm approved the review in Odoo');
		assert.equal(order().x_realm_status, STATUS.approved);
		assert.equal(dispatches.length, 0, 'nothing is committed before Odoo writes the file');

		const xml = odooFile();
		generate(xml);
		await step(env);
		assert.equal(order().x_realm_status, STATUS.committed);
		const sha = createHash('sha256').update(xml).digest('hex');
		assert.equal(dispatches[0].title, `Odoo payment order PAY0001 approved by P-1 sha256:${sha}`);
		assert.equal(order().x_file_sha256, sha);
	});

	it('commits nothing when the file pays another account than the realm approved', async () => {
		await step(env);
		proposals.get('P-1')!.status = 'accepted';
		await step(env);
		generate(odooFile(['CH5604835012345678009', 'CH9300762011623852957']));
		await step(env);
		assert.equal(order().x_realm_status, STATUS.problem);
		assert.match(order().x_realm_note, /does not hold the payments P-1 approved/);
		assert.equal(dispatches.length, 0);
	});

	it('rejects the review in Odoo when the realm rejects the order', async () => {
		await step(env);
		proposals.get('P-1')!.status = 'rejected';
		await step(env);
		assert.deepEqual([order().validation_status, order().x_realm_status], ['rejected', STATUS.rejected]);
		assert.ok(calls.includes(`${ORDER}.reject_tier`));
	});
});
