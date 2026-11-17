import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bidsOfLot, lotsOf, openLots, winningBid, type Lot, type LotBid } from './lots.ts';

const lots: Lot[] = [
	{ id: '1', title: 'Road works', estimated_value: 500_000, status: 'awarded', winner: 'B-2', contract: 'C-10' },
	{ id: '2', title: 'Bike racks', estimated_value: null, status: 'open', winner: null, contract: null },
	{ id: '3', title: 'Signs', estimated_value: 10_000, status: 'void', winner: null, contract: null },
];
const bids: LotBid[] = [
	{ id: 'B-1', vendor: 'roadco', lot: '1', sealed: false },
	{ id: 'B-2', vendor: 'buildco', lot: '1', sealed: false },
	{ id: 'B-3', vendor: 'buildco', lot: '2', sealed: true },
];

describe('the bids and the winner of a lot', () => {
	it('counts the bids that price the lot', () => {
		assert.deepEqual(bidsOfLot(bids, lots[0]).map((b) => b.id), ['B-1', 'B-2']);
		assert.deepEqual(bidsOfLot(bids, lots[1]).map((b) => b.id), ['B-3']);
		assert.deepEqual(bidsOfLot(bids, lots[2]), []);
	});

	it('finds the awarded bid, and none for a lot that is not awarded', () => {
		assert.equal(winningBid(bids, lots[0])?.vendor, 'buildco');
		assert.equal(winningBid(bids, lots[1]), undefined);
		assert.equal(winningBid([], lots[0]), undefined);
	});

	it('leaves the lots that wait for an award', () => {
		assert.deepEqual(openLots(lots).map((lot) => lot.id), ['2']);
	});
});

describe('the lots a form creates', () => {
	it('gives each lot its id, its title and, when it has one, its budget in the currency\'s base units', () => {
		assert.deepEqual(
			lotsOf(
				[
					{ id: '1', title: ' Road works ', budget: '5000' },
					{ id: '2', title: 'Bike racks', budget: '' },
					{ id: '', title: '', budget: '' },
				],
				2,
			),
			{
				lots: [
					{ id: '1', title: 'Road works', estimated_value: 500_000 },
					{ id: '2', title: 'Bike racks' },
				],
			},
		);
	});

	it('is no lots when the rows are empty', () => {
		assert.deepEqual(lotsOf([], 2), { lots: [] });
		assert.deepEqual(lotsOf([{ id: ' ', title: '', budget: '' }], 2), { lots: [] });
	});

	it('refuses a row that lacks its id or title, or has a budget that is not an amount', () => {
		assert.deepEqual(lotsOf([{ id: '1', title: '', budget: '' }], 2), { problem: 'incomplete' });
		assert.deepEqual(lotsOf([{ id: '', title: 'x', budget: '1' }], 2), { problem: 'incomplete' });
		assert.deepEqual(lotsOf([{ id: '1', title: 'x', budget: 'much' }], 2), { problem: 'budget' });
	});
});
