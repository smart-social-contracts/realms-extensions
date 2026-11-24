// The per-person list a second signatory compares with the e-banking screen before signing, read from the committed
// file itself rather than from what the realm meant to write: what the bank will execute is what is in the file.
// At a bank that books a salary group as one entry (PostFinance), this list is the only per-person check there is.

import { find, findAll, parse, textAt } from './xml.ts';

export interface FileLine {
	group: string;
	salary: boolean;
	sepa: boolean;
	executionDate: string;
	id: string;
	name: string;
	iban: string;
	bic: string;
	/** As the file writes it: "4200.00". */
	amount: string;
	currency: string;
	reference: string;
	note: string;
}

export interface FileSummary {
	messageId: string;
	createdAt: string;
	debtor: { name: string; iban: string };
	lines: FileLine[];
	count: number;
	controlSum: string;
}

export function readPain001(xml: string): FileSummary {
	const root = find(parse(xml), 'CstmrCdtTrfInitn');
	if (!root) throw new Error('this is not a pain.001 file');
	const groups = findAll(root, 'PmtInf');
	const lines = groups.flatMap((g) =>
		findAll(g, 'CdtTrfTxInf').map((tx) => ({
			group: textAt(g, 'PmtInfId'),
			salary: textAt(g, 'PmtTpInf/CtgyPurp/Cd') === 'SALA',
			sepa: textAt(g, 'PmtTpInf/SvcLvl/Cd') === 'SEPA',
			executionDate: textAt(g, 'ReqdExctnDt/Dt'),
			id: textAt(tx, 'PmtId/EndToEndId'),
			name: textAt(tx, 'Cdtr/Nm'),
			iban: textAt(tx, 'CdtrAcct/Id/IBAN'),
			bic: textAt(tx, 'CdtrAgt/FinInstnId/BICFI'),
			amount: textAt(tx, 'Amt/InstdAmt'),
			currency: find(tx, 'Amt/InstdAmt')?.attrs.Ccy ?? '',
			reference: textAt(tx, 'RmtInf/Strd/CdtrRefInf/Ref'),
			note: textAt(tx, 'RmtInf/Ustrd') || textAt(tx, 'RmtInf/Strd/AddtlRmtInf'),
		})),
	);
	return {
		messageId: textAt(root, 'GrpHdr/MsgId'),
		createdAt: textAt(root, 'GrpHdr/CreDtTm'),
		debtor: { name: textAt(groups[0], 'Dbtr/Nm'), iban: textAt(groups[0], 'DbtrAcct/Id/IBAN') },
		lines,
		count: Number(textAt(root, 'GrpHdr/NbOfTxs')),
		controlSum: textAt(root, 'GrpHdr/CtrlSum'),
	};
}
