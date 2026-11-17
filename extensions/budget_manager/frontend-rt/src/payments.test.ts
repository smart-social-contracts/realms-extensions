import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dayInZone } from './days.ts';
import { isOverdue, listed, owed, owedOnLines, partyName, type Payment } from './payments.ts';
import type { BudgetLine } from './stages.ts';

const at = (iso: string) => Date.parse(iso) / 1000;
const MADRID = 'Europe/Madrid';
const NOW = at('2026-11-12T12:00:00Z');

const payment = (id: string, over: Partial<Payment> = {}): Payment => ({
	id,
	sender: 'Fund:ROADS',
	to: 'Organization:O-3',
	symbol: 'REALM',
	amount: 1_000,
	status: 'scheduled',
	due_at: at('2026-11-20T10:00:00Z'),
	budget: null,
	committed: false,
	contract: null,
	...over,
});

describe('a day in the realm\'s time zone', () => {
	it('is the day the clocks there show, not the UTC day', () => {
		const late = at('2026-11-30T23:30:00Z');
		assert.equal(dayInZone(late, 'UTC'), '2026-11-30');
		assert.equal(dayInZone(late, MADRID), '2026-12-01'); // 00:30 there
		assert.equal(dayInZone(late, 'America/Los_Angeles'), '2026-11-30');
	});
});

describe('an overdue payment', () => {
	it('is owed and past its due date', () => {
		assert.equal(isOverdue(payment('T-1', { due_at: NOW - 1 }), NOW), true);
		assert.equal(isOverdue(payment('T-1', { due_at: NOW }), NOW), false);
		assert.equal(isOverdue(payment('T-1', { due_at: NOW + 60 }), NOW), false);
	});

	it('is never one that was cancelled, or one with no due date', () => {
		assert.equal(isOverdue(payment('T-1', { status: 'cancelled', due_at: NOW - 86_400 }), NOW), false);
		assert.equal(isOverdue(payment('T-1', { due_at: null }), NOW), false);
	});
});

describe('the list of payments', () => {
	const payments = [
		payment('T-5', { status: 'cancelled', due_at: at('2026-11-05T10:00:00Z') }),
		payment('T-4', { due_at: at('2026-12-01T10:00:00Z') }),
		payment('T-3', { due_at: at('2026-11-20T10:00:00Z') }),
		payment('T-2', { due_at: at('2026-10-30T10:00:00Z') }), // overdue
		payment('T-1', { due_at: at('2026-11-03T10:00:00Z') }), // overdue, and this month
	];
	const ids = (filter: Parameters<typeof listed>[1]) => listed(payments, filter, NOW, MADRID).map((p) => p.id);

	it('lists them all, the owed ones by due date first and the cancelled ones last', () => {
		assert.deepEqual(ids('all'), ['T-2', 'T-1', 'T-3', 'T-4', 'T-5']);
	});

	it('lists the owed ones that are past due', () => {
		assert.deepEqual(ids('overdue'), ['T-2', 'T-1']);
	});

	it('lists the owed ones that fall due in this month, past due or not, and not a cancelled one', () => {
		assert.deepEqual(ids('month'), ['T-1', 'T-3']);
	});

	it('reads the month in the realm\'s time zone', () => {
		const lateNovember = [payment('T-9', { due_at: at('2026-11-30T23:30:00Z') })]; // 1 Dec in Madrid
		assert.deepEqual(listed(lateNovember, 'month', NOW, MADRID), []);
		assert.deepEqual(listed(lateNovember, 'month', NOW, 'UTC').map((p) => p.id), ['T-9']);
	});

	it('is empty when there are no payments', () => {
		assert.deepEqual(listed([], 'all', NOW, MADRID), []);
	});
});

describe('what is owed', () => {
	it('adds up the owed payments by token and leaves the cancelled out', () => {
		const total = owed([
			payment('T-1', { amount: 1_000 }),
			payment('T-2', { amount: 500 }),
			payment('T-3', { amount: 7, symbol: 'ckBTC' }),
			payment('T-4', { amount: 9_999, status: 'cancelled' }),
		]);
		assert.deepEqual(total, { REALM: 1_500, ckBTC: 7 });
	});
});

describe('what is owed on a budget line', () => {
	const line = (id: string, over: Partial<BudgetLine> = {}): BudgetLine => ({
		id,
		fund: 'ROADS',
		period: 'FY2026',
		category: 'capital',
		kind: 'expense',
		status: 'adopted',
		planned: 1_000,
		reserved: 0,
		committed: 0,
		actual: 0,
		...over,
	});
	// B-5 is a version of the capital line that a later budget amended into B-1: the realm keeps their slot.
	const lines = { 'B-1': line('B-1'), 'B-5': line('B-5', { status: 'amended' }), 'B-2': line('B-2', { category: 'upkeep' }) };

	it('adds up the owed payments charged to it, and to the versions it was amended from', () => {
		const total = owedOnLines(
			[payment('T-1', { budget: 'B-1', amount: 300 }), payment('T-2', { budget: 'B-5', amount: 200 }), payment('T-3', { budget: 'B-2', amount: 50 })],
			lines,
		);
		assert.deepEqual(total, { 'ROADS:FY2026:capital': 500, 'ROADS:FY2026:upkeep': 50 });
	});

	it('leaves out what is not owed, and what no line the realm lists is charged', () => {
		const total = owedOnLines(
			[
				payment('T-1', { budget: 'B-1', amount: 300, status: 'cancelled' }),
				payment('T-2', { budget: null, amount: 200 }),
				payment('T-3', { budget: 'B-404', amount: 50 }),
			],
			lines,
		);
		assert.deepEqual(total, {});
		assert.deepEqual(owedOnLines([], lines), {});
	});
});

describe('the parties of a payment', () => {
	it('are named without the kind the realm adds', () => {
		assert.equal(partyName('Fund:ROADS'), 'ROADS');
		assert.equal(partyName('Organization:O-3'), 'O-3');
		assert.equal(partyName('aaaaa-aa'), 'aaaaa-aa');
	});
});
