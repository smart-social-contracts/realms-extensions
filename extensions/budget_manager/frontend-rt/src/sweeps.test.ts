import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bookingOf, hasMoved, idOnQuarter, newestFirst, roleIn, swept, type BookedEntry, type Sweep } from './sweeps.ts';

const sweep = (id: string, over: Partial<Sweep> = {}): Sweep => ({
	id,
	quarter: 'north',
	fund: 'ROOT',
	symbol: 'REALM',
	into: 'ROADS',
	amount: 890,
	fee: 10,
	created_at: 1_790_000_000,
	block: '77',
	status: 'booked',
	reason: null,
	reported_at: 1_790_000_100,
	...over,
});

const entry = (id: string, over: Partial<BookedEntry> = {}): BookedEntry => ({
	id,
	transaction: 'T-12',
	category: 'cash',
	kind: 'asset',
	debit: 890,
	credit: 0,
	sweep: 'north/SW-1',
	...over,
});

describe('what a realm is in a federation', () => {
	const north = { id: 'north', name: 'North' };
	const agora = { id: 'agora', name: 'Agora' };

	it('is nothing without a directory, or alone in it', () => {
		assert.equal(roleIn(null), null);
		assert.equal(roleIn({ capital: 'agora', quarters: [] }), null);
		assert.equal(roleIn({ capital: 'agora', quarters: [agora] }), null);
	});

	it('is the capital when the directory lists it first and it has quarters', () => {
		assert.equal(roleIn({ capital: 'agora', quarters: [agora, north] }), 'capital');
	});

	it('is a quarter when its capital is another realm', () => {
		assert.equal(roleIn({ capital: 'agora', quarters: [north, agora] }), 'quarter');
	});
});

describe('a sweep', () => {
	it('is known on its quarter without the quarter the capital puts before it', () => {
		assert.equal(idOnQuarter(sweep('north/SW-1')), 'SW-1');
		assert.equal(idOnQuarter(sweep('SW-1')), 'SW-1');
	});

	it('has moved money when it was sent or booked', () => {
		assert.deepEqual(
			['sending', 'sent', 'booked', 'failed', 'needs_check'].map((status) => hasMoved(sweep('SW-1', { status }))),
			[false, true, true, false, false],
		);
	});

	it('is booked by the entries that name it, which have one transaction', () => {
		const entries = [entry('LE-1'), entry('LE-2', { category: 'sweep', kind: 'equity', debit: 0, credit: 890 }), entry('LE-3', { sweep: 'north/SW-2' })];
		const booking = bookingOf(sweep('north/SW-1'), entries);
		assert.equal(booking?.transaction, 'T-12');
		assert.deepEqual(booking?.entries.map((e) => e.id), ['LE-1', 'LE-2']);
		assert.equal(bookingOf(sweep('north/SW-9'), entries), null);
		assert.equal(bookingOf(sweep('north/SW-1'), []), null);
	});
});

describe('the sweeps of a realm', () => {
	it('add up, by token, those that moved money', () => {
		const total = swept([
			sweep('SW-1', { amount: 890, status: 'booked' }),
			sweep('SW-2', { amount: 100, status: 'sent' }),
			sweep('SW-3', { amount: 5_000, status: 'failed' }),
			sweep('SW-4', { amount: 7, symbol: 'ckBTC' }),
		]);
		assert.deepEqual(total, { REALM: 990, ckBTC: 7 });
		assert.deepEqual(swept([]), {});
	});

	it('are listed newest first', () => {
		const sorted = newestFirst([sweep('SW-1', { created_at: 10 }), sweep('SW-3', { created_at: 30 }), sweep('SW-2', { created_at: 30 })]);
		assert.deepEqual(sorted.map((s) => s.id), ['SW-3', 'SW-2', 'SW-1']);
	});
});
