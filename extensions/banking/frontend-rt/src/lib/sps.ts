// Swiss Payment Standards 2025: pain.001.001.09 as the SPS XSD pain.001.001.09.ch.03 and IG v2.2 define it.
//
// SPS sorts each payment into a payment type (IG 3.15): D (domestic: a CH/LI IBAN in CHF or EUR, a QR-bill), S (SEPA:
// EUR to an IBAN of another SEPA country) or X (any other currency, or abroad outside SEPA). Each type, currency and
// salary/other mix is one payment group, and a salary group carries category purpose SALA (IG 4.2: "SALA … must
// always be sent at the B-Level").

import { ibanCountry, SEPA_COUNTRIES } from './iban.ts';
import { normalized, orderProblems, type PaymentLine, type PaymentOrder, type Problem } from './order.ts';
import { groupBy, writePain001, type PaymentGroup, type Pain001Style } from './pain001.ts';
import { el, leaf } from './xml.ts';

export type SpsPaymentType = 'D' | 'S' | 'X';

export function spsPaymentType(line: PaymentLine): SpsPaymentType {
	const country = ibanCountry(line.payee.iban);
	const domestic = country === 'CH' || country === 'LI';
	if (domestic) return line.currency === 'CHF' || line.currency === 'EUR' ? 'D' : 'X';
	return line.currency === 'EUR' && SEPA_COUNTRIES.has(country) ? 'S' : 'X';
}

/** Basic Latin, Latin-1 Supplement and Latin Extended-A, plus Ș ș Ț ț and € (IG 3.1). */
const SPS_CHARACTER = /^[ -~ -ſȘ-ț€]*$/;

function characterProblems(order: PaymentOrder): Problem[] {
	const out: Problem[] = [];
	const texts: [string | undefined, string | undefined][] = [[undefined, order.debtor.name]];
	for (const l of order.lines) {
		const a = l.payee.address;
		texts.push([l.id, l.payee.name], [l.id, l.note], [l.id, a?.street], [l.id, a?.town], [l.id, a?.postCode]);
	}
	for (const [line, text] of texts) {
		if (text && !SPS_CHARACTER.test(text)) {
			const bad = [...text].filter((ch) => !SPS_CHARACTER.test(ch)).join('');
			out.push({ line, message: `"${bad}" cannot be sent in a Swiss payment file` });
		}
	}
	return out;
}

function typeProblems(order: PaymentOrder): Problem[] {
	const out: Problem[] = [];
	if (!['CH', 'LI'].includes(ibanCountry(order.debtor.iban))) {
		out.push({ message: 'A Swiss payment file pays from a Swiss or Liechtenstein account' });
	}
	for (const line of order.lines) {
		const type = spsPaymentType(line);
		const abroad = !['CH', 'LI'].includes(ibanCountry(line.payee.iban));
		if (type === 'X' && abroad && !line.payee.bic) {
			out.push({ line: line.id, message: "A payment abroad outside SEPA needs the payee bank's BIC" });
		}
		if (type === 'S' && line.reference?.kind === 'QRR') {
			out.push({ line: line.id, message: 'A SEPA payment cannot carry a QR reference' });
		}
		if (type !== 'D' && line.amount > 999_999_999_99) {
			out.push({ line: line.id, message: 'The amount is above what a SEPA or cross-border payment takes' });
		}
	}
	return out;
}

export function spsProblems(order: PaymentOrder): Problem[] {
	const o = normalized(order);
	return [...orderProblems(o), ...characterProblems(o), ...typeProblems(o)];
}

export function spsGroups(order: PaymentOrder): PaymentGroup[] {
	return groupBy(order.lines, (l) => `${spsPaymentType(l)}|${l.currency}|${l.salary ? 'SALA' : ''}`).map((lines) => {
		const type = spsPaymentType(lines[0]);
		return {
			lines,
			serviceLevel: type === 'S' ? 'SEPA' : undefined,
			categoryPurpose: lines[0].salary ? 'SALA' : undefined,
			chargeBearer: type === 'S' ? 'SLEV' : type === 'X' ? 'SHAR' : undefined,
		};
	});
}

/** The IID of a Swiss or Liechtenstein IBAN: its positions 5 to 9, the institution's clearing number. */
function iidOf(iban: string): string {
	return iban.slice(4, 9);
}

const SPS_STYLE: Pain001Style = {
	text: (s) => s.trim(),
	// IG 3.9: product name, provider, version, and the IG version written as nnnn (2.2 is 0220).
	contact: (order) => [
		['NAME', order.software.name],
		['PRVD', 'Smart Social Contracts'],
		['VRSN', order.software.version],
		['SPSV', '0220'],
	],
	debtorAgent: (debtor) =>
		el('FinInstnId', el('ClrSysMmbId', el('ClrSysId', leaf('Cd', 'CHBCC')), leaf('MmbId', iidOf(debtor.iban)))),
};

export function writeSps(order: PaymentOrder): string {
	const o = normalized(order);
	return writePain001(o, spsGroups(o), SPS_STYLE);
}
