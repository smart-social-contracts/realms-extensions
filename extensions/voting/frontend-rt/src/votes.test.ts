import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';
import {
	choiceOf,
	isVetoed,
	missingVoters,
	myVote,
	quorumReached,
	vetoHoldersMissing,
	waitingText,
	type OpenVote,
	type Translate,
} from './votes.ts';

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

describe('vetoHoldersMissing', () => {
	it('counts the veto holders who have not voted, whatever they voted', () => {
		const voted = [
			{ voter: 'aaaaa-aa', choice: 'yes' },
			{ voter: 'bbbbb-bb', choice: 'abstain' },
		];
		assert.equal(vetoHoldersMissing(['aaaaa-aa', 'ccccc-cc', 'ddddd-dd'], voted), 2);
		assert.equal(vetoHoldersMissing(['aaaaa-aa', 'bbbbb-bb'], voted), 0);
	});

	it('is 0 for a vote with no veto holders, or when nothing is known', () => {
		assert.equal(vetoHoldersMissing([], []), 0);
		assert.equal(vetoHoldersMissing(undefined, undefined), 0);
		assert.equal(vetoHoldersMissing(['aaaaa-aa'], undefined), 1);
	});
});

describe('isVetoed', () => {
	const votes = [
		{ voter: 'aaaaa-aa', choice: 'no' },
		{ voter: 'bbbbb-bb', choice: 'yes' },
		{ voter: 'ccccc-cc', choice: 'no' },
	];

	it('is true while a veto holder has voted no', () => {
		assert.equal(isVetoed(['aaaaa-aa', 'bbbbb-bb'], votes), true);
		assert.equal(isVetoed(['ccccc-cc'], votes), true);
	});

	it('is not true for a no from someone without a veto, or a veto holder who voted yes or has not voted', () => {
		assert.equal(isVetoed(['bbbbb-bb'], votes), false);
		assert.equal(isVetoed(['ddddd-dd'], votes), false);
		assert.equal(isVetoed([], votes), false);
		assert.equal(isVetoed(undefined, votes), false);
		assert.equal(isVetoed(['aaaaa-aa'], undefined), false);
	});
});

describe('quorumReached', () => {
	it('compares the votes cast with a share of the eligible voters', () => {
		const half = 50_000_000;
		assert.equal(quorumReached(1, 4, half), false);
		assert.equal(quorumReached(2, 4, half), true);
		assert.equal(quorumReached(3, 4, half), true);
	});

	it('is reached with no quorum, and by one vote when the electorate is not known', () => {
		assert.equal(quorumReached(0, 4, 0), true);
		assert.equal(quorumReached(1, null, 100_000_000), true);
		assert.equal(quorumReached(0, null, 100_000_000), false);
	});
});

const VOTING_LOCALES = '../../frontend/i18n/locales/extensions/voting';
const strings = (locale: string): Record<string, string> =>
	JSON.parse(readFileSync(new URL(`${VOTING_LOCALES}/${locale}.json`, import.meta.url), 'utf8'));
const translator = (locale: string): Translate => {
	const dict = { ...strings('en'), ...strings(locale) };
	return (key, vars) => interpolate(dict[key] ?? key, vars);
};

// A department vote needing 2 approvals, 40 % turnout, 5 eligible; each case changes what is missing.
const department: OpenVote = {
	deadline: true,
	eligible: 5,
	cast: 3,
	yes: 1,
	required: 2,
	vetoHoldersMissing: 2,
	vetoed: false,
	quorum: 40_000_000,
};
const realmWide: OpenVote = {
	deadline: true,
	eligible: 5,
	cast: 3,
	yes: 2,
	required: null,
	vetoHoldersMissing: 0,
	vetoed: false,
	quorum: 0,
};

describe('waitingText', () => {
	const en = translator('en');

	it('names the approvals and the veto holders a department vote still needs', () => {
		assert.equal(
			waitingText(en, department),
			"Waiting for 1 more approval and 2 veto holders' votes, or the deadline",
		);
		assert.equal(
			waitingText(en, { ...department, yes: 0, vetoHoldersMissing: 1 }),
			"Waiting for 2 more approvals and 1 veto holder's vote, or the deadline",
		);
	});

	it('says "more approvals" only while there are fewer yes than it needs', () => {
		assert.equal(waitingText(en, { ...department, yes: 2 }), "Waiting for 2 veto holders' votes, or the deadline");
		assert.equal(waitingText(en, { ...department, yes: 4 }), "Waiting for 2 veto holders' votes, or the deadline");
	});

	it('mentions veto holders only when some are still to vote', () => {
		assert.equal(waitingText(en, { ...department, vetoHoldersMissing: 0 }), 'Waiting for 1 more approval, or the deadline');
		assert.equal(waitingText(en, { ...department, yes: 0, vetoHoldersMissing: 0 }), 'Waiting for 2 more approvals, or the deadline');
	});

	it('waits for the quorum when approvals and veto holders are done', () => {
		const done = { ...department, yes: 2, vetoHoldersMissing: 0 };
		assert.equal(waitingText(en, { ...done, cast: 1 }), 'Waiting for enough votes to reach the quorum, or the deadline');
		assert.equal(waitingText(en, { ...done, cast: 2 }), '');
	});

	it('lists the quorum whenever it is short, joined to the rest as a list', () => {
		assert.equal(
			waitingText(en, { ...department, vetoHoldersMissing: 0, cast: 1 }),
			'Waiting for 1 more approval and enough votes to reach the quorum, or the deadline',
		);
		assert.equal(
			waitingText(en, { ...department, yes: 0, vetoHoldersMissing: 1, cast: 1 }),
			"Waiting for 2 more approvals, 1 veto holder's vote and enough votes to reach the quorum, or the deadline",
		);
	});

	describe('while a veto holder has voted no', () => {
		it('names only that, with approvals short', () => {
			assert.equal(
				waitingText(en, { ...department, vetoed: true }),
				'Waiting for a veto holder to change their no, or the deadline',
			);
			assert.equal(
				waitingText(en, { ...department, vetoed: true, yes: 0, vetoHoldersMissing: 0, cast: 1 }),
				'Waiting for a veto holder to change their no, or the deadline',
			);
		});

		it('still says it when everything else is met', () => {
			const met = { ...department, yes: 2, vetoHoldersMissing: 0, cast: 3, vetoed: true };
			assert.equal(waitingText(en, met), 'Waiting for a veto holder to change their no, or the deadline');
		});

		it('says how a vote with no deadline stays open', () => {
			assert.equal(
				waitingText(en, { ...department, vetoed: true, deadline: false }),
				'Waiting for a veto holder to change their no: it stays open until it passes or everyone has voted',
			);
		});
	});

	it('says nothing of a department vote whose electorate is not known', () => {
		assert.equal(waitingText(en, { ...department, eligible: null }), '');
		assert.equal(waitingText(en, { ...department, eligible: 0 }), '');
		assert.equal(waitingText(en, { ...department, eligible: null, vetoed: true }), '');
	});

	it('says how a vote with no deadline stays open', () => {
		assert.equal(
			waitingText(en, { ...department, deadline: false }),
			"Waiting for 1 more approval and 2 veto holders' votes: it stays open until it passes or everyone has voted",
		);
	});

	it('names the voters a realm-wide vote waits for', () => {
		assert.equal(waitingText(en, realmWide), 'Waiting for 2 more voters or the deadline');
		assert.equal(waitingText(en, { ...realmWide, cast: 4 }), 'Waiting for 1 more voter or the deadline');
		assert.equal(waitingText(en, { ...realmWide, deadline: false }), 'Waiting for 2 more voters, or until the outcome is certain');
		assert.equal(waitingText(en, { ...realmWide, cast: 5 }), '');
		assert.equal(waitingText(en, { ...realmWide, eligible: null }), '');
	});
});

describe('the voting strings in every language', () => {
	const english = strings('en');
	const locales = ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia'];
	const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

	it('have the keys and the placeholders of English', () => {
		for (const locale of locales) {
			const other = strings(locale);
			assert.deepEqual(Object.keys(other).sort(), Object.keys(english).sort(), locale);
			for (const key of Object.keys(english)) {
				assert.deepEqual(placeholders(other[key]), placeholders(english[key]), `${locale} ${key}`);
			}
		}
	});

	it('read out every case of the waiting text, with nothing left to fill in', () => {
		const cases: OpenVote[] = [
			department,
			{ ...department, yes: 0, vetoHoldersMissing: 1 },
			{ ...department, vetoHoldersMissing: 0 },
			{ ...department, yes: 2 },
			{ ...department, yes: 2, vetoHoldersMissing: 0, cast: 1 },
			{ ...department, vetoHoldersMissing: 0, cast: 1 },
			{ ...department, yes: 0, vetoHoldersMissing: 1, cast: 1 },
			{ ...department, vetoed: true },
			{ ...department, vetoed: true, deadline: false },
			{ ...department, deadline: false },
			realmWide,
			{ ...realmWide, cast: 4 },
			{ ...realmWide, deadline: false },
			{ ...realmWide, deadline: false, cast: 4 },
		];
		for (const locale of ['en', ...locales]) {
			const t = translator(locale);
			const read = cases.map((vote) => waitingText(t, vote));
			for (const text of read) assert.ok(text && !/[{}]/.test(text), `${locale}: ${text}`);
			assert.equal(new Set(read).size, read.length, `${locale}: each case reads differently`);
		}
	});
});
