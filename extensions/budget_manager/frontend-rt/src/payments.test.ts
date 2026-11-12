import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dayInZone } from './days.ts';
import { isOverdue, listed, owed, partyName, type Payment } from './payments.ts';

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

describe('the parties of a payment', () => {
	it('are named without the kind the realm adds', () => {
		assert.equal(partyName('Fund:ROADS'), 'ROADS');
		assert.equal(partyName('Organization:O-3'), 'O-3');
		assert.equal(partyName('aaaaa-aa'), 'aaaaa-aa');
	});
});
