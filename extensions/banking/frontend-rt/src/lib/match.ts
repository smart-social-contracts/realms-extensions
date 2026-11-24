// Matching a bank statement against what the realm ordered and invoiced.
//
// Outgoing: a payment comes back with the EndToEndId the file gave it, which is the realm's payment id. A bank that
// books a payment group as one entry (PostFinance always does so for salaries, whatever BtchBookg says) gives only
// the group's PmtInfId and total: the per-person lines never reach the statement, and the list the second signatory
// checked before signing is the only per-person record. Such an entry is matched as a whole group.
// Incoming: a payment to the realm carries the QR or creditor reference of the invoice it pays.
// Anything else goes on the review list.

import type { Statement, StatementEntry, StatementTransaction } from './camt.ts';
import { invoiceOfReference } from './references.ts';

/** What the realm sent to the bank: one committed batch, as its record keeps it. */
export interface SentBatch {
	messageId: string;
	lines: { id: string; amount: number; currency: string; group: string }[];
}

export type Match =
	| { kind: 'paid'; entry: string; line: string; amount: number; currency: string; date: string }
	| { kind: 'group_booked'; entry: string; group: string; lines: string[]; amount: number; currency: string; date: string }
	| { kind: 'returned'; entry: string; line: string; amount: number; currency: string; date: string }
	| { kind: 'incoming'; entry: string; invoice: string; reference: string; amount: number; currency: string; date: string }
	| { kind: 'review'; entry: string; reason: string; amount: number; currency: string; date: string; direction: 'in' | 'out';
			transaction?: StatementTransaction };

function linesById(batches: SentBatch[]) {
	return new Map(batches.flatMap((b) => b.lines.map((l) => [l.id, l] as const)));
}

function groupsById(batches: SentBatch[]) {
	const groups = new Map<string, SentBatch['lines']>();
	for (const line of batches.flatMap((b) => b.lines)) groups.set(line.group, [...(groups.get(line.group) ?? []), line]);
	return groups;
}

function review(e: StatementEntry, reason: string, tx?: StatementTransaction): Match {
	const money = tx ?? e;
	return { kind: 'review', entry: e.ref, reason, amount: money.amount, currency: money.currency, date: e.bookingDate,
		direction: e.direction, ...(tx ? { transaction: tx } : {}) };
}

function outgoing(e: StatementEntry, lines: ReturnType<typeof linesById>, groups: ReturnType<typeof groupsById>): Match[] {
	const known = e.transactions.filter((tx) => lines.has(tx.endToEndId));
	if (known.length) {
		return e.transactions.map((tx) => {
			const line = lines.get(tx.endToEndId);
			if (!line) return review(e, 'an outgoing payment the realm did not order', tx);
			if (line.amount !== tx.amount || line.currency !== tx.currency) {
				return review(e, `payment ${line.id} was ordered for a different amount`, tx);
			}
			return { kind: 'paid', entry: e.ref, line: line.id, amount: tx.amount, currency: tx.currency, date: e.bookingDate };
		});
	}
	const groupId = e.batch?.paymentGroupId || e.transactions.map((tx) => tx.paymentGroupId).find(Boolean) || '';
	const group = groups.get(groupId);
	if (!group) return [review(e, 'an outgoing payment the realm did not order')];
	const total = group.reduce((sum, l) => sum + l.amount, 0);
	if (total !== e.amount || group.some((l) => l.currency !== e.currency)) {
		return [review(e, `payment group ${groupId} was ordered for a different total`)];
	}
	return [{ kind: 'group_booked', entry: e.ref, group: groupId, lines: group.map((l) => l.id), amount: e.amount,
		currency: e.currency, date: e.bookingDate }];
}

function incoming(e: StatementEntry, lines: ReturnType<typeof linesById>): Match[] {
	const txs = e.transactions.length ? e.transactions : [null];
	return txs.map((tx) => {
		const money = tx ?? e;
		const returned = tx && lines.get(tx.endToEndId);
		if (returned) {
			return { kind: 'returned', entry: e.ref, line: returned.id, amount: money.amount, currency: money.currency, date: e.bookingDate };
		}
		const invoice = tx?.reference ? invoiceOfReference(tx.reference) : null;
		if (!tx || !invoice) return review(e, tx?.reference ? 'a reference that names no invoice' : 'a payment without a reference', tx ?? undefined);
		return { kind: 'incoming', entry: e.ref, invoice, reference: tx.reference, amount: money.amount, currency: money.currency,
			date: e.bookingDate };
	});
}

/** Every entry of ``statement`` matched to the realm's payments and invoices, or put on the review list. Entries
 * that are not booked yet (PDNG, INFO) and reversals are always reviewed by a person. */
export function matchStatement(statement: Statement, batches: SentBatch[]): Match[] {
	const lines = linesById(batches);
	const groups = groupsById(batches);
	return statement.entries.flatMap((e) => {
		if (e.status && e.status !== 'BOOK') return [review(e, `not booked yet (${e.status})`)];
		if (e.reversal) return [review(e, 'a reversal of an earlier entry')];
		return e.direction === 'out' ? outgoing(e, lines, groups) : incoming(e, lines);
	});
}

/** What the realm's record of an import keeps: ids, amounts and dates, never a name or an account. */
export function reportOf(statement: Statement, matches: Match[]) {
	return {
		statement: statement.id,
		kind: statement.kind,
		message: statement.messageId,
		paid: matches.flatMap((m) => (m.kind === 'paid' ? [[m.line, m.amount, m.currency, m.date]] : [])),
		group_booked: matches.flatMap((m) =>
			m.kind === 'group_booked' ? [[m.group, m.lines.length, m.amount, m.currency, m.date]] : [],
		),
		returned: matches.flatMap((m) => (m.kind === 'returned' ? [[m.line, m.amount, m.currency, m.date]] : [])),
		incoming: matches.flatMap((m) => (m.kind === 'incoming' ? [[m.invoice, m.amount, m.currency, m.date]] : [])),
		to_review: matches.filter((m) => m.kind === 'review').length,
	};
}
