// Bank statements: camt.052 (the intraday account report), camt.053 (the account statement) and camt.054 (debit and
// credit notifications), ISO 20022.
// Read by element name, whatever the version (001.04 to 001.08 name the parts the realm needs the same way), so a
// bank on an older version still works. Only what matching needs is kept.

import { parseAmount } from './order.ts';
import { find, findAll, parse, textAt, type XmlNode } from './xml.ts';

export interface StatementTransaction {
	endToEndId: string;
	paymentGroupId: string;
	/** In minor units of ``currency``: the instructed amount when the bank gives it, else the booked one, else the
	 * entry's when the bank gives no amount per transaction. */
	amount: number;
	currency: string;
	/** The structured creditor reference: a QR reference or an "RF…" one. */
	reference: string;
	note: string;
	/** The other side: who paid the realm, or whom the realm paid. Personal data: kept only in the encrypted copy. */
	counterparty: { name: string; iban: string };
}

export interface StatementEntry {
	/** The bank's reference of the entry, or its position in the statement when the bank gives none. */
	ref: string;
	amount: number;
	currency: string;
	direction: 'in' | 'out';
	reversal: boolean;
	/** BOOK (booked), PDNG (pending) or INFO. */
	status: string;
	bookingDate: string;
	/** What a batch-booked entry says of its batch: the PmtInfId it books and how many payments it holds. */
	batch: { messageId: string; paymentGroupId: string; count: number } | null;
	transactions: StatementTransaction[];
}

export interface Statement {
	kind: 'camt.052' | 'camt.053' | 'camt.054';
	messageId: string;
	/** The statement's or notification's own id. */
	id: string;
	createdAt: string;
	account: { iban: string; currency: string };
	entries: StatementEntry[];
}

function amountOf(node: XmlNode | undefined): { amount: number; currency: string } | null {
	if (!node) return null;
	const currency = node.attrs.Ccy ?? '';
	const amount = parseAmount(node.text, currency);
	if (amount === null) throw new Error(`"${node.text.trim()}" is not an amount in ${currency}`);
	return { amount, currency };
}

function dateOf(node: XmlNode | undefined): string {
	return textAt(node, 'Dt') || textAt(node, 'DtTm').slice(0, 10);
}

/** A party's name: camt.053.001.08 nests it in Pty, the 001.04 versions do not. */
function partyName(party: XmlNode | undefined): string {
	return textAt(party, 'Pty/Nm') || textAt(party, 'Nm');
}

function transactionOf(tx: XmlNode, entry: { amount: number; currency: string; direction: 'in' | 'out' }) {
	// The instructed amount is what the realm ordered; a payment in another currency than the account's is booked
	// (Amt) in the account's currency.
	const own = amountOf(find(tx, 'AmtDtls/InstdAmt/Amt')) ?? amountOf(find(tx, 'Amt')) ?? entry;
	const parties = find(tx, 'RltdPties');
	const side = entry.direction === 'in' ? 'Dbtr' : 'Cdtr';
	const strd = findAll(tx, 'RmtInf/Strd');
	return {
		endToEndId: textAt(tx, 'Refs/EndToEndId').replace(/^NOTPROVIDED$/, ''),
		paymentGroupId: textAt(tx, 'Refs/PmtInfId'),
		amount: own.amount,
		currency: own.currency,
		reference: strd.map((s) => textAt(s, 'CdtrRefInf/Ref')).find(Boolean) ?? '',
		note: findAll(tx, 'RmtInf/Ustrd').map((u) => u.text.trim()).join(' '),
		counterparty: { name: partyName(find(parties, side)), iban: textAt(parties, `${side}Acct/Id/IBAN`) },
	};
}

function entryOf(ntry: XmlNode, index: number): StatementEntry {
	const money = amountOf(find(ntry, 'Amt'));
	if (!money) throw new Error(`entry ${index + 1} has no amount`);
	const direction = textAt(ntry, 'CdtDbtInd') === 'CRDT' ? 'in' : 'out';
	const details = findAll(ntry, 'NtryDtls');
	const btch = details.map((d) => find(d, 'Btch')).find(Boolean);
	return {
		ref: textAt(ntry, 'AcctSvcrRef') || textAt(ntry, 'NtryRef') || `#${index + 1}`,
		...money,
		direction,
		reversal: textAt(ntry, 'RvslInd') === 'true',
		status: textAt(ntry, 'Sts/Cd') || textAt(ntry, 'Sts'),
		bookingDate: dateOf(find(ntry, 'BookgDt')),
		batch: btch
			? { messageId: textAt(btch, 'MsgId'), paymentGroupId: textAt(btch, 'PmtInfId'), count: Number(textAt(btch, 'NbOfTxs') || 0) }
			: null,
		transactions: details.flatMap((d) => findAll(d, 'TxDtls')).map((tx) => transactionOf(tx, { ...money, direction })),
	};
}

/** The message element of each camt kind, and the element of each account report in it. */
const KINDS = {
	BkToCstmrAcctRpt: ['camt.052', 'Rpt'],
	BkToCstmrStmt: ['camt.053', 'Stmt'],
	BkToCstmrDbtCdtNtfctn: ['camt.054', 'Ntfctn'],
} as const;

/** Every report (camt.052), statement (camt.053) or notification (camt.054) in a bank file. Throws when the file is
 * none of them. */
export function parseStatements(source: string): Statement[] {
	return statementsOf(parse(source));
}

export function statementsOf(root: XmlNode): Statement[] {
	const message = root.children[0];
	const known = message && KINDS[message.name as keyof typeof KINDS];
	if (root.name !== 'Document' || !known) throw new Error('this is not a camt.052, camt.053 or camt.054 file');
	const [kind, report] = known;
	const reports = message.children.filter((c) => c.name === report);
	return reports.map((r) => ({
		kind,
		messageId: textAt(message, 'GrpHdr/MsgId'),
		id: textAt(r, 'Id'),
		createdAt: textAt(r, 'CreDtTm') || textAt(message, 'GrpHdr/CreDtTm'),
		account: { iban: textAt(r, 'Acct/Id/IBAN'), currency: textAt(r, 'Acct/Ccy') },
		entries: findAll(r, 'Ntry').map(entryOf),
	}));
}
