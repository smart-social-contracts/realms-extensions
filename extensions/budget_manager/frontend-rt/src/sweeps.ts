/**
 * Quarter sweeps (ggg I-FED-5 to I-FED-7): a quarter moves what its fund holds, all but what it keeps, into a fund of
 * its capital. The quarter records each sweep as `<id>`; the capital books it once, as `<quarter>/<id>`.
 */

export interface SweepRule {
	fund: string;
	symbol: string;
	into: string;
	keep: number;
}

export interface Sweep {
	id: string;
	quarter: string;
	fund: string;
	symbol: string;
	into: string;
	amount: number;
	fee: number;
	created_at: number;
	block: string | null;
	status: string;
	reason: string | null;
	reported_at: number | null;
}

export interface BookedEntry {
	id: string;
	transaction: string;
	category: string;
	kind: string;
	debit: number;
	credit: number;
	sweep: string;
}

/** What a sweep's booking on this realm's books is: the transaction and its lines, null while nothing is booked. */
export interface Booking {
	transaction: string;
	entries: BookedEntry[];
}

/** The realm's directory of itself and its quarters (`quarter_directory`): this realm is listed first. */
export interface Directory {
	capital: string;
	quarters: { id: string; name: string }[];
}

/** What this realm is in a federation: a quarter, a capital that has quarters, or neither. */
export function roleIn(directory: Directory | null): 'capital' | 'quarter' | null {
	if (!directory || directory.quarters.length === 0) return null;
	const [self, ...others] = directory.quarters;
	if (directory.capital !== self.id) return 'quarter';
	return others.length > 0 ? 'capital' : null;
}

/** The sweep's id on its quarter: the capital keeps it as `<quarter>/<id>`. */
export function idOnQuarter(sweep: Sweep): string {
	return sweep.id.startsWith(`${sweep.quarter}/`) ? sweep.id.slice(sweep.quarter.length + 1) : sweep.id;
}

/** The ledger entries that book ``sweep`` on this realm (the realm names a sweep on each of them). */
export function bookingOf(sweep: Sweep, entries: BookedEntry[]): Booking | null {
	const own = entries.filter((entry) => entry.sweep === sweep.id);
	return own.length ? { transaction: own[0].transaction, entries: own } : null;
}

/** Money that has left the quarter for the capital: sent, or booked as well. A sweep that is sending or needs checking
 * may not have moved, and a failed one has not. */
export function hasMoved(sweep: Sweep): boolean {
	return sweep.status === 'sent' || sweep.status === 'booked';
}

/** What the sweeps that moved add up to, by token. */
export function swept(sweeps: Sweep[]): Record<string, number> {
	const total: Record<string, number> = {};
	for (const sweep of sweeps.filter(hasMoved)) total[sweep.symbol] = (total[sweep.symbol] ?? 0) + sweep.amount;
	return total;
}

/** The newest first: when each was recorded, then by id. */
export function newestFirst(sweeps: Sweep[]): Sweep[] {
	return [...sweeps].sort((a, b) => b.created_at - a.created_at || b.id.localeCompare(a.id));
}
