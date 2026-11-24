// The realm records on a small in-memory realm that refuses as the real one does (document.manage is for the
// department's staff, a key opens only for whom it was wrapped), with a vault that wraps a record's key per principal
// as the host's vetKeys one does. tests/e2e/walk.py runs the same flow on a local realm with the real vetKD.
import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { formatById } from './formats.ts';
import { factsOf, orderOf } from './compose.ts';
import {
	bankDispatches,
	commitApproved,
	commitOrder,
	proposeFile,
	confirmAtBank,
	loadRegister,
	Refused,
	saveRegister,
	sha256Hex,
	treasuriesOf,
	type Realm,
	type Register,
} from './realm.ts';
import { SWISS_ORDER } from './samples.ts';
import { checkFile, factsOfFile } from './upload.ts';
import type { Vault } from './vault.ts';

const TREASURER = 'treasurer-principal';
const SIGNATORY = 'signatory-principal';
const MEMBER = 'member-principal';

/** One AES key per principal stands in for the vetKey only that principal can derive. */
const principalKeys = new Map<string, CryptoKey>();
async function keyOf(principal: string) {
	if (!principalKeys.has(principal)) {
		principalKeys.set(principal, await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']));
	}
	return principalKeys.get(principal)!;
}
const hex = (b: ArrayBuffer | Uint8Array) => Buffer.from(b as ArrayBuffer).toString('hex');
const bytes = (h: string) => new Uint8Array(Buffer.from(h, 'hex'));

async function aes(key: CryptoKey, data: Uint8Array) {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	return hex(iv) + hex(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
}
async function unaes(key: CryptoKey, text: string) {
	return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(text.slice(0, 24)) }, key, bytes(text.slice(24))));
}

function vaultOf(me: string): Vault {
	return {
		async seal(recipients, data) {
			const dek = crypto.getRandomValues(new Uint8Array(32));
			const key = await crypto.subtle.importKey('raw', dek, 'AES-GCM', false, ['encrypt']);
			const ciphertext = await aes(key, new TextEncoder().encode(JSON.stringify(data)));
			const keys: Record<string, string> = {};
			for (const p of new Set(recipients)) keys[p] = await aes(await keyOf(p), dek);
			return { ciphertext, keys };
		},
		async open<T>(wrapped: string, ciphertext: string) {
			if (!wrapped) return null;
			const dek = await unaes(await keyOf(me), wrapped).catch(() => null);
			if (!dek) return null;
			const key = await crypto.subtle.importKey('raw', dek, 'AES-GCM', false, ['decrypt']);
			return JSON.parse(new TextDecoder().decode(await unaes(key, ciphertext))) as T;
		},
	};
}

/** Everything the realm was sent, as the audit log would keep it. */
let calls: { op: string; args: any }[];
let documents: Map<string, any>;
let dispatches: any[];
let proposals: Map<string, { status: string; args: any }>;

function realmAs(me: string, permissions: string[]): Realm {
	const staff = [TREASURER, SIGNATORY];
	function staffOnly(department: string) {
		if (department !== 'Treasury' || !staff.includes(me)) throw new Refused(`only ${department}'s staff manage its documents`);
	}
	const ops: Record<string, (a: any) => any> = {
		me: () => ({ permissions }),
		department_chart: () => ({
			chart: { department: 'Administration', head: '', positions: [], children: [
				{ department: 'Treasury', head: '', positions: [{ holders: staff.map((user) => ({ user })) }], children: [] },
			] },
		}),
		document_list: (a) => {
			staffOnly(a.department);
			return { documents: [...documents.values()].filter((d) => d.kind === a.kind), next: null };
		},
		document_store: (a) => {
			staffOnly(a.department);
			const id = a.document ?? `DOC-${documents.size + 1}`;
			documents.set(id, { id, kind: a.kind, ref: a.ref, facts: a.facts ?? {}, keys: a.keys, at: 1, author: me });
			return { document: id };
		},
		document_get: (a) => {
			const d = documents.get(a.document);
			if (!staff.includes(me) && !d.keys[me]) throw new Refused(`${a.document} was not shared with you`);
			return { document: d, wrapped_dek: d.keys[me] ?? '' };
		},
		notification_send: (a) => {
			dispatches.push({ id: `DSP-${dispatches.length + 1}`, to: a.recipient.split(':')[1], topic: a.topic, body: { text: a.body }, status: 'queued' });
			return { dispatch: dispatches.at(-1).id };
		},
		dispatch_list: (a) => ({ dispatches: dispatches.filter((d) => d.to === a.to), next: null }),
		proposal_create: (a) => {
			const id = `P-${proposals.size + 1}`;
			proposals.set(id, { status: 'voting', args: a });
			return { proposal: id };
		},
		proposal_get: (a) => ({ proposal: { id: a.proposal, status: proposals.get(a.proposal)!.status }, tally: { yes: 0, no: 0 }, eligible: 2 }),
		dispatch_confirm: (a) => {
			Object.assign(dispatches.find((d) => d.id === a.dispatch), { status: 'confirmed', receipt: a.outcome.Confirmed.receipt });
			return { dispatch: a.dispatch };
		},
	};
	const call = async (op: string, args: any = {}) => {
		calls.push({ op, args });
		return ops[op](args);
	};
	return { read: call, run: call };
}

const REGISTER: Register = {
	account: SWISS_ORDER.debtor,
	payees: SWISS_ORDER.lines.map((l, i) => ({ id: `P${i + 1}`, ...l.payee })),
};

beforeEach(() => {
	calls = [];
	documents = new Map();
	dispatches = [];
	proposals = new Map();
});

describe('encryption round trip', () => {
	it('stores the register as ciphertext only, which the other signatory opens and a member cannot', async () => {
		const treasurer = realmAs(TREASURER, ['treasury.manage']);
		const [treasury] = await treasuriesOf(treasurer, TREASURER);
		await saveRegister(treasurer, vaultOf(TREASURER), treasury, TREASURER, REGISTER, null, 'en');

		const sent = JSON.stringify(calls);
		for (const clear of ['CH9300762011623852957', 'CH5604835012345678009', 'Ada Example', 'Beispielweg', 'Zürich']) {
			assert.ok(!sent.includes(clear), `${clear} reached the realm in clear`);
		}
		const stored = calls.find((c) => c.op === 'document_store')!.args;
		assert.deepEqual(Object.keys(stored.keys).sort(), [SIGNATORY, TREASURER].sort());

		const signatory = realmAs(SIGNATORY, ['treasury.manage']);
		const opened = await loadRegister(signatory, vaultOf(SIGNATORY), treasury);
		assert.deepEqual(opened.register, REGISTER);

		// A member who somehow got the document's id holds no key to it.
		const member = realmAs(MEMBER, ['realm.data_view']);
		await assert.rejects(loadRegister(member, vaultOf(MEMBER), treasury), Refused);
		const [doc] = documents.values();
		assert.equal(await vaultOf(MEMBER).open(doc.keys[TREASURER], doc.ref.slice('inline:'.length)), null);
	});
});

describe('permission refusal', () => {
	it('finds no treasury for a member without the treasury permission, or one with it who holds no seat', async () => {
		assert.deepEqual(await treasuriesOf(realmAs(MEMBER, ['realm.data_view']), MEMBER), []);
		assert.deepEqual(await treasuriesOf(realmAs(MEMBER, ['treasury.manage']), MEMBER), []);
		assert.deepEqual(await treasuriesOf(realmAs(TREASURER, ['treasury.manage']), TREASURER), [
			{ department: 'Treasury', staff: [TREASURER, SIGNATORY] },
		]);
	});

	it("passes on the realm's refusal, so nothing is committed or handed out", async () => {
		const member = realmAs(MEMBER, ['treasury.manage']);
		const treasury = { department: 'Treasury', staff: [TREASURER, SIGNATORY] };
		const sps = formatById('sps-2025');
		const file = sps.write(SWISS_ORDER);
		const draft = { executionDate: SWISS_ORDER.executionDate, lines: SWISS_ORDER.lines.map((_, i) => ({ payee: `P${i + 1}` })) as any };
		const facts = factsOf(SWISS_ORDER, sps, draft, await sha256Hex(file));
		await assert.rejects(commitOrder(member, vaultOf(MEMBER), treasury, MEMBER, facts, file, 'en'), /only Treasury's staff/);
		assert.equal(documents.size, 0);
		assert.equal(dispatches.length, 0);
	});
});

describe('committing an order', () => {
	it('records the sha256 and the lines before the file goes out, and queues it for the bank', async () => {
		const treasurer = realmAs(TREASURER, ['treasury.manage']);
		const [treasury] = await treasuriesOf(treasurer, TREASURER);
		const sps = formatById('sps-2025');
		const draft = {
			executionDate: SWISS_ORDER.executionDate,
			lines: SWISS_ORDER.lines.map((l, i) => ({ payee: `P${i + 1}`, amount: String(l.amount / 100), currency: l.currency,
				salary: !!l.salary, referenceKind: l.reference?.kind ?? '', reference: l.reference?.value ?? '', note: l.note ?? '' })),
		} as const;
		const { order, problems } = orderOf(REGISTER, structuredClone(draft) as any, 'BK-20261124-0001', SWISS_ORDER.createdAt, SWISS_ORDER.software);
		assert.deepEqual(problems, []);
		const file = sps.write(order!);
		assert.equal(file, sps.write(SWISS_ORDER), 'the draft gives the same file as the sample order');
		const facts = factsOf(order!, sps, draft as any, await sha256Hex(file));

		await assert.rejects(commitOrder(treasurer, vaultOf(TREASURER), treasury, TREASURER, { ...facts, file_sha256: '0'.repeat(64) }, file, 'en'));
		const { document, dispatch } = await commitOrder(treasurer, vaultOf(TREASURER), treasury, TREASURER, facts, file, 'en');
		assert.deepEqual(calls.filter((c) => c.op !== 'me' && c.op !== 'department_chart').map((c) => c.op), ['document_store', 'notification_send']);
		const stored = calls.find((c) => c.op === 'document_store')!.args;
		assert.equal(stored.facts.file_sha256, await sha256Hex(file));
		assert.deepEqual(stored.facts.lines[0], ['BK-20261124-0001-01', 420000, 'CHF', 'BK-20261124-0001-1', 'P1', true]);
		assert.ok(!JSON.stringify(stored.facts).includes('CH56'), 'no IBAN in the facts');

		await confirmAtBank(treasurer, dispatch!, 'EB-778812');
		const outbox = await bankDispatches(treasurer);
		assert.deepEqual(outbox.get(document), { id: dispatch, status: 'confirmed', receipt: 'EB-778812', document });
	});
});

describe('a file from the ERP', () => {
	it('goes to the vote with its facts, and is committed for the bank only once approved', async () => {
		const treasurer = realmAs(TREASURER, ['treasury.manage']);
		const [treasury] = await treasuriesOf(treasurer, TREASURER);
		const file = formatById('sps-2025').write(SWISS_ORDER);
		const sha = await sha256Hex(file);
		const facts = factsOfFile(checkFile(file, null, [], sha), sha);

		const { document, proposal } = await proposeFile(treasurer, vaultOf(TREASURER), treasury, TREASURER, facts, file, 'en');
		assert.equal(proposals.get(proposal)!.args.department, 'Treasury');
		assert.ok(!JSON.stringify(proposals.get(proposal)!.args).includes('Ada'), 'no name in the motion');
		const stored = calls.find((c) => c.op === 'document_store')!.args;
		assert.deepEqual([stored.facts.proposal, stored.facts.source, stored.facts.file_sha256], [proposal, 'erp', sha]);

		await assert.rejects(commitApproved(treasurer, document, stored.facts), /has not approved/);
		assert.equal(dispatches.length, 0);
		proposals.get(proposal)!.status = 'accepted';
		await commitApproved(treasurer, document, stored.facts);
		assert.equal(dispatches[0].body.text, document);
		assert.equal(dispatches[0].topic, 'banking.order');
	});
});
