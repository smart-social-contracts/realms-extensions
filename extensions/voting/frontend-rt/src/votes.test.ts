import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';
import { ONE, PERCENT } from '../../../_shared/frontend/units.ts';
import {
	approvalBar,
	approvalLabel,
	approvalsNeeded,
	castingNote,
	castingVoteMatters,
	choiceOf,
	endedText,
	finalOutcome,
	firstVoteOf,
	isVetoed,
	missingVoters,
	myVote,
	quorumReached,
	requirementText,
	secondVoteText,
	vetoHoldersMissing,
	votersNeeded,
	votingRule,
	waitingText,
	type OpenVote,
	type Outcome,
	type Translate,
	type VoteState,
	type VotingRule,
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

const tally = (yes: number, no = 0, abstain = 0) => ({ yes, no, abstain });

// A department deciding 2 of 3 seats (the policy stores 2/3 rounded down), 40 % turnout, one with a veto.
const departmentRule: VotingRule = {
	threshold: 66_666_666,
	quorum: 40 * PERCENT,
	thresholdOf: 'eligible',
	castingVote: '',
	seats: 3,
	veto: true,
	majorityOfCast: false,
};
// The realm's own rule: more than half of the yes and no votes cast.
const realmRule: VotingRule = {
	threshold: 50 * PERCENT,
	quorum: 0,
	thresholdOf: 'cast',
	castingVote: '',
	seats: null,
	veto: false,
	majorityOfCast: false,
};

// A department vote needing 2 approvals, 5 eligible, 3 votes cast of which 1 yes; each case changes what is missing.
const department: OpenVote = {
	deadline: true,
	department: true,
	rule: departmentRule,
	eligible: 5,
	votes: tally(1, 1, 1),
	vetoed: false,
	castingChoice: '',
	firstVote: null,
	expiresIfTied: false,
	vetoHoldersMissing: 2,
};
const realmWide: OpenVote = {
	deadline: true,
	department: false,
	rule: realmRule,
	eligible: 5,
	votes: tally(2, 1),
	vetoed: false,
	castingChoice: '',
	firstVote: null,
	expiresIfTied: false,
	vetoHoldersMissing: 0,
};

describe('waitingText', () => {
	const en = translator('en');

	it('names the approvals and the veto holders a department vote still needs', () => {
		assert.equal(
			waitingText(en, department),
			"Waiting for 1 more approval and 2 veto holders' votes, or the deadline",
		);
		assert.equal(
			waitingText(en, { ...department, votes: tally(0, 1, 2), vetoHoldersMissing: 1 }),
			"Waiting for 2 more approvals and 1 veto holder's vote, or the deadline",
		);
	});

	it('says "more approvals" only while there are fewer yes than it needs', () => {
		assert.equal(waitingText(en, { ...department, votes: tally(2, 0, 1) }), "Waiting for 2 veto holders' votes, or the deadline");
		assert.equal(waitingText(en, { ...department, votes: tally(4) }), "Waiting for 2 veto holders' votes, or the deadline");
	});

	it('mentions veto holders only when some are still to vote', () => {
		assert.equal(waitingText(en, { ...department, vetoHoldersMissing: 0 }), 'Waiting for 1 more approval, or the deadline');
		assert.equal(
			waitingText(en, { ...department, votes: tally(0, 1, 2), vetoHoldersMissing: 0 }),
			'Waiting for 2 more approvals, or the deadline',
		);
	});

	it('waits for the quorum when approvals and veto holders are done', () => {
		const strict = { ...departmentRule, quorum: 60 * PERCENT }; // 3 of the 5 must vote
		const done = { ...department, rule: strict, vetoHoldersMissing: 0 };
		assert.equal(waitingText(en, { ...done, votes: tally(2) }), 'Waiting for enough votes to reach the quorum, or the deadline');
		assert.equal(waitingText(en, { ...done, votes: tally(2, 0, 1) }), '');
	});

	it('lists the quorum whenever it is short, joined to the rest as a list', () => {
		assert.equal(
			waitingText(en, { ...department, vetoHoldersMissing: 0, votes: tally(1) }),
			'Waiting for 1 more approval and enough votes to reach the quorum, or the deadline',
		);
		assert.equal(
			waitingText(en, { ...department, votes: tally(0, 1), vetoHoldersMissing: 1 }),
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
				waitingText(en, { ...department, vetoed: true, votes: tally(0, 1), vetoHoldersMissing: 0 }),
				'Waiting for a veto holder to change their no, or the deadline',
			);
		});

		it('still says it when everything else is met', () => {
			const met = { ...department, votes: tally(2, 1), vetoHoldersMissing: 0, vetoed: true };
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

	it('says nothing of a department vote that records no rule, rather than guess its approvals', () => {
		assert.equal(waitingText(en, { ...department, rule: null }), '');
		assert.equal(waitingText(en, { ...department, rule: null, vetoed: true }), '');
	});

	it('says how a vote with no deadline stays open', () => {
		assert.equal(
			waitingText(en, { ...department, deadline: false }),
			"Waiting for 1 more approval and 2 veto holders' votes: it stays open until it passes or everyone has voted",
		);
	});

	it('names the voters a realm-wide vote waits for', () => {
		assert.equal(waitingText(en, realmWide), 'Waiting for 2 more voters or the deadline');
		assert.equal(waitingText(en, { ...realmWide, votes: tally(2, 2) }), 'Waiting for 1 more voter or the deadline');
		assert.equal(waitingText(en, { ...realmWide, deadline: false }), 'Waiting for 2 more voters, or until the outcome is certain');
		assert.equal(waitingText(en, { ...realmWide, votes: tally(2, 2, 1) }), '');
		assert.equal(waitingText(en, { ...realmWide, eligible: null }), '');
	});

	it('names the voters of a realm-wide vote whatever rule it records', () => {
		assert.equal(waitingText(en, { ...realmWide, rule: null }), 'Waiting for 2 more voters or the deadline');
		assert.equal(
			waitingText(en, { ...realmWide, rule: { ...realmRule, thresholdOf: 'eligible' } }),
			'Waiting for 2 more voters or the deadline',
		);
	});
});

describe('votingRule', () => {
	const stored = {
		threshold: 66_666_666,
		quorum: 40 * PERCENT,
		threshold_of: 'eligible',
		casting_vote: '',
		tally: { yes: 0, no: 0, abstain: 0, eligible: 4, seats: 3, veto: ['dana'] },
	};

	it('reads a department rule with its seats and whether it has veto holders', () => {
		assert.deepEqual(votingRule(stored, true), departmentRule);
		assert.equal(votingRule({ ...stored, tally: { ...stored.tally, veto: [] } }, true)?.veto, false);
	});

	it('reads a realm-wide rule with its basis and its casting member', () => {
		const realm = { ...stored, threshold: 60 * PERCENT, quorum: 0, threshold_of: 'cast', casting_vote: 'dana-id', tally: { yes: 0, no: 0, abstain: 0 } };
		assert.deepEqual(votingRule(realm, false), {
			threshold: 60 * PERCENT,
			quorum: 0,
			thresholdOf: 'cast',
			castingVote: 'dana-id',
			seats: null,
			veto: false,
			majorityOfCast: false,
		});
		assert.equal(votingRule({ ...realm, threshold_of: 'eligible' }, false)?.thresholdOf, 'eligible');
	});

	it('is null for a proposal that records no rule, rather than numbers made up from what is there', () => {
		// stored before the rule was kept, or by a realm that does not keep it: no basis, a Json field read as text
		assert.equal(votingRule({ threshold: 50 * PERCENT, quorum: 0, tally: '{}' }, false), null);
		assert.equal(votingRule({ ...stored, threshold_of: undefined }, true), null);
		assert.equal(votingRule({ ...stored, threshold_of: 'other' }, false), null);
		assert.equal(votingRule({ ...stored, threshold: null }, false), null);
		assert.equal(votingRule({ ...stored, quorum: undefined }, false), null);
		assert.equal(votingRule({ ...stored, threshold: '66666666' }, false), null);
		assert.equal(votingRule({}, false), null);
		assert.equal(votingRule(undefined, false), null);
	});

	it('is null for a department vote that has no seats to take its threshold of', () => {
		assert.equal(votingRule({ ...stored, tally: '{}' }, true), null);
		assert.equal(votingRule({ ...stored, tally: { ...stored.tally, seats: 0 } }, true), null);
		assert.equal(votingRule({ ...stored, tally: { yes: 0, no: 0, abstain: 0, required: 2 } }, true), null);
	});

	it("reads that a department's vote counts the votes cast, as its policy says", () => {
		const counted = { ...stored, threshold: 50 * PERCENT, threshold_of: 'cast', casting_vote: 'dana-id', majority_of_cast: true };
		assert.deepEqual(votingRule(counted, true), {
			threshold: 50 * PERCENT,
			quorum: 40 * PERCENT,
			thresholdOf: 'cast',
			castingVote: 'dana-id',
			seats: 3,
			veto: true,
			majorityOfCast: true,
		});
	});

	it('is a department vote by seats unless the proposal says it counts the votes cast', () => {
		assert.equal(votingRule({ ...stored, majority_of_cast: false }, true)?.majorityOfCast, false);
		assert.equal(votingRule({ ...stored, majority_of_cast: 'yes' }, true)?.majorityOfCast, false);
		assert.equal(votingRule({ ...stored, majority_of_cast: null }, true)?.majorityOfCast, false);
	});

	it('never takes a realm-wide vote for one that counts the votes cast', () => {
		const realm = { ...stored, threshold_of: 'cast', majority_of_cast: true, tally: { yes: 0, no: 0, abstain: 0 } };
		assert.equal(votingRule(realm, false)?.majorityOfCast, false);
	});
});

describe('firstVoteOf', () => {
	it('reads the count the realm kept of a tied first vote', () => {
		assert.deepEqual(firstVoteOf({ first_vote: { yes: 2, no: 2, abstain: 1, eligible: 5, seats: 5 } }), tally(2, 2, 1));
	});

	it('is null for a vote that is the first, whatever else the proposal says', () => {
		assert.equal(firstVoteOf({ first_vote: null }), null);
		assert.equal(firstVoteOf({}), null);
		assert.equal(firstVoteOf(undefined), null);
		assert.equal(firstVoteOf({ first_vote: '{}' }), null); // a Json field read as text
	});
});

describe('approvalsNeeded', () => {
	// The realm's test of a department vote: yes > 0 and yes * ONE >= threshold * seats.
	const realmReaches = (yes: number, threshold: number, seats: number) => yes > 0 && yes * ONE >= threshold * seats;

	it('is the fewest yes votes the realm accepts, for every policy and a stricter threshold', () => {
		const thresholds = [0, 1, 33_333_333, 50 * PERCENT, 66_666_666, 75 * PERCENT, 99_999_999, ONE];
		for (let seats = 1; seats <= 12; seats++) {
			for (let m = 1; m <= seats; m++) thresholds.push(Math.floor((m * ONE) / seats)); // as the policy stores m of n
			for (const threshold of thresholds) {
				const needed = approvalsNeeded(threshold, seats);
				for (let yes = 0; yes <= seats + 1; yes++) {
					assert.equal(yes >= needed, realmReaches(yes, threshold, seats), `${threshold} of ${seats} seats, ${yes} yes`);
				}
			}
		}
	});

	it('rounds a share of the seats up, never down', () => {
		assert.equal(approvalsNeeded(66_666_666, 3), 2);
		assert.equal(approvalsNeeded(75 * PERCENT, 4), 3);
		assert.equal(approvalsNeeded(ONE, 3), 3);
		assert.equal(approvalsNeeded(1, 4), 1);
		assert.equal(approvalsNeeded(0, 4), 1); // at least one yes, always
	});
});

describe('votersNeeded', () => {
	// The realm's quorum test (quorum_met, a department that counts the votes cast): cast * ONE >= quorum * seats.
	const realmReaches = (cast: number, quorum: number, seats: number) => cast * ONE >= quorum * seats;

	it('is the fewest votes cast the realm accepts, for every quorum of every number of seats', () => {
		const quorums = [1, 25 * PERCENT, 33_333_333, 40 * PERCENT, 50 * PERCENT, 66_666_666, 75 * PERCENT, 99_999_999, ONE];
		for (let seats = 1; seats <= 40; seats++) {
			for (let m = 1; m <= seats; m++) quorums.push(Math.floor((m * ONE) / seats));
			for (const quorum of quorums) {
				const needed = votersNeeded(quorum, seats);
				for (let cast = 0; cast <= seats + 1; cast++) {
					assert.equal(cast >= needed, realmReaches(cast, quorum, seats), `${quorum} of ${seats} seats, ${cast} cast`);
				}
			}
		}
	});

	it('rounds a share of the seats up, never down', () => {
		assert.equal(votersNeeded(33_333_333, 5), 2);
		assert.equal(votersNeeded(33_333_333, 33), 11); // 10.99999989
		assert.equal(votersNeeded(40 * PERCENT, 5), 2);
		assert.equal(votersNeeded(50 * PERCENT, 5), 3);
		assert.equal(votersNeeded(ONE, 7), 7);
	});
});

// The cases of the realm's finalization tests (realms-gos tests/ggg/test_voting_rule.py and test_proposals.py), as the
// votes they end with. ``eligible`` is the electorate counted when the vote opened, ``casting`` what the casting member voted.
// ``source`` says how a case relates to the Python: "copied" has the same votes and the same end; "adapted" has the votes
// of a Python case that asserts the status while the vote is open or after one more vote, here taken to the deadline;
// "new" is not in the Python. ``ends`` is how the realm settles it; ``page`` is what the screen says when that differs:
// a tie that the casting member's yes decides depends on their standing, which the screen cannot read.
type Case = {
	name: string;
	source: 'copied' | 'adapted' | 'new';
	rule: Partial<VotingRule>;
	votes: ReturnType<typeof tally>;
	eligible: number;
	vetoed?: boolean;
	casting?: string;
	/** Whether this is the second vote, which a tied first vote (1 yes, 1 no, 2 abstentions) put the proposal to. */
	second?: boolean;
	/** Whether the vote ended after the time the proposal takes effect. */
	late?: boolean;
	ends: 'accepted' | 'rejected' | 'second_vote' | 'expired';
	page?: Outcome;
};
const asRealm = (rule: Partial<VotingRule>): VotingRule => ({ ...realmRule, ...rule });
// A department's rule stores m of n rounded down: m * ONE // n.
const share = (m: number, n: number) => Math.floor((m * ONE) / n);
const asDepartment = (m: number, n: number, rule: Partial<VotingRule> = {}): VotingRule => ({
	...departmentRule,
	threshold: share(m, n),
	quorum: 0,
	seats: n,
	veto: false,
	...rule,
});
const castingDecides = 'depends_on_casting_member';

const REALM_CASES: Case[] = [
	// test_the_yes_votes_exceed_the_threshold_of_the_votes_cast_or_of_all_the_eligible (Agora has seven members)
	{ name: 'Cast: 3 yes of 3 cast', source: 'copied', rule: {}, votes: tally(3), eligible: 7, ends: 'accepted' },
	{ name: 'Eligible: 3 yes of 7 is not more than half', source: 'copied', rule: { thresholdOf: 'eligible' }, votes: tally(3), eligible: 7, ends: 'rejected' },
	{ name: 'Eligible: 4 yes of 7', source: 'copied', rule: { thresholdOf: 'eligible' }, votes: tally(4), eligible: 7, ends: 'accepted' },
	// test_a_raised_threshold_decides_the_vote
	{ name: '75 %: exactly three quarters is not more', source: 'copied', rule: { threshold: 75 * PERCENT }, votes: tally(3, 1), eligible: 7, ends: 'rejected' },
	{ name: '75 %: 4 of 5', source: 'copied', rule: { threshold: 75 * PERCENT }, votes: tally(4, 1), eligible: 7, ends: 'accepted' },
	// test_a_tie_at_the_threshold_is_accepted_only_with_the_casting_members_yes (the casting member is Dana)
	{ name: 'tie at 50 % with the casting yes', source: 'copied', rule: { castingVote: 'dana' }, votes: tally(1, 1), eligible: 7, casting: 'yes', ends: 'accepted', page: castingDecides },
	{ name: 'casting member voted no: bob yes, alice and dana no', source: 'copied', rule: { castingVote: 'dana' }, votes: tally(1, 2), eligible: 7, casting: 'no', ends: 'rejected' },
	{ name: 'casting member abstained: bob yes, alice no', source: 'copied', rule: { castingVote: 'dana' }, votes: tally(1, 1, 1), eligible: 7, casting: 'abstain', ends: 'rejected' },
	{ name: 'casting member did not vote', source: 'copied', rule: { castingVote: 'dana' }, votes: tally(1, 1), eligible: 7, casting: '', ends: 'rejected' },
	{ name: 'tie at a raised 60 % with the casting yes', source: 'copied', rule: { castingVote: 'dana', threshold: 60 * PERCENT }, votes: tally(3, 2), eligible: 7, casting: 'yes', ends: 'accepted', page: castingDecides },
	{ name: 'below a raised 60 %: casting decides ties, not shortfalls', source: 'copied', rule: { castingVote: 'dana', threshold: 60 * PERCENT }, votes: tally(2, 2), eligible: 7, casting: 'yes', ends: 'rejected' },
	{ name: 'outvoted despite the casting yes', source: 'copied', rule: { castingVote: 'dana' }, votes: tally(1, 2), eligible: 7, casting: 'yes', ends: 'rejected' },
	// test_without_a_casting_vote_a_tie_rejects
	{ name: 'tie at 50 % with no casting member', source: 'copied', rule: {}, votes: tally(1, 1), eligible: 7, ends: 'rejected' },
	// test_a_casting_member_who_has_left_means_ties_reject_until_another_is_named: Dana voted yes and was then suspended. The
	// realm rejects the tie; the votes are the same as a tie her yes decides, so the screen cannot tell the two apart.
	{ name: 'tie at 50 %, the casting member voted yes and has left', source: 'copied', rule: { castingVote: 'dana' }, votes: tally(1, 1), eligible: 7, casting: 'yes', ends: 'rejected', page: castingDecides },
	// test_the_casting_vote_decides_only_ties_over_the_votes_cast (8 eligible, 4 yes: exactly half)
	{ name: 'Eligible: 4 yes of 8 is a tie of the eligible, which no casting vote decides', source: 'copied', rule: { thresholdOf: 'eligible', castingVote: 'dana' }, votes: tally(4), eligible: 8, casting: 'yes', ends: 'rejected' },
	// decided_by_casting_vote holds only for a threshold of the votes cast: a tie of those is no tie of the eligible
	{ name: 'Eligible: 1 yes and 1 no of 2 eligible, which the casting yes does not decide', source: 'new', rule: { thresholdOf: 'eligible', castingVote: 'dana' }, votes: tally(1, 1), eligible: 2, casting: 'yes', ends: 'rejected' },
	// test_I_GOV_3_quorum_and_threshold (quorum 50 %: alice and bob voted yes, of 7)
	{ name: 'quorum 50 % not reached by 2 yes of 7', source: 'copied', rule: { quorum: 50 * PERCENT }, votes: tally(2), eligible: 7, ends: 'rejected' },
	{ name: 'quorum 50 % reached by 4 of 7', source: 'new', rule: { quorum: 50 * PERCENT }, votes: tally(3, 1), eligible: 7, ends: 'accepted' },
];

const DEPARTMENT_CASES: Case[] = [
	// test_a_departments_vote_ends_at_its_stored_threshold (4 seats, 4 voters): the Python asserts the status after each vote
	{ name: 'm = 2 of four seats: 2 yes', source: 'adapted', rule: asDepartment(2, 4), votes: tally(2), eligible: 4, ends: 'accepted' },
	{ name: '75 % of four seats is three: 2 yes', source: 'adapted', rule: asDepartment(2, 4, { threshold: 75 * PERCENT }), votes: tally(2), eligible: 4, ends: 'rejected' },
	{ name: '75 % of four seats: 3 yes', source: 'adapted', rule: asDepartment(2, 4, { threshold: 75 * PERCENT }), votes: tally(3), eligible: 4, ends: 'accepted' },
	// test_a_departments_threshold_is_a_share_of_the_policys_n_whoever_fills_the_seats (m = 2, n = 3, four voters)
	{ name: '2 of 3 seats: 1 yes', source: 'adapted', rule: asDepartment(2, 3), votes: tally(1), eligible: 4, ends: 'rejected' },
	{ name: '2 of 3 seats: m, exactly', source: 'adapted', rule: asDepartment(2, 3), votes: tally(2), eligible: 4, ends: 'accepted' },
	{ name: '100 % of 3 seats: 2 yes', source: 'adapted', rule: asDepartment(2, 3, { threshold: ONE }), votes: tally(2), eligible: 4, ends: 'rejected' },
	{ name: '100 % of 3 seats is 3 yes, not 4', source: 'adapted', rule: asDepartment(2, 3, { threshold: ONE }), votes: tally(3), eligible: 4, ends: 'accepted' },
	// test_a_vacancy_never_makes_a_departments_vote_easier (n = 4, two seats filled)
	{ name: 'vacancy: one yes is not m', source: 'adapted', rule: asDepartment(2, 4), votes: tally(1), eligible: 2, ends: 'rejected' },
	{ name: 'vacancy: two yes', source: 'adapted', rule: asDepartment(2, 4), votes: tally(2), eligible: 2, ends: 'accepted' },
	{ name: 'vacancy: one yes, one no', source: 'copied', rule: asDepartment(2, 4), votes: tally(1, 1), eligible: 2, ends: 'rejected' },
	// test_a_threshold_the_filled_seats_cannot_reach_rejects_the_vote
	{ name: 'three approvals from two seats', source: 'copied', rule: asDepartment(3, 4), votes: tally(2), eligible: 2, ends: 'rejected' },
	// test_a_direct_policy_needs_one_yes_however_many_hold_seats
	{ name: 'direct policy: one yes', source: 'copied', rule: asDepartment(1, 1), votes: tally(1), eligible: 2, ends: 'accepted' },
	{ name: 'direct policy: no yes at all', source: 'new', rule: asDepartment(1, 1), votes: tally(0, 0, 2), eligible: 2, ends: 'rejected' },
	// test_I_GOV_7_a_vetoing_no_keeps_the_vote_open_until_it_ends_and_rejects_it_then (2 of 3, dana holds a veto)
	{ name: 'veto: dana no, bob and alice yes', source: 'copied', rule: asDepartment(2, 3, { veto: true }), votes: tally(2, 1), eligible: 4, vetoed: true, ends: 'rejected' },
	{ name: 'veto: dana changed her mind', source: 'adapted', rule: asDepartment(2, 3, { veto: true }), votes: tally(3), eligible: 4, ends: 'accepted' },
	// test_I_GOV_7_a_veto_holder_who_has_not_voted_keeps_a_department_vote_open
	{ name: 'veto: dana abstained', source: 'adapted', rule: asDepartment(2, 3, { veto: true }), votes: tally(2, 0, 1), eligible: 4, ends: 'accepted' },
	// test_I_GOV_7_a_veto_holder_who_never_votes_does_not_block_acceptance_at_the_deadline
	{ name: 'veto: dana never voted', source: 'copied', rule: asDepartment(2, 3, { veto: true }), votes: tally(2), eligible: 4, ends: 'accepted' },
	// test_veto (m = 1 of 3; dana, who holds the veto, and bob are the only two who may vote)
	{ name: 'veto: one approval and a no from the veto holder', source: 'copied', rule: asDepartment(1, 3, { veto: true }), votes: tally(1, 1), eligible: 2, vetoed: true, ends: 'rejected' },
	// test_I_GOV_3_a_departments_quorum_is_enforced (m = 1 of 3, quorum 75 % of four)
	{ name: 'quorum 75 %: one yes of four', source: 'copied', rule: asDepartment(1, 3, { quorum: 75 * PERCENT }), votes: tally(1), eligible: 4, ends: 'rejected' },
	{ name: 'quorum 75 %: two of four', source: 'adapted', rule: asDepartment(1, 3, { quorum: 75 * PERCENT }), votes: tally(1, 0, 1), eligible: 4, ends: 'rejected' },
	{ name: 'quorum 75 %: abstentions count towards it', source: 'adapted', rule: asDepartment(1, 3, { quorum: 75 * PERCENT }), votes: tally(1, 0, 2), eligible: 4, ends: 'accepted' },
	// test_I_GOV_7_a_no_can_be_replaced_after_approvals_become_impossible (3 of 3)
	{ name: '3 of 3: two no', source: 'copied', rule: asDepartment(3, 3), votes: tally(0, 2), eligible: 4, ends: 'rejected' },
	{ name: '3 of 3: three yes and a no', source: 'adapted', rule: asDepartment(3, 3), votes: tally(3, 1), eligible: 4, ends: 'accepted' },
];

// A department that counts the votes cast (realms-gos tests/ggg/test_department_majority.py): Civil Registry seats dana (its head, the
// casting member), bob, alice and carla, so four voters whatever its policy's n; a majority of the votes cast, a half unless stated.
const asMajority = (n: number, rule: Partial<VotingRule> = {}): VotingRule => ({
	...asDepartment(1, n),
	threshold: 50 * PERCENT,
	thresholdOf: 'cast',
	castingVote: 'dana',
	majorityOfCast: true,
	...rule,
});
const quarter = (rule: Partial<VotingRule> = {}) => asMajority(4, { threshold: 75 * PERCENT, ...rule });
const FIRST_VOTE = tally(1, 1, 2); // the tied first vote of the cases that are a second vote

const MAJORITY_CASES: Case[] = [
	// test_the_yes_votes_must_exceed_the_no_votes_and_abstentions_count_for_the_quorum_only (quorum 50 %)
	{ name: '2 yes, 1 no, 1 abstention', source: 'copied', rule: asMajority(4, { quorum: 50 * PERCENT }), votes: tally(2, 1, 1), eligible: 4, ends: 'accepted' },
	{ name: '1 yes, 1 no, 2 abstentions is a tie, not a majority', source: 'copied', rule: asMajority(4, { quorum: 50 * PERCENT }), votes: tally(1, 1, 2), eligible: 4, ends: 'second_vote' },
	{ name: '1 yes, 2 no, 1 abstention', source: 'copied', rule: asMajority(4, { quorum: 50 * PERCENT }), votes: tally(1, 2, 1), eligible: 4, ends: 'rejected' },
	// test_a_vote_that_has_not_ended_is_decided_at_its_deadline_not_before
	{ name: '2 yes at the deadline', source: 'copied', rule: asMajority(4), votes: tally(2), eligible: 4, ends: 'accepted' },
	{ name: 'one yes against no one: abstentions do not count against it', source: 'new', rule: asMajority(4), votes: tally(1, 0, 3), eligible: 4, ends: 'accepted' },
	{ name: 'nobody voted', source: 'new', rule: asMajority(4), votes: tally(0), eligible: 4, ends: 'rejected' },
	// test_the_quorum_is_over_the_policys_n_so_a_vacancy_never_makes_the_vote_easier (four seats filled, quorum 50 %)
	{ name: 'n = 8: all four voting is 50 % of the seats', source: 'copied', rule: asMajority(8, { quorum: 50 * PERCENT }), votes: tally(4), eligible: 4, ends: 'accepted' },
	{ name: 'n = 10: all four voting is 40 % of the seats', source: 'copied', rule: asMajority(10, { quorum: 50 * PERCENT }), votes: tally(4), eligible: 4, ends: 'rejected' },
	// test_a_tie_in_the_first_vote_is_put_to_a_second ..., test_a_tie_at_the_deadline_is_recorded_by_finalize_as_a_second_vote
	{ name: 'a tie at the deadline', source: 'copied', rule: asMajority(4), votes: tally(1, 1), eligible: 4, ends: 'second_vote' },
	// test_a_tie_in_the_second_vote_is_decided_by_the_casting_vote_only_when_it_voted_yes: the realm accepts the first; it depends on
	// the casting member's standing, which the screen cannot read
	{ name: 'second vote, tied, the casting member voted yes', source: 'copied', rule: asMajority(4), votes: tally(1, 1), eligible: 4, second: true, casting: 'yes', ends: 'accepted', page: castingDecides },
	{ name: 'second vote, tied, the casting member voted no', source: 'copied', rule: asMajority(4), votes: tally(1, 1), eligible: 4, second: true, casting: 'no', ends: 'rejected' },
	{ name: 'second vote, tied, the casting member abstained', source: 'copied', rule: asMajority(4), votes: tally(1, 1, 1), eligible: 4, second: true, casting: 'abstain', ends: 'rejected' },
	{ name: 'second vote, tied, the casting member did not vote', source: 'new', rule: asMajority(4), votes: tally(1, 1), eligible: 4, second: true, casting: '', ends: 'rejected' },
	{ name: 'second vote, a majority, whatever the casting member voted', source: 'new', rule: asMajority(4), votes: tally(2, 1), eligible: 4, second: true, casting: 'no', ends: 'accepted' },
	{ name: 'second vote, the casting yes does not turn a majority of no into a tie', source: 'new', rule: asMajority(4), votes: tally(1, 2), eligible: 4, second: true, casting: 'yes', ends: 'rejected' },
	// test_a_head_who_holds_no_seat_neither_votes_nor_casts_the_deciding_vote: they cannot vote, so the screen finds no vote of theirs
	{ name: 'second vote, tied, the head holds no seat', source: 'copied', rule: asMajority(4, { castingVote: 'mallory' }), votes: tally(1, 1), eligible: 4, second: true, casting: '', ends: 'rejected' },
	// test_with_no_head_a_tie_in_the_second_vote_rejects
	{ name: 'second vote, tied, no head', source: 'copied', rule: asMajority(4, { castingVote: '' }), votes: tally(1, 1), eligible: 4, second: true, ends: 'rejected' },
	// test_the_second_vote_is_decided_like_the_first_so_one_that_misses_its_quorum_is_rejected (quorum 75 %)
	{ name: 'first vote: three of four voted and tied', source: 'copied', rule: asMajority(4, { quorum: 75 * PERCENT }), votes: tally(1, 1, 1), eligible: 4, ends: 'second_vote' },
	{ name: 'second vote: one of four voted', source: 'copied', rule: asMajority(4, { quorum: 75 * PERCENT }), votes: tally(1), eligible: 4, second: true, ends: 'rejected' },
	// test_a_veto_holders_no_rejects_a_tied_first_vote_instead_of_putting_it_to_a_second
	{ name: 'veto: a tie with the veto holder against', source: 'copied', rule: asMajority(4, { veto: true }), votes: tally(1, 1, 2), eligible: 4, vetoed: true, ends: 'rejected' },
	{ name: 'veto: a majority with the veto holder against', source: 'new', rule: asMajority(4, { veto: true }), votes: tally(3, 1), eligible: 4, vetoed: true, ends: 'rejected' },
	{ name: 'veto: a veto holder who has not voted does not hold it', source: 'new', rule: asMajority(4, { veto: true }), votes: tally(2), eligible: 4, ends: 'accepted' },
	// test_a_first_vote_that_ends_after_the_effective_time_expires_the_proposal_instead_of_putting_it_to_a_second
	{ name: 'a first vote that tied after the effective time', source: 'copied', rule: asMajority(4), votes: tally(1, 1), eligible: 4, late: true, ends: 'expired' },
	{ name: 'the same, with a veto holder against: the veto rejects it first', source: 'new', rule: asMajority(4, { veto: true }), votes: tally(1, 1, 2), eligible: 4, late: true, vetoed: true, ends: 'rejected' },
	{ name: 'only a first vote expires: a second vote that tied still goes to the casting vote', source: 'new', rule: asMajority(4), votes: tally(1, 1), eligible: 4, second: true, casting: 'yes', late: true, ends: 'accepted', page: castingDecides },
	{ name: 'a tie below the quorum is rejected, not expired', source: 'new', rule: asMajority(4, { quorum: 75 * PERCENT }), votes: tally(1, 1), eligible: 4, late: true, ends: 'rejected' },
	// test_a_stricter_threshold_has_its_own_tie_decided_as_the_default_is (75 %)
	{ name: '75 %: 3 yes of 4 is exactly the threshold, a tie', source: 'copied', rule: quarter(), votes: tally(3, 1), eligible: 4, ends: 'second_vote' },
	{ name: '75 %: the second vote, with the casting yes', source: 'copied', rule: quarter(), votes: tally(3, 1), eligible: 4, second: true, casting: 'yes', ends: 'accepted', page: castingDecides },
	{ name: '75 %: a half is below the threshold, no tie', source: 'copied', rule: quarter(), votes: tally(2, 2), eligible: 4, ends: 'rejected' },
	{ name: '75 %: 4 of 4 exceeds it', source: 'new', rule: quarter(), votes: tally(4), eligible: 4, ends: 'accepted' },
	// test_eligible_adds_an_absolute_majority_of_the_policys_n_to_the_majority_of_the_votes_cast (n = 4, a half of the seats is two)
	{ name: 'eligible: 1 yes beats 0 no, but 2 of 4 seats is half', source: 'copied', rule: asMajority(4, { thresholdOf: 'eligible' }), votes: tally(1, 0, 3), eligible: 4, ends: 'rejected' },
	{ name: 'cast: the same votes pass', source: 'copied', rule: asMajority(4), votes: tally(1, 0, 3), eligible: 4, ends: 'accepted' },
	{ name: 'eligible: 2 yes reach half the seats and beat 1 no', source: 'copied', rule: asMajority(4, { thresholdOf: 'eligible' }), votes: tally(2, 1, 1), eligible: 4, ends: 'accepted' },
	{ name: 'eligible: a tie still goes to a second vote', source: 'copied', rule: asMajority(4, { thresholdOf: 'eligible' }), votes: tally(2, 2), eligible: 4, ends: 'second_vote' },
	{ name: 'eligible: a first vote tied below the seats still goes to a second vote', source: 'new', rule: asMajority(4, { thresholdOf: 'eligible', threshold: ONE }), votes: tally(2, 2), eligible: 4, ends: 'second_vote' },
	{ name: 'eligible: a second vote tied, the casting yes, but below the seats', source: 'new', rule: asMajority(4, { thresholdOf: 'eligible', threshold: 75 * PERCENT }), votes: tally(2, 2), eligible: 4, second: true, casting: 'yes', ends: 'rejected' },
	// test_under_eligible_a_stricter_threshold_is_a_share_of_the_policys_n_not_of_the_votes_cast (n = 4, 75 % is three seats)
	{ name: 'eligible 75 %: 3 yes and 1 no reach three seats and beat one no', source: 'copied', rule: asMajority(4, { thresholdOf: 'eligible', threshold: 75 * PERCENT }), votes: tally(3, 1), eligible: 4, ends: 'accepted' },
	{ name: 'eligible 75 %: 2 yes against 0 no do not reach three seats', source: 'new', rule: asMajority(4, { thresholdOf: 'eligible', threshold: 75 * PERCENT }), votes: tally(2, 0, 2), eligible: 4, ends: 'rejected' },
	// test_under_eligible_the_majority_of_the_votes_cast_stays_at_a_half_with_its_own_tie (n = 2, 75 % of two seats is two)
	{ name: 'eligible 75 % of n = 2: 2 yes and 2 no tie at a half of the votes cast', source: 'copied', rule: asMajority(2, { thresholdOf: 'eligible', threshold: 75 * PERCENT }), votes: tally(2, 2), eligible: 4, ends: 'second_vote' },
];

describe('the vote ends as the realm settles it', () => {
	const en = translator('en');
	const stateOf = (c: Case, department: boolean): VoteState => ({
		department,
		rule: department ? (c.rule as VotingRule) : asRealm(c.rule),
		eligible: c.eligible,
		votes: c.votes,
		vetoed: c.vetoed ?? false,
		castingChoice: c.casting ?? '',
		firstVote: c.second ? FIRST_VOTE : null,
		expiresIfTied: c.late ?? false,
	});

	for (const [kind, cases, department] of [
		['realm-wide', REALM_CASES, false],
		['department', DEPARTMENT_CASES, true],
		['department, majority of the votes cast', MAJORITY_CASES, true],
	] as const) {
		describe(kind, () => {
			for (const c of cases) {
				it(`${c.source}: ${c.name}: ${c.page ?? c.ends}`, () => {
					assert.equal(finalOutcome(stateOf(c, department)), c.page ?? c.ends);
				});
			}
		});
	}

	it("a department's waiting text names nothing exactly when the realm accepts it", () => {
		for (const c of DEPARTMENT_CASES) {
			const open: OpenVote = { ...stateOf(c, true), deadline: true, vetoHoldersMissing: 0 };
			assert.equal(waitingText(en, open) === '', c.ends === 'accepted', c.name);
		}
	});

	it("a casting vote is named exactly when the votes stand at the threshold and the vote has a casting member", () => {
		for (const c of REALM_CASES) {
			const tied = c.votes.yes + c.votes.no > 0 && c.rule.thresholdOf !== 'eligible' && c.votes.yes * ONE === asRealm(c.rule).threshold * (c.votes.yes + c.votes.no);
			assert.equal(castingNote(en, stateOf(c, false), 'dana') !== '', tied && !!c.rule.castingVote, c.name);
		}
	});

	it('draws the bar so that its fill passes the threshold mark exactly when the realm accepts it', () => {
		// Without a quorum, a veto or a casting vote nothing else decides: it is the threshold of the basis the bar measures.
		for (const c of REALM_CASES.filter((c) => !c.rule.quorum && !c.rule.castingVote)) {
			const bar = approvalBar(asRealm(c.rule), c.votes, c.eligible);
			assert.equal(bar.fill > bar.mark, c.ends === 'accepted', c.name);
		}
		for (const c of DEPARTMENT_CASES.filter((c) => !c.rule.quorum && !c.rule.veto)) {
			const bar = approvalBar(c.rule as VotingRule, c.votes, c.eligible);
			assert.equal(bar.fill >= bar.mark && c.votes.yes > 0, c.ends === 'accepted', c.name);
		}
	});

	it("reads the casting member's vote only for a tie at the threshold of a vote that has one", () => {
		assert.equal(castingVoteMatters(null, tally(1, 1), null), false);
		assert.equal(castingVoteMatters(asRealm({ castingVote: 'dana' }), tally(2, 1), null), false);
		assert.equal(castingVoteMatters(asRealm({ castingVote: 'dana' }), tally(0), null), false);
		assert.equal(castingVoteMatters(asRealm({ castingVote: 'dana' }), tally(1, 1), null), true);
		assert.equal(castingVoteMatters(asRealm({ castingVote: '' }), tally(1, 1), null), false);
		assert.equal(castingVoteMatters(asDepartment(1, 2, { castingVote: 'dana' }), tally(1, 1), null), false);
	});

	it("reads the casting member's vote for a department that counts the votes cast only for a tie in its second vote", () => {
		const rule = asMajority(4);
		assert.equal(castingVoteMatters(rule, tally(1, 1), null), false); // a first vote's tie goes to a second vote
		assert.equal(castingVoteMatters(rule, tally(1, 1), FIRST_VOTE), true);
		assert.equal(castingVoteMatters(rule, tally(2, 1), FIRST_VOTE), false);
		assert.equal(castingVoteMatters(rule, tally(0), FIRST_VOTE), false);
		assert.equal(castingVoteMatters(asMajority(4, { castingVote: '' }), tally(1, 1), FIRST_VOTE), false);
		assert.equal(castingVoteMatters(asMajority(4, { thresholdOf: 'eligible', threshold: 75 * PERCENT }), tally(1, 1), FIRST_VOTE), true); // a half of the votes cast
	});

	it('knows nothing of a vote whose rule or electorate it does not have', () => {
		const known = stateOf(DEPARTMENT_CASES[0], true);
		assert.equal(finalOutcome({ ...known, rule: null }), null);
		assert.equal(finalOutcome({ ...known, eligible: null }), null);
		assert.equal(finalOutcome({ ...known, eligible: 0 }), null);
	});
});

describe('approvalBar', () => {
	it('measures the yes votes among the yes and no votes cast under a threshold of the votes cast', () => {
		assert.deepEqual(approvalBar(realmRule, tally(3, 1, 2), 7), { basis: 4, fill: 0.75, mark: 0.5 });
		assert.deepEqual(approvalBar(realmRule, tally(0, 0, 3), 7), { basis: 0, fill: 0, mark: 0.5 }); // only abstentions
	});

	it('measures the yes votes among all the eligible members under a threshold of the eligible', () => {
		const eligible: VotingRule = { ...realmRule, thresholdOf: 'eligible' };
		assert.deepEqual(approvalBar(eligible, tally(3, 1), 8), { basis: 8, fill: 0.375, mark: 0.5 });
		assert.deepEqual(approvalBar(eligible, tally(3, 1), null), { basis: 0, fill: 0, mark: 0.5 }); // the vote was not read
	});

	it("measures a department's approvals against the policy's seats, whoever fills them", () => {
		assert.deepEqual(approvalBar(departmentRule, tally(2, 1, 1), 5), { basis: 3, fill: 2 / 3, mark: 0.66666666 });
		assert.equal(approvalBar(departmentRule, tally(4), 5).fill, 1); // more yes than seats fills the bar, no further
	});

	it('puts the mark where the stored threshold is', () => {
		assert.equal(approvalBar({ ...realmRule, threshold: 75 * PERCENT }, tally(1), 7).mark, 0.75);
		assert.equal(approvalBar({ ...realmRule, threshold: ONE }, tally(1), 7).mark, 1);
	});
});

describe('approvalLabel', () => {
	const en = translator('en');

	it('says what the bar measures in the words of the Requirement line', () => {
		assert.equal(approvalLabel(en, realmRule), 'Approval: more than 50% yes of the yes and no votes cast');
		assert.equal(
			approvalLabel(en, { ...realmRule, thresholdOf: 'eligible' }),
			'Approval: more than 50% yes of all eligible members, whether they vote or not',
		);
		assert.equal(approvalLabel(en, departmentRule), "Approval: 2 of the policy's 3 seats must vote yes");
	});

	it('is the first words of the Requirement line', () => {
		for (const rule of [realmRule, { ...realmRule, thresholdOf: 'eligible' } as VotingRule, departmentRule]) {
			const label = approvalLabel(en, rule).replace('Approval: ', '');
			assert.ok(requirementText(en, rule, 'dana').startsWith(`Requirement: ${label}`), label);
		}
	});
});

describe('requirementText', () => {
	const en = translator('en');
	const who = 'aaaaa-a…bbbbb';

	it('names the share of the votes cast a realm-wide proposal must exceed', () => {
		assert.equal(requirementText(en, realmRule, who), 'Requirement: more than 50% yes of the yes and no votes cast');
		assert.equal(
			requirementText(en, { ...realmRule, threshold: 66_666_666 }, who),
			'Requirement: more than 66.666666% yes of the yes and no votes cast',
		);
	});

	it('does not say "decisive votes" of a rule over all the eligible members', () => {
		const text = requirementText(en, { ...realmRule, thresholdOf: 'eligible' }, who);
		assert.equal(text, 'Requirement: more than 50% yes of all eligible members, whether they vote or not');
		assert.ok(!/decisive|votes cast/.test(text));
	});

	it('adds the quorum and who holds the casting vote', () => {
		assert.equal(
			requirementText(en, { ...realmRule, quorum: 25 * PERCENT, castingVote: 'dana' }, who),
			'Requirement: more than 50% yes of the yes and no votes cast, a tie at the threshold goes to the yes of the casting vote (aaaaa-a…bbbbb) and at least 25% of the eligible members must vote',
		);
	});

	it('does not give a casting vote to a rule over all the eligible, which has no ties to decide', () => {
		assert.ok(!requirementText(en, { ...realmRule, thresholdOf: 'eligible', castingVote: 'dana' }, who).includes('casting'));
	});

	it("says that a department's abstentions and non-voters count, and names its seats, veto and quorum", () => {
		assert.equal(
			requirementText(en, departmentRule, who),
			"Requirement: 2 of the policy's 3 seats must vote yes, abstentions and members who do not vote count against it, no veto holder may vote no and at least 40% of the eligible members must vote",
		);
		assert.equal(
			requirementText(en, asDepartment(1, 1), who),
			"Requirement: the policy's 1 seat must vote yes and abstentions and members who do not vote count against it",
		);
	});

	it("gives a department's rule as the approvals the realm rounds up to, never a percentage", () => {
		const startsWith = (rule: VotingRule, start: string) => assert.ok(requirementText(en, rule, who).startsWith(start), start);
		startsWith(asDepartment(2, 5, { threshold: 75 * PERCENT }), "Requirement: 4 of the policy's 5 seats must vote yes"); // 3.75
		startsWith(asDepartment(2, 4, { threshold: 75 * PERCENT }), "Requirement: 3 of the policy's 4 seats must vote yes");
		startsWith(asDepartment(1, 3), "Requirement: 1 of the policy's 3 seats must vote yes");
		assert.ok(!/%/.test(requirementText(en, { ...departmentRule, quorum: 0 }, who)));
	});

	it('says the rule is not recorded when the proposal has none', () => {
		assert.equal(requirementText(en, null, who), 'Requirement: not recorded for this proposal');
	});
});

describe('castingNote', () => {
	const en = translator('en');
	const who = 'dana';
	const tie: VoteState = {
		department: false,
		rule: { ...realmRule, castingVote: 'dana-id' },
		eligible: 7,
		votes: tally(1, 1),
		vetoed: false,
		castingChoice: 'yes',
		firstVote: null,
		expiresIfTied: false,
	};

	it('says the casting vote decides a tie it voted yes in', () => {
		assert.equal(
			castingNote(en, tie, who),
			'Yes and no are tied at the threshold: the yes of the casting vote (dana) decides it, if they are still a member.',
		);
	});

	it('says a tie passes only with the casting yes while it has not been given', () => {
		const text = 'Yes and no are tied at the threshold: it passes only with a yes from the casting vote (dana).';
		for (const castingChoice of ['', 'no', 'abstain']) assert.equal(castingNote(en, { ...tie, castingChoice }, who), text);
	});

	it('says nothing without a tie, without a casting member, or for a department', () => {
		assert.equal(castingNote(en, { ...tie, votes: tally(2, 1) }, who), '');
		assert.equal(castingNote(en, { ...tie, votes: tally(0) }, who), '');
		assert.equal(castingNote(en, { ...tie, rule: realmRule }, who), '');
		assert.equal(castingNote(en, { ...tie, rule: { ...tie.rule!, thresholdOf: 'eligible' } }, who), '');
		assert.equal(castingNote(en, { ...tie, department: true, rule: departmentRule }, who), '');
		assert.equal(castingNote(en, { ...tie, rule: null }, who), '');
	});
});

describe('endedText', () => {
	const en = translator('en');
	const when = 'Nov 8, 2026, 10:00';
	const ended = (state: Partial<VoteState>): VoteState => ({ ...department, ...state });

	it('keeps "needs N approvals, M received" for a department vote short of them', () => {
		assert.equal(
			endedText(en, ended({ votes: tally(1, 1, 1), vetoHoldersMissing: 0 } as Partial<VoteState>), when),
			'Voting period ended Nov 8, 2026, 10:00 — needs 2 approvals, 1 received. Awaiting finalization.',
		);
		assert.equal(
			endedText(en, ended({ rule: asDepartment(1, 3, { quorum: 0 }), votes: tally(0, 2) }), when),
			'Voting period ended Nov 8, 2026, 10:00 — needs 1 approval, 0 received. Awaiting finalization.',
		);
	});

	it('keeps "policy satisfied (M/N)" for a department vote that has them', () => {
		assert.equal(
			endedText(en, ended({ votes: tally(2, 0, 1) }), when),
			'Voting period ended Nov 8, 2026, 10:00 — policy satisfied (2/2 approvals). Awaiting finalization.',
		);
	});

	it('does not call a vetoed or quorum-short department vote satisfied', () => {
		assert.equal(
			endedText(en, ended({ votes: tally(2, 1), vetoed: true }), when),
			'Voting period ended Nov 8, 2026, 10:00 — a veto holder voted no. Awaiting finalization.',
		);
		assert.equal(
			endedText(en, ended({ votes: tally(2), rule: { ...departmentRule, quorum: 60 * PERCENT } }), when),
			'Voting period ended Nov 8, 2026, 10:00 — the quorum was not reached. Awaiting finalization.',
		);
	});

	it('says why a realm-wide vote ends as it does', () => {
		const realm = (state: Partial<VoteState>) => ended({ department: false, rule: realmRule, votes: tally(3, 1), ...state });
		const say = (why: string) => `Voting period ended Nov 8, 2026, 10:00 — ${why}. Awaiting finalization.`;
		assert.equal(endedText(en, realm({}), when), say('the yes votes exceed the threshold'));
		assert.equal(endedText(en, realm({ votes: tally(1, 3) }), when), say('the yes votes do not exceed the threshold'));
		assert.equal(
			endedText(en, realm({ rule: { ...realmRule, quorum: 90 * PERCENT } }), when), // 4 of 5 voted
			say('the quorum was not reached'),
		);
		assert.equal(
			endedText(en, realm({ rule: { ...realmRule, castingVote: 'dana' }, votes: tally(1, 1), castingChoice: 'yes' }), when),
			say('yes and no are tied at the threshold, and the casting vote decides it, if its holder is still a member'),
		);
	});

	it('says only that the period ended when the rule or the electorate is not known', () => {
		const plain = 'Voting period ended Nov 8, 2026, 10:00. Awaiting finalization.';
		assert.equal(endedText(en, ended({ rule: null }), when), plain);
		assert.equal(endedText(en, ended({ eligible: null }), when), plain);
		assert.equal(endedText(en, ended({ department: false, rule: null }), when), plain);
	});
});

describe('a department vote that counts the votes cast', () => {
	const en = translator('en');
	const who = 'aaaaa-a…bbbbb';
	const council = asMajority(5, { quorum: 40 * PERCENT });
	const open = (state: Partial<OpenVote> = {}): OpenVote => ({
		deadline: true,
		department: true,
		rule: council,
		eligible: 5,
		votes: tally(1, 1),
		vetoed: false,
		castingChoice: '',
		firstVote: null,
		expiresIfTied: false,
		vetoHoldersMissing: 0,
		...state,
	});

	describe('requirementText', () => {
		const rule = (r: VotingRule) => requirementText(en, r, who);

		it('says a majority of the yes and no votes cast, the quorum as a number of seats, what abstentions count towards, and the tie', () => {
			assert.equal(
				rule(council),
				"Requirement: more than 50% yes of the yes and no votes cast, at least 2 of the policy's 5 seats must vote, abstentions count towards the quorum, not the majority, a tie at the threshold goes to a second vote and a tie at the threshold in the second vote goes to the yes of the casting vote (aaaaa-a…bbbbb)",
			);
		});

		it('gives the quorum as the number of seats the realm needs, rounded up, never as a rounded percentage', () => {
			const needed = (quorum: number, seats: number) => rule(asMajority(seats, { quorum }));
			assert.ok(needed(33_333_333, 5).includes("at least 2 of the policy's 5 seats must vote"));
			assert.ok(needed(33_333_333, 33).includes("at least 11 of the policy's 33 seats must vote"));
			assert.ok(needed(ONE, 7).includes("at least 7 of the policy's 7 seats must vote"));
			assert.ok(!/%\s+of the policy/.test(needed(33_333_333, 5)));
		});

		it('says abstentions count towards the quorum only when there is one, and never towards the majority', () => {
			const withQuorum = rule(council);
			assert.ok(withQuorum.includes('abstentions count towards the quorum, not the majority'), withQuorum);
			assert.ok(withQuorum.indexOf('must vote,') < withQuorum.indexOf('abstentions count'), withQuorum); // the quorum comes first
			const none = rule({ ...council, quorum: 0 });
			assert.ok(none.includes('abstentions do not count towards the majority'), none);
			assert.ok(!/quorum|at least/.test(none), none);
			for (const text of [withQuorum, none]) assert.ok(!/abstentions are not counted/.test(text), text);
		});

		it('names a veto', () => {
			const text = rule({ ...council, quorum: 0, veto: true });
			assert.ok(text.includes('abstentions do not count towards the majority, no veto holder may vote no, a tie'), text);
		});

		it('says a tie in the second vote rejects when the vote has no casting member', () => {
			assert.ok(rule({ ...council, castingVote: '' }).endsWith('a tie at the threshold in the second vote rejects it'));
		});

		it('says nothing of a second vote to come while it is the second vote', () => {
			const second = requirementText(en, council, who, true);
			assert.ok(!second.includes('goes to a second vote'), second);
			assert.ok(second.endsWith('a tie at the threshold in the second vote goes to the yes of the casting vote (aaaaa-a…bbbbb)'), second);
			assert.ok(rule(council).includes('a tie at the threshold goes to a second vote'));
			assert.equal(requirementText(en, asDepartment(3, 5), who, true), requirementText(en, asDepartment(3, 5), who)); // m of n has none
		});

		it('gives the stricter threshold of the votes cast, exactly', () => {
			assert.ok(rule({ ...council, threshold: 75 * PERCENT }).startsWith('Requirement: more than 75% yes of the yes and no votes cast, at least 2 of'));
		});

		it('adds the yes votes the seats need under `eligible`, to a majority that stays at a half', () => {
			const text = rule({ ...council, thresholdOf: 'eligible', threshold: 60 * PERCENT });
			assert.ok(
				text.startsWith("Requirement: 3 of the policy's 5 seats must vote yes, more than 50% yes of the yes and no votes cast, at least 2 of the policy's 5 seats must vote"),
				text,
			);
		});

		it("does not say that abstentions count against it, or that the eligible members vote, as a department's seats do", () => {
			for (const text of [rule(council), rule({ ...council, thresholdOf: 'eligible' })]) assert.ok(!/count against|eligible members/.test(text), text);
		});

		it("keeps the seat wording for a department that decides by m of n", () => {
			assert.equal(
				rule(asDepartment(3, 5, { quorum: 40 * PERCENT, castingVote: '' })),
				"Requirement: 3 of the policy's 5 seats must vote yes, abstentions and members who do not vote count against it and at least 40% of the eligible members must vote",
			);
		});
	});

	describe('the bar', () => {
		it('measures the yes votes among the yes and no votes cast, with the threshold of them marked', () => {
			assert.deepEqual(approvalBar(council, tally(2, 1, 1), 5), { basis: 3, fill: 2 / 3, mark: 0.5 });
			assert.deepEqual(approvalBar(asMajority(5, { threshold: 75 * PERCENT }), tally(1, 1), 5), { basis: 2, fill: 0.5, mark: 0.75 });
			assert.equal(approvalLabel(en, council), 'Approval: more than 50% yes of the yes and no votes cast');
		});

		it("measures the yes votes against the policy's seats under `eligible`", () => {
			const seats = asMajority(5, { thresholdOf: 'eligible', threshold: 60 * PERCENT });
			assert.deepEqual(approvalBar(seats, tally(2, 1), 5), { basis: 5, fill: 0.4, mark: 0.6 });
			assert.equal(approvalLabel(en, seats), "Approval: 3 of the policy's 5 seats must vote yes");
		});

		it('is the first words of the Requirement line', () => {
			for (const rule of [council, asMajority(5, { thresholdOf: 'eligible', threshold: 60 * PERCENT }), asMajority(1, { castingVote: '' })]) {
				const label = approvalLabel(en, rule).replace('Approval: ', '');
				assert.ok(requirementText(en, rule, who).startsWith(`Requirement: ${label}`), label);
			}
		});

		it('draws its fill past the threshold mark exactly when the votes cast make a majority, where nothing else decides', () => {
			const plain = MAJORITY_CASES.filter((c) => !c.rule.quorum && !c.rule.veto && !c.second && c.rule.thresholdOf === 'cast');
			for (const c of plain) {
				const bar = approvalBar(c.rule as VotingRule, c.votes, c.eligible);
				assert.equal(bar.fill > bar.mark, c.ends === 'accepted', c.name);
			}
		});
	});

	describe('waitingText', () => {
		it('waits for the voters who have not voted, until the deadline', () => {
			assert.equal(waitingText(en, open()), 'Waiting for 3 more voters, or the deadline');
			assert.equal(waitingText(en, open({ votes: tally(2, 1, 1) })), 'Waiting for 1 more voter, or the deadline');
			assert.equal(waitingText(en, open({ votes: tally(2, 1, 2) })), '');
		});

		it('is not met by approvals, as a department that counts seats is: only everyone voting ends it early', () => {
			assert.equal(waitingText(en, open({ votes: tally(4) })), 'Waiting for 1 more voter, or the deadline');
		});

		it('says how a vote with no deadline stays open', () => {
			assert.equal(waitingText(en, open({ deadline: false })), 'Waiting for 3 more voters: it stays open until everyone has voted');
			assert.equal(waitingText(en, open({ deadline: false, votes: tally(2, 2) })), 'Waiting for 1 more voter: it stays open until everyone has voted');
		});

		it('does not wait for a veto holder who has not voted, nor for a quorum that is short', () => {
			const rule = asMajority(5, { veto: true, quorum: 80 * PERCENT });
			assert.equal(waitingText(en, open({ rule, vetoHoldersMissing: 2 })), 'Waiting for 3 more voters, or the deadline');
		});

		it("names a veto holder's no, whatever else is missing, until it changes", () => {
			assert.equal(waitingText(en, open({ vetoed: true })), 'Waiting for a veto holder to change their no, or the deadline');
			assert.equal(
				waitingText(en, open({ vetoed: true, deadline: false })),
				'Waiting for a veto holder to change their no: it stays open until everyone has voted',
			);
		});

		it('says nothing of a vote whose electorate is not known', () => {
			assert.equal(waitingText(en, open({ eligible: null })), '');
			assert.equal(waitingText(en, open({ eligible: 0, vetoed: true })), '');
		});
	});

	describe('castingNote', () => {
		const second = (state: Partial<VoteState> = {}): VoteState => ({ ...open(), firstVote: FIRST_VOTE, ...state });

		it('says the casting vote decides a tie in the second vote that it voted yes in', () => {
			assert.equal(
				castingNote(en, second({ castingChoice: 'yes' }), 'dana'),
				'Yes and no are tied at the threshold again: the yes of the casting vote (dana) decides it, if they still hold a seat.',
			);
		});

		it('says it passes only with the casting yes while that has not been given', () => {
			for (const castingChoice of ['', 'no', 'abstain']) {
				assert.equal(
					castingNote(en, second({ castingChoice }), 'dana'),
					'Yes and no are tied at the threshold again: it passes only with a yes from the casting vote (dana).',
				);
			}
		});

		it('says a tie in the second vote rejects when there is no casting member', () => {
			assert.equal(
				castingNote(en, second({ rule: { ...council, castingVote: '' } }), 'dana'),
				'Yes and no are tied at the threshold again, and the vote has no casting vote: a tie rejects it.',
			);
		});

		it("says nothing of a first vote's tie, which goes to a second vote, or of votes that do not tie", () => {
			assert.equal(castingNote(en, open({ castingChoice: 'yes' }), 'dana'), '');
			assert.equal(castingNote(en, second({ votes: tally(2, 1) }), 'dana'), '');
			assert.equal(castingNote(en, second({ votes: tally(0) }), 'dana'), '');
		});
	});

	describe('endedText', () => {
		const when = 'Nov 8, 2026, 10:00';
		const say = (why: string) => `Voting period ended ${when} — ${why}. Awaiting finalization.`;
		const ended = (state: Partial<VoteState>) => endedText(en, { ...open(), ...state }, when);

		it('says the yes votes exceed the threshold, or do not', () => {
			assert.equal(ended({ votes: tally(3, 1, 1) }), say('the yes votes exceed the threshold'));
			assert.equal(ended({ votes: tally(1, 2, 2) }), say('the yes votes do not exceed the threshold'));
		});

		it('says a tie in the first vote goes to a second vote', () => {
			assert.equal(ended({ votes: tally(2, 2, 1) }), say('yes and no are tied at the threshold, so a second vote follows'));
		});

		it('says a first vote that tied after the proposal takes effect expires it instead of going to a second vote', () => {
			assert.equal(
				ended({ votes: tally(2, 2, 1), expiresIfTied: true }),
				say('yes and no are tied at the threshold, but the vote ended after the time the proposal takes effect, so it expires instead of going to a second vote'),
			);
			assert.equal(ended({ votes: tally(3, 1, 1), expiresIfTied: true }), say('the yes votes exceed the threshold'));
		});

		it('says a tie in the second vote waits for the casting yes, or is rejected without it', () => {
			const second = { firstVote: FIRST_VOTE, votes: tally(2, 2, 1) };
			assert.equal(
				ended({ ...second, castingChoice: 'yes' }),
				say('yes and no are tied at the threshold again, and the casting vote decides it, if its holder still holds a seat'),
			);
			assert.equal(
				ended({ ...second, castingChoice: 'no' }),
				say('yes and no are tied at the threshold again, and without a yes from the casting vote it is rejected'),
			);
		});

		it('says a veto holder voted no, or the quorum was not reached, before anything about the votes', () => {
			assert.equal(ended({ votes: tally(2, 2, 1), vetoed: true }), say('a veto holder voted no'));
			assert.equal(ended({ votes: tally(1) }), say('the quorum was not reached')); // 40 % of 5 seats is two voters
			assert.equal(ended({ votes: tally(1), vetoed: true }), say('a veto holder voted no'));
			assert.equal(ended({ votes: tally(2) }), say('the yes votes exceed the threshold')); // two voters reach it
		});

		it('says how many approvals the seats need under `eligible`, when the votes cast are a majority but not enough', () => {
			const rule = asMajority(5, { thresholdOf: 'eligible', threshold: 60 * PERCENT });
			assert.equal(ended({ rule, votes: tally(2, 1, 1) }), say('needs 3 approvals, 2 received'));
		});

		it('keeps "needs N approvals, M received" for the seats of a department that decides by m of n', () => {
			assert.equal(ended({ ...department, firstVote: null, votes: tally(1, 1, 1), vetoHoldersMissing: 0 } as Partial<VoteState>), say('needs 2 approvals, 1 received'));
		});
	});

	describe('secondVoteText', () => {
		it('says the first vote tied, and what it came to', () => {
			assert.equal(
				secondVoteText(en, tally(2, 2, 1)),
				"Second vote: the first vote ended in a tie (2 yes, 2 no, 1 abstain), so the proposal was put to a second vote under the same rule. The first vote's ballots were deleted: everyone votes again.",
			);
		});

		it('says nothing of a first vote', () => {
			assert.equal(secondVoteText(en, null), '');
		});
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
		const counted: OpenVote = { ...department, rule: asMajority(5, { quorum: 40 * PERCENT }), votes: tally(1, 1), vetoHoldersMissing: 0 };
		const cases: OpenVote[] = [
			department,
			{ ...department, votes: tally(0, 1, 2), vetoHoldersMissing: 1 },
			{ ...department, vetoHoldersMissing: 0 },
			{ ...department, votes: tally(2, 0, 1) },
			{ ...department, votes: tally(2, 0, 1), vetoHoldersMissing: 0, rule: { ...departmentRule, quorum: 80 * PERCENT } },
			{ ...department, vetoHoldersMissing: 0, votes: tally(1) },
			{ ...department, votes: tally(0, 1), vetoHoldersMissing: 1 },
			{ ...department, vetoed: true },
			{ ...department, vetoed: true, deadline: false },
			{ ...department, deadline: false },
			realmWide,
			{ ...realmWide, votes: tally(2, 2) },
			{ ...realmWide, deadline: false },
			{ ...realmWide, deadline: false, votes: tally(2, 2) },
			counted,
			{ ...counted, votes: tally(1) },
			{ ...counted, deadline: false },
			{ ...counted, deadline: false, votes: tally(2, 2) },
			{ ...counted, deadline: false, vetoed: true },
		];
		for (const locale of ['en', ...locales]) {
			const t = translator(locale);
			const read = cases.map((vote) => waitingText(t, vote));
			for (const text of read) assert.ok(text && !/[{}]/.test(text), `${locale}: ${text}`);
			assert.equal(new Set(read).size, read.length, `${locale}: each case reads differently`);
		}
	});

	it('read out the figure next to the bar exactly, in every language', () => {
		for (const locale of ['en', ...locales]) {
			const text = translator(locale)('approval_figure', { yes: 3, basis: 8 });
			assert.ok(/3/.test(text) && /8/.test(text) && !/[{}%.]/.test(text), `${locale}: ${text}`);
		}
		assert.equal(translator('en')('approval_figure', { yes: 3, basis: 8 }), '3 of 8');
	});

	it('read out the rule, the casting vote and the end of a vote, with nothing left to fill in', () => {
		const tie: VoteState = {
			department: false,
			rule: { ...realmRule, castingVote: 'dana-id', quorum: 25 * PERCENT },
			eligible: 7,
			votes: tally(1, 1),
			vetoed: false,
			castingChoice: 'yes',
			firstVote: null,
			expiresIfTied: false,
		};
		const ended = (state: Partial<VoteState>): VoteState => ({ ...department, ...state });
		const council = asMajority(5, { quorum: 40 * PERCENT, veto: true });
		const secondTie: VoteState = { ...department, rule: council, votes: tally(1, 1), castingChoice: 'yes', firstVote: FIRST_VOTE };
		for (const locale of ['en', ...locales]) {
			const t = translator(locale);
			const rules = [
				requirementText(t, departmentRule, 'dana'),
				requirementText(t, asDepartment(1, 1), 'dana'),
				requirementText(t, realmRule, 'dana'),
				requirementText(t, { ...realmRule, thresholdOf: 'eligible' }, 'dana'),
				requirementText(t, tie.rule, 'dana'),
				requirementText(t, null, 'dana'),
				requirementText(t, council, 'dana'),
				requirementText(t, council, 'dana', true),
				requirementText(t, { ...council, quorum: 0 }, 'dana'),
				requirementText(t, { ...council, castingVote: '' }, 'dana'),
				requirementText(t, { ...council, thresholdOf: 'eligible', threshold: 60 * PERCENT }, 'dana'),
			];
			const notes = [
				castingNote(t, tie, 'dana'),
				castingNote(t, { ...tie, castingChoice: '' }, 'dana'),
				castingNote(t, secondTie, 'dana'),
				castingNote(t, { ...secondTie, castingChoice: '' }, 'dana'),
				castingNote(t, { ...secondTie, rule: { ...council, castingVote: '' } }, 'dana'),
			];
			const labels = [
				approvalLabel(t, realmRule),
				approvalLabel(t, { ...realmRule, thresholdOf: 'eligible' }),
				approvalLabel(t, departmentRule),
			];
			const secondVotes = [secondVoteText(t, tally(2, 2, 1)), t('second_vote_short')];
			const ends = [
				endedText(t, ended({ votes: tally(1, 1, 1) }), '8 Nov'),
				endedText(t, ended({ rule: asDepartment(1, 3), votes: tally(0, 2) }), '8 Nov'),
				endedText(t, ended({ votes: tally(2, 0, 1) }), '8 Nov'),
				endedText(t, ended({ votes: tally(2, 1), vetoed: true }), '8 Nov'),
				endedText(t, ended({ votes: tally(2), rule: { ...departmentRule, quorum: 60 * PERCENT } }), '8 Nov'),
				endedText(t, { ...tie, rule: realmRule, votes: tally(3, 1) }, '8 Nov'),
				endedText(t, { ...tie, rule: realmRule, votes: tally(1, 3) }, '8 Nov'),
				endedText(t, tie, '8 Nov'),
				endedText(t, ended({ rule: null }), '8 Nov'),
				endedText(t, ended({ rule: council, votes: tally(2, 2, 1) }), '8 Nov'),
				endedText(t, secondTie, '8 Nov'),
				endedText(t, { ...secondTie, castingChoice: '' }, '8 Nov'),
				endedText(t, ended({ rule: council, votes: tally(2, 2, 1), expiresIfTied: true }), '8 Nov'),
				endedText(t, ended({ rule: { ...council, thresholdOf: 'eligible', threshold: 60 * PERCENT }, votes: tally(2, 1, 1) }), '8 Nov'),
			];
			for (const group of [rules, notes, labels, secondVotes, ends]) {
				for (const text of group) assert.ok(text && !/[{}]/.test(text), `${locale}: ${text}`);
				assert.equal(new Set(group).size, group.length, `${locale}: each case reads differently`);
			}
		}
	});
});
