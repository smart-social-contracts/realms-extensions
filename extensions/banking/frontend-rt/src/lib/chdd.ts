// PostFinance's Swiss direct debit (CH-DD): pain.008.001.02.ch.03 as SIX's Swiss direct debit guidelines (SPS 2018,
// IG v1.2) define it. The only Swiss direct debit open to a new creditor: SIX's LSV+ and BDD take no new creditors
// since 1 January 2026 and end on 30 September 2028, and eBill Direct Debit runs through eBill, not a file.
//
// Both accounts are at PostFinance (institution 09000); the creditor is named by its RS-PID; the payer's authorisation
// is kept by PostFinance, so the file carries no mandate; remittance is unstructured only (the invoice reference is
// written as text).

import { collectionProblems, isRsPid, normalizedCollection, type CollectionLine, type CollectionOrder } from './collection.ts';
import { compactIban } from './iban.ts';
import { controlSum, formatAmount, type Address, type Problem } from './order.ts';
import { groupBy } from './pain001.ts';
import { el, leaf, serialize } from './xml.ts';

export const CHDD_NAMESPACE = 'http://www.six-interbank-clearing.com/de/pain.008.001.02.ch.03.xsd';
const POSTFINANCE = '09000';

/** The characters the 2018 guidelines allow in names and notes: those of SPS (IG credit transfer 3.1). */
const SPS_CHARACTER = /^[ -~ -ſȘ-ț€]*$/;

function atPostFinance(iban: string): boolean {
	const compact = compactIban(iban);
	return ['CH', 'LI'].includes(compact.slice(0, 2)) && compact.slice(4, 9) === POSTFINANCE;
}

export function chddProblems(order: CollectionOrder): Problem[] {
	const o = normalizedCollection(order);
	const out = collectionProblems(o);
	if (!isRsPid(o.creditorId)) out.push({ message: "PostFinance's RS-PID is digits ending in two check digits (ISO 7064 MOD 97-10)" });
	if (!atPostFinance(o.creditor.iban)) out.push({ message: 'CH-DD collects into a PostFinance account (IBAN CH.. 0900 0…)' });
	for (const line of o.lines) {
		if (line.currency !== 'CHF' && line.currency !== 'EUR') out.push({ line: line.id, message: 'CH-DD collects in CHF or EUR' });
		if (!atPostFinance(line.payer.iban)) out.push({ line: line.id, message: "CH-DD collects from a PostFinance account only" });
		for (const text of [line.payer.name, line.note ?? '', line.payer.address?.town ?? '']) {
			if (!SPS_CHARACTER.test(text)) out.push({ line: line.id, message: `"${text}" holds characters a Swiss file cannot carry` });
		}
		if (line.sequence !== 'OOFF' && line.sequence !== 'RCUR') {
			out.push({ line: line.id, message: 'CH-DD knows no first or final collection: its mandates are kept by PostFinance' });
		}
	}
	return out;
}

/** One group per currency: CH-DD core collections (DDCOR1) only. */
export function chddGroups(order: CollectionOrder): { lines: CollectionLine[] }[] {
	return groupBy(order.lines, (l) => l.currency).map((lines) => ({ lines }));
}

/** The 2018 Swiss address has no building number: the street carries it. */
function address(a: Address | undefined) {
	if (!a) return null;
	const street = [a.street, a.building].filter(Boolean).join(' ').trim();
	return el('PstlAdr', leaf('StrtNm', street), leaf('PstCd', a.postCode?.trim()), leaf('TwnNm', a.town.trim()), leaf('Ctry', a.country));
}

const postFinance = () => el('FinInstnId', el('ClrSysMmbId', leaf('MmbId', POSTFINANCE)));

/** The reference written as text, since CH-DD allows no structured remittance. */
function note(line: CollectionLine): string | undefined {
	return [line.reference?.value, line.note].filter(Boolean).join(' ') || undefined;
}

function collection(line: CollectionLine) {
	return el(
		'DrctDbtTxInf',
		el('PmtId', leaf('InstrId', line.id), leaf('EndToEndId', line.id)),
		leaf('InstdAmt', formatAmount(line.amount, line.currency), { Ccy: line.currency }),
		el('DbtrAgt', postFinance()),
		el('Dbtr', leaf('Nm', line.payer.name.trim()), address(line.payer.address)),
		el('DbtrAcct', el('Id', leaf('IBAN', line.payer.iban))),
		el('RmtInf', leaf('Ustrd', note(line))),
	);
}

export function writeChdd(order: CollectionOrder): string {
	const o = normalizedCollection(order);
	const groups = chddGroups(o).map((g, i) =>
		el(
			'PmtInf',
			leaf('PmtInfId', `${o.messageId}-${i + 1}`),
			leaf('PmtMtd', 'DD'),
			// The Swiss schema has no batch booking, count or sum per group: PostFinance books as its contract says.
			el('PmtTpInf', el('SvcLvl', leaf('Prtry', 'CHDD')), el('LclInstrm', leaf('Prtry', 'DDCOR1'))),
			leaf('ReqdColltnDt', o.collectionDate),
			el('Cdtr', leaf('Nm', o.creditor.name.trim()), address(o.creditor.address)),
			el('CdtrAcct', el('Id', leaf('IBAN', o.creditor.iban))),
			el('CdtrAgt', postFinance()),
			el('CdtrSchmeId', el('Id', el('PrvtId', el('Othr', leaf('Id', o.creditorId), el('SchmeNm', leaf('Prtry', 'CHDD')))))),
			...g.lines.map(collection),
		),
	);
	const header = el(
		'GrpHdr',
		leaf('MsgId', o.messageId),
		leaf('CreDtTm', o.createdAt),
		leaf('NbOfTxs', o.lines.length),
		leaf('CtrlSum', controlSum(o.lines)),
		el('InitgPty', leaf('Nm', o.creditor.name.trim()), el('Id', el('OrgId', el('Othr', leaf('Id', o.creditorId))))),
	);
	return serialize(el('Document', el('CstmrDrctDbtInitn', header, ...groups))!, { xmlns: CHDD_NAMESPACE });
}
