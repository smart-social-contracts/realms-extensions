// An Odoo payment order's way through the realm, with OCA's payment orders and tier validation.
//
// OCA's account_payment_order_tier_validation keeps a payment order in draft until its review is approved; the
// connector's Odoo user is that reviewer, so the realm's treasury decides:
//
//   the treasurer asks for validation      the order waits for its review in Odoo
//   Awaiting the realm                     the connector filed a motion in the treasury department: the order's
//                                          payments by id and amount, and a digest that binds their IBANs
//   Approved: confirm and generate in Odoo the realm approved; the connector approved the review, and Odoo lets the
//                                          treasurer confirm the order and generate its file
//   Approved: file committed               the file Odoo wrote holds exactly the approved payments; its sha256 is
//                                          recorded in the realm as a dispatch to the bank, before it is uploaded
//   Rejected by the realm                  the connector rejected the review: the order cannot be confirmed
//   Problem                                the file differs from what the realm approved: nothing is committed
//
// Odoo writes the file itself (pain.001.001.09.ch.03 with OCA's l10n_ch_pain_credit_transfer); the realm vouches that
// it holds the payments it approved, to the accounts it approved.

import { compactIban } from '../../../frontend-rt/src/lib/iban.ts';
import { decimalsOf, parseAmount } from '../../../frontend-rt/src/lib/order.ts';
import { sha256Hex, type Realm } from '../../../frontend-rt/src/lib/realm.ts';
import { readOrderFile } from '../../../frontend-rt/src/lib/review.ts';
import type { Odoo } from './client.ts';

export const ORDER = 'account.payment.order';

export const STATUS = {
	awaiting: 'Awaiting the realm',
	approved: 'Approved: confirm and generate the file in Odoo',
	committed: 'Approved: file committed, upload it in the e-banking',
	rejected: 'Rejected by the realm',
	problem: 'Problem',
} as const;

export interface Env {
	odoo: Odoo;
	realm: Realm;
	treasury: string;
	log: (line: string) => void;
}

/** One payment as the realm sees it: amount in minor units, currency, and the IBAN it goes to. */
export type Payment = { id: string; amount: number; currency: string; iban: string };

/** A digest of how much goes to each account in each currency: what the motion binds. Summed per account, because
 * OCA may merge several bills to one supplier into one payment of the file; sorted, so order does not matter. */
export async function digestOf(payments: Payment[]): Promise<string> {
	const sums = new Map<string, number>();
	for (const p of payments) {
		const key = `${p.currency} ${compactIban(p.iban)}`;
		sums.set(key, (sums.get(key) ?? 0) + p.amount);
	}
	return sha256Hex([...sums].map(([key, amount]) => `${amount} ${key}`).sort().join('\n'));
}

const DIGEST = /Payments digest: ([0-9a-f]{64})/;

function money(minor: number, currency: string): string {
	const d = decimalsOf(currency);
	return `${currency} ${(minor / 10 ** d).toLocaleString('en', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

/** The motion: the order's payments by Odoo id and amount, and the digest that binds their IBANs, which it never shows. */
export function motionOf(order: { name: string }, payments: Payment[], digest: string) {
	const totals = new Map<string, number>();
	for (const p of payments) totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.amount);
	const total = [...totals].map(([c, a]) => money(a, c)).join(' + ');
	return {
		title: `Approve Odoo payment order ${order.name}: ${payments.length} payments, ${total}`,
		description: [
			`Odoo asks the treasury to approve payment order ${order.name}. The payees and their accounts are in Odoo: check them there before you vote.`,
			'Once approved, Odoo writes the payment file; its payments must match these, to the same accounts, or nothing is committed for the bank.',
			`Payments digest: ${digest}`,
			'',
			...payments.map((p) => `Odoo payment ${p.id} · ${money(p.amount, p.currency)}`),
		].join('\n'),
	};
}

export function outcomeOf(status: string): 'pending' | 'approved' | 'rejected' {
	if (status === 'accepted' || status === 'executed' || status === 'execution_scheduled') return 'approved';
	if (status === 'draft' || status === 'voting') return 'pending';
	return 'rejected';
}

/** The order's payments, from its payment lines and their bank accounts. */
async function paymentsOf(odoo: Odoo, order: any): Promise<Payment[]> {
	const lines = await odoo.call('account.payment.line', 'read', [order.payment_line_ids], { fields: ['amount_currency', 'currency_id', 'partner_bank_id'] });
	const banks = await odoo.call('res.partner.bank', 'read', [lines.map((l: any) => l.partner_bank_id[0])], { fields: ['acc_number'] });
	const iban = new Map(banks.map((b: any) => [b.id, b.acc_number]));
	return lines.map((l: any) => {
		const currency = l.currency_id[1];
		return { id: String(l.id), amount: Math.round(l.amount_currency * 10 ** decimalsOf(currency)), currency, iban: String(iban.get(l.partner_bank_id[0])) };
	});
}

/** Write the connector's own fields. OCA locks a payment order while it is under validation; its skip_validation_check
 * context lets the connector record what the realm decided without touching anything else. */
const write = (env: Env, id: number, values: Record<string, unknown>) =>
	env.odoo.call(ORDER, 'write', [[id], values], { context: { skip_validation_check: true } });

/** Orders waiting for their review: file each as a motion in the treasury department. */
async function submit(env: Env) {
	const orders = await env.odoo.call(ORDER, 'search_read', [[['state', '=', 'draft'], ['validation_status', 'in', ['waiting', 'pending']], ['x_realm_proposal', '=', false]]],
		{ fields: ['name', 'payment_line_ids'] });
	for (const order of orders) {
		const payments = await paymentsOf(env.odoo, order);
		const digest = await digestOf(payments);
		const { proposal } = await env.realm.run('proposal_create', {
			...motionOf(order, payments, digest), department: env.treasury, kind: 'payment run', tags: ['odoo'],
		});
		await write(env, order.id, { x_realm_status: STATUS.awaiting, x_realm_proposal: proposal, x_realm_note: '' });
		env.log(`${order.name}: filed as ${proposal} in ${env.treasury}`);
	}
}

/** Follow each vote; the realm's decision is the review's. */
async function follow(env: Env) {
	const orders = await env.odoo.call(ORDER, 'search_read', [[['x_realm_status', '=', STATUS.awaiting]]], { fields: ['name', 'x_realm_proposal', 'x_realm_votes'] });
	for (const order of orders) {
		const { proposal, tally, eligible } = await env.realm.read('proposal_get', { proposal: order.x_realm_proposal });
		const votes = `${tally?.yes ?? 0} yes, ${tally?.no ?? 0} no of ${eligible} seats (${proposal.status})`;
		const outcome = outcomeOf(proposal.status);
		if (outcome === 'pending') {
			if (order.x_realm_votes !== votes) await write(env, order.id, { x_realm_votes: votes });
		} else if (outcome === 'approved') {
			await env.odoo.call(ORDER, 'validate_tier', [[order.id]]);
			await write(env, order.id, { x_realm_status: STATUS.approved, x_realm_votes: votes });
			env.log(`${order.name}: approved by ${order.x_realm_proposal}; the review is approved in Odoo`);
		} else {
			await env.odoo.call(ORDER, 'reject_tier', [[order.id]]);
			await write(env, order.id, { x_realm_status: STATUS.rejected, x_realm_votes: votes });
			env.log(`${order.name}: ${order.x_realm_proposal} ended ${proposal.status}; the review is rejected in Odoo`);
		}
	}
}

/** The payments a file holds, as the realm compares them. */
export function paymentsOfFile(xml: string): Payment[] {
	return readOrderFile(xml).lines.map((l) => ({ id: l.id, amount: parseAmount(l.amount, l.currency) ?? -1, currency: l.currency, iban: l.iban }));
}

/** Once Odoo generated the file: compare it with what the realm approved, then commit its hash for the bank. */
async function commit(env: Env) {
	const orders = await env.odoo.call(ORDER, 'search_read', [[['x_realm_status', '=', STATUS.approved], ['state', 'in', ['generated', 'uploaded']]]],
		{ fields: ['name', 'x_realm_proposal'] });
	for (const order of orders) {
		const [file] = await env.odoo.call('ir.attachment', 'search_read', [[['res_model', '=', ORDER], ['res_id', '=', order.id]]],
			{ fields: ['name', 'datas'], order: 'id desc', limit: 1 });
		if (!file) continue;
		const xml = Buffer.from(file.datas, 'base64').toString('utf8');
		const { proposal } = await env.realm.read('proposal_get', { proposal: order.x_realm_proposal });
		const approved = DIGEST.exec(String(proposal.description ?? ''))?.[1];
		const fromFile = await digestOf(paymentsOfFile(xml));
		if (!approved || approved !== fromFile) {
			await write(env, order.id, { x_realm_status: STATUS.problem, x_realm_note: `The file ${file.name} does not hold the payments ${order.x_realm_proposal} approved: nothing is committed for the bank` });
			env.log(`${order.name}: the file differs from what ${order.x_realm_proposal} approved`);
			continue;
		}
		const sha = await sha256Hex(xml);
		const { dispatch } = await env.realm.run('notification_send', {
			recipient: 'External:bank', topic: 'odoo.payment_order', body: order.name,
			title: `Odoo payment order ${order.name} approved by ${order.x_realm_proposal} sha256:${sha}`,
		});
		await write(env, order.id, { x_realm_status: STATUS.committed, x_realm_dispatch: dispatch, x_file_sha256: sha, x_realm_note: file.name });
		env.log(`${order.name}: ${file.name} matches ${order.x_realm_proposal}; sha256 ${sha.slice(0, 16)}… committed as ${dispatch}`);
	}
}

/** One pass: file new motions, follow votes, commit generated files. */
export async function step(env: Env) {
	for (const part of [submit, follow, commit]) await part(env).catch((e) => env.log(`odoo ${part.name}: ${(e as Error).message}`));
}
