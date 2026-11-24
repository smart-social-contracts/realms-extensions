// The pain.001.001.09 message (ISO 20022 customer credit transfer initiation) both formats write. A format decides
// how the lines are grouped and what each group says (service level, category purpose, charges); this file writes the
// elements in the order the schema requires.

import { controlSum, formatAmount, type Account, type Address, type PaymentLine, type PaymentOrder } from './order.ts';
import { el, leaf, serialize } from './xml.ts';

export const PAIN_001_NAMESPACE = 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.09';

/** One B-level payment group: lines paid from the debtor account on one date, in one currency and one kind. */
export interface PaymentGroup {
	lines: PaymentLine[];
	serviceLevel?: 'SEPA';
	categoryPurpose?: 'SALA';
	chargeBearer?: 'SLEV' | 'SHAR';
}

/** How a format writes what the schema leaves open. */
export interface Pain001Style {
	/** The text of a name, a town or a note as the format's character set allows it. */
	text: (s: string) => string;
	/** The group header's InitgPty/CtctDtls/Othr pairs (SPS asks for the software that wrote the file). */
	contact?: (order: PaymentOrder) => [string, string][];
	/** The debtor's bank, when the account does not give a BIC. */
	debtorAgent: (debtor: Account) => ReturnType<typeof el>;
}

/** A structured postal address, as pain.001 and pain.008 both write it. */
export function address(a: Address | undefined, text: (s: string) => string) {
	if (!a) return null;
	return el(
		'PstlAdr',
		leaf('StrtNm', a.street && text(a.street)),
		leaf('BldgNb', a.building && text(a.building)),
		leaf('PstCd', a.postCode && text(a.postCode)),
		leaf('TwnNm', text(a.town)),
		leaf('Ctry', a.country),
	);
}

function remittance(line: PaymentLine, text: (s: string) => string) {
	const ref = line.reference;
	if (!ref) return el('RmtInf', leaf('Ustrd', line.note && text(line.note)));
	const kind = ref.kind === 'QRR' ? leaf('Prtry', 'QRR') : leaf('Cd', 'SCOR');
	return el(
		'RmtInf',
		el(
			'Strd',
			el('CdtrRefInf', el('Tp', el('CdOrPrtry', kind)), leaf('Ref', ref.value)),
			leaf('AddtlRmtInf', line.note && text(line.note)),
		),
	);
}

function transaction(line: PaymentLine, style: Pain001Style) {
	return el(
		'CdtTrfTxInf',
		el('PmtId', leaf('InstrId', line.id), leaf('EndToEndId', line.id)),
		el('Amt', leaf('InstdAmt', formatAmount(line.amount, line.currency), { Ccy: line.currency })),
		line.payee.bic ? el('CdtrAgt', el('FinInstnId', leaf('BICFI', line.payee.bic))) : null,
		el('Cdtr', leaf('Nm', style.text(line.payee.name)), address(line.payee.address, style.text)),
		el('CdtrAcct', el('Id', leaf('IBAN', line.payee.iban))),
		remittance(line, style.text),
	);
}

function group(order: PaymentOrder, g: PaymentGroup, index: number, style: Pain001Style) {
	const debtor = order.debtor;
	return el(
		'PmtInf',
		leaf('PmtInfId', `${order.messageId}-${index + 1}`),
		leaf('PmtMtd', 'TRF'),
		leaf('BtchBookg', 'true'),
		leaf('NbOfTxs', g.lines.length),
		leaf('CtrlSum', controlSum(g.lines)),
		el(
			'PmtTpInf',
			g.serviceLevel ? el('SvcLvl', leaf('Cd', g.serviceLevel)) : null,
			g.categoryPurpose ? el('CtgyPurp', leaf('Cd', g.categoryPurpose)) : null,
		),
		el('ReqdExctnDt', leaf('Dt', order.executionDate)),
		el('Dbtr', leaf('Nm', style.text(debtor.name)), address(debtor.address, style.text)),
		el('DbtrAcct', el('Id', leaf('IBAN', debtor.iban))),
		el('DbtrAgt', debtor.bic ? el('FinInstnId', leaf('BICFI', debtor.bic)) : style.debtorAgent(debtor)),
		leaf('ChrgBr', g.chargeBearer),
		...g.lines.map((line) => transaction(line, style)),
	);
}

/** The PmtInfId of each line: the group it was written in. A statement that books a group as one entry names it. */
export function groupIds(messageId: string, groups: { lines: { id: string }[] }[]): Record<string, string> {
	const out: Record<string, string> = {};
	groups.forEach((g, i) => g.lines.forEach((l) => (out[l.id] = `${messageId}-${i + 1}`)));
	return out;
}

export function writePain001(order: PaymentOrder, groups: PaymentGroup[], style: Pain001Style): string {
	const all = groups.flatMap((g) => g.lines);
	const contact = style.contact?.(order) ?? [];
	const header = el(
		'GrpHdr',
		leaf('MsgId', order.messageId),
		leaf('CreDtTm', order.createdAt),
		leaf('NbOfTxs', all.length),
		leaf('CtrlSum', controlSum(all)),
		el(
			'InitgPty',
			leaf('Nm', style.text(order.debtor.name)),
			el('CtctDtls', ...contact.map(([kind, id]) => el('Othr', leaf('ChanlTp', kind), leaf('Id', id)))),
		),
	);
	const body = el('CstmrCdtTrfInitn', header, ...groups.map((g, i) => group(order, g, i, style)));
	return serialize(el('Document', body)!, { xmlns: PAIN_001_NAMESPACE });
}

/** ``lines`` split by ``key``, the groups in the order their first line comes. */
export function groupBy<T>(lines: T[], key: (l: T) => string): T[][] {
	const groups = new Map<string, T[]>();
	for (const line of lines) {
		const k = key(line);
		groups.set(k, [...(groups.get(k) ?? []), line]);
	}
	return [...groups.values()];
}
