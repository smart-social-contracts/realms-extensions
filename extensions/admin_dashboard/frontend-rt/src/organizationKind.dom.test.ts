// The kind of an organization (ggg I-ORG-9) on the data explorer's list of organisations: a chip on each row, and a filter
// that asks the realm (`organization_list` takes a `kind`) rather than filtering what is loaded. These tests mount the
// real page on a small fake realm.
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/admin_dashboard/en.json';
import AdminDashboard from './AdminDashboard.svelte';

type Org = { id: string; description: string; status: string; kind?: unknown };

const ORGS: Org[] = [
	{ id: 'Clinic B', description: 'A private clinic', status: 'active', kind: 'company' },
	{ id: 'Harbour Party', description: 'A party', status: 'active', kind: 'party' },
	{ id: 'Dockers', description: 'The dockers', status: 'active', kind: 'union' },
	{ id: 'Friends of the Park', description: 'An association', status: 'active', kind: 'association' },
	{ id: 'Cooperativa', description: 'A cooperative', status: 'active', kind: 'other' },
	{ id: 'Old Registry', description: 'Registered before kinds', status: 'active' },
];

let target: HTMLElement;
let page: ReturnType<typeof mount>;
let asked: [string, any][];

const settle = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));
const text = () => target.textContent ?? '';
const chips = () => [...target.querySelectorAll('[data-testid="org-kind"]')].map((e) => e.textContent?.trim());
const select = (id: string) => target.querySelector<HTMLSelectElement>(`#${id}`)!;
const organizationCalls = () => asked.filter(([op]) => op === 'organization_list').map(([, args]) => args);

async function choose(id: string, value: string) {
	select(id).value = value;
	select(id).dispatchEvent(new Event('change', { bubbles: true }));
	await settle();
}

/** Mounts the page on a realm that holds ``orgs``; it lists them as the realm does: a page of rows, filtered, and `next`. */
async function mountOn(orgs: Org[], { refuse = '', hold }: { refuse?: string; hold?: { when: (args: any) => boolean; gate: Promise<void> } } = {}) {
	asked = [];
	vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => en }));
	const replies: Record<string, (args: any) => unknown> = {
		organization_list: ({ from = 1, count = 100, kind }) => {
			if (refuse) return { ok: false, error: refuse };
			count = Math.min(count, 500); // the realm reads 500 rows a call at most, then keeps the ones of the kind asked for
			const rows = orgs.slice(from - 1, from - 1 + count);
			return {
				ok: true,
				organizations: rows.filter((o) => !kind || o.kind === kind),
				next: from - 1 + count < orgs.length ? from + count : null,
			};
		},
		user_list: () => ({ ok: true, users: [], next: null }),
	};
	const ctx = {
		read: async (op: string, args: any) => {
			asked.push([op, args]);
			if (op === 'organization_list' && hold?.when(args)) await hold.gate; // a slow reply
			return replies[op]?.(args) ?? { ok: false, error: `${op} is not open to you` };
		},
		principal: writable('carla'),
		locale: writable('en'),
	};
	target = document.body.appendChild(document.createElement('div'));
	page = mount(AdminDashboard, { target, props: { ctx } });
	await settle();
	await choose('entity-type-select', 'Organization');
}

afterEach(() => {
	unmount(page);
	target.remove();
	vi.unstubAllGlobals();
});

test('every organisation shows its kind, and one registered without a kind reads as unknown', async () => {
	await mountOn(ORGS);
	expect(chips()).toEqual(['Company', 'Party', 'Union', 'Association', 'Other', 'Unknown']);
	const unknown = [...target.querySelectorAll('[data-testid="org-kind"]')].at(-1)!;
	expect(unknown.getAttribute('title')).toBe('The realm states no kind for this organisation.');
});

test('a kind the page does not know is shown as the realm states it', async () => {
	await mountOn([{ id: 'Odd', description: 'x', status: 'active', kind: 'cooperative' }]);
	expect(chips()).toEqual(['cooperative']);
});

test('the kind filter is offered on organisations only, with the five kinds', async () => {
	await mountOn(ORGS);
	expect([...select('org-kind-select').options].map((o) => o.textContent?.trim())).toEqual([
		'All kinds',
		'Company',
		'Party',
		'Union',
		'Association',
		'Other',
	]);
	expect(text()).toContain('A kind is what the organisation says it is: the realm does not check it.');

	await choose('entity-type-select', 'User');
	expect(target.querySelector('#org-kind-select')).toBeNull();
	expect(chips()).toEqual([]);
});

test('a kind asks the realm for it, and the list keeps the organisations of that kind', async () => {
	await mountOn(ORGS);
	expect(organizationCalls().at(-1)).not.toHaveProperty('kind');

	await choose('org-kind-select', 'party');
	expect(organizationCalls().at(-1)).toMatchObject({ kind: 'party' });
	expect(chips()).toEqual(['Party']);
	expect(text()).toContain('Harbour Party');
	expect(text()).not.toContain('Clinic B');

	await choose('org-kind-select', '');
	expect(organizationCalls().at(-1)).not.toHaveProperty('kind');
	expect(chips()).toHaveLength(6);
});

test('the next page keeps the kind, and a filtered call reads as many rows as the realm allows', async () => {
	const many: Org[] = Array.from({ length: 1_200 }, (_, i) => ({ id: `Org ${i + 1}`, description: 'x', status: 'active', kind: i % 2 ? 'union' : 'company' }));
	await mountOn(many);
	await choose('org-kind-select', 'union');
	expect(organizationCalls().at(-1)).toMatchObject({ kind: 'union', count: 500 });
	const next = [...target.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Next')!;
	expect(next.disabled).toBe(false);
	next.click();
	await settle();
	expect(organizationCalls().at(-1)).toMatchObject({ kind: 'union', from: 501, count: 500 });
});

/** ``total`` organisations, of which only the ``at``th is a party. */
const withOneParty = (total: number, at: number): Org[] =>
	Array.from({ length: total }, (_, i) => ({ id: `Org ${i + 1}`, description: 'x', status: 'active', kind: i + 1 === at ? 'party' : 'company' }));

test('the only party among 300 organisations, at row 250, is found', async () => {
	await mountOn(withOneParty(300, 250));
	await choose('org-kind-select', 'party');
	expect(chips()).toEqual(['Party']);
	expect(text()).toContain('Org 250');
	expect(text()).not.toContain('No organisations of this kind.');
});

test('a kind far down the list is found by following the realm over the pages with none of it', async () => {
	await mountOn(withOneParty(1_200, 1_150));
	await choose('org-kind-select', 'party');
	expect(chips()).toEqual(['Party']);
	expect(organizationCalls().filter((args) => args.kind === 'party')).toHaveLength(3); // rows 1-500, 501-1000, 1001-1200
});

test('when the realm has more rows than a click searches, the page says how many it searched and offers to go on, not "none"', async () => {
	await mountOn(withOneParty(25_000, 24_000));
	await choose('org-kind-select', 'party');
	// the first call and 20 hops: 21 calls of 500 rows
	expect(chips()).toEqual([]);
	expect(text()).toContain('None of the 10500 organisations searched is of this kind.');
	expect(text()).not.toContain('No organisations of this kind.');
	const further = () => target.querySelector<HTMLButtonElement>('[data-testid="org-kind-search-further"]')!;
	further().click();
	await settle(200);
	expect(text()).toContain('None of the 21000 organisations searched is of this kind.'); // counted from the first row
	further().click();
	await settle(200);
	expect(chips()).toEqual(['Party']);
	expect(text()).toContain('Org 24000');
});

test('a kind no organisation has says so', async () => {
	await mountOn(ORGS.filter((o) => o.kind !== 'union'));
	await choose('org-kind-select', 'union');
	expect(chips()).toEqual([]);
	expect(text()).toContain('No organisations of this kind.');
});

test('a realm with no organisations lists none, without an error', async () => {
	await mountOn([]);
	expect(chips()).toEqual([]);
	expect(text()).toContain('No items found.');
	expect(text()).not.toContain('This list isn');
});

test('a reader the realm refuses is told which permission is missing, and sees no kinds', async () => {
	await mountOn(ORGS, { refuse: 'organization_list needs realm.data_view' });
	expect(text()).toContain('Additional permissions needed');
	expect(text()).toContain('realm.data_view');
	expect(chips()).toEqual([]);
});

/** ``total`` organisations, of which the ones at the rows ``at`` are parties. */
const withParties = (total: number, at: number[]): Org[] =>
	Array.from({ length: total }, (_, i) => ({ id: `Org ${i + 1}`, description: 'x', status: 'active', kind: at.includes(i + 1) ? 'party' : 'company' }));
const button = (name: string) => [...target.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === name)!;

test('a page after the first with no more of the kind says there are no more, not that there are none', async () => {
	await mountOn(withParties(600, [10, 20])); // both parties are in the first 500 rows
	await choose('org-kind-select', 'party');
	expect(chips()).toEqual(['Party', 'Party']);
	expect(button('Next').disabled).toBe(false);

	button('Next').click();
	await settle();
	expect(chips()).toEqual([]);
	expect(text()).toContain('No more organisations of this kind.');
	expect(text()).not.toContain('No organisations of this kind.');
	// and the way back is there
	button('Prev').click();
	await settle();
	expect(chips()).toEqual(['Party', 'Party']);
});

test('a page after the first that searched far counts only the rows since the last page with a match', async () => {
	await mountOn(withParties(12_000, [10, 11_900])); // a party in the first 500 rows, the other far down
	await choose('org-kind-select', 'party');
	expect(chips()).toEqual(['Party']);
	expect(text()).toContain('Org 10');

	button('Next').click(); // 21 calls of 500 rows from row 501: none of them holds a party
	await settle(300);
	expect(chips()).toEqual([]);
	expect(text()).toContain('None of the next 10500 organisations searched is of this kind.');
	expect(text()).not.toContain('11000');
	expect(text()).not.toContain('No more organisations of this kind.');

	target.querySelector<HTMLButtonElement>('[data-testid="org-kind-search-further"]')!.click();
	await settle(300);
	expect(chips()).toEqual(['Party']);
	expect(text()).toContain('Org 11900');
});

test('a chain of calls over empty pages stops when the kind is changed', async () => {
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	await mountOn(withParties(25_000, [24_000]), { hold: { when: (args) => args.kind === 'party', gate } });
	await choose('org-kind-select', 'party'); // its first call is held
	await choose('org-kind-select', 'company');
	release();
	await settle(200);
	// the held call of the first request, and the one call that fills the page of the second: the first request hops no further (it would
	// have gone on over the 20 hops, with the kind the page has by then)
	expect(organizationCalls().map((args) => args.kind)).toEqual(['party', 'company']);
});
