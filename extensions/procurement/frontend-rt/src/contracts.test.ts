import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	amendment,
	dayIn,
	dayStart,
	decimalsFor,
	hasEnded,
	holderOf,
	isCallOff,
	linkedRealms,
	money,
	proposalPath,
	splitText,
	splitTotal,
	suppliers,
	termChanges,
	termsOf,
	visibleContracts,
	type Contract,
	type Terms,
} from './contracts.ts';

const seconds = (iso: string) => Date.parse(iso) / 1000;
const MADRID = 'Europe/Madrid';

const lane: Contract = {
	id: 'C-9',
	title: 'Bike lane works',
	parties: ['Department:Infrastructure', 'Organization:buildco'],
	mandate: null,
	kind: 'works',
	procedure: 'open',
	tender: 'T-5',
	lot: '',
	value: 5_000_000,
	symbol: 'REALM',
	status: 'active',
	starts_at: seconds('2026-01-01T00:00:00+01:00'),
	ends_at: seconds('2026-03-31T00:00:00+02:00'),
	split: [
		{ period: 'FY2026', amount: 3_000_000 },
		{ period: 'FY2027', amount: 2_000_000 },
	],
	framework: null,
};
const callOff: Contract = {
	...lane,
	id: 'C-14',
	title: 'Electricity',
	tender: '',
	framework: { holder: { External: 'province' }, reference: 'AM-2025/04', winners: ['buildco'] },
};

describe('money', () => {
	it('shows an amount in the currency decimals, grouped, with its symbol', () => {
		assert.equal(money(5_000_000, 'REALM', 2, 'en-US'), '50,000 REALM');
		assert.equal(money(1_234_567, 'REALM', 2, 'en-US'), '12,345.67 REALM');
		assert.equal(money(7, 'REALM', 0, 'en-US'), '7 REALM');
		assert.equal(money(0, '', 2, 'en-US'), '0');
	});
});

describe('the decimals of an amount', () => {
	const facts = { zone: 'UTC', currency: 'REALM', decimals: 8, tokens: { GOLD: 3 }, externals: [], realms: {} };

	it('are its token\'s, else the currency\'s, else none', () => {
		assert.equal(decimalsFor('GOLD', facts), 3);
		assert.equal(decimalsFor('REALM', facts), 8);
		assert.equal(decimalsFor('REALM', { ...facts, tokens: { REALM: 6 } }), 6);
		assert.equal(decimalsFor('OTHER', facts), 0);
	});
});

describe('contracts that have ended', () => {
	it('are the terminated and the fulfilled', () => {
		assert.deepEqual(['draft', 'active', 'fulfilled', 'terminated', 'disputed'].map((status) => hasEnded({ ...lane, status })), [false, false, true, true, false]);
	});
});

describe('days in the realm zone', () => {
	it('reads the day a time falls on in the zone, not in UTC', () => {
		assert.equal(dayIn(seconds('2026-01-01T00:00:00+01:00'), MADRID), '2026-01-01');
		assert.equal(dayIn(seconds('2026-01-01T00:00:00+01:00'), 'UTC'), '2025-12-31');
		assert.equal(dayIn(0, MADRID), '');
	});

	it('starts a day at its midnight in the zone, an hour later where the clocks skip it', () => {
		assert.equal(dayStart('2026-01-01', MADRID), seconds('2026-01-01T00:00:00+01:00'));
		assert.equal(dayStart('2026-03-29', MADRID), seconds('2026-03-29T00:00:00+01:00'));
		// Midnight does not exist in Havana on the night the clocks go forward (2026-03-08).
		assert.equal(dayStart('2026-03-08', 'America/Havana'), seconds('2026-03-08T01:00:00-04:00'));
	});
});

describe('the contracts a list shows', () => {
	it('keeps only the call-offs under a framework agreement when asked', () => {
		assert.equal(isCallOff(lane), false);
		assert.equal(isCallOff(callOff), true);
		assert.deepEqual(visibleContracts([lane, callOff], false).map((c) => c.id), ['C-9', 'C-14']);
		assert.deepEqual(visibleContracts([lane, callOff], true).map((c) => c.id), ['C-14']);
		assert.deepEqual(visibleContracts([lane], true), []);
	});

	it('names the suppliers, the parties that are organizations', () => {
		assert.deepEqual(suppliers(lane), ['buildco']);
		assert.deepEqual(suppliers({ ...lane, parties: ['Department:Infrastructure'] }), []);
	});
});

describe('what an amendment changed', () => {
	const before: Terms = termsOf(lane);

	it('lists the terms that differ, in the order a contract has them', () => {
		const after: Terms = {
			...before,
			ends_at: before.ends_at + 86_400,
			split: [
				{ period: 'FY2026', amount: 1_000_000 },
				{ period: 'FY2027', amount: 4_000_000 },
			],
		};
		assert.deepEqual(termChanges(before, after).map((change) => change.term), ['split', 'ends_at']);
		assert.deepEqual(termChanges(before, { ...before, value: 4_000_000 }).map((change) => change.term), ['value']);
	});

	it('finds nothing in terms that are the same', () => {
		assert.deepEqual(termChanges(before, { ...before, split: [...before.split] }), []);
	});

	it('writes a split as its periods', () => {
		assert.equal(splitText(lane.split, 'REALM', 2, 'en-US'), 'FY2026 30,000 REALM · FY2027 20,000 REALM');
		assert.equal(splitTotal(lane.split), 5_000_000);
	});
});

describe('the amendment a form files', () => {
	const current = termsOf(lane);
	const same = {
		value: '50000',
		split: [
			{ period: 'FY2026', amount: '30000' },
			{ period: 'FY2027', amount: '20000' },
		],
		starts: '2026-01-01',
		ends: '2026-03-31',
	};

	it('files only what it changes, since a term left out keeps the contract\'s', () => {
		assert.deepEqual(amendment(current, same, 2, MADRID), { problem: 'nothing_changed' });
		assert.deepEqual(amendment(current, { ...same, value: '40000', split: [] }, 2, MADRID), { args: { value: 4_000_000, split: [] } });
		assert.deepEqual(amendment(current, { ...same, ends: '2026-06-30' }, 2, MADRID), {
			args: { ends_at: seconds('2026-06-30T00:00:00+02:00') },
		});
	});

	it('lets a contract lose its end, never its start', () => {
		assert.deepEqual(amendment(current, { ...same, ends: '' }, 2, MADRID), { args: { ends_at: 0 } });
		assert.deepEqual(amendment(current, { ...same, starts: '' }, 2, MADRID), { problem: 'nothing_changed' });
	});

	it('takes a re-spread over the periods', () => {
		const result = amendment(
			current,
			{ ...same, split: [{ period: 'FY2026', amount: '10000' }, { period: 'FY2027', amount: '40000' }] },
			2,
			MADRID,
		);
		assert.deepEqual(result, {
			args: {
				split: [
					{ period: 'FY2026', amount: 1_000_000 },
					{ period: 'FY2027', amount: 4_000_000 },
				],
			},
		});
	});

	it('refuses an amount, a period or a day that is not one', () => {
		assert.deepEqual(amendment(current, { ...same, value: 'lots' }, 2, MADRID), { problem: 'bad_value' });
		assert.deepEqual(amendment(current, { ...same, value: '1.234' }, 2, MADRID), { problem: 'bad_value' });
		assert.deepEqual(amendment(current, { ...same, split: [{ period: ' ', amount: '1' }] }, 2, MADRID), { problem: 'bad_split_period' });
		assert.deepEqual(amendment(current, { ...same, split: [{ period: 'FY2026', amount: 'x' }] }, 2, MADRID), { problem: 'bad_split_amount' });
		assert.deepEqual(amendment(current, { ...same, ends: '2026-02-30' }, 2, MADRID), { problem: 'bad_day' });
	});
});

describe('where a proposal is read', () => {
	it('is in the voting extension, under the realm\'s own prefix', () => {
		assert.equal(proposalPath('P-31', '/extensions/procurement'), '/extensions/voting/proposals/P-31');
		assert.equal(proposalPath('P-31', '/r/valencia/extensions/procurement/'), '/r/valencia/extensions/voting/proposals/P-31');
	});
});

describe('the holder of a framework agreement', () => {
	const externals = [{ id: 'province', name: 'Province of Alicante', kind: 'authority' }];
	const capital = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
	const realms = linkedRealms([
		{ source: { Realm: capital }, name: 'Spain' },
		{ source: { Record: { url: 'https://example.org/spain.json' } }, name: 'A stand-in record' },
	]);

	it('is an outside body of this realm, by its name', () => {
		assert.deepEqual(holderOf(callOff.framework!, externals, realms), {
			kind: 'external',
			id: 'province',
			name: 'Province of Alicante',
			body: 'authority',
		});
		assert.equal(holderOf({ ...callOff.framework!, holder: { External: 'gone' } }, externals, realms).name, null);
	});

	it('is another realm, by its name when this realm is linked to it and by its capital when not', () => {
		const held = (holder: string) => ({ holder: { Realm: holder }, reference: 'T-12', winners: [] });
		assert.equal(holderOf(held(capital), externals, realms).name, 'Spain');
		assert.deepEqual(holderOf(held('aaaaa-aa'), externals, realms), { kind: 'realm', id: 'aaaaa-aa', name: null, body: '' });
		assert.deepEqual(realms, { [capital]: 'Spain' });
	});
});
