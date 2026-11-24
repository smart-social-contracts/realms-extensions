// SEPA Credit Transfer: pain.001.001.09 as the EPC's customer-to-bank guidelines (EPC132-08, 2025 v1.0) define it.
// EUR only, between IBANs of SEPA countries, service level SEPA and charges SLEV, and the EPC's restricted Latin
// character set, to which names and notes are converted (and shown converted on the review screen).

import { ibanCountry, SEPA_COUNTRIES } from './iban.ts';
import { normalized, orderProblems, type PaymentOrder, type Problem } from './order.ts';
import { groupBy, writePain001, type PaymentGroup, type Pain001Style } from './pain001.ts';
import { el, leaf } from './xml.ts';

const LIGATURES: Record<string, string> = {
	ß: 'ss', æ: 'ae', Æ: 'AE', ø: 'o', Ø: 'O', œ: 'oe', Œ: 'OE', ł: 'l', Ł: 'L', đ: 'd', Đ: 'D', þ: 'th', Þ: 'TH', '&': '+',
};

/** ``text`` in the EPC's basic set (a-z A-Z 0-9 / - ? : ( ) . , ' + space): accents dropped, ligatures spelled out,
 * anything else a space. */
export function sepaText(text: string): string {
	const spelled = [...text.normalize('NFD').replace(/[̀-ͯ]/g, '')].map((ch) => LIGATURES[ch] ?? ch).join('');
	return spelled.replace(/[^A-Za-z0-9/\-?:().,'+ ]/g, ' ').replace(/ {2,}/g, ' ').trim();
}

export function sepaProblems(order: PaymentOrder): Problem[] {
	const o = normalized(order);
	const out = orderProblems(o);
	if (!SEPA_COUNTRIES.has(ibanCountry(o.debtor.iban))) out.push({ message: 'The paying account is not in a SEPA country' });
	for (const line of o.lines) {
		if (line.currency !== 'EUR') out.push({ line: line.id, message: 'A SEPA credit transfer is in EUR' });
		if (!SEPA_COUNTRIES.has(ibanCountry(line.payee.iban))) {
			out.push({ line: line.id, message: "The payee's IBAN is not in a SEPA country" });
		}
		if (line.amount > 999_999_999_99) out.push({ line: line.id, message: 'A SEPA payment is at most 999,999,999.99' });
		if (line.reference?.kind === 'QRR') out.push({ line: line.id, message: 'A SEPA payment cannot carry a QR reference' });
		if (line.reference && line.note) {
			out.push({ line: line.id, message: 'A SEPA payment carries either a creditor reference or a note, not both' });
		}
		if (!sepaText(line.payee.name)) out.push({ line: line.id, message: "The payee's name has no character SEPA can send" });
	}
	return out;
}

export function sepaGroups(order: PaymentOrder): PaymentGroup[] {
	return groupBy(order.lines, (l) => (l.salary ? 'SALA' : '')).map((lines) => ({
		lines,
		serviceLevel: 'SEPA',
		categoryPurpose: lines[0].salary ? 'SALA' : undefined,
		chargeBearer: 'SLEV',
	}));
}

const SEPA_STYLE: Pain001Style = {
	text: sepaText,
	// EPC132-08: the debtor's bank is identified by the IBAN when no BIC is given.
	debtorAgent: () => el('FinInstnId', el('Othr', leaf('Id', 'NOTPROVIDED'))),
};

export function writeSepa(order: PaymentOrder): string {
	const o = normalized(order);
	return writePain001(o, sepaGroups(o), SEPA_STYLE);
}
