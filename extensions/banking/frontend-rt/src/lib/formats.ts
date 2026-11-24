// The payment file formats the extension writes. A new one (generic ISO 20022 CGI-MP, a national fixed-width format)
// is one more entry: its checks, its grouping and its writer.

import { chddGroups, chddProblems, writeChdd } from './chdd.ts';
import { normalizedCollection, type CollectionOrder } from './collection.ts';
import type { SentBatch } from './match.ts';
import { normalized, type PaymentOrder, type Problem } from './order.ts';
import { groupIds } from './pain001.ts';
import { sddGroups, sddProblems, writeSdd } from './sdd.ts';
import { sepaGroups, sepaProblems, writeSepa } from './sepa.ts';
import { spsGroups, spsProblems, writeSps } from './sps.ts';

export interface FileFormat<O> {
	id: string;
	label: string;
	/** What stops the file, each problem naming its line when it has one. Empty: the file can be written. */
	problems: (order: O) => Problem[];
	/** The payment groups the file will hold, in file order. */
	groups: (order: O) => { lines: { id: string }[] }[];
	/** The file: the same order always gives the same bytes. */
	write: (order: O) => string;
}

export type PaymentFormat = FileFormat<PaymentOrder>;
export type CollectionFormat = FileFormat<CollectionOrder>;

export const FORMATS: PaymentFormat[] = [
	{
		id: 'sps-2025',
		label: 'Swiss Payment Standards 2025 (pain.001.001.09.ch.03)',
		problems: spsProblems,
		groups: (o) => spsGroups(normalized(o)),
		write: writeSps,
	},
	{
		id: 'sepa-2025',
		label: 'SEPA Credit Transfer (EPC 2025, pain.001.001.09)',
		problems: sepaProblems,
		groups: (o) => sepaGroups(normalized(o)),
		write: writeSepa,
	},
];

/** Direct debits (pain.008): SEPA Core in EUR, and PostFinance's CH-DD in Switzerland. */
export const COLLECTION_FORMATS: CollectionFormat[] = [
	{
		id: 'sepa-dd-2025',
		label: 'SEPA Direct Debit Core (EPC 2025, pain.008.001.08)',
		problems: sddProblems,
		groups: (o) => sddGroups(normalizedCollection(o)),
		write: writeSdd,
	},
	{
		id: 'ch-dd',
		label: 'PostFinance CH-DD (pain.008.001.02.ch.03)',
		problems: chddProblems,
		groups: (o) => chddGroups(normalizedCollection(o)),
		write: writeChdd,
	},
];

export function formatById(id: string): PaymentFormat {
	const format = FORMATS.find((f) => f.id === id);
	if (!format) throw new Error(`no payment file format ${id}`);
	return format;
}

export function collectionFormatById(id: string): CollectionFormat {
	const format = COLLECTION_FORMATS.find((f) => f.id === id);
	if (!format) throw new Error(`no direct debit file format ${id}`);
	return format;
}

/** What a statement is matched against: each line's id, amount and the payment group (PmtInfId) it was written in. */
export function sentBatch<O extends PaymentOrder | CollectionOrder>(order: O, format: FileFormat<O>): SentBatch {
	const groups = groupIds(order.messageId, format.groups(order));
	return {
		messageId: order.messageId,
		kind: 'creditorId' in order ? 'collection' : 'payment',
		lines: order.lines.map((l) => ({ id: l.id, amount: l.amount, currency: l.currency, group: groups[l.id] })),
	};
}
