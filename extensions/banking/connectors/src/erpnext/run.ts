// An ERPNext payment run's way through the realm.
//
//   Ready for approval   the treasurer in ERPNext asks for it
//   Awaiting the realm   the connector filed a motion in the realm's treasury department: its seats vote on it, under
//                        the department's own policy (m of n)
//   Approved: file ready the realm approved it; the connector wrote the pain.001, recorded its sha256 in the realm (a
//                        dispatch to the bank naming the motion and the hash), and only then attached it to the run
//   Rejected by the realm the motion was rejected, withdrawn or expired: no file is ever written
//   Problem              what stops the file, in realm_note
//
// The realm sees ids and amounts only: the names and IBANs stay in ERPNext, which writes them into the file.

import { decimalsOf, type Account, type PaymentLine, type PaymentOrder } from '../../../frontend-rt/src/lib/order.ts';
import { formatById } from '../../../frontend-rt/src/lib/formats.ts';
import { ibanCountry } from '../../../frontend-rt/src/lib/iban.ts';
import { sha256Hex, type Realm } from '../../../frontend-rt/src/lib/realm.ts';
import type { ErpNext } from './client.ts';

export const RUN = 'Realm Payment Run';

export const STATUS = {
	ready: 'Ready for approval',
	awaiting: 'Awaiting the realm',
	released: 'Approved: file ready',
	rejected: 'Rejected by the realm',
	problem: 'Problem',
} as const;

export interface Env {
	erp: ErpNext;
	realm: Realm;
	/** The realm department whose seats approve payment runs. */
	treasury: string;
	software: PaymentOrder['software'];
	now: () => Date;
	log: (line: string) => void;
}

/** ERPNext keeps amounts as decimals; the file and the realm count minor units. */
export function minorUnits(amount: number, currency: string): number {
	return Math.round(Number(amount) * 10 ** decimalsOf(currency));
}

function money(minor: number, currency: string): string {
	const decimals = decimalsOf(currency);
	return `${currency} ${(minor / 10 ** decimals).toLocaleString('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/** The motion the realm votes on: the run's payments by ERPNext id and amount, no name and no account. */
export function motionOf(run: any): { title: string; description: string } {
	const lines = run.items.map((item: any, i: number) => {
		const currency = item.currency || run.currency;
		return `${lineId(run.name, i, run.items.length)} · ${item.purchase_invoice || 'no invoice'} · ${money(minorUnits(item.amount, currency), currency)}`;
	});
	const totals = new Map<string, number>();
	for (const item of run.items) {
		const currency = item.currency || run.currency;
		totals.set(currency, (totals.get(currency) ?? 0) + minorUnits(item.amount, currency));
	}
	const total = [...totals].map(([c, a]) => money(a, c)).join(' + ');
	return {
		title: `Approve ERPNext payment run ${run.name}: ${run.items.length} payments, ${total}`,
		description: [
			`ERPNext asks the treasury to approve payment run ${run.name} of ${run.company}, to be executed on ${run.execution_date}.`,
			'The payees and their bank accounts are in ERPNext: check them there before you vote.',
			'Once approved, the payment file is written and its sha256 recorded here before ERPNext releases it.',
			'',
			...lines,
		].join('\n'),
	};
}

export function lineId(run: string, index: number, count: number): string {
	return `${run}-${String(index + 1).padStart(Math.max(2, String(count).length), '0')}`;
}

/** What a proposal's status means for the run. */
export function outcomeOf(status: string): 'pending' | 'approved' | 'rejected' {
	if (status === 'accepted' || status === 'executed' || status === 'execution_scheduled') return 'approved';
	if (status === 'draft' || status === 'voting') return 'pending';
	return 'rejected';
}

// --- reading the run's accounts from ERPNext --------------------------------------------------------------------------

async function countryCode(erp: ErpNext, country: string): Promise<string> {
	return String((await erp.get('Country', country)).code ?? '').toUpperCase();
}

/** The first address linked to ``doctype`` ``name``, as a payment file's structured address. */
async function addressOf(erp: ErpNext, doctype: string, name: string): Promise<Account['address']> {
	const [address] = await erp.list(
		'Address',
		[['Dynamic Link', 'link_doctype', '=', doctype], ['Dynamic Link', 'link_name', '=', name]],
		['address_line1', 'pincode', 'city', 'country'],
	);
	if (!address) return undefined;
	return { street: address.address_line1 || undefined, postCode: address.pincode || undefined, town: address.city,
		country: await countryCode(erp, address.country) };
}

async function bicOf(erp: ErpNext, bank: string): Promise<string | undefined> {
	return bank ? (await erp.get('Bank', bank)).swift_number || undefined : undefined;
}

async function companyAccount(erp: ErpNext, company: string): Promise<Account> {
	const [account] = await erp.list('Bank Account', [['is_company_account', '=', 1], ['company', '=', company]], ['iban', 'bank']);
	if (!account?.iban) throw new Error(`${company} has no company bank account with an IBAN`);
	return { name: company, iban: account.iban, bic: await bicOf(erp, account.bank), address: await addressOf(erp, 'Company', company) };
}

async function supplierAccount(erp: ErpNext, supplier: string): Promise<Account> {
	const accounts = await erp.list('Bank Account', [['party_type', '=', 'Supplier'], ['party', '=', supplier]], ['iban', 'bank', 'is_default']);
	const account = accounts.find((a) => a.is_default) ?? accounts[0];
	if (!account?.iban) throw new Error(`supplier ${supplier} has no bank account with an IBAN`);
	const name = (await erp.get('Supplier', supplier)).supplier_name || supplier;
	return { name, iban: account.iban, bic: await bicOf(erp, account.bank), address: await addressOf(erp, 'Supplier', supplier) };
}

/** The run as a payment order: ERPNext's run id is the file's MsgId, and each payment's id its EndToEndId. */
export async function orderOfRun(erp: ErpNext, run: any, createdAt: string, software: PaymentOrder['software']): Promise<PaymentOrder> {
	const lines: PaymentLine[] = [];
	for (const [i, item] of run.items.entries()) {
		const currency = item.currency || run.currency;
		lines.push({
			id: lineId(run.name, i, run.items.length),
			payee: await supplierAccount(erp, item.supplier),
			amount: minorUnits(item.amount, currency),
			currency,
			reference: item.reference ? { kind: item.reference_kind || 'SCOR', value: item.reference } : undefined,
			note: item.note || item.purchase_invoice || undefined,
		});
	}
	return { messageId: run.name, createdAt, executionDate: run.execution_date, debtor: await companyAccount(erp, run.company), lines, software };
}

// --- the steps ----------------------------------------------------------------------------------------------------

async function problem(env: Env, run: any, note: string) {
	env.log(`${run.name}: ${note}`);
	await env.erp.update(RUN, run.name, { realm_status: STATUS.problem, realm_note: note });
}

/** File the run's motion in the treasury department. */
export async function submit(env: Env, name: string) {
	const run = await env.erp.get(RUN, name);
	if (!run.items?.length) return problem(env, run, 'The run has no payments');
	const motion = motionOf(run);
	const { proposal } = await env.realm.run('proposal_create', { ...motion, department: env.treasury, kind: 'payment run', tags: ['erpnext'] });
	await env.erp.update(RUN, name, { realm_status: STATUS.awaiting, realm_proposal: proposal, realm_note: '' });
	env.log(`${name}: filed as ${proposal} in ${env.treasury}`);
}

/** Follow the vote; once the realm approved the run, write the file, commit its hash, then hand it to ERPNext. */
export async function follow(env: Env, name: string) {
	const run = await env.erp.get(RUN, name);
	const { proposal, tally, eligible } = await env.realm.read('proposal_get', { proposal: run.realm_proposal });
	const votes = `${tally?.yes ?? 0} yes, ${tally?.no ?? 0} no of ${eligible} seats (${proposal.status})`;
	const outcome = outcomeOf(proposal.status);
	if (outcome === 'pending') {
		if (run.realm_votes !== votes) await env.erp.update(RUN, name, { realm_votes: votes });
		return;
	}
	if (outcome === 'rejected') {
		await env.erp.update(RUN, name, { realm_status: STATUS.rejected, realm_votes: votes });
		env.log(`${name}: ${run.realm_proposal} ended ${proposal.status}; no file`);
		return;
	}
	await release(env, { ...run, realm_votes: votes });
}

async function release(env: Env, run: any) {
	// The creation time is kept on the run first, so that the file written again after a failure is the same file.
	const createdAt = run.file_created_at || env.now().toISOString().slice(0, 19) + '+00:00';
	if (!run.file_created_at) await env.erp.update(RUN, run.name, { file_created_at: createdAt, realm_votes: run.realm_votes });
	let order: PaymentOrder;
	try {
		order = await orderOfRun(env.erp, run, createdAt, env.software);
	} catch (e) {
		return problem(env, run, String((e as Error).message));
	}
	const country = ibanCountry(order.debtor.iban);
	const format = formatById(country === 'CH' || country === 'LI' ? 'sps-2025' : 'sepa-2025');
	const problems = format.problems(order);
	if (problems.length) return problem(env, run, problems.map((p) => (p.line ? `${p.line}: ${p.message}` : p.message)).join('; '));
	const file = format.write(order);
	const sha = await sha256Hex(file);
	if (run.realm_dispatch && run.file_sha256 !== sha) return problem(env, run, 'The file written again differs from the one committed');
	if (!run.realm_dispatch) {
		const { dispatch } = await env.realm.run('notification_send', {
			recipient: 'External:bank', topic: 'erpnext.payment_run', body: run.name,
			title: `ERPNext payment run ${run.name} approved by ${run.realm_proposal} sha256:${sha}`,
		});
		await env.erp.update(RUN, run.name, { realm_dispatch: dispatch, file_sha256: sha });
		env.log(`${run.name}: approved by ${run.realm_proposal}; sha256 ${sha.slice(0, 16)}… committed as ${dispatch}`);
	}
	await env.erp.attach(RUN, run.name, `${run.name}.xml`, file);
	await env.erp.update(RUN, run.name, { realm_status: STATUS.released, realm_note: `${format.label}` });
	env.log(`${run.name}: ${run.name}.xml attached in ERPNext`);
}

/** One pass over the runs that wait for the connector. */
export async function step(env: Env) {
	for (const { name } of await env.erp.list(RUN, [['realm_status', '=', STATUS.ready]])) {
		await submit(env, name).catch((e) => env.log(`${name}: ${(e as Error).message}`));
	}
	for (const { name } of await env.erp.list(RUN, [['realm_status', '=', STATUS.awaiting]])) {
		await follow(env, name).catch((e) => env.log(`${name}: ${(e as Error).message}`));
	}
}
