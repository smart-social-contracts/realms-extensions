// From what the treasurer typed to a payment order or a direct debit collection, and the facts the realm keeps of it.

import type { CollectionLine, CollectionOrder, Sequence } from './collection.ts';
import { ibanCountry } from './iban.ts';
import { parseAmount, type PaymentLine, type PaymentOrder, type Problem } from './order.ts';
import type { FileFormat } from './formats.ts';
import { sentBatch } from './formats.ts';
import type { SentBatch } from './match.ts';
import type { Doc, OrderFacts, Register } from './realm.ts';

export interface DraftLine {
	payee: string;
	amount: string;
	currency: string;
	salary: boolean;
	/** A collection's SEPA sequence type. */
	sequence: Sequence;
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

/** Each draft line with its id, payee from the register and amount, and what is wrong with it. */
function linesOf(register: Register, draft: Draft, messageId: string, problems: Problem[]) {
	const width = Math.max(2, String(draft.lines.length).length);
	return draft.lines.map((d, i) => {
		const id = `${messageId}-${String(i + 1).padStart(width, '0')}`;
		const payee = register.payees.find((p) => p.id === d.payee);
		if (!payee) problems.push({ line: id, message: 'Choose someone from the register' });
		const amount = parseAmount(d.amount, d.currency);
		if (amount === null) problems.push({ line: id, message: `"${d.amount}" is not an amount in ${d.currency}` });
		return {
			id,
			party: payee ?? { name: '', iban: '' },
			amount: amount ?? 0,
			currency: d.currency,
			reference: d.referenceKind ? { kind: d.referenceKind, value: d.reference } : undefined,
			note: d.note.trim() || undefined,
		};
	});
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
	const lines: PaymentLine[] = linesOf(register, draft, messageId, problems).map(({ party, ...l }, i) => ({
		...l, payee: party, salary: draft.lines[i].salary,
	}));
	const order = { messageId, createdAt: created, executionDate: draft.executionDate, debtor: register.account, lines, software };
	return { order, problems };
}

/** A collection: the realm collects into its account, under its SEPA creditor identifier or, for CH-DD, its RS-PID. */
export function collectionOf(
	register: Register,
	draft: Draft,
	formatId: string,
	messageId: string,
	created: string,
	software: CollectionOrder['software'],
): { order: CollectionOrder | null; problems: Problem[] } {
	const account = register.account;
	if (!account) return { order: null, problems: [{ message: "The realm's own account is not in the register" }] };
	const problems: Problem[] = [];
	const lines: CollectionLine[] = linesOf(register, draft, messageId, problems).map(({ party, ...l }, i) => ({
		...l, payer: party, sequence: draft.lines[i].sequence,
	}));
	const creditorId = (formatId === 'ch-dd' ? account.rsPid : account.creditorId) ?? '';
	const order = { messageId, createdAt: created, collectionDate: draft.executionDate, creditor: account, creditorId, lines, software };
	return { order, problems };
}

/** What the realm keeps in clear of a committed order: per line its id, amount, currency, group and payee id. */
export function factsOf<O extends PaymentOrder | CollectionOrder>(order: O, format: FileFormat<O>, draft: Draft, sha256: string): OrderFacts {
	const batch = sentBatch(order, format);
	return {
		kind: batch.kind,
		format: format.id,
		message_id: order.messageId,
		file_sha256: sha256,
		execution_date: 'executionDate' in order ? order.executionDate : order.collectionDate,
		created_at: order.createdAt,
		lines: batch.lines.map((l, i) => [l.id, l.amount, l.currency, l.group, draft.lines[i].payee, draft.lines[i].salary]),
	};
}

/** The sent batch a statement is matched against, from an order's facts. */
export function batchOfFacts(facts: OrderFacts): SentBatch {
	return {
		messageId: facts.message_id,
		kind: facts.kind ?? 'payment',
		lines: facts.lines.map(([id, amount, currency, group]) => ({ id, amount, currency, group })),
	};
}
