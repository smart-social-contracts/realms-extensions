// A collection by direct debit (pain.008): the realm, as creditor, asks its bank to collect from payers who gave it a
// mandate, for taxes, fees or invoices. The formats (sdd.ts, chdd.ts) write it; what they share is checked here.

import { compactIban, mod97 } from './iban.ts';
import { accountProblems, referenceProblem, type Account, type Problem, type Reference } from './order.ts';

/** The payer's authorisation: SEPA needs its id and the day it was signed; at PostFinance (CH-DD) the bank keeps it. */
export interface Mandate {
	id: string;
	/** YYYY-MM-DD. */
	signedOn: string;
}

export type Sequence = 'OOFF' | 'FRST' | 'RCUR' | 'FNAL';

export interface CollectionLine {
	/** The realm's id of this collection: the file's EndToEndId, which the statement brings back. */
	id: string;
	payer: Account & { mandate?: Mandate };
	/** In minor units. */
	amount: number;
	currency: string;
	/** SEPA: one-off, or first, recurring or final of a series. */
	sequence: Sequence;
	/** The creditor reference of the invoice the collection pays (RF…). */
	reference?: Reference;
	note?: string;
}

export interface CollectionOrder {
	messageId: string;
	createdAt: string;
	/** YYYY-MM-DD: the day the payers are debited. */
	collectionDate: string;
	creditor: Account;
	/** SEPA: the creditor identifier (DE98ZZZ09999999999). CH-DD: PostFinance's RS-PID. */
	creditorId: string;
	lines: CollectionLine[];
	software: { name: string; version: string };
}

/** A SEPA creditor identifier: country, check digits, a business code that is not checked, and the national id; the
 * check digits are those of the national id and the country, mod 97 as an IBAN's (EPC262-08). */
export function isSepaCreditorId(id: string): boolean {
	const ci = id.replace(/\s+/g, '').toUpperCase();
	if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{3}[A-Z0-9]{1,28}$/.test(ci) || ci.length > 35) return false;
	return mod97(ci.slice(7) + ci.slice(0, 4)) === 1;
}

/** PostFinance's RS-PID: digits whose last two are check digits, ISO 7064 MOD 97-10 (the whole number mod 97 is 1). */
export function isRsPid(id: string): boolean {
	return /^[0-9]{3,35}$/.test(id) && mod97(id) === 1;
}

export function collectionProblems(order: CollectionOrder): Problem[] {
	const out: Problem[] = [];
	const msg = referenceProblem('The message id', order.messageId);
	if (msg) out.push({ message: msg });
	if (order.messageId.length > 30) out.push({ message: 'The message id has at most 30 characters (its groups add "-n")' });
	if (!/^\d{4}-\d{2}-\d{2}$/.test(order.collectionDate)) out.push({ message: 'The collection date is YYYY-MM-DD' });
	if (!order.lines.length) out.push({ message: 'The collection has no payers' });
	out.push(...accountProblems('The collecting account', order.creditor));
	const seen = new Set<string>();
	for (const line of order.lines) {
		const id = referenceProblem(`Collection ${line.id}'s id`, line.id);
		if (id) out.push({ line: line.id, message: id });
		if (seen.has(line.id)) out.push({ line: line.id, message: `Collection id ${line.id} is used twice` });
		seen.add(line.id);
		if (!Number.isSafeInteger(line.amount) || line.amount <= 0 || line.amount > 999_999_999_99) {
			out.push({ line: line.id, message: 'The amount must be more than zero and at most 999,999,999.99' });
		}
		out.push(...accountProblems('The payer', line.payer, line.id));
		if ((line.note ?? '').length > 140) out.push({ line: line.id, message: 'The note is longer than 140 characters' });
	}
	return out;
}

export function normalizedCollection(order: CollectionOrder): CollectionOrder {
	const account = <A extends Account>(a: A): A => ({ ...a, iban: compactIban(a.iban), bic: a.bic?.toUpperCase() || undefined });
	return {
		...order,
		creditorId: order.creditorId.replace(/\s+/g, '').toUpperCase(),
		creditor: account(order.creditor),
		lines: order.lines.map((l) => ({
			...l,
			payer: account(l.payer),
			reference: l.reference ? { ...l.reference, value: l.reference.value.replace(/\s+/g, '').toUpperCase() } : undefined,
		})),
	};
}
