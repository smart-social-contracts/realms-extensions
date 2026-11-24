// IBAN checks (ISO 13616): the country's length and the mod-97 check digits. The realm's own payout accounts are not
// validated anywhere (realms-gos payment_account_add stores what it is given), so every IBAN this extension writes into
// a payment file is checked here first.

/** IBAN length per country, from the SWIFT IBAN registry. */
const LENGTHS: Record<string, number> = {
	AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BI: 27, BR: 29, BY: 28, CH: 21, CR: 22,
	CY: 28, CZ: 24, DE: 22, DJ: 27, DK: 18, DO: 28, EE: 20, EG: 29, ES: 24, FI: 18, FK: 18, FO: 18, FR: 27, GB: 22,
	GE: 22, GI: 23, GL: 18, GR: 27, GT: 28, HN: 28, HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30,
	KW: 30, KZ: 20, LB: 28, LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, LY: 25, MC: 27, MD: 24, ME: 22, MK: 19, MN: 20,
	MR: 27, MT: 31, MU: 30, NI: 28, NL: 18, NO: 15, OM: 23, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29, RO: 24, RS: 22,
	RU: 33, SA: 24, SC: 31, SD: 18, SE: 24, SI: 19, SK: 24, SM: 27, SO: 23, ST: 25, SV: 28, TL: 23, TN: 24, TR: 26,
	UA: 29, VA: 22, VG: 24, XK: 20, YE: 30,
};

/** The countries whose accounts the IBAN registry numbers. */
export const IBAN_COUNTRIES: ReadonlySet<string> = new Set(Object.keys(LENGTHS));

/** The countries of the SEPA schemes (EPC409-09): an IBAN of one of them can be paid with a SEPA credit transfer. */
export const SEPA_COUNTRIES = new Set([
	'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
	'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'CH', 'MC', 'SM', 'VA', 'AD', 'GB', 'GI', 'AL',
	'MD', 'ME', 'MK', 'RS',
]);

/** The IBAN without spaces, in capitals: the form a payment file carries. */
export function compactIban(text: string): string {
	return text.replace(/\s+/g, '').toUpperCase();
}

/** An account id as a person reads it: an IBAN in groups of four, any other account number as it is. */
export function printAccount(id: string): string {
	return /^[A-Z]{2}\d{2}[A-Z0-9]{8,}$/.test(compactIban(id)) ? printIban(id) : id;
}

/** The IBAN in groups of four, the way a bank prints it. */
export function printIban(iban: string): string {
	return compactIban(iban).replace(/(.{4})(?=.)/g, '$1 ');
}

/** The remainder mod 97 of an alphanumeric string read with A=10 … Z=35, digit by digit (no big integers). */
export function mod97(text: string): number {
	let rest = 0;
	for (const ch of text) {
		const value = parseInt(ch, 36);
		rest = value < 10 ? (rest * 10 + value) % 97 : (rest * 100 + value) % 97;
	}
	return rest;
}

/** Why ``text`` is not a valid IBAN, or null when it is one. */
export function ibanProblem(text: string): string | null {
	const iban = compactIban(text);
	if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return 'an IBAN is two letters, two check digits and the account';
	const length = LENGTHS[iban.slice(0, 2)];
	if (length === undefined) return `${iban.slice(0, 2)} is not a country with IBANs`;
	if (iban.length !== length) return `an IBAN of ${iban.slice(0, 2)} has ${length} characters, not ${iban.length}`;
	if (mod97(iban.slice(4) + iban.slice(0, 4)) !== 1) return 'the check digits do not match: a character is wrong';
	return null;
}

export function ibanCountry(iban: string): string {
	return compactIban(iban).slice(0, 2);
}

/** Whether ``iban`` is a Swiss or Liechtenstein QR-IBAN: its institution id (positions 5-9) lies in 30000-31999. */
export function isQrIban(iban: string): boolean {
	const compact = compactIban(iban);
	if (!['CH', 'LI'].includes(compact.slice(0, 2))) return false;
	const iid = Number(compact.slice(4, 9));
	return iid >= 30000 && iid <= 31999;
}
