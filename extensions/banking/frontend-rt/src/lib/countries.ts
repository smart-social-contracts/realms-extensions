// The countries Banking knows how to pay in: how their bank accounts are numbered, their currency, and the payment file
// their banks take. The realm sets the country of its own bank in the register (its banking profile); every account,
// the realm's or a payee's, is checked by the rules of the country it is in.
//
// Most of the world numbers accounts by IBAN. Where a country does not, an account is its number at the bank and the
// bank's clearing code, which an ISO 20022 file carries as the account's "other" id and the bank's clearing system
// member id (ClrSysMmbId).

import { IBAN_COUNTRIES } from './iban.ts';

/** The clearing systems of the countries that number accounts without an IBAN (ISO 20022 ExternalClearingSystemIdentification1Code). */
export type ClearingSystem = 'USABA' | 'CACPA' | 'AUBSB' | 'INFSC';

/** How a country without IBANs identifies an account: the bank's code and the account's number there. */
export interface LocalScheme {
	system: ClearingSystem;
	/** What people there call the bank's code: "Routing number (ABA)", "BSB"… */
	codeLabel: string;
	codeExample: string;
	numberLabel: string;
	/** The bank's code as a file carries it, or null when it is not one. */
	code: (text: string) => string | null;
	/** What is wrong with an account number, or null. */
	numberProblem: (text: string) => string | null;
}

export type PaymentFormatId = 'sps-2025' | 'sepa-2025' | 'iso-cgi';

export interface Country {
	code: string;
	name: string;
	currency: string;
	/** ``iban``, or the scheme of a country without IBANs. */
	accounts: 'iban' | LocalScheme;
	/** The file the realm's bank there takes by default for payments in ``currency``. */
	paymentFormat: PaymentFormatId;
}

const digitsOnly = (text: string) => text.replace(/[\s.-]/g, '');

/** An ABA routing number: nine digits whose weighted sum (3, 7, 1) is a multiple of ten. */
export function abaRouting(text: string): string | null {
	const n = digitsOnly(text);
	if (!/^\d{9}$/.test(n)) return null;
	const d = [...n].map(Number);
	const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
	return sum % 10 === 0 ? n : null;
}

/** A Canadian routing number in its electronic form, 0 + institution (3 digits) + transit (5 digits); also read from the
 * cheque form "transit-institution" (12345-003). */
export function canadianRouting(text: string): string | null {
	const t = text.trim();
	const cheque = /^(\d{5})[\s-](\d{3})$/.exec(t);
	if (cheque) return `0${cheque[2]}${cheque[1]}`;
	const n = digitsOnly(t);
	return /^0\d{8}$/.test(n) ? n : null;
}

/** An Australian BSB: six digits, printed 062-000. */
export function bsb(text: string): string | null {
	const n = digitsOnly(text);
	return /^\d{6}$/.test(n) ? n : null;
}

/** An Indian IFSC: the bank's four letters, a zero, and the branch's six letters or digits. */
export function ifsc(text: string): string | null {
	const n = text.trim().toUpperCase();
	return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(n) ? n : null;
}

const accountDigits = (min: number, max: number) => (text: string) =>
	new RegExp(`^\\d{${min},${max}}$`).test(digitsOnly(text)) ? null : `The account number has ${min} to ${max} digits`;

const US: LocalScheme = {
	system: 'USABA', codeLabel: 'Routing number (ABA)', codeExample: '981234568', numberLabel: 'Account number',
	code: abaRouting, numberProblem: accountDigits(4, 17),
};
const CA: LocalScheme = {
	system: 'CACPA', codeLabel: 'Transit and institution', codeExample: '12345-999', numberLabel: 'Account number',
	code: canadianRouting, numberProblem: accountDigits(7, 12),
};
const AU: LocalScheme = {
	system: 'AUBSB', codeLabel: 'BSB', codeExample: '000-123', numberLabel: 'Account number',
	code: bsb, numberProblem: accountDigits(5, 9),
};
const IN: LocalScheme = {
	system: 'INFSC', codeLabel: 'IFSC', codeExample: 'EXMP0001234', numberLabel: 'Account number',
	code: ifsc, numberProblem: accountDigits(9, 18),
};

const EURO = ['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];
const NAMES: Record<string, string> = {
	AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', CY: 'Cyprus', DE: 'Germany', EE: 'Estonia', ES: 'Spain', FI: 'Finland',
	FR: 'France', GR: 'Greece', HR: 'Croatia', IE: 'Ireland', IT: 'Italy', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia',
	MT: 'Malta', NL: 'Netherlands', PT: 'Portugal', SI: 'Slovenia', SK: 'Slovakia',
};

/** The countries with a profile of their own: currency, accounts and default file. */
export const COUNTRIES: Country[] = [
	{ code: 'CH', name: 'Switzerland', currency: 'CHF', accounts: 'iban', paymentFormat: 'sps-2025' },
	{ code: 'LI', name: 'Liechtenstein', currency: 'CHF', accounts: 'iban', paymentFormat: 'sps-2025' },
	...EURO.map((code): Country => ({ code, name: NAMES[code], currency: 'EUR', accounts: 'iban', paymentFormat: 'sepa-2025' })),
	{ code: 'GB', name: 'United Kingdom', currency: 'GBP', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'SE', name: 'Sweden', currency: 'SEK', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'DK', name: 'Denmark', currency: 'DKK', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'NO', name: 'Norway', currency: 'NOK', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'PL', name: 'Poland', currency: 'PLN', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'CZ', name: 'Czechia', currency: 'CZK', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'HU', name: 'Hungary', currency: 'HUF', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'RO', name: 'Romania', currency: 'RON', accounts: 'iban', paymentFormat: 'iso-cgi' },
	{ code: 'US', name: 'United States', currency: 'USD', accounts: US, paymentFormat: 'iso-cgi' },
	{ code: 'CA', name: 'Canada', currency: 'CAD', accounts: CA, paymentFormat: 'iso-cgi' },
	{ code: 'AU', name: 'Australia', currency: 'AUD', accounts: AU, paymentFormat: 'iso-cgi' },
	{ code: 'IN', name: 'India', currency: 'INR', accounts: IN, paymentFormat: 'iso-cgi' },
].sort((a, b) => a.name.localeCompare(b.name));

/** The profile of ``code``. A country without one pays by the generic ISO file: with IBANs where the IBAN registry
 * knows the country, otherwise by account number and the bank's BIC. */
export function countryOf(code: string): Country {
	const c = (code || '').toUpperCase();
	return COUNTRIES.find((x) => x.code === c) ?? { code: c, name: c, currency: '', accounts: 'iban', paymentFormat: 'iso-cgi' };
}

/** Whether accounts of ``code`` are numbered by IBAN (a country without a profile and outside the IBAN registry is not). */
export function usesIban(code: string): boolean {
	const c = countryOf(code);
	return c.accounts === 'iban' && (COUNTRIES.includes(c) || IBAN_COUNTRIES.has(c.code));
}

/** The local scheme of ``code``, if its accounts are not IBANs. */
export function localScheme(code: string): LocalScheme | null {
	const c = countryOf(code);
	return c.accounts === 'iban' ? null : c.accounts;
}
