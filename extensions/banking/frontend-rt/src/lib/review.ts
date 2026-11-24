// The per-person list a second signatory compares with the e-banking screen before signing, read from the committed
// file itself rather than from what the realm meant to write: what the bank will execute is what is in the file.
// At a bank that books a salary group as one entry (PostFinance), this list is the only per-person check there is.
// A payment order (pain.001) lists whom the realm pays; a collection (pain.008), whom it debits and under which mandate.

import { find, findAll, parse, textAt } from './xml.ts';

export interface FileLine {
	group: string;
	salary: boolean;
	sepa: boolean;
	executionDate: string;
	id: string;
	name: string;
	/** The account's IBAN, or its number at the bank where it has none (an "other" id). */
	iban: string;
	/** The bank's BIC, or its clearing code ("USABA 981234568") where the file names it so. */
	bic: string;
	/** As the file writes it: "4200.00". */
	amount: string;
	currency: string;
	reference: string;
	note: string;
	/** A collection's mandate and sequence type (SEPA); empty for a payment. */
	mandate: string;
	sequence: string;
}

export interface FileSummary {
	kind: 'payment' | 'collection';
	messageId: string;
	createdAt: string;
	/** The realm's own account: the one paying, or the one collecting. */
	account: { name: string; iban: string };
	lines: FileLine[];
	count: number;
	controlSum: string;
}

export function readOrderFile(xml: string): FileSummary {
	const doc = parse(xml);
	const payments = find(doc, 'CstmrCdtTrfInitn');
	const root = payments ?? find(doc, 'CstmrDrctDbtInitn');
	if (!root) throw new Error('this is not a pain.001 or pain.008 file');
	// The other party of each line, and the realm's own account, by the side each file names them.
	const [party, own, tx] = payments ? ['Cdtr', 'Dbtr', 'CdtTrfTxInf'] : ['Dbtr', 'Cdtr', 'DrctDbtTxInf'];
	const groups = findAll(root, 'PmtInf');
	const lines = groups.flatMap((g) =>
		findAll(g, tx).map((t) => {
			const amount = find(t, 'Amt/InstdAmt') ?? find(t, 'InstdAmt');
			return {
				group: textAt(g, 'PmtInfId'),
				salary: textAt(g, 'PmtTpInf/CtgyPurp/Cd') === 'SALA',
				sepa: textAt(g, 'PmtTpInf/SvcLvl/Cd') === 'SEPA',
				executionDate: textAt(g, 'ReqdExctnDt/Dt') || textAt(g, 'ReqdColltnDt'),
				id: textAt(t, 'PmtId/EndToEndId'),
				name: textAt(t, `${party}/Nm`),
				iban: textAt(t, `${party}Acct/Id/IBAN`) || textAt(t, `${party}Acct/Id/Othr/Id`),
				bic: textAt(t, `${party}Agt/FinInstnId/BICFI`) || [textAt(t, `${party}Agt/FinInstnId/ClrSysMmbId/ClrSysId/Cd`),
					textAt(t, `${party}Agt/FinInstnId/ClrSysMmbId/MmbId`)].filter(Boolean).join(' '),
				amount: amount?.text.trim() ?? '',
				currency: amount?.attrs.Ccy ?? '',
				reference: textAt(t, 'RmtInf/Strd/CdtrRefInf/Ref'),
				note: textAt(t, 'RmtInf/Ustrd') || textAt(t, 'RmtInf/Strd/AddtlRmtInf'),
				mandate: textAt(t, 'DrctDbtTx/MndtRltdInf/MndtId'),
				sequence: textAt(g, 'PmtTpInf/SeqTp'),
			};
		}),
	);
	return {
		kind: payments ? 'payment' : 'collection',
		messageId: textAt(root, 'GrpHdr/MsgId'),
		createdAt: textAt(root, 'GrpHdr/CreDtTm'),
		account: {
			name: textAt(groups[0], `${own}/Nm`),
			iban: textAt(groups[0], `${own}Acct/Id/IBAN`) || textAt(groups[0], `${own}Acct/Id/Othr/Id`),
		},
		lines,
		count: Number(textAt(root, 'GrpHdr/NbOfTxs')),
		controlSum: textAt(root, 'GrpHdr/CtrlSum'),
	};
}
