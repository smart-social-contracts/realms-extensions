/** What a member voted, read from the realm's vote records, the rule a vote is decided by, and what an open vote is still waiting for. */

import { ONE, formatPercent } from '../../../_shared/frontend/units.ts';

/** The votes of a proposal come this many at a time (the most the realm gives). */
export const VOTES_PAGE = 500;

type Vote = { voter: string; choice: string };
type VotesPage = { votes?: Vote[]; next?: number | string | null };
type Read = (name: string, args: Record<string, unknown>) => Promise<VotesPage | null>;

/** What ``me`` voted among ``votes`` (yes, no or abstain), or '' if they have not. */
export function choiceOf(votes: Vote[] | undefined, me: string): string {
	if (!me) return '';
	return votes?.find((vote) => vote.voter === me)?.choice ?? '';
}

/**
 * What ``me`` voted on ``proposal``, given its first page of votes. The realm has no call for one member's
 * vote, so the next pages are read until it turns up or the votes end; '' when it is not there.
 */
export async function myVote(read: Read, proposal: string, first: VotesPage, me: string): Promise<string> {
	if (!me) return '';
	let page: VotesPage | null = first;
	while (page) {
		const choice = choiceOf(page.votes, me);
		if (choice || page.next == null) return choice;
		page = await read('proposal_get', { proposal, from: page.next, count: VOTES_PAGE });
	}
	return '';
}

/** How many eligible voters have not voted yet; 0 when the number of eligible voters is not known. */
export function missingVoters(eligible: number | null | undefined, cast: number): number {
	return eligible ? Math.max(eligible - cast, 0) : 0;
}

/**
 * How many of a department vote's veto holders have not voted, among ``votes`` (the first page of them: a department's
 * electorate is its seats). A veto holder who has left the department cannot vote and does not hold the vote open,
 * but the screen cannot tell, so it counts as missing.
 */
export function vetoHoldersMissing(veto: string[] | undefined, votes: Vote[] | undefined): number {
	const voted = new Set((votes ?? []).map((vote) => vote.voter));
	return (veto ?? []).filter((holder) => !voted.has(holder)).length;
}

/** Whether a veto holder has voted no among ``votes``: a department's vote does not pass while one stands. */
export function isVetoed(veto: string[] | undefined, votes: Vote[] | undefined): boolean {
	const holders = new Set(veto ?? []);
	return (votes ?? []).some((vote) => holders.has(vote.voter) && vote.choice === 'no');
}

/** Whether the votes cast reach ``quorum``, a share of the eligible voters in hundred-millionths. */
export function quorumReached(cast: number, eligible: number | null | undefined, quorum: number): boolean {
	return cast * ONE >= quorum * Math.max(eligible ?? 0, 1);
}

/**
 * The rule that decides a proposal, as the realm stores it when the proposal is filed (ggg I-GOV-3). Everything below
 * that decides a vote repeats the realm's own arithmetic (api/proposals.py: department_outcome, exceeds,
 * decided_by_casting_vote, quorum_met), integer for integer, so that the screen never says what the realm will not do.
 */
export type VotingRule = {
	/** The share of its basis the yes votes must exceed (realm-wide) or reach (a department's), in hundred-millionths. */
	threshold: number;
	/** The share of the eligible voters who must vote, in hundred-millionths. */
	quorum: number;
	/** What a realm-wide threshold is a share of: the yes and no votes cast, or all the eligible voters. */
	thresholdOf: 'cast' | 'eligible';
	/** The casting member of a realm-wide vote, whose yes decides a tie at the threshold; '' for nobody. */
	castingVote: string;
	/** A department vote's n, the seats of its policy, which its threshold is a share of; null for a realm-wide vote. */
	seats: number | null;
	/** Whether a department's policy has veto holders: a veto holder's no rejects the vote. */
	veto: boolean;
};

/** The rule of a department's vote, which knows its seats. */
type DepartmentRule = VotingRule & { seats: number };

export type Votes = { yes: number; no: number; abstain: number };

const isDepartment = (rule: VotingRule): rule is DepartmentRule => rule.seats !== null;

const whole = (value: unknown): number | null =>
	typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;

/**
 * The rule stored with ``proposal`` (a proposal row of the realm), or null when it records none: a proposal stored before
 * the rule was kept, or by a realm that does not keep it, has no basis, and a department's vote opened before its seats were
 * counted has no n. The screen says so rather than guess numbers.
 */
export function votingRule(proposal: any, department: boolean): VotingRule | null {
	const threshold = whole(proposal?.threshold);
	const quorum = whole(proposal?.quorum);
	const basis = proposal?.threshold_of;
	if (threshold === null || quorum === null || (basis !== 'cast' && basis !== 'eligible')) return null;
	const seats = department ? whole(proposal?.tally?.seats) : null;
	if (department && !seats) return null;
	return {
		threshold,
		quorum,
		thresholdOf: basis,
		castingVote: String(proposal.casting_vote ?? ''),
		seats,
		veto: Array.isArray(proposal.tally?.veto) && proposal.tally.veto.length > 0,
	};
}

/** The yes votes a department's vote needs: its threshold of the policy's seats, rounded up, and at least one. */
export function approvalsNeeded(threshold: number, seats: number): number {
	return Math.max(Math.ceil((threshold * seats) / ONE), 1);
}

/** Whether the yes votes of a realm-wide vote exceed its threshold of the votes cast, or of all the eligible. */
function exceedsThreshold(rule: VotingRule, votes: Votes, eligible: number): boolean {
	const basis = rule.thresholdOf === 'eligible' ? eligible : votes.yes + votes.no;
	return votes.yes * ONE > rule.threshold * basis;
}

/** Whether the yes votes stand exactly at the threshold of the yes and no votes cast, where a casting vote may decide. */
function tiedAtThreshold(rule: VotingRule, votes: Votes): boolean {
	return rule.thresholdOf === 'cast' && votes.yes * ONE === rule.threshold * (votes.yes + votes.no);
}

/** Whether a tie at the threshold is decided by the casting member's yes (``castingChoice``: what they voted, '' for nothing). */
function decidedByCastingVote(rule: VotingRule, votes: Votes, castingChoice: string): boolean {
	return rule.castingVote !== '' && castingChoice === 'yes' && tiedAtThreshold(rule, votes);
}

const castBy = (votes: Votes): number => votes.yes + votes.no + votes.abstain;

/** What a department's vote is short of, by the realm's department_outcome: the approvals it lacks, a veto, its quorum. */
function departmentShortfall(rule: DepartmentRule, votes: Votes, eligible: number, vetoed: boolean) {
	return {
		approvals: Math.max(approvalsNeeded(rule.threshold, rule.seats) - votes.yes, 0),
		vetoed,
		quorum: !quorumReached(castBy(votes), eligible, rule.quorum),
	};
}

/** A vote as far as its rule is concerned: open or ended, what has been cast and what the rule makes of it. */
export type VoteState = {
	/** Whether a department decides the vote (by its seats), not the whole realm. */
	department: boolean;
	/** The rule stored with the proposal; null when it records none. */
	rule: VotingRule | null;
	/** The eligible voters counted when the vote opened; null when the vote was not read. */
	eligible: number | null;
	votes: Votes;
	/** Whether a veto holder has voted no. */
	vetoed: boolean;
	/** What the casting member voted ('' if they have not, or the vote has no casting member). */
	castingChoice: string;
};

/**
 * How a vote ends. A tie decided by the casting member's yes depends on their standing: the realm ignores that yes once
 * they have left (a suspended or banned member), and the screen cannot read it.
 */
export type Outcome = 'accepted' | 'rejected' | 'depends_on_casting_member';

/**
 * How a vote whose deadline has passed ends: the realm's ``outcome`` with ``final`` set. Null when the screen cannot tell:
 * the rule is not recorded or the electorate is not known.
 */
export function finalOutcome(vote: VoteState): Outcome | null {
	const { rule, eligible, votes } = vote;
	if (!rule || !eligible) return null;
	if (isDepartment(rule)) {
		const short = departmentShortfall(rule, votes, eligible, vote.vetoed);
		return short.approvals || short.vetoed || short.quorum ? 'rejected' : 'accepted';
	}
	if (!quorumReached(castBy(votes), eligible, rule.quorum)) return 'rejected';
	if (exceedsThreshold(rule, votes, eligible)) return 'accepted';
	return decidedByCastingVote(rule, votes, vote.castingChoice) ? 'depends_on_casting_member' : 'rejected';
}

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** The parts of a list as words: "a", "a and b", "a, b and c". */
function joinList(t: Translate, parts: string[]): string {
	if (parts.length === 1) return parts[0];
	return t('waiting_and', { first: parts.slice(0, -1).join(t('waiting_sep')), second: parts[parts.length - 1] });
}

/** What the yes votes must come to and what that is a share of: the first words of the rule, and of the approval bar's label. */
function thresholdClause(t: Translate, rule: VotingRule): string {
	// A department's yes votes reach its threshold of the seats, so the rule is the approvals that takes, rounded up as the
	// realm does; a realm-wide one is exact to the stored ratio, and no more than that is "more than".
	if (isDepartment(rule)) {
		if (rule.seats === 1) return t('rule_department_one');
		return t('rule_department', { seats: rule.seats, approvals: approvalsNeeded(rule.threshold, rule.seats) });
	}
	return t(rule.thresholdOf === 'eligible' ? 'rule_eligible' : 'rule_cast', { threshold: formatPercent(rule.threshold) });
}

/**
 * The rule in words: what the yes votes must come to, what that is a share of (and for a department, that abstentions and
 * members who do not vote count against it), the quorum, a veto and the casting vote. ``who`` names the casting member.
 */
export function requirementText(t: Translate, rule: VotingRule | null, who: string): string {
	if (!rule) return t('requirement_unknown');
	const parts: string[] = [thresholdClause(t, rule)];
	if (isDepartment(rule)) {
		parts.push(t('rule_abstain'));
		if (rule.veto) parts.push(t('rule_veto'));
	} else if (rule.thresholdOf === 'cast' && rule.castingVote) {
		parts.push(t('rule_casting', { who }));
	}
	if (rule.quorum) parts.push(t('rule_quorum', { quorum: formatPercent(rule.quorum) }));
	return t('requirement', { rule: joinList(t, parts) });
}

/** What the rule's threshold is a share of, counted: a department's seats, all the eligible voters, or the yes and no votes cast. */
function basisOf(rule: VotingRule, votes: Votes, eligible: number | null): number {
	if (isDepartment(rule)) return rule.seats;
	if (rule.thresholdOf === 'eligible') return eligible ?? 0;
	return votes.yes + votes.no;
}

/**
 * The approval bar of a vote with a stored rule: the share of the rule's basis that the yes votes make up (``fill``, 0 to 1,
 * of ``basis``) and where the threshold lies on it (``mark``, 0 to 1). A vote with no rule keeps the bar of yes among yes and no.
 */
export function approvalBar(rule: VotingRule, votes: Votes, eligible: number | null) {
	const basis = basisOf(rule, votes, eligible);
	return { basis, fill: basis ? Math.min(votes.yes / basis, 1) : 0, mark: Math.min(rule.threshold / ONE, 1) };
}

/** What the approval bar measures, in the words of the Requirement line. */
export function approvalLabel(t: Translate, rule: VotingRule): string {
	return t('approval_label', { rule: thresholdClause(t, rule) });
}

/** Whether the casting member's vote matters: the yes and no votes cast stand exactly at the threshold of a vote that has one. */
export function castingVoteMatters(rule: VotingRule | null, votes: Votes): boolean {
	return !!rule && !isDepartment(rule) && rule.castingVote !== '' && votes.yes + votes.no > 0 && tiedAtThreshold(rule, votes);
}

/**
 * Why a realm-wide tie at the threshold goes the way it does, when the yes and no votes are tied there: the casting member's
 * yes decides it, or it waits for that yes. '' when there is no tie, or the vote has no casting member (a tie then rejects).
 */
export function castingNote(t: Translate, vote: VoteState, who: string): string {
	const { rule, votes } = vote;
	if (!rule || !castingVoteMatters(rule, votes)) return '';
	return t(decidedByCastingVote(rule, votes, vote.castingChoice) ? 'casting_decides' : 'casting_needs', { who });
}

/** Why a vote whose deadline has passed ends as it does, as the realm will settle it: '' when the screen cannot tell. */
function endedBecause(t: Translate, vote: VoteState): string {
	const { rule, eligible, votes } = vote;
	const outcome = finalOutcome(vote);
	if (!rule || !eligible || !outcome) return '';
	if (isDepartment(rule)) {
		const needed = approvalsNeeded(rule.threshold, rule.seats);
		const short = departmentShortfall(rule, votes, eligible, vote.vetoed);
		if (outcome === 'accepted') return t('ended_satisfied', { yes: votes.yes, needed });
		if (short.vetoed) return t('ended_vetoed');
		if (short.approvals) return t(`ended_needs_${needed === 1 ? 'one' : 'many'}`, { needed, yes: votes.yes });
		return t('ended_quorum');
	}
	if (outcome === 'accepted') return t('ended_exceeds');
	if (outcome === 'depends_on_casting_member') return t('ended_casting');
	return t(quorumReached(castBy(votes), eligible, rule.quorum) ? 'ended_not_exceeds' : 'ended_quorum');
}

/** The line for a vote whose deadline has passed and which waits to be finalized, ``when`` it ended. */
export function endedText(t: Translate, vote: VoteState, when: string): string {
	const why = endedBecause(t, vote);
	return why ? t('ended_because', { when, why }) : t('ended', { when });
}

/** An open vote, as far as what it waits for is concerned. */
export type OpenVote = VoteState & {
	/** Whether the vote has a deadline (a realm with a voting window of 0 has none). */
	deadline: boolean;
	/** The department vote's veto holders who have not voted. */
	vetoHoldersMissing: number;
};

/**
 * Why an open vote is still open, in words: '' when it waits for nothing the screen knows of.
 * A realm-wide vote ends at its deadline or once everyone has voted. A department's passes once it has its approvals,
 * no veto holder stands against it, every veto holder who can still vote has voted and its quorum is met (the realm's
 * department_outcome), so the text names only what is still short. While a veto holder's no stands nothing else
 * matters: the vote waits for them to change it, or for the deadline.
 */
export function waitingText(t: Translate, vote: OpenVote): string {
	const open = vote.deadline ? '' : '_open';
	if (!vote.department) {
		const missing = missingVoters(vote.eligible, castBy(vote.votes));
		if (!missing) return '';
		return t(`waiting_${missing === 1 ? 'one' : 'many'}${open}`, { count: missing });
	}
	// the vote was not read (its electorate is not known), or it records no rule (the seats its threshold is a share of)
	if (!vote.eligible || !vote.rule || !isDepartment(vote.rule)) return '';
	const short = departmentShortfall(vote.rule, vote.votes, vote.eligible, vote.vetoed);
	if (short.vetoed) return t(`waiting_department${open}`, { what: t('waiting_vetoed') });
	const parts: string[] = [];
	if (short.approvals) parts.push(t(`waiting_approvals_${short.approvals === 1 ? 'one' : 'many'}`, { count: short.approvals }));
	if (vote.vetoHoldersMissing) {
		parts.push(t(`waiting_vetoes_${vote.vetoHoldersMissing === 1 ? 'one' : 'many'}`, { count: vote.vetoHoldersMissing }));
	}
	if (short.quorum) parts.push(t('waiting_quorum'));
	if (!parts.length) return '';
	return t(`waiting_department${open}`, { what: joinList(t, parts) });
}
