// The structured references an incoming payment carries back to the realm: the Swiss QR reference (QRR, only with a
// QR-IBAN) and the ISO 11649 creditor reference (SCOR, "RF…", with any IBAN). Both are made from a realm invoice id,
// so a statement line names the invoice it pays without the realm keeping a separate table.

import { mod97 } from './iban.ts';

const QRR_TABLE = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];

/** The check digit of a QR reference: modulo 10, recursive (the former ISR rule). */
export function qrrCheckDigit(digits: string): number {
	let carry = 0;
	for (const d of digits) carry = QRR_TABLE[(carry + Number(d)) % 10];
	return (10 - carry) % 10;
}

export function isQrr(ref: string): boolean {
	const compact = ref.replace(/\s+/g, '');
	return /^[0-9]{27}$/.test(compact) && qrrCheckDigit(compact.slice(0, 26)) === Number(compact[26]);
}

/** The 27-digit QR reference of a number (at most 26 digits): zero-padded, then its check digit. */
export function qrrOf(number: string): string {
	if (!/^[0-9]{1,26}$/.test(number)) throw new Error('a QR reference holds at most 26 digits');
	const body = number.padStart(26, '0');
	return body + qrrCheckDigit(body);
}

export function isCreditorReference(ref: string): boolean {
	const compact = ref.replace(/\s+/g, '').toUpperCase();
	return /^RF[0-9]{2}[A-Z0-9]{1,21}$/.test(compact) && mod97(compact.slice(4) + compact.slice(0, 4)) === 1;
}

/** The ISO 11649 creditor reference "RF" + check digits + ``body`` (letters and digits, at most 21). */
export function creditorReferenceOf(body: string): string {
	const clean = body.toUpperCase();
	if (!/^[A-Z0-9]{1,21}$/.test(clean)) throw new Error('a creditor reference holds 1 to 21 letters and digits');
	const check = 98 - mod97(clean + 'RF00');
	return `RF${String(check).padStart(2, '0')}${clean}`;
}

/** The creditor reference of a realm record: its id without the hyphen ("INV-12" is RF..INV12, "BILL-7" RF..BILL7). */
export function invoiceReference(invoiceId: string): string {
	return creditorReferenceOf(invoiceId.replace(/-/g, ''));
}

/** The kinds of realm records a QR reference names, by the two digits before the record's ten-digit number. A realm
 * invoice's code is 00, so "INV-12" pays with …00000000012 and its check digit, as it always has. */
const QRR_KINDS: Record<string, string> = { INV: '00', BILL: '01' };

/** The QR reference of a realm invoice or bill whose id ends in a number of at most ten digits. */
export function invoiceQrr(invoiceId: string): string | null {
	const m = /^([A-Z]+)-([0-9]{1,10})$/.exec(invoiceId);
	const kind = m && QRR_KINDS[m[1]];
	return kind ? qrrOf(kind + m![2].padStart(10, '0')) : null;
}

/** The realm invoice or bill an incoming reference names, or null: "RF..INV12" names INV-12, "RF..BILL7" BILL-7, and a
 * QR reference names one by its kind code and number. */
export function invoiceOfReference(ref: string): string | null {
	const compact = ref.replace(/\s+/g, '').toUpperCase();
	if (isCreditorReference(compact)) {
		const body = /^([A-Z]+)([0-9]+)$/.exec(compact.slice(4));
		return body ? `${body[1]}-${Number(body[2])}` : null;
	}
	if (isQrr(compact)) {
		const [zeros, code, number] = [compact.slice(0, 14), compact.slice(14, 16), Number(compact.slice(16, 26))];
		const kind = Object.keys(QRR_KINDS).find((k) => QRR_KINDS[k] === code);
		return /^0+$/.test(zeros) && kind && number > 0 ? `${kind}-${number}` : null;
	}
	return null;
}
