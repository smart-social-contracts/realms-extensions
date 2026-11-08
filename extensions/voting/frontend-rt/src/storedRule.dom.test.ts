// The page describes the voting rule stored with each proposal (realms-extensions#71, realms-gos I-GOV-3), not one
// guessed from the proposal's kind. These tests mount the real page on a small fake realm and read what it says.
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/voting/en.json';
import Voting from './Voting.svelte';

const PERCENT = 1_000_000;
const DANA = 'dana-ddddd-ddddd-ddddd-ddddd-ddddd-ddddd-ddd';
const DANA_SHORT = `${DANA.slice(0, 8)}...${DANA.slice(-6)}`;
const PAST = 1_700_000_000; // a deadline that has passed
const FUTURE = 4_102_444_800;

type Vote = { voter: string; choice: string };
/** A proposal as the realm stores it, the counts ``proposal_get`` reports for it and the votes it lists. */
type Row = { proposal: Record<string, unknown>; counts: Record<string, number>; votes: Vote[] };
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
const departmentVote = (yes: number, no: number, votes: Vote[], deadline = PAST): Row => ({
	proposal: proposal('Department', {
		department: 'Civil Registry',
		deadline,
		threshold: 66_666_666,
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
const viewButtons = (within: Element) => [...within.querySelectorAll('button')].filter((b) => b.textContent?.trim() === 'View');
const text = (testid: string) => target.querySelector(`[data-testid="${testid}"]`)?.textContent?.trim() ?? null;

/** Mounts the page on a realm that holds ``rows`` and opens the proposal titled ``title``. */
async function openOn(rows: Row[], title: string) {
	window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia; // jsdom has none
	vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => en }));
	const rowOf = (id: string) => rows.find((row) => row.proposal.id === id)!;
	const replies: Record<string, (args: any) => unknown> = {
		proposal_list: () => ({
			ok: true,
			proposals: rows.map(({ proposal: { id, title, status, deadline, proposer } }) => ({ id, title, status, deadline, proposer })),
			next: null,
		}),
		proposal_get: ({ proposal: id }) => {
			const { proposal, counts, votes } = rowOf(id);
			const { eligible, ...tally } = counts;
			return { ok: true, proposal, tally, eligible, votes, next: null };
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
		"Requirement: at least 66.666666% of the policy's 3 seats must vote yes (2 of 3), abstentions and members who do not vote count against it, no veto holder may vote no and at least 40% of the eligible members must vote",
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
		`Yes and no are tied at the threshold: the yes of the casting vote (${DANA_SHORT}) decides it.`,
	);
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
