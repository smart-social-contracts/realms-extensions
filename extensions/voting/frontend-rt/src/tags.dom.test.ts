// The tags of a proposal (realms-gos I-GOV-15): chips on the cards and the proposal page, a filter that asks the
// realm for the tag (a list can hold thousands of proposals, so the page never filters them itself), and tags in
// the form within the realm's limits. These tests mount the real page on a small fake realm.
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/voting/en.json';
import Voting from './Voting.svelte';

type Row = { id: string; title: string; tags?: unknown };

const FUTURE = 4_102_444_800;
const row = (n: number, tags?: unknown): Row => ({ id: `P-${n}`, title: `Proposal ${n}`, ...(tags === undefined ? {} : { tags }) });

let target: HTMLElement;
let page: ReturnType<typeof mount> | undefined;
/** What the page asked the realm, in order. */
let asked: [string, any][];
let created: Record<string, any>[];

const settle = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
const all = <E extends Element = HTMLElement>(selector: string) => [...target.querySelectorAll<E>(selector)];
const byTestId = (id: string) => all(`[data-testid="${id}"]`);
const texts = (id: string) => byTestId(id).map((e) => e.textContent?.trim());
const text = () => target.textContent ?? '';
const button = (name: string) => all<HTMLButtonElement>('button').find((b) => b.textContent?.trim() === name)!;

async function type(input: HTMLInputElement, value: string, enter = false) {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	if (enter) input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
	await settle();
}

/**
 * Mounts the page on a realm that holds ``rows``, and answers `proposal_list` as realms-gos does: it reads ``count`` rows
 * from ``from``, sends back the ones that carry a tag asked for, and `next` is the row after the page.
 */
async function mountOn(rows: Row[], realm: { signedOut?: boolean; hold?: { when: (args: any) => boolean; gate: Promise<void> } } = {}) {
	asked = [];
	created = [];
	window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia; // jsdom has none
	vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => en }));
	const full = (r: Row) => ({ proposer: 'alice', status: 'voting', opens_at: 1, deadline: FUTURE, description: 'In the park', ...r });
	const replies: Record<string, (args: any) => unknown> = {
		proposal_list: ({ from = 1, count = 100, tags = [], status }) => {
			const page = rows.slice(from - 1, from - 1 + count);
			const kept = page.filter((r) => (!tags.length || (Array.isArray(r.tags) && r.tags.some((t) => tags.includes(t)))) && (!status || status === 'voting'));
			return { ok: true, proposals: kept.map(full), next: from - 1 + count < rows.length ? from + count : null };
		},
		proposal_get: ({ proposal: id }) => ({
			ok: true,
			proposal: full(rows.find((r) => r.id === id)!),
			tally: { yes: 0, no: 0, abstain: 0 },
			eligible: 3,
			votes: [],
			next: null,
		}),
		department_list: () => ({ ok: true, departments: [{ id: 'Realm', is_root: true }] }),
	};
	const ctx = {
		read: async (op: string, args: any) => {
			asked.push([op, args]);
			if (op === 'proposal_list' && realm.hold?.when(args)) await realm.hold.gate; // a slow reply
			return replies[op]?.(args) ?? { ok: false };
		},
		run: async (op: string, args: any) => {
			if (realm.signedOut) return { ok: false, error: 'sign in first' };
			created.push(args);
			return { ok: true, proposal: 'P-99' };
		},
		principal: writable('carla'),
		locale: writable('en'),
	};
	target = document.body.appendChild(document.createElement('div'));
	page = mount(Voting, { target, props: { ctx } });
	await settle();
}

const listCalls = () => asked.filter(([op]) => op === 'proposal_list').map(([, args]) => args);

afterEach(() => {
	if (page) unmount(page);
	target.remove();
	vi.unstubAllGlobals();
});

test('a card shows the tags of its proposal, and a proposal without tags shows none', async () => {
	await mountOn([row(1, ['parks', 'district-3']), row(2, []), row(3), row(4, 'not a list')]);
	expect(byTestId('card-tag').map((e) => e.textContent)).toEqual(['parks', 'district-3']);
});

test('the proposal page shows the tags, and a tag leads to the list of the proposals that carry it', async () => {
	await mountOn([row(1, ['parks']), row(2, ['bikes'])]);
	button('View').click();
	await settle();
	expect(texts('detail-tag')).toEqual(['parks']);

	byTestId('detail-tag')[0].click();
	await settle();
	expect(listCalls().at(-1)).toMatchObject({ tags: ['parks'] });
	expect(texts('card-tag')).toEqual(['parks']);
	expect(all('[data-proposal-id]').map((e) => e.getAttribute('data-proposal-id'))).toEqual(['P-1']);
});

test('the filter asks the realm for the tag and does not filter the list itself', async () => {
	await mountOn([row(1, ['parks']), row(2, ['bikes']), row(3, ['parks', 'bikes'])]);
	expect(all('[data-proposal-id]')).toHaveLength(3);

	await type(byTestId('tag-input')[0] as HTMLInputElement, 'bikes', true);
	expect(listCalls().at(-1)).toMatchObject({ tags: ['bikes'] });
	expect(all('[data-proposal-id]').map((e) => e.getAttribute('data-proposal-id'))).toEqual(['P-2', 'P-3']);

	// a second tag widens it: the realm keeps the proposals that carry at least one
	await type(byTestId('tag-input')[0] as HTMLInputElement, 'parks', true);
	expect(listCalls().at(-1)).toMatchObject({ tags: ['bikes', 'parks'] });
	expect(all('[data-proposal-id]')).toHaveLength(3);

	button('Clear filters').click();
	await settle();
	expect(listCalls().at(-1)).not.toHaveProperty('tags');
	expect(all('[data-proposal-id]')).toHaveLength(3);
});

test('a tag found nowhere says so, and one that is not a tag says why', async () => {
	await mountOn([row(1, ['parks'])]);
	const input = () => byTestId('tag-input')[0] as HTMLInputElement;
	await type(input(), 'x'.repeat(65), true);
	expect(texts('tag-problem')).toEqual(['A tag has at most 64 characters.']);
	expect(listCalls().every((args) => !args.tags)).toBe(true);

	await type(input(), 'nothing', true);
	expect(texts('tag-problem')).toEqual([]);
	expect(all('[data-proposal-id]')).toHaveLength(0);
	expect(target.textContent).toContain('No proposals match the current filters');
});

test('a rare tag is searched for a page of rows at a time, with a limit, then the page offers to go on', async () => {
	// 5,100 proposals, and only the last one carries the tag: the search stops after 10 calls of 500 rows
	const rows = Array.from({ length: 5_100 }, (_, i) => row(i + 1, i === 5_099 ? ['rare'] : []));
	await mountOn(rows);
	await type(byTestId('tag-input')[0] as HTMLInputElement, 'rare', true);
	await settle(300);

	const searches = listCalls().filter((args) => args.tags);
	expect(searches).toHaveLength(10);
	expect(searches.every((args) => args.count === 500)).toBe(true);
	expect(texts('tags-searched')).toEqual(['None of the 5000 proposals searched carries these tags.']);

	byTestId('tags-search-further')[0].click();
	await settle(300);
	expect(listCalls().filter((args) => args.tags)).toHaveLength(11);
	expect(all('[data-proposal-id]').map((e) => e.getAttribute('data-proposal-id'))).toEqual(['P-5100']);
	expect(texts('tags-searched')).toEqual([]);
});

test('the form lists the limits, adds tags as they are typed, and files them with the proposal', async () => {
	await mountOn([]);
	button('Submit Proposal').click();
	await settle();

	expect(texts('tags-hint')[0]).toContain('At most 16 tags of 1 to 64 characters each');
	expect(texts('tags-hint')[0]).toContain('“Parks” and “parks” are two different tags');
	const input = () => byTestId('tag-input')[0] as HTMLInputElement;
	await type(all<HTMLInputElement>('#rt-title')[0], 'Plant trees');
	await type(all<HTMLTextAreaElement>('#rt-desc')[0] as unknown as HTMLInputElement, 'In the park');

	await type(input(), '  Parks ', true);
	await type(input(), 'café', true); // typed as e + accent; sent in NFC
	await type(input(), 'Parks', true);
	expect(texts('tag-problem')).toEqual(['“Parks” is already there.']);
	expect(texts('tag-chip').map((t) => t?.replace('×', '').trim())).toEqual(['Parks', 'café']);
	expect(texts('tags-count')).toEqual(['2 of 16 tags']);

	all<HTMLButtonElement>('button[type="submit"]')[0].click();
	await settle();
	expect(created).toHaveLength(1);
	expect(created[0]).toMatchObject({ title: 'Plant trees', tags: ['Parks', 'café'] });
});

test('the form refuses a 17th tag, and a tag can be taken out', async () => {
	await mountOn([]);
	button('Submit Proposal').click();
	await settle();
	const input = () => byTestId('tag-input')[0] as HTMLInputElement;
	for (let i = 1; i <= 16; i++) await type(input(), `tag ${i}`, true);
	expect(texts('tags-count')).toEqual(['16 of 16 tags']);
	expect(input().disabled).toBe(true);
	expect((byTestId('tag-add')[0] as HTMLButtonElement).disabled).toBe(true);

	all<HTMLButtonElement>('[data-testid="tag-chip"] button')[0].click();
	await settle();
	expect(texts('tags-count')).toEqual(['15 of 16 tags']);
	expect(input().disabled).toBe(false);
});

/** Opens the form and fills in a title and a description. */
async function fillForm() {
	button('Submit Proposal').click();
	await settle();
	await type(all<HTMLInputElement>('#rt-title')[0], 'Plant trees');
	await type(all<HTMLTextAreaElement>('#rt-desc')[0] as unknown as HTMLInputElement, 'In the park');
}

test('a proposal filed without tags carries none', async () => {
	await mountOn([]);
	await fillForm();
	all<HTMLButtonElement>('button[type="submit"]')[0].click();
	await settle();
	expect(created).toHaveLength(1);
	expect(created[0]).not.toHaveProperty('tags');
});

test('a refusal of the realm is shown, with the tags still in the form', async () => {
	await mountOn([], { signedOut: true });
	await fillForm();
	await type(byTestId('tag-input')[0] as HTMLInputElement, 'parks', true);
	all<HTMLButtonElement>('button[type="submit"]')[0].click();
	await settle();
	expect(target.textContent).toContain('sign in first');
	expect(texts('tag-chip').map((t) => t?.replace('×', '').trim())).toEqual(['parks']);
	expect(created).toEqual([]);
});

const cardIds = () => all('[data-proposal-id]').map((e) => e.getAttribute('data-proposal-id'));

test('a tag search still running when the filter is cleared does not put its older list back', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	await mountOn([row(1, ['slow']), row(2), row(3)], { hold: { when: (args) => args.tags?.includes('slow'), gate } });
	await type(byTestId('tag-input')[0] as HTMLInputElement, 'slow', true); // its reply is held

	button('Clear filters').click();
	await settle();
	expect(cardIds()).toEqual(['P-1', 'P-2', 'P-3']);

	release(); // the old search answers now, with the one proposal it found
	await settle();
	expect(cardIds()).toEqual(['P-1', 'P-2', 'P-3']);
	expect(text()).not.toContain('Filtered');
});

test('a page that "Load more" was reading when the filter changes is not merged into the new list', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	const rows = Array.from({ length: 60 }, (_, i) => row(i + 1, i === 6 ? ['x'] : []));
	await mountOn(rows, { hold: { when: (args) => !args.tags && args.from === 31, gate } });
	button('Load more proposals').click(); // rows 31 to 60 are on their way
	await settle();

	await type(byTestId('tag-input')[0] as HTMLInputElement, 'x', true);
	expect(cardIds()).toEqual(['P-7']);

	release();
	await settle();
	expect(cardIds()).toEqual(['P-7']);
	expect(byTestId('tags-searched')).toHaveLength(0);
});

test('an old tag search stops making calls once the filter has changed', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	// 5,100 untagged rows: a search for "none" would take ten calls
	const rows = Array.from({ length: 5_100 }, (_, i) => row(i + 1, []));
	await mountOn(rows, { hold: { when: (args) => args.tags?.includes('none'), gate } });
	await type(byTestId('tag-input')[0] as HTMLInputElement, 'none', true);
	button('Clear filters').click();
	await settle();
	release();
	await settle(200);
	expect(listCalls().filter((args) => args.tags?.includes('none'))).toHaveLength(1);
});

test('a tag search still running when the page is closed stops making calls', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	const rows = Array.from({ length: 5_100 }, (_, i) => row(i + 1, []));
	await mountOn(rows, { hold: { when: (args) => args.tags?.includes('none'), gate } });
	await type(byTestId('tag-input')[0] as HTMLInputElement, 'none', true); // its first call is held
	unmount(page!);
	page = undefined;
	release();
	await settle(200);
	expect(listCalls().filter((args) => args.tags?.includes('none'))).toHaveLength(1); // the other nine calls of the search are not made
});
