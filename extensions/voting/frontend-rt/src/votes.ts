/** What a member voted, read from the realm's vote records, and how many votes are still missing. */

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
