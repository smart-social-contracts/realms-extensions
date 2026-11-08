import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { interpolate } from '../../../_shared/frontend/extension-i18n.ts';
import { ONE, PERCENT } from '../../../_shared/frontend/units.ts';
import {
	approvalsNeeded,
	castingNote,
	choiceOf,
	endedText,
	finalOutcome,
	isVetoed,
	missingVoters,
	myVote,
	quorumReached,
	requirementText,
	vetoHoldersMissing,
	votingRule,
	waitingText,
	type OpenVote,
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
};
// The realm's own rule: more than half of the yes and no votes cast.
const realmRule: VotingRule = {
	threshold: 50 * PERCENT,
	quorum: 0,
	thresholdOf: 'cast',
	castingVote: '',
	seats: null,
	veto: false,
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

// The cases of the realm's finalization tests (realms-gos tests/ggg/test_voting_rule.py and test_proposals.py), as the
// votes they end with. ``eligible`` is the electorate counted when the vote opened, ``casting`` what the casting member voted.
type Case = {
	name: string;
	rule: Partial<VotingRule>;
	votes: ReturnType<typeof tally>;
	eligible: number;
	vetoed?: boolean;
	casting?: string;
	ends: 'accepted' | 'rejected';
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

const REALM_CASES: Case[] = [
	// test_the_yes_votes_exceed_the_threshold_of_the_votes_cast_or_of_all_the_eligible (Agora has seven members)
	{ name: 'Cast: 3 yes of 3 cast', rule: {}, votes: tally(3), eligible: 7, ends: 'accepted' },
	{ name: 'Eligible: 3 yes of 7 is not more than half', rule: { thresholdOf: 'eligible' }, votes: tally(3), eligible: 7, ends: 'rejected' },
	{ name: 'Eligible: 4 yes of 7', rule: { thresholdOf: 'eligible' }, votes: tally(4), eligible: 7, ends: 'accepted' },
	// test_a_raised_threshold_decides_the_vote
	{ name: '75 %: exactly three quarters is not more', rule: { threshold: 75 * PERCENT }, votes: tally(3, 1), eligible: 7, ends: 'rejected' },
	{ name: '75 %: 4 of 5', rule: { threshold: 75 * PERCENT }, votes: tally(4, 1), eligible: 7, ends: 'accepted' },
	// test_a_tie_at_the_threshold_is_accepted_only_with_the_casting_members_yes
	{ name: 'tie at 50 % with the casting yes', rule: { castingVote: 'dana' }, votes: tally(1, 1), eligible: 7, casting: 'yes', ends: 'accepted' },
	{ name: 'tie at 50 %, casting member voted no', rule: { castingVote: 'dana' }, votes: tally(1, 1), eligible: 7, casting: 'no', ends: 'rejected' },
	{ name: 'tie at 50 %, casting member abstained', rule: { castingVote: 'dana' }, votes: tally(1, 1, 1), eligible: 7, casting: 'abstain', ends: 'rejected' },
	{ name: 'tie at 50 %, casting member did not vote', rule: { castingVote: 'dana' }, votes: tally(1, 1), eligible: 7, casting: '', ends: 'rejected' },
	{ name: 'tie at a raised 60 % with the casting yes', rule: { castingVote: 'dana', threshold: 60 * PERCENT }, votes: tally(3, 2), eligible: 7, casting: 'yes', ends: 'accepted' },
	{ name: 'below a raised 60 %: casting decides ties, not shortfalls', rule: { castingVote: 'dana', threshold: 60 * PERCENT }, votes: tally(2, 2), eligible: 7, casting: 'yes', ends: 'rejected' },
	{ name: 'outvoted despite the casting yes', rule: { castingVote: 'dana' }, votes: tally(1, 2), eligible: 7, casting: 'yes', ends: 'rejected' },
	// test_without_a_casting_vote_a_tie_rejects
	{ name: 'tie at 50 % with no casting member', rule: {}, votes: tally(1, 1), eligible: 7, ends: 'rejected' },
	// test_the_casting_vote_decides_only_ties_over_the_votes_cast (8 eligible, 4 yes: exactly half)
	{ name: 'Eligible: 4 yes of 8 is a tie of the eligible, which no casting vote decides', rule: { thresholdOf: 'eligible', castingVote: 'dana' }, votes: tally(4), eligible: 8, casting: 'yes', ends: 'rejected' },
	// decided_by_casting_vote holds only for a threshold of the votes cast: a tie of those is no tie of the eligible
	{ name: 'Eligible: 1 yes and 1 no of 2 eligible, which the casting yes does not decide', rule: { thresholdOf: 'eligible', castingVote: 'dana' }, votes: tally(1, 1), eligible: 2, casting: 'yes', ends: 'rejected' },
	// test_I_GOV_3_quorum_and_threshold (quorum 50 %: 2 of 7 voted)
	{ name: 'quorum 50 % not reached by 2 yes of 7', rule: { quorum: 50 * PERCENT }, votes: tally(2), eligible: 7, ends: 'rejected' },
	{ name: 'quorum 50 % reached by 4 of 7', rule: { quorum: 50 * PERCENT }, votes: tally(3, 1), eligible: 7, ends: 'accepted' },
];

const DEPARTMENT_CASES: Case[] = [
	// test_a_departments_vote_ends_at_its_stored_threshold (4 seats, 4 voters)
	{ name: 'm = 2 of four seats: 2 yes', rule: asDepartment(2, 4), votes: tally(2), eligible: 4, ends: 'accepted' },
	{ name: '75 % of four seats is three: 2 yes', rule: asDepartment(2, 4, { threshold: 75 * PERCENT }), votes: tally(2), eligible: 4, ends: 'rejected' },
	{ name: '75 % of four seats: 3 yes', rule: asDepartment(2, 4, { threshold: 75 * PERCENT }), votes: tally(3), eligible: 4, ends: 'accepted' },
	// test_a_departments_threshold_is_a_share_of_the_policys_n_whoever_fills_the_seats (m = 2, n = 3, four voters)
	{ name: '2 of 3 seats: 1 yes', rule: asDepartment(2, 3), votes: tally(1), eligible: 4, ends: 'rejected' },
	{ name: '2 of 3 seats: m, exactly', rule: asDepartment(2, 3), votes: tally(2), eligible: 4, ends: 'accepted' },
	{ name: '100 % of 3 seats: 2 yes', rule: asDepartment(2, 3, { threshold: ONE }), votes: tally(2), eligible: 4, ends: 'rejected' },
	{ name: '100 % of 3 seats is 3 yes, not 4', rule: asDepartment(2, 3, { threshold: ONE }), votes: tally(3), eligible: 4, ends: 'accepted' },
	// test_a_vacancy_never_makes_a_departments_vote_easier (n = 4, two seats filled)
	{ name: 'vacancy: one yes is not m', rule: asDepartment(2, 4), votes: tally(1), eligible: 2, ends: 'rejected' },
	{ name: 'vacancy: two yes', rule: asDepartment(2, 4), votes: tally(2), eligible: 2, ends: 'accepted' },
	{ name: 'vacancy: one yes, one no', rule: asDepartment(2, 4), votes: tally(1, 1), eligible: 2, ends: 'rejected' },
	// test_a_threshold_the_filled_seats_cannot_reach_rejects_the_vote
	{ name: 'three approvals from two seats', rule: asDepartment(3, 4), votes: tally(2), eligible: 2, ends: 'rejected' },
	// test_a_direct_policy_needs_one_yes_however_many_hold_seats
	{ name: 'direct policy: one yes', rule: asDepartment(1, 1), votes: tally(1), eligible: 2, ends: 'accepted' },
	{ name: 'direct policy: no yes at all', rule: asDepartment(1, 1), votes: tally(0, 0, 2), eligible: 2, ends: 'rejected' },
	// test_I_GOV_7_a_vetoing_no_keeps_the_vote_open_until_it_ends_and_rejects_it_then (2 of 3, dana holds a veto)
	{ name: 'veto: dana no, bob and alice yes', rule: asDepartment(2, 3, { veto: true }), votes: tally(2, 1), eligible: 4, vetoed: true, ends: 'rejected' },
	{ name: 'veto: dana changed her mind', rule: asDepartment(2, 3, { veto: true }), votes: tally(3), eligible: 4, ends: 'accepted' },
	// test_I_GOV_7_a_veto_holder_who_has_not_voted_keeps_a_department_vote_open
	{ name: 'veto: dana abstained', rule: asDepartment(2, 3, { veto: true }), votes: tally(2, 0, 1), eligible: 4, ends: 'accepted' },
	// test_I_GOV_7_a_veto_holder_who_never_votes_does_not_block_acceptance_at_the_deadline
	{ name: 'veto: dana never voted', rule: asDepartment(2, 3, { veto: true }), votes: tally(2), eligible: 4, ends: 'accepted' },
	// test_veto (m = 1 of 3, dana holds a veto and says no)
	{ name: 'veto: one approval and a no from the veto holder', rule: asDepartment(1, 3, { veto: true }), votes: tally(1, 1), eligible: 4, vetoed: true, ends: 'rejected' },
	// test_I_GOV_3_a_departments_quorum_is_enforced (m = 1 of 3, quorum 75 % of four)
	{ name: 'quorum 75 %: one yes of four', rule: asDepartment(1, 3, { quorum: 75 * PERCENT }), votes: tally(1), eligible: 4, ends: 'rejected' },
	{ name: 'quorum 75 %: two of four', rule: asDepartment(1, 3, { quorum: 75 * PERCENT }), votes: tally(1, 0, 1), eligible: 4, ends: 'rejected' },
	{ name: 'quorum 75 %: abstentions count towards it', rule: asDepartment(1, 3, { quorum: 75 * PERCENT }), votes: tally(1, 0, 2), eligible: 4, ends: 'accepted' },
	// test_I_GOV_7_a_no_can_be_replaced_after_approvals_become_impossible (3 of 3)
	{ name: '3 of 3: two no', rule: asDepartment(3, 3), votes: tally(0, 2), eligible: 4, ends: 'rejected' },
	{ name: '3 of 3: three yes', rule: asDepartment(3, 3), votes: tally(3, 1), eligible: 4, ends: 'accepted' },
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
	});

	for (const [kind, cases, department] of [
		['realm-wide', REALM_CASES, false],
		['department', DEPARTMENT_CASES, true],
	] as const) {
		describe(kind, () => {
			for (const c of cases) {
				it(`${c.name}: ${c.ends}`, () => {
					assert.equal(finalOutcome(stateOf(c, department)), c.ends);
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

	it('knows nothing of a vote whose rule or electorate it does not have', () => {
		const known = stateOf(DEPARTMENT_CASES[0], true);
		assert.equal(finalOutcome({ ...known, rule: null }), null);
		assert.equal(finalOutcome({ ...known, eligible: null }), null);
		assert.equal(finalOutcome({ ...known, eligible: 0 }), null);
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
			"Requirement: at least 66.666666% of the policy's 3 seats must vote yes (2 of 3), abstentions and members who do not vote count against it, no veto holder may vote no and at least 40% of the eligible members must vote",
		);
		assert.equal(
			requirementText(en, asDepartment(1, 1), who),
			"Requirement: at least 100% of the policy's 1 seats must vote yes (1 of 1) and abstentions and members who do not vote count against it",
		);
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
	};

	it('says the casting vote decides a tie it voted yes in', () => {
		assert.equal(
			castingNote(en, tie, who),
			'Yes and no are tied at the threshold: the yes of the casting vote (dana) decides it.',
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
			say('yes and no are tied at the threshold, and the casting vote decides it'),
		);
	});

	it('says only that the period ended when the rule or the electorate is not known', () => {
		const plain = 'Voting period ended Nov 8, 2026, 10:00. Awaiting finalization.';
		assert.equal(endedText(en, ended({ rule: null }), when), plain);
		assert.equal(endedText(en, ended({ eligible: null }), when), plain);
		assert.equal(endedText(en, ended({ department: false, rule: null }), when), plain);
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
		];
		for (const locale of ['en', ...locales]) {
			const t = translator(locale);
			const read = cases.map((vote) => waitingText(t, vote));
			for (const text of read) assert.ok(text && !/[{}]/.test(text), `${locale}: ${text}`);
			assert.equal(new Set(read).size, read.length, `${locale}: each case reads differently`);
		}
	});

	it('read out the rule, the casting vote and the end of a vote, with nothing left to fill in', () => {
		const tie: VoteState = {
			department: false,
			rule: { ...realmRule, castingVote: 'dana-id', quorum: 25 * PERCENT },
			eligible: 7,
			votes: tally(1, 1),
			vetoed: false,
			castingChoice: 'yes',
		};
		const ended = (state: Partial<VoteState>): VoteState => ({ ...department, ...state });
		for (const locale of ['en', ...locales]) {
			const t = translator(locale);
			const rules = [
				requirementText(t, departmentRule, 'dana'),
				requirementText(t, asDepartment(1, 1), 'dana'),
				requirementText(t, realmRule, 'dana'),
				requirementText(t, { ...realmRule, thresholdOf: 'eligible' }, 'dana'),
				requirementText(t, tie.rule, 'dana'),
				requirementText(t, null, 'dana'),
			];
			const notes = [castingNote(t, tie, 'dana'), castingNote(t, { ...tie, castingChoice: '' }, 'dana')];
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
			];
			for (const group of [rules, notes, ends]) {
				for (const text of group) assert.ok(text && !/[{}]/.test(text), `${locale}: ${text}`);
				assert.equal(new Set(group).size, group.length, `${locale}: each case reads differently`);
			}
		}
	});
});
