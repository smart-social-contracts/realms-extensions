import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { choiceOf, missingVoters, myVote } from './votes.ts';

const votes = [
	{ voter: 'aaaaa-aa', choice: 'yes' },
	{ voter: 'bbbbb-bb', choice: 'abstain' },
];

describe('choiceOf', () => {
	it('finds what a member voted', () => {
		assert.equal(choiceOf(votes, 'aaaaa-aa'), 'yes');
		assert.equal(choiceOf(votes, 'bbbbb-bb'), 'abstain');
	});

	it('is empty for a member who has not voted, for nobody, and for no votes', () => {
		assert.equal(choiceOf(votes, 'ccccc-cc'), '');
		assert.equal(choiceOf(votes, ''), '');
		assert.equal(choiceOf(undefined, 'aaaaa-aa'), '');
	});
});

describe('myVote', () => {
	it('answers from the first page when the vote is there, without another call', async () => {
		const read = async () => {
			throw new Error('no other call is needed');
		};
		assert.equal(await myVote(read, 'P-1', { votes, next: 3 }, 'bbbbb-bb'), 'abstain');
	});

	it('reads the next pages until the vote turns up', async () => {
		const calls: Record<string, unknown>[] = [];
		const read = async (name: string, args: Record<string, unknown>) => {
			assert.equal(name, 'proposal_get');
			calls.push(args);
			return args.from === 3
				? { votes: [{ voter: 'ccccc-cc', choice: 'no' }], next: 5 }
				: { votes: [{ voter: 'ddddd-dd', choice: 'no' }], next: null };
		};
		assert.equal(await myVote(read, 'P-1', { votes, next: 3 }, 'ddddd-dd'), 'no');
		assert.deepEqual(calls, [
			{ proposal: 'P-1', from: 3, count: 500 },
			{ proposal: 'P-1', from: 5, count: 500 },
		]);
	});

	it('stops at the end of the votes, with nothing', async () => {
		const read = async () => ({ votes: [], next: null });
		assert.equal(await myVote(read, 'P-1', { votes, next: 3 }, 'ccccc-cc'), '');
		assert.equal(await myVote(read, 'P-1', { votes, next: null }, 'ccccc-cc'), '');
	});

	it('gives up when a page cannot be read', async () => {
		assert.equal(await myVote(async () => null, 'P-1', { votes, next: 3 }, 'ccccc-cc'), '');
	});

	it('reads nothing for someone who is not signed in', async () => {
		const read = async () => {
			throw new Error('no call is needed');
		};
		assert.equal(await myVote(read, 'P-1', { votes, next: 3 }, ''), '');
	});
});

describe('missingVoters', () => {
	it('counts the eligible voters who have not voted', () => {
		assert.equal(missingVoters(2, 1), 1);
		assert.equal(missingVoters(5, 0), 5);
		assert.equal(missingVoters(2, 2), 0);
	});

	it('is 0 when the electorate is not known, or smaller than the votes', () => {
		assert.equal(missingVoters(null, 3), 0);
		assert.equal(missingVoters(0, 3), 0);
		assert.equal(missingVoters(2, 3), 0);
	});
});
