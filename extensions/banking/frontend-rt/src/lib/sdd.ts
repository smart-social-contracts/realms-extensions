// SEPA Direct Debit Core: pain.008.001.08 as the EPC's customer-to-bank guidelines (EPC130-08, 2025) define it.
// EUR only, between IBANs of SEPA countries; service level SEPA, local instrument CORE and charges SLEV; one payment
// group per sequence type (one-off, first, recurring, final); every collection names its mandate and the day the payer
// signed it; the creditor is named by its SEPA creditor identifier.

import { isSepaCreditorId, normalizedCollection, collectionProblems, type CollectionLine, type CollectionOrder } from './collection.ts';
import { ibanCountry, SEPA_COUNTRIES } from './iban.ts';
import { controlSum, formatAmount, type Problem } from './order.ts';
import { address, groupBy } from './pain001.ts';
import { sepaText } from './sepa.ts';
import { el, leaf, serialize } from './xml.ts';
import { isCreditorReference } from './references.ts';

export const PAIN_008_NAMESPACE = 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.08';

export function sddProblems(order: CollectionOrder): Problem[] {
	const o = normalizedCollection(order);
	const out = collectionProblems(o);
	if (!isSepaCreditorId(o.creditorId)) out.push({ message: 'The SEPA creditor identifier is not valid (like DE98ZZZ09999999999)' });
	if (!SEPA_COUNTRIES.has(ibanCountry(o.creditor.iban))) out.push({ message: 'The collecting account is not in a SEPA country' });
	for (const line of o.lines) {
		if (line.currency !== 'EUR') out.push({ line: line.id, message: 'A SEPA direct debit is in EUR' });
		if (!SEPA_COUNTRIES.has(ibanCountry(line.payer.iban))) out.push({ line: line.id, message: "The payer's IBAN is not in a SEPA country" });
		const mandate = line.payer.mandate;
		if (!mandate?.id) out.push({ line: line.id, message: 'The payer has no SEPA mandate in the register' });
		else if (!/^[A-Za-z0-9/\-?:().,'+ ]{1,35}$/.test(mandate.id)) out.push({ line: line.id, message: 'The mandate id has 1 to 35 letters and digits' });
		if (mandate && (!/^\d{4}-\d{2}-\d{2}$/.test(mandate.signedOn) || mandate.signedOn > o.collectionDate)) {
			out.push({ line: line.id, message: 'The mandate was signed on a day (YYYY-MM-DD) before the collection' });
		}
		if (line.reference && (line.reference.kind !== 'SCOR' || !isCreditorReference(line.reference.value))) {
			out.push({ line: line.id, message: 'A SEPA direct debit carries an RF creditor reference, or none' });
		}
		if (line.reference && line.note) out.push({ line: line.id, message: 'A SEPA direct debit carries either a reference or a note, not both' });
	}
	return out;
}

export function sddGroups(order: CollectionOrder): { lines: CollectionLine[] }[] {
	return groupBy(order.lines, (l) => l.sequence).map((lines) => ({ lines }));
}

function remittance(line: CollectionLine) {
	if (line.reference) {
		return el('RmtInf', el('Strd', el('CdtrRefInf', el('Tp', el('CdOrPrtry', leaf('Cd', 'SCOR'))), leaf('Ref', line.reference.value))));
	}
	return el('RmtInf', leaf('Ustrd', line.note && sepaText(line.note)));
}

function agent(bic: string | undefined) {
	return bic ? el('FinInstnId', leaf('BICFI', bic)) : el('FinInstnId', el('Othr', leaf('Id', 'NOTPROVIDED')));
}

function collection(line: CollectionLine) {
	return el(
		'DrctDbtTxInf',
		el('PmtId', leaf('InstrId', line.id), leaf('EndToEndId', line.id)),
		leaf('InstdAmt', formatAmount(line.amount, line.currency), { Ccy: line.currency }),
		el('DrctDbtTx', el('MndtRltdInf', leaf('MndtId', line.payer.mandate?.id), leaf('DtOfSgntr', line.payer.mandate?.signedOn))),
		el('DbtrAgt', agent(line.payer.bic)),
		el('Dbtr', leaf('Nm', sepaText(line.payer.name)), address(line.payer.address, sepaText)),
		el('DbtrAcct', el('Id', leaf('IBAN', line.payer.iban))),
		remittance(line),
	);
}

export function writeSdd(order: CollectionOrder): string {
	const o = normalizedCollection(order);
	const groups = sddGroups(o).map((g, i) =>
		el(
			'PmtInf',
			leaf('PmtInfId', `${o.messageId}-${i + 1}`),
			leaf('PmtMtd', 'DD'),
			leaf('BtchBookg', 'true'),
			leaf('NbOfTxs', g.lines.length),
			leaf('CtrlSum', controlSum(g.lines)),
			el('PmtTpInf', el('SvcLvl', leaf('Cd', 'SEPA')), el('LclInstrm', leaf('Cd', 'CORE')), leaf('SeqTp', g.lines[0].sequence)),
			leaf('ReqdColltnDt', o.collectionDate),
			el('Cdtr', leaf('Nm', sepaText(o.creditor.name)), address(o.creditor.address, sepaText)),
			el('CdtrAcct', el('Id', leaf('IBAN', o.creditor.iban))),
			el('CdtrAgt', agent(o.creditor.bic)),
			leaf('ChrgBr', 'SLEV'),
			el('CdtrSchmeId', el('Id', el('PrvtId', el('Othr', leaf('Id', o.creditorId), el('SchmeNm', leaf('Prtry', 'SEPA')))))),
			...g.lines.map(collection),
		),
	);
	const header = el(
		'GrpHdr',
		leaf('MsgId', o.messageId),
		leaf('CreDtTm', o.createdAt),
		leaf('NbOfTxs', o.lines.length),
		leaf('CtrlSum', controlSum(o.lines)),
		el('InitgPty', leaf('Nm', sepaText(o.creditor.name))),
	);
	return serialize(el('Document', el('CstmrDrctDbtInitn', header, ...groups))!, { xmlns: PAIN_008_NAMESPACE });
}
