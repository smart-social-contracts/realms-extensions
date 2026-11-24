// The bank's status report on a file it received: pain.002 (SPS: pain.002.001.10). It says whether the whole order
// was accepted or rejected, and which payments in it were rejected and why. Read by element name, so the 2009 version
// (pain.002.001.03) reads the same.

import { find, findAll, parse, textAt, type XmlNode } from './xml.ts';

export interface Rejection {
	/** The rejected payment's EndToEndId, or the payment group's PmtInfId when a whole group is rejected. */
	ref: string;
	reason: string;
}

export interface StatusReport {
	messageId: string;
	createdAt: string;
	/** The MsgId of the order the report is about. */
	original: string;
	/** ACCP, ACTC, ACWC, PART, RJCT…; "" when the bank reports per group or payment only. */
	status: string;
	reason: string;
	rejected: Rejection[];
}

/** The reasons a status gives, as "AC01 IncorrectAccountNumber: text". */
function reasonOf(node: XmlNode | undefined): string {
	return findAll(node, 'StsRsnInf')
		.map((r) => [textAt(r, 'Rsn/Cd') || textAt(r, 'Rsn/Prtry'), ...findAll(r, 'AddtlInf').map((a) => a.text.trim())]
			.filter(Boolean).join(' '))
		.join('; ');
}

export function statusOf(root: XmlNode): StatusReport {
	const message = find(root, 'CstmrPmtStsRpt');
	if (root.name !== 'Document' || !message) throw new Error('this is not a pain.002 status report');
	const group = find(message, 'OrgnlGrpInfAndSts');
	const rejected: Rejection[] = [];
	for (const pmtInf of findAll(message, 'OrgnlPmtInfAndSts')) {
		if (textAt(pmtInf, 'PmtInfSts') === 'RJCT') rejected.push({ ref: textAt(pmtInf, 'OrgnlPmtInfId'), reason: reasonOf(pmtInf) });
		for (const tx of findAll(pmtInf, 'TxInfAndSts')) {
			if (textAt(tx, 'TxSts') === 'RJCT') rejected.push({ ref: textAt(tx, 'OrgnlEndToEndId'), reason: reasonOf(tx) });
		}
	}
	return {
		messageId: textAt(message, 'GrpHdr/MsgId'),
		createdAt: textAt(message, 'GrpHdr/CreDtTm'),
		original: textAt(group, 'OrgnlMsgId'),
		status: textAt(group, 'GrpSts'),
		reason: reasonOf(group),
		rejected,
	};
}

export function parseStatusReport(source: string): StatusReport {
	return statusOf(parse(source));
}

/** Whether the bank took the order: anything but a rejection of the whole message. */
export function acceptedByBank(report: StatusReport): boolean {
	return report.status !== 'RJCT';
}

/** What the realm's record of the import keeps: ids, codes and the bank's reasons, never a name or an account. */
export function statusReportOf(report: StatusReport) {
	return {
		statement: report.messageId,
		kind: 'pain.002',
		message: report.original,
		status: report.status || (report.rejected.length ? 'PART' : ''),
		rejected: report.rejected.map((r) => [r.ref, r.reason]),
		paid: [],
		collected: [],
		group_booked: [],
		returned: [],
		incoming: [],
		to_review: report.rejected.length,
	};
}
