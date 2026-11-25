import { test } from 'node:test';
import assert from 'node:assert/strict';
import { realmStatus } from './status.ts';

const quarters = [{ population: 14 }, { population: '3' }, {}];

test('the realm\'s own counts of proposals and votes reach the status', () => {
	const status = realmStatus({ status: 'alpha', open_registration: false }, quarters, { proposals: 11, votes: 151 });
	assert.equal(status.proposals_count, 11);
	assert.equal(status.votes_count, 151);
	assert.equal(status.users_count, 17);
	assert.equal(status.realm_stage, 'alpha');
});

test('a realm that reports no numbers leaves the counts undefined, which the page hides', () => {
	for (const numbers of [null, {}]) {
		const status = realmStatus({ status: 'alpha' }, quarters, numbers);
		assert.equal(status.proposals_count, undefined);
		assert.equal(status.votes_count, undefined);
	}
});

test('a realm with no proposals yet reports zeros, and zeros are shown', () => {
	const status = realmStatus({}, [], { proposals: 0, votes: 0 });
	assert.equal(status.proposals_count, 0);
	assert.equal(status.votes_count, 0);
	assert.equal(status.users_count, 0);
});
