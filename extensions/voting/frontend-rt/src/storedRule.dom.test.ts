// The page describes the voting rule stored with each proposal (realms-extensions#71, realms-gos I-GOV-3), not one
// guessed from the proposal's kind. These tests mount the real page on a small fake realm and read what it says.
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/voting/en.json';
import Voting from './Voting.svelte';

const PERCENT = 1_000_000;
const ONE = 100 * PERCENT;
const DANA = 'dana-ddddd-ddddd-ddddd-ddddd-ddddd-ddddd-ddd';
const DANA_SHORT = `${DANA.slice(0, 8)}...${DANA.slice(-6)}`;
const PAST = 1_700_000_000; // a deadline that has passed
const FUTURE = 4_102_444_800;

type Vote = { voter: string; choice: string };
/** A proposal as the realm stores it, the counts ``proposal_get`` reports for it and the votes it lists. */
type Row = { proposal: Record<string, unknown>; counts: Record<string, number>; votes: Vote[]; later?: Vote[] };
const counts = (yes: number, no = 0, abstain = 0, eligible = 4) => ({ yes, no, abstain, eligible });

const root = { id: 'Realm', is_root: true };
const registry = { id: 'Civil Registry', is_root: false };

const proposal = (title: string, fields: Record<string, unknown>) => ({
	id: title,
	title,
	description: 'In the park',
	proposer: 'alice',
	status: 'voting',
	opens_at: 1,
	...fields,
});

/** A department's vote, 2 of the policy's 3 seats with a 40 % quorum and a veto holder (bob), ending at ``deadline``. */
const departmentVote = (yes: number, no: number, votes: Vote[], deadline = PAST, threshold = 66_666_666): Row => ({
	proposal: proposal('Department', {
		department: 'Civil Registry',
		deadline,
		threshold,
		quorum: 40 * PERCENT,
		threshold_of: 'eligible',
		casting_vote: '',
		tally: { yes, no, abstain: 0, eligible: 4, seats: 3, veto: ['bob'] },
	}),
	counts: counts(yes, no),
	votes,
});

let target: HTMLElement;
let page: ReturnType<typeof mount>;
/** The proposals whose later pages of votes the page read. */
let pagesRead: string[];

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
const viewButtons = (within: Element) => [...within.querySelectorAll('button')].filter((b) => b.textContent?.trim() === 'View');
const text = (testid: string) => target.querySelector(`[data-testid="${testid}"]`)?.textContent?.trim() ?? null;

/** Mounts the page on a realm that holds ``rows`` and opens the proposal titled ``title``. */
async function openOn(rows: Row[], title: string) {
	pagesRead = [];
	window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia; // jsdom has none
	vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => en }));
	const rowOf = (id: string) => rows.find((row) => row.proposal.id === id)!;
	const replies: Record<string, (args: any) => unknown> = {
		proposal_list: () => ({
			ok: true,
			proposals: rows.map(({ proposal: { id, title, status, deadline, proposer } }) => ({ id, title, status, deadline, proposer })),
			next: null,
		}),
		proposal_get: ({ proposal: id, from }) => {
			const { proposal, counts, votes, later } = rowOf(id);
			const { eligible, ...tally } = counts;
			if (from) pagesRead.push(id);
			return { ok: true, proposal, tally, eligible, votes: from ? later : votes, next: from || !later ? null : 2 };
		},
		department_list: () => ({ ok: true, departments: [root, registry] }),
	};
	const ctx = {
		read: async (op: string, args: any) => replies[op]?.(args) ?? { ok: false },
		run: async () => ({ ok: false }),
		principal: writable('carla'),
		locale: writable('en'),
	};
	target = document.body.appendChild(document.createElement('div'));
	page = mount(Voting, { target, props: { ctx } });
	await settle();

	// the card that holds the title is the innermost one with a View button
	let card = [...target.querySelectorAll('*')].find((e) => !e.children.length && e.textContent?.trim() === title)?.parentElement;
	while (card && !viewButtons(card).length) card = card.parentElement;
	viewButtons(card!)[0].click();
	await settle();
}

afterEach(() => {
	unmount(page);
	target.remove();
	vi.unstubAllGlobals();
});

test('a department vote past its deadline names its rule, abstentions and non-voters included', async () => {
	await openOn([departmentVote(1, 0, [{ voter: 'alice', choice: 'yes' }])], 'Department');
	expect(text('requirement-line')).toBe(
		"Requirement: 2 of the policy's 3 seats must vote yes, abstentions and members who do not vote count against it, no veto holder may vote no and at least 40% of the eligible members must vote",
	);
});

test('a department vote past its deadline keeps "needs N approvals, M received"', async () => {
	await openOn([departmentVote(1, 0, [{ voter: 'alice', choice: 'yes' }])], 'Department');
	expect(text('ended-line')).toMatch(/^Voting period ended .+ — needs 2 approvals, 1 received\. Awaiting finalization\.$/);
});

test('a department vote past its deadline keeps "policy satisfied (M/N)"', async () => {
	const votes = [
		{ voter: 'alice', choice: 'yes' },
		{ voter: 'carla', choice: 'yes' },
	];
	await openOn([departmentVote(2, 0, votes)], 'Department');
	expect(text('ended-line')).toMatch(/^Voting period ended .+ — policy satisfied \(2\/2 approvals\)\. Awaiting finalization\.$/);
});

test('a department vote with a veto holder\'s no says it is vetoed, not that it needs approvals', async () => {
	const votes = [
		{ voter: 'alice', choice: 'yes' },
		{ voter: 'carla', choice: 'yes' },
		{ voter: 'bob', choice: 'no' },
	];
	await openOn([departmentVote(2, 1, votes)], 'Department');
	expect(text('ended-line')).toMatch(/^Voting period ended .+ — a veto holder voted no\. Awaiting finalization\.$/);
});

test('an open department vote with a veto holder\'s no says it was vetoed', async () => {
	const votes = [
		{ voter: 'alice', choice: 'yes' },
		{ voter: 'carla', choice: 'yes' },
		{ voter: 'bob', choice: 'no' },
	];
	await openOn([departmentVote(2, 1, votes, FUTURE)], 'Department');
	expect(text('waiting-line')).toBe('Waiting for a veto holder to change their no, or the deadline');
});

test('an open department vote that records no rule does not wait for voters as a realm-wide vote does', async () => {
	const row: Row = {
		proposal: proposal('Old', { department: 'Civil Registry', deadline: FUTURE, threshold: 50 * PERCENT, quorum: 0, tally: '{}' }),
		counts: counts(2, 1),
		votes: [],
	};
	await openOn([row], 'Old');
	expect(text('waiting-line')).toBeNull();
});

test('a realm-wide vote over all the eligible members does not speak of decisive votes', async () => {
	const row: Row = {
		proposal: proposal('Eligible', {
			department: 'Realm',
			deadline: FUTURE,
			threshold: 50 * PERCENT,
			quorum: 25 * PERCENT,
			threshold_of: 'eligible',
			casting_vote: '',
			tally: { yes: 3, no: 1, abstain: 0, eligible: 7 },
		}),
		counts: counts(3, 1, 0, 7),
		votes: [],
	};
	await openOn([row], 'Eligible');
	const requirement = text('requirement-line')!;
	expect(requirement).toBe(
		'Requirement: more than 50% yes of all eligible members, whether they vote or not and at least 25% of the eligible members must vote',
	);
	expect(requirement).not.toMatch(/decisive|votes cast/);
});

test('the casting vote that decided a tie is shown, with who holds it', async () => {
	const row: Row = {
		proposal: proposal('Tied', {
			department: 'Realm',
			deadline: FUTURE,
			threshold: 50 * PERCENT,
			quorum: 0,
			threshold_of: 'cast',
			casting_vote: DANA,
			tally: { yes: 1, no: 1, abstain: 0, eligible: 7 },
		}),
		counts: counts(1, 1, 0, 7),
		votes: [
			{ voter: DANA, choice: 'yes' },
			{ voter: 'alice', choice: 'no' },
		],
	};
	await openOn([row], 'Tied');
	expect(text('requirement-line')).toBe(
		`Requirement: more than 50% yes of the yes and no votes cast and a tie at the threshold goes to the yes of the casting vote (${DANA_SHORT})`,
	);
	expect(text('casting-note')).toBe(
		`Yes and no are tied at the threshold: the yes of the casting vote (${DANA_SHORT}) decides it, if they are still a member.`,
	);
});

/** The bar of the open proposal: its label and figure, how far it is filled (percent) and the style of its threshold mark. */
const bar = () => {
	const fill = target.querySelector<HTMLElement>('[data-testid="approval-fill"]');
	return {
		label: text('approval-label'),
		figure: text('approval-figure'),
		fill: parseFloat(fill?.style.width ?? 'NaN'),
		mark: target.querySelector('[data-testid="threshold-mark"]')?.getAttribute('style') ?? null,
	};
};
/** The percentage a mark with ``calc(P% - Npx)`` stands at. */
const markAt = (mark: string | null) => parseFloat(/left:\s*calc\(([\d.]+)%/.exec(mark ?? '')?.[1] ?? 'NaN');

test('the bar of a vote over the votes cast measures yes among yes and no', async () => {
	const row: Row = {
		proposal: proposal('Cast', {
			department: 'Realm',
			deadline: FUTURE,
			threshold: 50 * PERCENT,
			quorum: 0,
			threshold_of: 'cast',
			casting_vote: '',
			tally: { yes: 3, no: 1, abstain: 2, eligible: 7 },
		}),
		counts: counts(3, 1, 2, 7),
		votes: [],
	};
	await openOn([row], 'Cast');
	const { mark, ...shown } = bar();
	expect(shown).toEqual({ label: 'Approval: more than 50% yes of the yes and no votes cast', figure: '3 of 4', fill: 75 });
	expect(markAt(mark)).toBe(50);
	expect(mark).toContain('left: calc(50% - 1px)');
});

test('the bar of a vote over all the eligible members measures yes among them', async () => {
	const row: Row = {
		proposal: proposal('Eligible', {
			department: 'Realm',
			deadline: FUTURE,
			threshold: 50 * PERCENT,
			quorum: 0,
			threshold_of: 'eligible',
			casting_vote: '',
			tally: { yes: 3, no: 1, abstain: 0, eligible: 8 },
		}),
		counts: counts(3, 1, 0, 8),
		votes: [],
	};
	await openOn([row], 'Eligible');
	const { mark, ...shown } = bar();
	expect(shown).toEqual({
		label: 'Approval: more than 50% yes of all eligible members, whether they vote or not',
		figure: '3 of 8',
		fill: 37.5,
	});
	expect(markAt(mark)).toBe(50);
});

test("the bar of a department's vote measures approvals against the policy's seats", async () => {
	// 1 approval of the policy's 3 seats, though 4 members may vote; the mark is at the stored 2/3
	await openOn([departmentVote(1, 0, [{ voter: 'alice', choice: 'yes' }])], 'Department');
	const { fill, mark, ...words } = bar();
	expect(words).toEqual({ label: "Approval: 2 of the policy's 3 seats must vote yes", figure: '1 of 3' });
	expect(fill).toBeCloseTo(100 / 3, 5);
	expect(markAt(mark)).toBeCloseTo(66.666666, 3); // jsdom writes a calc() to four decimals
});

test('the threshold mark stays inside the bar at 100 % and takes the theme\'s dark grey', async () => {
	await openOn([departmentVote(1, 0, [{ voter: 'alice', choice: 'yes' }], PAST, ONE)], 'Department');
	const { mark } = bar();
	expect(mark).toContain('left: calc(100% - 2px)'); // its own width, so that the bar does not clip it
	expect(mark).toContain('background: var(--color-gray-900, #111827)');
});

test('the requirement shows before a single vote has been cast, and the bar does not', async () => {
	const row: Row = {
		proposal: proposal('Fresh', {
			department: 'Realm',
			deadline: FUTURE,
			threshold: 50 * PERCENT,
			quorum: 0,
			threshold_of: 'cast',
			casting_vote: '',
			tally: { yes: 0, no: 0, abstain: 0, eligible: 7 },
		}),
		counts: counts(0, 0, 0, 7),
		votes: [],
	};
	await openOn([row], 'Fresh');
	expect(text('requirement-line')).toBe('Requirement: more than 50% yes of the yes and no votes cast');
	expect(text('approval-label')).toBeNull();
	expect(text('casting-note')).toBeNull();
});

/** A vote with a casting member (Dana) whose own vote is on the second page of the votes. */
const castingRow = (title: string, yes: number, no: number): Row => ({
	proposal: proposal(title, {
		department: 'Realm',
		deadline: FUTURE,
		threshold: 50 * PERCENT,
		quorum: 0,
		threshold_of: 'cast',
		casting_vote: DANA,
		tally: { yes, no, abstain: 0, eligible: 7 },
	}),
	counts: counts(yes, no, 0, 7),
	votes: [{ voter: 'carla', choice: 'no' }], // the member's own vote is on the first page: nothing else is looked for
	later: [{ voter: DANA, choice: 'yes' }],
});

test("the casting member's vote is looked for in the later pages when the votes are tied at the threshold", async () => {
	await openOn([castingRow('Tied', 1, 1)], 'Tied');
	expect(pagesRead).toEqual(['Tied']);
	expect(text('casting-note')).toContain('the yes of the casting vote');
});

test("the casting member's vote is not looked for when the votes are not tied", async () => {
	await openOn([castingRow('Ahead', 3, 1)], 'Ahead');
	expect(pagesRead).toEqual([]);
	expect(text('casting-note')).toBeNull();
});

test('a proposal that records no rule keeps the bar of yes among yes and no', async () => {
	const row: Row = {
		proposal: proposal('Old', { department: 'Civil Registry', deadline: PAST, threshold: 50 * PERCENT, quorum: 0, tally: '{}' }),
		counts: counts(2, 1),
		votes: [],
	};
	await openOn([row], 'Old');
	const spans = [...target.querySelectorAll('span')].map((span) => span.textContent?.trim());
	expect(spans).toContain('Approval (yes / decisive votes)');
	expect(spans).toContain('66.7%');
	expect(text('approval-label')).toBeNull();
	expect(target.querySelector('[data-testid="threshold-mark"]')).toBeNull();
});

test('a proposal that records no rule says so, with no numbers', async () => {
	// stored before the rule was kept: no basis, no seats, and its tally a Json field read as text
	const row: Row = {
		proposal: proposal('Old', { department: 'Civil Registry', deadline: PAST, threshold: 50 * PERCENT, quorum: 0, tally: '{}' }),
		counts: counts(2, 1),
		votes: [],
	};
	await openOn([row], 'Old');
	expect(text('requirement-line')).toBe('Requirement: not recorded for this proposal');
	expect(text('casting-note')).toBeNull();
	expect(text('ended-line')).toMatch(/^Voting period ended [^—]+\. Awaiting finalization\.$/);
});
