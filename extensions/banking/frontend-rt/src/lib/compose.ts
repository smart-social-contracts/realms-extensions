// From what the treasurer typed to a payment order and the facts the realm keeps of it.

import { ibanCountry } from './iban.ts';
import { parseAmount, type PaymentLine, type PaymentOrder, type Problem } from './order.ts';
import type { PaymentFormat } from './formats.ts';
import { sentBatch } from './formats.ts';
import type { Doc, OrderFacts, Register } from './realm.ts';

export interface DraftLine {
	payee: string;
	amount: string;
	currency: string;
	salary: boolean;
	referenceKind: '' | 'QRR' | 'SCOR';
	reference: string;
	note: string;
}

export interface Draft {
	executionDate: string;
	lines: DraftLine[];
}

/** The format a realm account is paid from by default: SPS from Switzerland and Liechtenstein, SEPA elsewhere. */
export function defaultFormat(register: Register): string {
	const country = register.account ? ibanCountry(register.account.iban) : 'CH';
	return country === 'CH' || country === 'LI' ? 'sps-2025' : 'sepa-2025';
}

/** "BK-20261124-0003": the day, then one more than the orders already committed (banks refuse a MsgId seen twice). */
export function nextMessageId(now: Date, orders: Doc[]): string {
	const day = now.toISOString().slice(0, 10).replace(/-/g, '');
	return `BK-${day}-${String(orders.length + 1).padStart(4, '0')}`;
}

/** ``now`` as a payment file's creation time, to the second, in UTC. */
export function createdAt(now: Date): string {
	return now.toISOString().slice(0, 19) + '+00:00';
}

export function orderOf(
	register: Register,
	draft: Draft,
	messageId: string,
	created: string,
	software: PaymentOrder['software'],
): { order: PaymentOrder | null; problems: Problem[] } {
	if (!register.account) return { order: null, problems: [{ message: "The realm's own account is not in the register" }] };
	const problems: Problem[] = [];
	const width = Math.max(2, String(draft.lines.length).length);
	const lines: PaymentLine[] = draft.lines.map((d, i) => {
		const id = `${messageId}-${String(i + 1).padStart(width, '0')}`;
		const payee = register.payees.find((p) => p.id === d.payee);
		if (!payee) problems.push({ line: id, message: 'Choose a payee from the register' });
		const amount = parseAmount(d.amount, d.currency);
		if (amount === null) problems.push({ line: id, message: `"${d.amount}" is not an amount in ${d.currency}` });
		return {
			id,
			payee: payee ?? { name: '', iban: '' },
			amount: amount ?? 0,
			currency: d.currency,
			salary: d.salary,
			reference: d.referenceKind ? { kind: d.referenceKind, value: d.reference } : undefined,
			note: d.note.trim() || undefined,
		};
	});
	const order = { messageId, createdAt: created, executionDate: draft.executionDate, debtor: register.account, lines, software };
	return { order, problems };
}

/** What the realm keeps in clear of a committed order: per payment its id, amount, currency, group and payee id. */
export function factsOf(order: PaymentOrder, format: PaymentFormat, draft: Draft, sha256: string): OrderFacts {
	const groups = new Map(sentBatch(order, format).lines.map((l) => [l.id, l.group]));
	return {
		format: format.id,
		message_id: order.messageId,
		file_sha256: sha256,
		execution_date: order.executionDate,
		created_at: order.createdAt,
		lines: order.lines.map((l, i) => [l.id, l.amount, l.currency, groups.get(l.id) ?? '', draft.lines[i].payee, !!l.salary]),
	};
}

/** The sent batch a statement is matched against, from an order's facts. */
export function batchOfFacts(facts: OrderFacts) {
	return {
		messageId: facts.message_id,
		lines: facts.lines.map(([id, amount, currency, group]) => ({ id, amount, currency, group })),
	};
}
