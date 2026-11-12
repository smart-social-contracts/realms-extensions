/**
 * Scheduled payments (ggg I-FIN-10): transfers the realm owes by a due date, and those revoked unpaid. The realm
 * keeps times in UTC seconds; the days and months people read are the realm's own (its time zone).
 */
import { dayInZone } from './days.ts';
import { slotOf, type BudgetLine } from './stages.ts';

export interface Payment {
	id: string;
	sender: string;
	to: string;
	symbol: string;
	amount: number;
	status: string;
	due_at: number | null;
	budget: string | null;
	committed: boolean;
	contract: string | null;
}

export type Filter = 'month' | 'overdue' | 'all';

export function isScheduled(payment: Payment): boolean {
	return payment.status === 'scheduled';
}

/** Owed and past its due date, which the realm never moves. */
export function isOverdue(payment: Payment, now: number): boolean {
	return isScheduled(payment) && payment.due_at !== null && payment.due_at < now;
}

/** Owed, and falling due in the month ``now`` is in, whether it has fallen due already or not. */
function isDueThisMonth(payment: Payment, now: number, zone: string): boolean {
	return (
		isScheduled(payment) &&
		payment.due_at !== null &&
		dayInZone(payment.due_at, zone).slice(0, 7) === dayInZone(now, zone).slice(0, 7)
	);
}

/**
 * The payments to list, the earliest due first with the owed ones before the cancelled: all of them, those owed and
 * past due, or those owed that fall due this month. A cancelled payment is owed no more, so only "all" lists it.
 */
export function listed(payments: Payment[], filter: Filter, now: number, zone: string): Payment[] {
	const keep: Record<Filter, (payment: Payment) => boolean> = {
		all: () => true,
		overdue: (payment) => isOverdue(payment, now),
		month: (payment) => isDueThisMonth(payment, now, zone),
	};
	const due = (payment: Payment) => payment.due_at ?? Number.MAX_SAFE_INTEGER;
	return payments
		.filter(keep[filter])
		.sort((a, b) => Number(!isScheduled(a)) - Number(!isScheduled(b)) || due(a) - due(b) || a.id.localeCompare(b.id));
}

/** What the owed payments among ``payments`` add up to, by token. */
export function owed(payments: Payment[]): Record<string, number> {
	const total: Record<string, number> = {};
	for (const payment of payments.filter(isScheduled)) total[payment.symbol] = (total[payment.symbol] ?? 0) + payment.amount;
	return total;
}

/**
 * What is owed and not yet paid on each budget line, by slot (a line and the versions it was amended through): the owed
 * payments charged to it. A payment charged to no line, or to one the realm does not list, is on none.
 */
export function owedOnLines(payments: Payment[], lines: Record<string, BudgetLine>): Record<string, number> {
	const total: Record<string, number> = {};
	for (const payment of payments.filter(isScheduled)) {
		const line = payment.budget ? lines[payment.budget] : undefined;
		if (line) total[slotOf(line)] = (total[slotOf(line)] ?? 0) + payment.amount;
	}
	return total;
}

/** A payment's party as a name: ``Fund:ROADS`` is ROADS, ``Organization:O-3`` is O-3. */
export function partyName(ref: string): string {
	return ref.replace(/^(Fund|User|Organization|Follower):/, '');
}
