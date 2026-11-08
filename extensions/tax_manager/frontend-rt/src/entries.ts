/**
 * A tax policy's taxes as the realm holds them, typed entries (GGG's `TaxEntry`), and as the editor holds them: one
 * tax with a base (who is taxed) and a method (how the amount is worked out). Amounts are in the token's smallest
 * unit and rates in hundred-millionths on both sides; only the shape changes.
 *
 * An entry says the same with GGG's fields: the `subject` follows the base, `amount` or `rate` follows the method,
 * and the brackets and every other setting are the entry's `facts`. A subject the editor has no base for (a codex may
 * name its own) is kept as the base, and a fact it does not edit rides along in `extra`, so editing one tax does not
 * change what the editor does not show.
 */

export interface Bracket {
	up_to: number | null;
	rate: number;
}

export interface Tax {
	code: string;
	/** The realm's word for it: tax, fee, ... */
	kind: string;
	base: string;
	method: string;
	amount?: number;
	rate?: number;
	brackets?: Bracket[];
	label?: string;
	enabled?: boolean;
	unit_value?: number;
	exempt_below?: number;
	exempt_profiles?: string[];
	due_days?: number;
	/** The facts of the entry that the editor has no field for. */
	extra: Record<string, unknown>;
}

export interface TaxEntry {
	code: string;
	kind: string;
	subject: string;
	rate?: number;
	amount?: number;
	facts: Record<string, unknown>;
}

const SUBJECT_OF_BASE: Record<string, string> = { flat: 'User', land_area: 'Land', declared: 'Declaration' };
const BASE_OF_SUBJECT: Record<string, string> = { User: 'flat', Land: 'land_area', Declaration: 'declared' };
// The settings the editor edits, which an entry keeps in its facts.
const EDITED_FACTS = ['label', 'enabled', 'unit_value', 'exempt_below', 'exempt_profiles', 'due_days', 'brackets'];

function methodOf(entry: TaxEntry): string {
	if (entry.rate != null) return 'proportional';
	if (entry.facts.brackets != null) return 'progressive';
	return 'fixed';
}

/** The tax of the editor for an entry of the realm. */
export function toTax(entry: TaxEntry): Tax {
	const facts = entry.facts ?? {};
	const extra = Object.fromEntries(Object.entries(facts).filter(([name]) => !EDITED_FACTS.includes(name)));
	return {
		code: entry.code,
		kind: entry.kind,
		base: BASE_OF_SUBJECT[entry.subject] ?? entry.subject,
		method: methodOf({ ...entry, facts }),
		...(entry.amount != null ? { amount: entry.amount } : {}),
		...(entry.rate != null ? { rate: entry.rate } : {}),
		...Object.fromEntries(EDITED_FACTS.filter((name) => facts[name] != null).map((name) => [name, facts[name]])),
		extra,
	};
}

/** The entry of the realm for a tax of the editor: one way to charge, and the settings in its facts. */
export function toEntry(tax: Tax): TaxEntry {
	const facts: Record<string, unknown> = { ...tax.extra };
	for (const name of EDITED_FACTS) {
		const value = (tax as unknown as Record<string, unknown>)[name];
		if (value != null) facts[name] = value;
	}
	if (tax.method !== 'progressive') delete facts.brackets;
	return {
		code: tax.code,
		kind: tax.kind,
		subject: SUBJECT_OF_BASE[tax.base] ?? tax.base,
		...(tax.method === 'fixed' && tax.amount != null ? { amount: tax.amount } : {}),
		...(tax.method === 'proportional' && tax.rate != null ? { rate: tax.rate } : {}),
		facts,
	};
}
