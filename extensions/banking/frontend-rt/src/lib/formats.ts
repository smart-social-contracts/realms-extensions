// The payment file formats the extension writes. A new one (generic ISO 20022 CGI-MP, a national fixed-width format)
// is one more entry: its checks, its grouping and its writer.

import type { SentBatch } from './match.ts';
import { normalized, type PaymentOrder, type Problem } from './order.ts';
import { groupIds, type PaymentGroup } from './pain001.ts';
import { sepaGroups, sepaProblems, writeSepa } from './sepa.ts';
import { spsGroups, spsProblems, writeSps } from './sps.ts';

export interface PaymentFormat {
	id: string;
	label: string;
	/** What stops the file, each problem naming its payment line when it has one. Empty: the file can be written. */
	problems: (order: PaymentOrder) => Problem[];
	/** The payment groups the file will hold, in file order. */
	groups: (order: PaymentOrder) => PaymentGroup[];
	/** The file: the same order always gives the same bytes. */
	write: (order: PaymentOrder) => string;
}

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

export function formatById(id: string): PaymentFormat {
	const format = FORMATS.find((f) => f.id === id);
	if (!format) throw new Error(`no payment file format ${id}`);
	return format;
}

/** What a statement is matched against: each line's id, amount and the payment group (PmtInfId) it was written in. */
export function sentBatch(order: PaymentOrder, format: PaymentFormat): SentBatch {
	const groups = groupIds(normalized(order), format.groups(order));
	return {
		messageId: order.messageId,
		lines: order.lines.map((l) => ({ id: l.id, amount: l.amount, currency: l.currency, group: groups[l.id] })),
	};
}
