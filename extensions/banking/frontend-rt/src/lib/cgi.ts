// The generic ISO 20022 payment file: pain.001.001.09 as the Common Global Implementation - Market Practice (CGI-MP)
// describes it, the profile banks take in most countries outside the Swiss and SEPA standards. Any currency; accounts
// by IBAN, or by number with the bank's clearing code where a country has no IBANs (ABA routing number, Canadian
// transit, BSB, IFSC); banks by BIC or clearing code; non-urgent service level, charges shared.
//
// Each bank publishes its own CGI-MP guide on top of this (what it requires of the initiating party, which characters
// it takes): the file is what all of them have in common, and the bank's test portal comes before the first payment.

import { ibanCountry } from './iban.ts';
import { normalized, orderProblems, type Account, type PaymentOrder, type Problem } from './order.ts';
import { groupBy, writePain001, type PaymentGroup, type Pain001Style } from './pain001.ts';
import { el, leaf } from './xml.ts';

/** ``text`` without control characters or doubled spaces: CGI-MP takes UTF-8, which banks narrow in their own guides. */
export function cgiText(text: string): string {
	return text.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ').replace(/ {2,}/g, ' ').trim();
}

function countryOfAccount(a: Account): string {
	return a.local ? (a.address?.country ?? '') : ibanCountry(a.iban);
}

function banked(a: Account): boolean {
	return !!a.bic || !!(a.local?.system && a.local.code);
}

export function cgiProblems(order: PaymentOrder): Problem[] {
	const o = normalized(order);
	const out = orderProblems(o);
	if (!banked(o.debtor)) {
		out.push({ message: "The paying account's bank needs its BIC (or, where accounts have no IBAN, its clearing code)" });
	}
	const home = countryOfAccount(o.debtor);
	for (const line of o.lines) {
		if (line.reference?.kind === 'QRR') {
			out.push({ line: line.id, message: 'A QR reference is paid in a Swiss payment file, not this one' });
		}
		if (!line.payee.local && countryOfAccount(line.payee) !== home && !line.payee.bic) {
			out.push({ line: line.id, message: "A payment to another country needs the payee bank's BIC" });
		}
	}
	return out;
}

/** One group per currency and kind (salaries apart, with category purpose SALA), non-urgent, charges shared. */
export function cgiGroups(order: PaymentOrder): PaymentGroup[] {
	return groupBy(order.lines, (l) => `${l.currency}|${l.salary ? 'SALA' : ''}`).map((lines) => ({
		lines,
		serviceLevel: 'NURG',
		categoryPurpose: lines[0].salary ? 'SALA' : undefined,
		chargeBearer: 'SHAR',
	}));
}

const CGI_STYLE: Pain001Style = {
	text: cgiText,
	// Not reached: cgiProblems asks the debtor's bank's BIC or clearing code.
	debtorAgent: () => el('FinInstnId', el('Othr', leaf('Id', 'NOTPROVIDED'))),
};

export function writeCgi(order: PaymentOrder): string {
	const o = normalized(order);
	return writePain001(o, cgiGroups(o), CGI_STYLE);
}
