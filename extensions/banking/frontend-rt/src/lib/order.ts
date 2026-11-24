// A payment order as the realm sees it, before any file format: who pays, from which account, and one line per payee.
// The formats (sps.ts, sepa.ts) turn it into a pain.001; what they share is checked here.

import { compactIban, ibanProblem, isQrIban } from './iban.ts';
import { isCreditorReference, isQrr } from './references.ts';

export interface Address {
	street?: string;
	building?: string;
	postCode?: string;
	town: string;
	/** ISO 3166 alpha-2. */
	country: string;
}

/** A bank account and the name and address the bank knows its holder by. */
export interface Account {
	name: string;
	iban: string;
	bic?: string;
	address?: Address;
}

export interface Reference {
	kind: 'QRR' | 'SCOR';
	value: string;
}

export interface PaymentLine {
	/** The realm's id of this payment: the file's EndToEndId, which the statement brings back. */
	id: string;
	payee: Account;
	/** In the currency's minor unit (cents): never a float. */
	amount: number;
	currency: string;
	/** A salary or pension: paid in a payment group of its own, with category purpose SALA. */
	salary?: boolean;
	reference?: Reference;
	/** Unstructured remittance text for the payee, at most 140 characters. */
	note?: string;
}

export interface PaymentOrder {
	/** The file's MsgId: unique per realm (banks refuse a MsgId they saw in the last 90 days). */
	messageId: string;
	/** When the order was committed, as an ISO 8601 date-time with its offset. */
	createdAt: string;
	/** YYYY-MM-DD. */
	executionDate: string;
	debtor: Account;
	lines: PaymentLine[];
	/** What wrote the file, which SPS asks for in the group header; kept in the order so a file regenerates exactly. */
	software: { name: string; version: string };
}

export interface Problem {
	/** The payment line it is about, if any. */
	line?: string;
	message: string;
}

/** Decimals of the currencies the realm is likely to pay in (ISO 4217); any other has two. */
const DECIMALS: Record<string, number> = { JPY: 0, KRW: 0, ISK: 0, CLP: 0, BHD: 3, KWD: 3, OMR: 3, JOD: 3, TND: 3 };

export function decimalsOf(currency: string): number {
	return DECIMALS[currency] ?? 2;
}

/** ``minor`` units of ``currency`` as a payment file writes them: "1250.50", "3", "0.05". */
export function formatAmount(minor: number, currency: string): string {
	const decimals = decimalsOf(currency);
	if (!decimals) return String(minor);
	const text = String(minor).padStart(decimals + 1, '0');
	return `${text.slice(0, -decimals)}.${text.slice(-decimals)}`;
}

/** The sum of ``lines`` as a decimal: the CtrlSum, which adds amounts of any currency. Exact (thousandths). */
export function controlSum(lines: PaymentLine[]): string {
	const thousandths = lines.reduce((sum, l) => sum + l.amount * 10 ** (3 - decimalsOf(l.currency)), 0);
	return formatAmount(thousandths, 'BHD').replace(/\.?0+$/, '') || '0';
}

/** The amount a person types ("1'250.50", "1250,5") in minor units, or null when it is not one. */
export function parseAmount(text: string, currency: string): number | null {
	const clean = text.trim().replace(/['’\s]/g, '').replace(',', '.');
	const decimals = decimalsOf(currency);
	const m = /^([0-9]+)(?:\.([0-9]*))?$/.exec(clean);
	if (!m || (m[2] ?? '').length > decimals) return null;
	return Number(m[1]) * 10 ** decimals + Number((m[2] ?? '').padEnd(decimals, '0') || 0);
}

/** The characters SPS and the EPC both allow in MsgId, PmtInfId and EndToEndId (SPS IG 3.2, EPC230-15). */
export function referenceProblem(what: string, id: string): string | null {
	if (!id || id.length > 35) return `${what} has 1 to 35 characters`;
	if (!/^[A-Za-z0-9 '()+,\-./:?]+$/.test(id)) return `${what} may hold only letters, digits, spaces and ' ( ) + , - . / : ?`;
	if (id.startsWith(' ') || id.startsWith('/') || id.endsWith('/') || id.includes('//')) {
		return `${what} may not start with a space or "/", end with "/" or hold "//"`;
	}
	return null;
}

function accountProblems(who: string, account: Account, line?: string): Problem[] {
	const out: Problem[] = [];
	if (!account.name.trim()) out.push({ line, message: `${who} has no name` });
	else if (account.name.length > 70) out.push({ line, message: `${who}'s name is longer than 70 characters` });
	const iban = ibanProblem(account.iban);
	if (iban) out.push({ line, message: `${who}'s IBAN: ${iban}` });
	if (account.bic && !/^[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3})?$/.test(account.bic)) {
		out.push({ line, message: `${who}'s BIC is not 8 or 11 letters and digits` });
	}
	if (account.address && !(account.address.town.trim() && /^[A-Z]{2}$/.test(account.address.country))) {
		out.push({ line, message: `${who}'s address needs a town and a two-letter country` });
	}
	return out;
}

/** What is wrong with ``order`` whatever the format: ids, amounts, accounts and references. */
export function orderProblems(order: PaymentOrder): Problem[] {
	const out: Problem[] = [];
	const msg = referenceProblem('The message id', order.messageId);
	if (msg) out.push({ message: msg });
	if (order.messageId.length > 30) out.push({ message: 'The message id has at most 30 characters (its groups add "-n")' });
	if (!/^\d{4}-\d{2}-\d{2}$/.test(order.executionDate)) out.push({ message: 'The execution date is YYYY-MM-DD' });
	if (!order.lines.length) out.push({ message: 'The order has no payments' });
	out.push(...accountProblems('The paying account', order.debtor));
	if (isQrIban(order.debtor.iban)) out.push({ message: 'The paying account is a QR-IBAN, which only receives' });
	const seen = new Set<string>();
	for (const line of order.lines) {
		const id = referenceProblem(`Payment ${line.id}'s id`, line.id);
		if (id) out.push({ line: line.id, message: id });
		if (seen.has(line.id)) out.push({ line: line.id, message: `Payment id ${line.id} is used twice` });
		seen.add(line.id);
		if (!Number.isSafeInteger(line.amount) || line.amount <= 0) {
			out.push({ line: line.id, message: 'The amount must be more than zero' });
		}
		if (!/^[A-Z]{3}$/.test(line.currency)) out.push({ line: line.id, message: 'The currency is a three-letter code' });
		out.push(...accountProblems('The payee', line.payee, line.id));
		if ((line.note ?? '').length > 140) out.push({ line: line.id, message: 'The note is longer than 140 characters' });
		out.push(...referenceProblems(line));
	}
	return out;
}

function referenceProblems(line: PaymentLine): Problem[] {
	const qrIban = isQrIban(line.payee.iban);
	const ref = line.reference;
	if (qrIban && ref?.kind !== 'QRR') {
		return [{ line: line.id, message: "A payment to a QR-IBAN carries the QR-bill's QR reference" }];
	}
	if (!ref) return [];
	if (ref.kind === 'QRR' && !qrIban) return [{ line: line.id, message: 'A QR reference is only paid to a QR-IBAN' }];
	if (ref.kind === 'QRR' && !isQrr(ref.value)) {
		return [{ line: line.id, message: 'The QR reference is not 27 digits with a matching check digit' }];
	}
	if (ref.kind === 'SCOR' && !isCreditorReference(ref.value)) {
		return [{ line: line.id, message: 'The creditor reference is not RF, two check digits and up to 21 characters' }];
	}
	return [];
}

/** ``order`` with every IBAN and reference in the compact form a file carries. */
export function normalized(order: PaymentOrder): PaymentOrder {
	const account = (a: Account): Account => ({ ...a, iban: compactIban(a.iban), bic: a.bic?.toUpperCase() || undefined });
	return {
		...order,
		debtor: account(order.debtor),
		lines: order.lines.map((l) => ({
			...l,
			payee: account(l.payee),
			reference: l.reference ? { ...l.reference, value: l.reference.value.replace(/\s+/g, '').toUpperCase() } : undefined,
		})),
	};
}
