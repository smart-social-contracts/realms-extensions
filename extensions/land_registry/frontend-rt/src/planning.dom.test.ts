// Planning on the land registry (GGG domain `planning`, I-AST-6, I-LIC-4): the zones a parcel lies in, a filter by zone, setting
// the zones with `land_zone_set`, and the licences that name the parcel. These tests mount the real page on a small fake realm.
import { mount, unmount } from 'svelte';
import { writable } from 'svelte/store';
import { afterEach, expect, test, vi } from 'vitest';
import en from '../../frontend/i18n/locales/extensions/land_registry/en.json';
import LandRegistry from './LandRegistry.svelte';

const HOME_CELL = '871f1d489ffffff'; // a member's home cell: an h3 index, not a zone the realm defines

const SEAFRONT = { id: 'seafront', name: 'Seafront', kind: 'planning', population: 0 };
const OLD_TOWN = { id: 'old-town', name: 'Old town', kind: 'heritage', population: 0 };

const parcel = (n: number, lies_in: string[] = []) => ({
	id: `L-${n}`,
	x: n * 2,
	y: 0,
	width: 2,
	height: 2,
	kind: 'residential',
	owner: 'User:alice',
	status: 'active',
	token_id: '',
	lies_in,
});

type Realm = {
	parcels?: any[];
	zones?: any[];
	licences?: any[] | ((args: any) => any);
	/** What `me` says the member holds; null for a reader whose `me` the realm refuses. */
	permissions?: string[] | null;
	timezone?: string;
	/** `official_timezone` of `realm_info`, which a quarter takes from its capital. */
	official?: string;
	/** A `land_map` that always has another page of zones. */
	endlessZones?: boolean;
	zoneSet?: (args: any) => any;
};

let target: HTMLElement;
let page: ReturnType<typeof mount>;
let asked: [string, any][];

const settle = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
const text = () => target.textContent ?? '';
const byTestId = (id: string) => [...target.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`)];
const rowOf = (id: string) => [...target.querySelectorAll<HTMLButtonElement>('.parcel-row')].find((row) => row.textContent?.includes(id))!;

/** Mounts the page on a realm that holds what ``realm`` says, as the realm answers its reads (a page of rows, and `next`). */
async function mountOn(realm: Realm) {
	asked = [];
	vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => en }));
	const { parcels = [], zones = [], licences = [], timezone = 'Europe/Madrid' } = realm;
	const replies: Record<string, (args: any) => unknown> = {
		land_list: () => ({ ok: true, lands: parcels, next: null }),
		land_map: ({ from = 1 }) => ({ ok: true, parcels: [], zones: from === 1 ? zones : [], next: realm.endlessZones ? from + 500 : null }),
		user_list: () => ({ ok: true, users: [{ id: 'alice', nickname: 'Alice' }] }),
		license_list: (args) => (typeof licences === 'function' ? licences(args) : { ok: true, licenses: licences, next: null }),
		me: () => (realm.permissions === null ? { ok: false, error: 'sign in first' } : { ok: true, permissions: realm.permissions ?? [] }),
		realm_info: () => ({ ok: true, realm: { timezone, ...(realm.official ? { official_timezone: realm.official } : {}) } }),
		land_zone_set: (args) => realm.zoneSet?.(args) ?? { ok: true, land: args.land },
	};
	const ctx = {
		read: async (op: string, args: any) => {
			asked.push([op, args]);
			return replies[op]?.(args) ?? { ok: false, error: `${op} is not open to you` };
		},
		run: async (op: string, args: any) => {
			asked.push([op, args]);
			return replies[op]?.(args) ?? { ok: false, error: `${op} is not open to you` };
		},
		principal: writable('alice'),
		locale: writable('en'),
	};
	target = document.body.appendChild(document.createElement('div'));
	page = mount(LandRegistry, { target, props: { ctx } });
	await settle();
}

const select = (testid: string) => byTestId(testid)[0] as unknown as HTMLSelectElement;
async function pick(testid: string, value: string) {
	select(testid).value = value;
	select(testid).dispatchEvent(new Event('change', { bubbles: true }));
	await settle();
}

afterEach(() => {
	delete (window as any).h3;
	unmount(page);
	target.remove();
	vi.unstubAllGlobals();
});

test('each parcel in the list names the planning zones it lies in, and a parcel in none names none', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront']), parcel(2, ['seafront', 'old-town']), parcel(3)], zones: [SEAFRONT, OLD_TOWN] });
	expect(byTestId('parcel-zones').map((e) => e.textContent)).toEqual(['Seafront', 'Seafront, Old town']);
});

test('the zone filter lists the realm\'s planning zones, and keeps the parcels that lie in the zone', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront']), parcel(2, ['seafront', 'old-town']), parcel(3)], zones: [SEAFRONT, OLD_TOWN, { id: HOME_CELL, name: '', kind: 'residential', population: 1 }] });
	expect([...select('zone-filter').options].map((o) => o.textContent?.trim())).toEqual(['All zones', 'Old town', 'Seafront', 'In no zone']);
	expect(target.querySelectorAll('.parcel-row')).toHaveLength(3);

	await pick('zone-filter', 'old-town');
	expect([...target.querySelectorAll('.parcel-row strong')].map((e) => e.textContent)).toEqual(['L-2']);
	expect(byTestId('zone-filter-count')[0].textContent).toBe('1 of 3 parcels');

	await pick('zone-filter', 'seafront');
	expect(target.querySelectorAll('.parcel-row')).toHaveLength(2);

	await pick('zone-filter', select('zone-filter').options[3].value); // in no zone
	expect([...target.querySelectorAll('.parcel-row strong')].map((e) => e.textContent)).toEqual(['L-3']);

	await pick('zone-filter', '');
	expect(target.querySelectorAll('.parcel-row')).toHaveLength(3);
});

test('a realm with no planning zones shows no filter, and the parcel page says there are none', async () => {
	// a member's home cell is a zone of the map, not a planning zone
	await mountOn({ parcels: [parcel(1)], zones: [{ id: HOME_CELL, name: '', kind: 'residential', population: 1 }] });
	expect(byTestId('zone-filter')).toHaveLength(0);
	rowOf('L-1').click();
	await settle();
	expect(text()).toContain('This parcel lies in no planning zone.');
	expect(text()).toContain('The realm has defined no planning zones yet.');
});

test('the parcel page shows the zones the parcel lies in, with their kind', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront', 'old-town'])], zones: [SEAFRONT, OLD_TOWN] });
	rowOf('L-1').click();
	await settle();
	const chips = byTestId('parcel-zone');
	expect(chips.map((e) => e.textContent)).toEqual(['Seafront', 'Old town']);
	expect(chips.map((e) => e.getAttribute('title'))).toEqual(['planning', 'heritage']);
});

test('the realm\'s word on which zones it defined decides, not the shape of the id', async () => {
	const zones = [
		{ id: HOME_CELL, name: 'Defined, with an index for an id', kind: 'planning', population: 0, defined: true },
		{ id: 'cell-0', name: '', kind: 'residential', population: 1, defined: false },
	];
	await mountOn({ parcels: [parcel(1)], zones });
	expect([...select('zone-filter').options].map((o) => o.textContent?.trim())).toEqual(['All zones', 'Defined, with an index for an id', 'In no zone']);
});

test('a zone the realm no longer lists is shown by its id', async () => {
	await mountOn({ parcels: [parcel(1, ['gone'])], zones: [SEAFRONT] });
	rowOf('L-1').click();
	await settle();
	expect(byTestId('parcel-zone').map((e) => e.textContent)).toEqual(['gone']);
});

test('the licences that name the parcel are listed, in the realm\'s time zone, and no other', async () => {
	const licences = [
		{ id: 'LIC-1', kind: 'building', holder: 'Organization:Clinic B', status: 'active', expires_at: 1_893_456_000, land: 'L-1' }, // 2030-01-01 01:00 in Madrid
		{ id: 'LIC-2', kind: 'demolition', holder: 'User:alice', status: 'applied', expires_at: 0, land: 'L-1' },
		{ id: 'LIC-3', kind: 'building', holder: 'User:alice', status: 'revoked', expires_at: 0, land: 'L-2' },
		{ id: 'LIC-4', kind: 'health', holder: 'User:alice', status: 'active', expires_at: 0, land: '' },
	];
	await mountOn({ parcels: [parcel(1), parcel(2), parcel(3)], zones: [SEAFRONT], licences });
	rowOf('L-1').click();
	await settle();
	expect(text()).toContain('Licences for this parcel');
	expect(byTestId('licence').map((e) => e.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
		'building · Active · Org Clinic B · until 2030-01-01 01:00 Europe/Madrid (UTC+01:00)',
		'demolition · Applied · Alice',
	]);

	rowOf('L-3').click();
	await settle();
	expect(byTestId('licence')).toHaveLength(0);
	expect(text()).toContain('No licence names this parcel.');
});

test('licences the realm will not list are said to be unavailable, and the parcels still show', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront'])], zones: [SEAFRONT], licences: () => ({ ok: false, error: 'license_list needs realm.data_view' }) });
	rowOf('L-1').click();
	await settle();
	expect(byTestId('licences-problem')[0].textContent).toBe('Licences are not available right now: license_list needs realm.data_view');
	expect(byTestId('parcel-zone')).toHaveLength(1);
});

test('licences beyond what the page reads are said to be cut off', async () => {
	// the realm always has another page: the page stops at 50 pages of 500
	await mountOn({ parcels: [parcel(1)], zones: [], licences: ({ from }) => ({ ok: true, licenses: [], next: from + 500 }) });
	rowOf('L-1').click();
	await settle(200);
	expect(asked.filter(([op]) => op === 'license_list')).toHaveLength(50);
	expect(text()).toContain('Only the first 25000 licences were searched.');
});

test('a reader without the permission to set zones sees the reason, and no way to set them', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront'])], zones: [SEAFRONT, OLD_TOWN], permissions: ['realm.data_view'] });
	rowOf('L-1').click();
	await settle();
	expect(byTestId('planning-reason')[0].textContent).toBe('Setting zones needs the realm.configure permission.');
	expect(target.querySelectorAll('.zone-form')).toHaveLength(0);
	expect([...target.querySelectorAll('button')].some((b) => b.textContent?.trim() === 'Save zones')).toBe(false);
});

test('a member who may set zones chooses them and saves them with the parcel', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront'])], zones: [SEAFRONT, OLD_TOWN], permissions: ['realm.configure'] });
	rowOf('L-1').click();
	await settle();
	const boxes = () => [...target.querySelectorAll<HTMLInputElement>('.zone-option input')];
	const save = () => [...target.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Save zones')!;
	// the options are the realm's zones by name: Old town, Seafront
	expect(boxes().map((b) => b.checked)).toEqual([false, true]);
	expect(save().disabled).toBe(true); // nothing changed

	boxes()[0].click();
	await settle();
	expect(save().disabled).toBe(false);
	save().click();
	await settle();
	const [, args] = asked.filter(([op]) => op === 'land_zone_set').at(-1)!;
	expect(args).toEqual({ land: 'L-1', zones: ['seafront', 'old-town'] });
	expect(text()).toContain('The zones of parcel L-1 are saved.');
});

test('every permission stands for this one, as it does elsewhere', async () => {
	await mountOn({ parcels: [parcel(1)], zones: [SEAFRONT], permissions: ['all'] });
	rowOf('L-1').click();
	await settle();
	expect(target.querySelectorAll('.zone-form')).toHaveLength(1);
});

test('a zone change the realm puts to a vote says so, and a refusal is shown', async () => {
	await mountOn({ parcels: [parcel(1)], zones: [SEAFRONT], permissions: ['realm.configure'], zoneSet: () => ({ ok: true, proposal: 'P-12' }) });
	rowOf('L-1').click();
	await settle();
	target.querySelector<HTMLInputElement>('.zone-option input')!.click();
	await settle();
	[...target.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Save zones')!.click();
	await settle();
	expect(text()).toContain('Submitted for a vote as proposal P-12.');
	unmount(page);
	target.remove();

	await mountOn({ parcels: [parcel(1)], zones: [SEAFRONT], permissions: ['realm.configure'], zoneSet: () => ({ ok: false, error: 'seafront is not a zone of the realm' }) });
	rowOf('L-1').click();
	await settle();
	target.querySelector<HTMLInputElement>('.zone-option input')!.click();
	await settle();
	[...target.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Save zones')!.click();
	await settle();
	expect(target.querySelector('.alert.error')?.textContent).toContain('seafront is not a zone of the realm');
});

test('a parcel lies in at most 8 zones: the ninth cannot be chosen', async () => {
	const zones = Array.from({ length: 9 }, (_, i) => ({ id: `z${i + 1}`, name: `Zone ${i + 1}`, kind: 'planning', population: 0 }));
	await mountOn({ parcels: [parcel(1, zones.slice(0, 8).map((z) => z.id))], zones, permissions: ['realm.configure'] });
	rowOf('L-1').click();
	await settle();
	const boxes = [...target.querySelectorAll<HTMLInputElement>('.zone-option input')];
	expect(boxes.filter((b) => b.checked)).toHaveLength(8);
	expect(boxes.filter((b) => b.disabled).map((b) => b.closest('label')?.querySelector('span')?.textContent)).toEqual(['Zone 9']);
	expect(text()).toContain('A parcel lies in at most 8 zones.');
});

test('an empty registry lists no parcels and no zones, without an error', async () => {
	await mountOn({});
	expect(text()).toContain('No parcels yet.');
	expect(byTestId('zone-filter')).toHaveLength(0);
	expect(target.querySelector('.alert.error')).toBeNull();
});

test('a reader who cannot read me still sees the zones and the licences, and is told what setting zones needs', async () => {
	await mountOn({ parcels: [parcel(1, ['seafront'])], zones: [SEAFRONT], permissions: null });
	rowOf('L-1').click();
	await settle();
	expect(byTestId('parcel-zone')).toHaveLength(1);
	expect(byTestId('planning-reason')).toHaveLength(1);
});

const licenceCalls = () => asked.filter(([op]) => op === 'license_list').length;
const refresh = () => [...target.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Refresh')!;

test('the licences are read when a parcel is opened, once, and again when the registry is refreshed', async () => {
	await mountOn({ parcels: [parcel(1), parcel(2)], zones: [SEAFRONT], licences: [{ id: 'LIC-1', kind: 'building', holder: 'User:alice', status: 'active', expires_at: 0, land: 'L-2' }] });
	expect(licenceCalls()).toBe(0); // the registry is on the screen without them

	rowOf('L-1').click();
	await settle();
	expect(licenceCalls()).toBe(1);
	rowOf('L-2').click();
	await settle();
	expect(licenceCalls()).toBe(1); // the one read serves every parcel
	expect(byTestId('licence')).toHaveLength(1);

	refresh().click();
	await settle(200);
	expect(licenceCalls()).toBe(2);
	expect(byTestId('licence')).toHaveLength(1);
});

test('a parcel action does not read the licences again', async () => {
	await mountOn({ parcels: [parcel(1)], zones: [SEAFRONT], permissions: ['realm.configure'] });
	rowOf('L-1').click();
	await settle();
	expect(licenceCalls()).toBe(1);
	target.querySelector<HTMLInputElement>('.zone-option input')!.click();
	await settle();
	[...target.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Save zones')!.click();
	await settle();
	expect(asked.filter(([op]) => op === 'land_zone_set')).toHaveLength(1);
	expect(licenceCalls()).toBe(1);
});

test('a licence\'s expiry is in the realm\'s official time zone: the capital\'s, on a quarter', async () => {
	const licences = [{ id: 'LIC-1', kind: 'building', holder: 'User:alice', status: 'active', expires_at: 1_893_456_000, land: 'L-1' }];
	await mountOn({ parcels: [parcel(1)], licences, timezone: 'Europe/Madrid', official: 'Asia/Tokyo' });
	rowOf('L-1').click();
	await settle();
	expect(byTestId('licence')[0].textContent).toContain('until 2030-01-01 09:00 Asia/Tokyo (UTC+09:00)');
});

test('a zone the parcels lie in is a planning zone when the realm does not say, though its id is the shape of a cell', async () => {
	await mountOn({ parcels: [parcel(1, [HOME_CELL])], zones: [{ id: HOME_CELL, name: 'Heritage', kind: 'planning', population: 0 }, { id: '871f1d48bffffff', name: '', kind: 'residential', population: 1 }] });
	expect([...select('zone-filter').options].map((o) => o.textContent?.trim())).toEqual(['All zones', 'Heritage', 'In no zone']);
});

test('h3-js, when it has loaded, decides which ids are home cells', async () => {
	(window as any).h3 = { isValidCell: (id: string) => id === 'cell-0' };
	await mountOn({ parcels: [parcel(1)], zones: [{ id: 'cell-0', name: 'A cell', kind: 'residential', population: 1 }, { id: HOME_CELL, name: 'Not a cell to h3-js', kind: 'planning', population: 0 }] });
	expect([...select('zone-filter').options].map((o) => o.textContent?.trim())).toEqual(['All zones', 'Not a cell to h3-js', 'In no zone']);
});

test('zones beyond the pages the page reads are said to be left out', async () => {
	await mountOn({ parcels: [parcel(1)], zones: [SEAFRONT], endlessZones: true });
	await settle(200);
	expect(asked.filter(([op]) => op === 'land_map')).toHaveLength(50);
	expect(byTestId('zones-capped')[0].textContent).toBe('Only the first 25000 zones were read: the zone list may be missing some.');
});

test('a registry that reads all its zones says nothing of a cut', async () => {
	await mountOn({ parcels: [parcel(1)], zones: [SEAFRONT] });
	expect(byTestId('zones-capped')).toHaveLength(0);
});
