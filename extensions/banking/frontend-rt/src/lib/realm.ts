// What the Banking screen keeps in the realm, with no change to the realm: every record is a Document of the
// treasury department (only its staff store, list or read one, and only they hold its key), the bank is an outside
// body whose channel is manual, a payment order is a dispatch to it, and an imported statement is the operator's
// report of what the bank said (GGG's External, Dispatch and external_report).
//
//   banking.register   the realm's own account(s) and the payees' bank details: one encrypted record
//   banking.order      one committed payment or direct debit file, encrypted; its facts in clear: the file's sha256
//                      and each line's id, amount, currency and payment group, never a name or an IBAN
//   banking.statement  one imported camt file or pain.002 status report, encrypted, with what matched; its facts: the
//                      report, in clear

import type { Mandate } from './collection.ts';
import { decimalsOf, type Account } from './order.ts';
import type { Match } from './match.ts';
import { plain, type Vault } from './vault.ts';

export const KIND = { register: 'banking.register', order: 'banking.order', statement: 'banking.statement' } as const;
/** The outside body the realm's payment orders go to. */
export const BANK = 'bank';
const INLINE = 'inline:';
const PAGE = 500;

/** ``read`` and ``run`` of the realm, each resolving with the reply or throwing the realm's refusal. */
export interface Realm {
	read(name: string, args?: Record<string, unknown>): Promise<any>;
	run(name: string, args: Record<string, unknown>): Promise<any>;
}

export class Refused extends Error {}

/** The realm, through Banking's own backend (``backend/entry.py``): ``ctx.read``/``ctx.run`` run a function of it, which
 * answers ``{ok, ...}``. The reads are the realm's operations by their names; the writes are the backend's own
 * (``save_register``, ``commit_order``, ``import_statement``, ``dispatch_confirm``, ``register_bank``). */
export function realmOf(ctx: any): Realm {
	async function call(kind: 'read' | 'run', name: string, args: Record<string, unknown>) {
		const reply = await ctx[kind](name, plain(args));
		if (!reply?.ok) throw new Refused(String(reply?.error ?? `${name} was refused`));
		return reply;
	}
	return { read: (name, args = {}) => call('read', name, args), run: (name, args) => call('run', name, args) };
}

export async function sha256Hex(text: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function readAll(realm: Realm, name: string, key: string, args: Record<string, unknown> = {}): Promise<any[]> {
	const rows: any[] = [];
	for (let from: number | null = 1; from != null; ) {
		const reply = await realm.read(name, { ...args, from, count: PAGE });
		rows.push(...(reply[key] ?? []));
		from = reply.next ?? null;
	}
	return rows;
}

// --- who may use it ------------------------------------------------------------------------------------------------

export interface Treasury {
	department: string;
	/** Its head and seat holders: who the realm lets store and read its documents, and who gets their keys. */
	staff: string[];
}

function seatedIn(chart: any, principal: string, out: Treasury[] = []): Treasury[] {
	const staff = [chart.head, ...chart.positions.flatMap((p: any) => p.holders.map((h: any) => h.user))].filter(Boolean);
	if (staff.includes(principal)) out.push({ department: chart.department, staff: [...new Set<string>(staff)] });
	for (const child of chart.children ?? []) seatedIn(child, principal, out);
	return out;
}

/** The departments where ``principal`` holds a seat, when they hold the treasury permission: empty for anyone the
 * realm would refuse. The screen asks first so that it can say why; the realm refuses anyway. */
export async function treasuriesOf(realm: Realm, principal: string): Promise<Treasury[]> {
	const me = await realm.read('me');
	const permissions: string[] = me.permissions ?? [];
	if (!permissions.includes('treasury.manage') && !permissions.includes('all')) return [];
	const { chart } = await realm.read('department_chart');
	return seatedIn(chart, principal);
}

// --- encrypted records ---------------------------------------------------------------------------------------------

export interface Doc {
	id: string;
	kind: string;
	at: number;
	author: string;
	facts: Record<string, any>;
}

function docOf(view: any): Doc {
	return { id: view.id, kind: view.kind ?? '', at: Number(view.at ?? 0), author: view.author ?? '', facts: view.facts ?? {} };
}

export async function listDocs(realm: Realm, department: string, kind: string): Promise<Doc[]> {
	return (await readAll(realm, 'document_list', 'documents', { department, kind })).map(docOf);
}

/** ``data`` sealed for the treasury's staff, as the document of ``kind`` the backend stores (replacing ``existing``). */
export async function sealedDocument(
	vault: Vault,
	treasury: Treasury,
	me: string,
	record: { kind: string; title: string; language: string; data: unknown; facts?: Record<string, unknown>; existing?: string },
): Promise<Record<string, unknown>> {
	const sealed = await vault.seal([...treasury.staff, me], record.data);
	return {
		department: treasury.department,
		...(record.existing ? { document: record.existing } : {}),
		title: record.title,
		languages: [record.language],
		kind: record.kind,
		ref: INLINE + sealed.ciphertext,
		hash: await sha256Hex(sealed.ciphertext),
		keys: sealed.keys,
		...(record.facts ? { facts: record.facts } : {}),
	};
}

/** The record ``document`` holds, opened with the caller's key, and its facts. ``data`` is null without a key. */
export async function openSealed<T>(realm: Realm, vault: Vault, document: string): Promise<{ doc: Doc; data: T | null }> {
	const reply = await realm.read('document_get', { document });
	const ref = String(reply.document.ref ?? '');
	const data = ref.startsWith(INLINE) ? await vault.open<T>(reply.wrapped_dek, ref.slice(INLINE.length)) : null;
	return { doc: docOf(reply.document), data };
}

// --- the register --------------------------------------------------------------------------------------------------

export interface Payee extends Account {
	/** The register's own id of the payee, which an order's facts name instead of the person. */
	id: string;
	/** The SEPA direct debit mandate the payee signed, when the realm collects from them. */
	mandate?: Mandate;
}

export interface RealmAccount extends Account {
	/** The SEPA creditor identifier the realm collects under. */
	creditorId?: string;
	/** PostFinance's id of the realm for CH-DD collections. */
	rsPid?: string;
}

export interface Register {
	/** The realm's own account the orders pay from and the collections are credited to. */
	account: RealmAccount | null;
	payees: Payee[];
}

export const EMPTY_REGISTER: Register = { account: null, payees: [] };

export async function loadRegister(realm: Realm, vault: Vault, treasury: Treasury): Promise<{ doc: string | null; register: Register | null }> {
	const [doc] = await listDocs(realm, treasury.department, KIND.register);
	if (!doc) return { doc: null, register: EMPTY_REGISTER };
	const { data } = await openSealed<Register>(realm, vault, doc.id);
	return { doc: doc.id, register: data };
}

export async function saveRegister(realm: Realm, vault: Vault, treasury: Treasury, me: string, register: Register, existing: string | null, language: string) {
	const document = await sealedDocument(vault, treasury, me, {
		kind: KIND.register, title: 'Bank register', language, data: register, existing: existing ?? undefined,
	});
	return String((await realm.run('save_register', document)).document);
}

// --- orders and the bank --------------------------------------------------------------------------------------------

export interface OrderFacts {
	/** A payment order pays out; a collection (direct debit) brings money in. Absent on the first orders: payment. */
	kind?: 'payment' | 'collection';
	/** Who wrote the file: the realm, or the public body's ERP (uploaded and put to the vote). Absent: the realm. */
	source?: 'realm' | 'erp';
	/** The treasury's motion that approves a file from the ERP. */
	proposal?: string;
	format: string;
	message_id: string;
	file_sha256: string;
	execution_date: string;
	created_at: string;
	/** [payment id, amount (minor units), currency, payment group, payee id, salary]. */
	lines: [string, number, string, string, string, boolean][];
}

export interface CommittedOrder {
	document: string;
	dispatch: string | null;
}

/** Commit the file before anyone downloads it: its sha256 and lines go on the record, the encrypted file with them,
 * and the order goes in the bank's outbox, in one call of the backend (``commit_order``), which also names the hash in
 * the dispatch, from the facts: the audit log keeps a call's arguments only up to a size, which the encrypted file
 * passes, so the dispatch is where anyone who reads the log sees the commitment. Returns the document and the dispatch. */
export async function commitOrder(
	realm: Realm,
	vault: Vault,
	treasury: Treasury,
	me: string,
	facts: OrderFacts,
	file: string,
	language: string,
): Promise<CommittedOrder> {
	if (facts.file_sha256 !== (await sha256Hex(file))) throw new Error('the file is not the one whose hash is committed');
	const what = facts.kind === 'collection' ? 'Direct debit collection' : 'Payment order';
	const document = await sealedDocument(vault, treasury, me, {
		kind: KIND.order, title: `${what} ${facts.message_id}`, language, data: { format: facts.format, file }, facts,
	});
	const reply = await realm.run('commit_order', document);
	return { document: String(reply.document), dispatch: reply.dispatch ?? null };
}

// --- files from the public body's ERP, approved by the treasury's vote ------------------------------------------

/** What a proposal's status means for the file it approves. */
export function outcomeOf(status: string): 'pending' | 'approved' | 'rejected' {
	if (status === 'accepted' || status === 'executed' || status === 'execution_scheduled') return 'approved';
	if (status === 'draft' || status === 'voting') return 'pending';
	return 'rejected';
}

function moneyText(minor: number, currency: string): string {
	const decimals = decimalsOf(currency);
	return `${currency} ${(minor / 10 ** decimals).toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** The motion the treasury votes on: the file's payments by id and amount, and its sha256; never a name or an IBAN. */
export function motionOfFile(facts: OrderFacts): { title: string; description: string } {
	const what = facts.kind === 'collection' ? 'direct debit file' : 'payment file';
	const totals = new Map<string, number>();
	for (const [, amount, currency] of facts.lines) totals.set(currency, (totals.get(currency) ?? 0) + amount);
	const total = [...totals].map(([c, a]) => moneyText(a, c)).join(' + ');
	return {
		title: `Approve ${what} ${facts.message_id}: ${facts.lines.length} ${facts.kind === 'collection' ? 'collections' : 'payments'}, ${total}`,
		description: [
			`The ${what} ${facts.message_id} (${facts.format}) was made by the ERP and uploaded to the Banking screen, for ${facts.execution_date}.`,
			`Its sha256 is ${facts.file_sha256}. Only this exact file is approved: anyone can check a file against it in Banking.`,
			'The names and accounts are in the file and in the ERP: the treasury staff see them in Banking before voting.',
			'',
			...facts.lines.map(([id, amount, currency]) => `${id} · ${moneyText(amount, currency)}`),
		].join('\n'),
	};
}

/** Put a file the ERP made to the treasury's vote, in one call of the backend (``propose_file``): the motion, then the
 * encrypted file with its facts, naming the motion. */
export async function proposeFile(
	realm: Realm,
	vault: Vault,
	treasury: Treasury,
	me: string,
	facts: OrderFacts,
	file: string,
	language: string,
): Promise<{ document: string; proposal: string }> {
	if (facts.file_sha256 !== (await sha256Hex(file))) throw new Error('the file is not the one whose hash is proposed');
	const document = await sealedDocument(vault, treasury, me, {
		kind: KIND.order, title: `ERP file ${facts.message_id}`, language, data: { format: facts.format, file }, facts,
	});
	const reply = await realm.run('propose_file', { document, motion: { ...motionOfFile(facts), kind: 'payment file', tags: ['banking'] } });
	return { document: String(reply.document), proposal: String(reply.proposal) };
}

/** The vote on a file from the ERP: its status, what it means, and the tally. */
export async function approvalOf(realm: Realm, proposal: string) {
	const reply = await realm.read('proposal_get', { proposal });
	const status = String(reply.proposal.status);
	return { status, outcome: outcomeOf(status), yes: reply.tally?.yes ?? 0, no: reply.tally?.no ?? 0, eligible: reply.eligible ?? 0 };
}

/** Once the treasury approved the file, commit its hash to the bank's outbox, naming the motion. The backend
 * (``commit_approved``) reads the vote in the realm itself, and refuses a file the treasury has not approved. */
export async function commitApproved(realm: Realm, document: string, facts: OrderFacts): Promise<string> {
	void facts;
	const reply = await realm.run('commit_approved', { document });
	return String(reply.dispatch);
}

export interface Dispatch {
	id: string;
	status: 'queued' | 'confirmed' | 'failed';
	receipt: string;
	document: string;
}

/** The outbox to the bank, by the order document each dispatch names. */
export async function bankDispatches(realm: Realm): Promise<Map<string, Dispatch>> {
	const rows = await readAll(realm, 'dispatch_list', 'dispatches', { to: BANK });
	const out = new Map<string, Dispatch>();
	for (const d of rows) {
		const document = String(d.body?.text ?? '');
		if (d.topic === KIND.order && document) {
			out.set(document, { id: d.id, status: d.status, receipt: d.receipt ?? '', document });
		}
	}
	return out;
}

/** The operator's word that the bank accepted the order (it was uploaded and signed in the e-banking), or the bank's
 * own status report saying so. */
export function confirmAtBank(realm: Realm, dispatch: string, receipt: string) {
	return realm.run('dispatch_confirm', { dispatch, outcome: { Confirmed: { receipt } } });
}

/** The bank rejected the whole order (a pain.002 with status RJCT). */
export function failAtBank(realm: Realm, dispatch: string, reason: string) {
	return realm.run('dispatch_confirm', { dispatch, outcome: { Failed: reason } });
}

export async function bankRegistered(realm: Realm): Promise<boolean> {
	return (await readAll(realm, 'external_list', 'externals')).some((e) => e.id === BANK);
}

/** Register the bank as an outside body with a manual channel. A realm-wide change: it may be filed as a proposal. */
export function registerBank(realm: Realm, name: string) {
	return realm.run('register_bank', { name });
}

// --- statements ----------------------------------------------------------------------------------------------------

/** Store an imported bank file, a camt statement or a pain.002 status report (encrypted, with its matches), and report
 * each statement in it to the realm. */
export async function recordImport(
	realm: Realm,
	vault: Vault,
	treasury: Treasury,
	me: string,
	imported: { name: string; file: string; matches: Match[]; reports: Record<string, unknown>[]; topic?: string },
	language: string,
): Promise<string> {
	const document = await sealedDocument(vault, treasury, me, {
		kind: KIND.statement,
		title: `Bank file ${imported.reports.map((r) => r.statement).join(', ')}`,
		language,
		data: { name: imported.name, file: imported.file, matches: imported.matches },
		facts: { reports: imported.reports },
	});
	const reply = await realm.run('import_statement', { document, reports: imported.reports, topic: imported.topic ?? KIND.statement });
	return String(reply.document);
}
