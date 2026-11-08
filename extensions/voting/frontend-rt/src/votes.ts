/** What a member voted, read from the realm's vote records, and what an open vote is still waiting for. */

import { ONE } from '../../../_shared/frontend/units.ts';

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

/** An open vote, as far as what it waits for is concerned. */
export type OpenVote = {
	/** Whether the vote has a deadline (a realm with a voting window of 0 has none). */
	deadline: boolean;
	eligible: number | null;
	/** Votes cast, and the yes among them. */
	cast: number;
	yes: number;
	/** The approvals a department's vote needs; null for a realm-wide vote. */
	required: number | null;
	/** The department vote's veto holders who have not voted. */
	vetoHoldersMissing: number;
	/** Whether a veto holder has voted no. */
	vetoed: boolean;
	/** The share of the eligible voters that must vote (hundred-millionths). */
	quorum: number;
};

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

/** The parts of a list as words: "a", "a and b", "a, b and c". */
function joinList(t: Translate, parts: string[]): string {
	if (parts.length === 1) return parts[0];
	return t('waiting_and', { first: parts.slice(0, -1).join(t('waiting_sep')), second: parts[parts.length - 1] });
}

/**
 * Why an open vote is still open, in words: '' when it waits for nothing the screen knows of.
 * A realm-wide vote ends at its deadline or once everyone has voted. A department's passes once it has its approvals,
 * no veto holder stands against it, every veto holder who can still vote has voted and its quorum is met (the realm's
 * department_outcome), so the text names only what is still short. While a veto holder's no stands nothing else
 * matters: the vote waits for them to change it, or for the deadline.
 */
export function waitingText(t: Translate, vote: OpenVote): string {
	const open = vote.deadline ? '' : '_open';
	if (vote.required === null) {
		const missing = missingVoters(vote.eligible, vote.cast);
		if (!missing) return '';
		return t(`waiting_${missing === 1 ? 'one' : 'many'}${open}`, { count: missing });
	}
	if (!vote.eligible) return ''; // the vote was not read: its electorate is not known
	if (vote.vetoed) return t(`waiting_department${open}`, { what: t('waiting_vetoed') });
	const parts: string[] = [];
	const approvals = Math.max(vote.required - vote.yes, 0);
	if (approvals) parts.push(t(`waiting_approvals_${approvals === 1 ? 'one' : 'many'}`, { count: approvals }));
	if (vote.vetoHoldersMissing) {
		parts.push(t(`waiting_vetoes_${vote.vetoHoldersMissing === 1 ? 'one' : 'many'}`, { count: vote.vetoHoldersMissing }));
	}
	if (!quorumReached(vote.cast, vote.eligible, vote.quorum)) parts.push(t('waiting_quorum'));
	if (!parts.length) return '';
	return t(`waiting_department${open}`, { what: joinList(t, parts) });
}
