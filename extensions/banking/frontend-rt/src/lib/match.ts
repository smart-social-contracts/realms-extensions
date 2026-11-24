// Matching a bank statement against what the realm sent to the bank and invoiced.
//
// A payment the realm ordered, or a direct debit it collects, comes back with the EndToEndId the file gave it, which is
// its realm id: a payment is booked as a debit and a collection as a credit; the opposite direction is the bank
// sending it back. A bank that books a payment group as one entry (PostFinance always does so for salaries, whatever
// BtchBookg says) gives only the group's PmtInfId and total: the per-person lines never reach the statement, and the
// list the second signatory checked before signing is the only per-person record. Such an entry is matched as a whole
// group. A payment to the realm carries the QR or creditor reference of the invoice it pays.
// Anything else goes on the review list.

import type { Statement, StatementEntry, StatementTransaction } from './camt.ts';
import { invoiceOfReference } from './references.ts';

/** What the realm sent to the bank: one committed order, as its record keeps it. */
export interface SentBatch {
	messageId: string;
	/** A payment order pays out; a collection (direct debit) brings money in. */
	kind: 'payment' | 'collection';
	lines: { id: string; amount: number; currency: string; group: string }[];
}

type Money = { entry: string; amount: number; currency: string; date: string };

export type Match =
	| (Money & { kind: 'paid' | 'collected' | 'returned'; line: string })
	| (Money & { kind: 'group_booked'; group: string; lines: string[] })
	| (Money & { kind: 'incoming'; invoice: string; reference: string })
	| (Money & { kind: 'review'; reason: string; direction: 'in' | 'out'; transaction?: StatementTransaction });

type Sent = SentBatch['lines'][0] & { kind: SentBatch['kind'] };

function linesById(batches: SentBatch[]): Map<string, Sent> {
	return new Map(batches.flatMap((b) => b.lines.map((l) => [l.id, { ...l, kind: b.kind }] as const)));
}

function groupsById(batches: SentBatch[]): Map<string, Sent[]> {
	const groups = new Map<string, Sent[]>();
	for (const line of linesById(batches).values()) groups.set(line.group, [...(groups.get(line.group) ?? []), line]);
	return groups;
}

function review(e: StatementEntry, reason: string, tx?: StatementTransaction): Match {
	const money = tx ?? e;
	return { kind: 'review', entry: e.ref, reason, amount: money.amount, currency: money.currency, date: e.bookingDate,
		direction: e.direction, ...(tx ? { transaction: tx } : {}) };
}

/** A payment is booked as a debit and a collection as a credit: that is the direction in which each one is done. */
function done(line: Sent, direction: StatementEntry['direction']): boolean {
	return (line.kind === 'payment') === (direction === 'out');
}

/** A payment to the realm, matched to the invoice its reference names. */
function byReference(e: StatementEntry, tx: StatementTransaction | null): Match {
	const invoice = tx?.reference ? invoiceOfReference(tx.reference) : null;
	if (!tx || !invoice) return review(e, tx?.reference ? 'a reference that names no invoice' : 'a payment without a reference', tx ?? undefined);
	return { kind: 'incoming', entry: e.ref, invoice, reference: tx.reference, amount: tx.amount, currency: tx.currency, date: e.bookingDate };
}

/** Each transaction of the entry: one the realm sent is paid, collected or sent back; another is an invoice paid or
 * goes on the review list. */
function byTransaction(e: StatementEntry, lines: Map<string, Sent>): Match[] {
	const txs = e.transactions.length ? e.transactions : [null];
	return txs.map((tx) => {
		const line = tx && lines.get(tx.endToEndId);
		if (!tx || !line) {
			return e.direction === 'in' ? byReference(e, tx) : review(e, 'an outgoing payment the realm did not order', tx ?? undefined);
		}
		const money = { entry: e.ref, amount: tx.amount, currency: tx.currency, date: e.bookingDate, line: line.id };
		if (!done(line, e.direction)) return { kind: 'returned', ...money };
		if (line.amount !== tx.amount || line.currency !== tx.currency) {
			return review(e, `${line.id} was ordered for a different amount`, tx);
		}
		return { kind: line.kind === 'payment' ? 'paid' : 'collected', ...money };
	});
}

/** An entry that books a whole payment group at once: matched when the group's lines add up to it. */
function byGroup(e: StatementEntry, groups: Map<string, Sent[]>): Match[] | null {
	const groupId = e.batch?.paymentGroupId || e.transactions.map((tx) => tx.paymentGroupId).find(Boolean) || '';
	const group = groups.get(groupId);
	if (!group || !done(group[0], e.direction)) return null;
	const total = group.reduce((sum, l) => sum + l.amount, 0);
	if (total !== e.amount || group.some((l) => l.currency !== e.currency)) {
		return [review(e, `payment group ${groupId} was ordered for a different total`)];
	}
	return [{ kind: 'group_booked', entry: e.ref, group: groupId, lines: group.map((l) => l.id), amount: e.amount,
		currency: e.currency, date: e.bookingDate }];
}

/** Every entry of ``statement`` matched to the realm's orders and invoices, or put on the review list. Entries
 * that are not booked yet (PDNG, INFO: an intraday camt.052 has them) and reversals are always reviewed by a person. */
export function matchStatement(statement: Statement, batches: SentBatch[]): Match[] {
	const lines = linesById(batches);
	const groups = groupsById(batches);
	return statement.entries.flatMap((e) => {
		if (e.status && e.status !== 'BOOK') return [review(e, `not booked yet (${e.status})`)];
		if (e.reversal) return [review(e, 'a reversal of an earlier entry')];
		const sent = e.transactions.some((tx) => lines.has(tx.endToEndId));
		return (!sent && byGroup(e, groups)) || byTransaction(e, lines);
	});
}

/** What the realm's record of an import keeps: ids, amounts and dates, never a name or an account. */
export function reportOf(statement: Statement, matches: Match[]) {
	return {
		statement: statement.id,
		kind: statement.kind,
		message: statement.messageId,
		paid: matches.flatMap((m) => (m.kind === 'paid' ? [[m.line, m.amount, m.currency, m.date]] : [])),
		collected: matches.flatMap((m) => (m.kind === 'collected' ? [[m.line, m.amount, m.currency, m.date]] : [])),
		group_booked: matches.flatMap((m) =>
			m.kind === 'group_booked' ? [[m.group, m.lines.length, m.amount, m.currency, m.date]] : [],
		),
		returned: matches.flatMap((m) => (m.kind === 'returned' ? [[m.line, m.amount, m.currency, m.date]] : [])),
		incoming: matches.flatMap((m) => (m.kind === 'incoming' ? [[m.invoice, m.amount, m.currency, m.date]] : [])),
		to_review: matches.filter((m) => m.kind === 'review').length,
	};
}
