import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startRealm, type Scenario } from '../realm';

// Planning on the land registry (GGG domain `planning`): the zones a parcel lies in, a filter by zone, setting the zones with
// `land_zone_set`, and the licences that name the parcel. The page is the built bundle on a canned realm that answers as realms-gos
// does; its map is not loaded (no network), only the sidebar the planning is shown in.
const OUT = join(__dirname, '..', 'test-results');
test.use({ viewport: { width: 1280, height: 1000 } });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
  mkdirSync(OUT, { recursive: true });
});
test.afterAll(() => close());

const HOME_CELL = '871f1d489ffffff';
const SEAFRONT = { id: 'seafront', name: 'Seafront', kind: 'planning', population: 0, defined: true };
const OLD_TOWN = { id: 'old-town', name: 'Old town', kind: 'heritage', population: 0, defined: true };
const ZONES = [SEAFRONT, OLD_TOWN, { id: HOME_CELL, name: '', kind: 'residential', population: 1, defined: false }];

const parcel = (n: number, kind: string, lies_in: string[] = [], owner = 'User:alice') => ({
  id: `L-${n}`,
  x: n * 3,
  y: 0,
  width: 3,
  height: 2,
  kind,
  owner,
  status: 'active',
  token_id: '',
  lies_in,
});
const TOWN = [
  parcel(1, 'residential', ['seafront']),
  parcel(2, 'commercial', ['seafront', 'old-town'], 'Organization:Clinic B'),
  parcel(3, 'agricultural'),
  parcel(4, 'residential', ['old-town']),
];
const LICENCES = [
  { id: 'LIC-1', kind: 'building', holder: 'Organization:Clinic B', status: 'active', expires_at: 1_893_456_000, land: 'L-2' },
  { id: 'LIC-2', kind: 'demolition', holder: 'User:alice', status: 'applied', expires_at: 0, land: 'L-2' },
  { id: 'LIC-3', kind: 'health', holder: 'User:alice', status: 'active', expires_at: 0, land: '' },
];

// What the canned realm answers, run in the page: `data` is what the realm holds, and a zone change is kept in it.
const landList = (_args: any, data: any) => ({ ok: true, lands: data.parcels, next: null });
const landZoneSet = (args: any, data: any) => {
  data.parcels.find((p: any) => p.id === args.land).lies_in = args.zones;
  return { ok: true, land: args.land };
};

function realm(opts: { parcels?: unknown[]; zones?: unknown[]; licences?: unknown[]; permissions?: string[]; replies?: Record<string, unknown>; locale?: string } = {}): Scenario {
  const { parcels = TOWN, zones = ZONES, licences = LICENCES, permissions = ['realm.data_view'], replies = {}, locale = 'en' } = opts;
  return {
    locale,
    data: { parcels },
    replies: {
      land_list: landList,
      land_map: { ok: true, parcels: [], zones, next: null },
      user_list: { ok: true, users: [{ id: 'alice', nickname: 'Alice' }] },
      license_list: { ok: true, licenses: licences, next: null },
      me: { ok: true, permissions },
      realm_info: { ok: true, realm: { timezone: 'Europe/Madrid' } },
      land_zone_set: landZoneSet,
      ...replies,
    },
  };
}

const asked = (page: Page): Promise<[string, any][]> => page.evaluate(() => (window as any).asked);
const rows = (page: Page) => page.locator('.parcel-row');
const rowOf = (page: Page, id: string) => page.locator('.parcel-row', { hasText: id });

/** The checkbox of a zone in the form that sets a parcel's zones (the filter's select has the zones' names too, so not by label). */
const zoneBox = (page: Page, name: string) => page.locator('.zone-option', { hasText: name }).locator('input');

async function open(page: Page) {
  // the map needs the network: without it the page shows its sidebar and says the map is not available
  await page.route(/unpkg\.com|openfreemap\.org/, (route) => route.abort());
  await page.goto(`${url}/extensions/land_registry`);
  await expect(page.getByRole('heading', { name: 'Land Registry' })).toBeVisible();
}

test('each parcel names its planning zones, and the filter keeps the parcels that lie in a zone', async ({ page }) => {
  scenario = realm();
  await open(page);
  await expect(page.getByTestId('parcel-zones')).toHaveText(['Seafront', 'Seafront, Old town', 'Old town']);
  await expect(page.getByTestId('zone-filter').locator('option')).toHaveText(['All zones', 'Old town', 'Seafront', 'In no zone']);
  await page.screenshot({ path: join(OUT, 'land-planning-list.png'), fullPage: true });

  await page.getByTestId('zone-filter').selectOption('old-town');
  await expect(rows(page)).toHaveCount(2);
  await expect(rowOf(page, 'L-2')).toBeVisible();
  await expect(rowOf(page, 'L-4')).toBeVisible();
  await expect(page.getByTestId('zone-filter-count')).toHaveText('2 of 4 parcels');
  await page.screenshot({ path: join(OUT, 'land-planning-filter.png'), fullPage: true });

  await page.getByTestId('zone-filter').selectOption({ label: 'In no zone' });
  await expect(rows(page)).toHaveCount(1);
  await expect(rowOf(page, 'L-3')).toBeVisible();

  await page.getByTestId('zone-filter').selectOption('');
  await expect(rows(page)).toHaveCount(4);
});

test('a parcel shows its zones and the licences that name it, and says so when none does', async ({ page }) => {
  scenario = realm();
  await open(page);
  await rowOf(page, 'L-2').click();
  await expect(page.getByTestId('parcel-zone')).toHaveText(['Seafront', 'Old town']);
  await expect(page.getByTestId('licence')).toHaveText([
    /building · Active · Org Clinic B · until 2030-01-01 01:00 Europe\/Madrid \(UTC\+01:00\)/,
    /demolition · Applied · Alice/,
  ]);
  await expect(page.getByRole('heading', { name: 'Licences for this parcel' })).toBeVisible();
  await page.screenshot({ path: join(OUT, 'land-planning-parcel.png'), fullPage: true });

  await rowOf(page, 'L-3').click();
  await expect(page.getByText('This parcel lies in no planning zone.')).toBeVisible();
  await expect(page.getByText('No licence names this parcel.')).toBeVisible();
});

test('a reader without the permission sees the reason and no way to set zones', async ({ page }) => {
  scenario = realm({ permissions: ['realm.data_view'] });
  await open(page);
  await rowOf(page, 'L-1').click();
  await expect(page.getByTestId('planning-reason')).toHaveText('Setting zones needs the realm.configure permission.');
  await expect(page.getByRole('button', { name: 'Save zones' })).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'land-planning-reader.png'), fullPage: true });
});

test('a member who may set zones chooses them, saves them, and the list shows them', async ({ page }) => {
  scenario = realm({ permissions: ['realm.configure'] });
  await open(page);
  await rowOf(page, 'L-3').click();
  await expect(page.getByText('Choose the zones this parcel lies in: at most 8, each one the realm defines.')).toBeVisible();
  const save = page.getByRole('button', { name: 'Save zones' });
  await expect(save).toBeDisabled();

  await zoneBox(page, 'Old town').check();
  await zoneBox(page, 'Seafront').check();
  await page.screenshot({ path: join(OUT, 'land-planning-set-zones.png'), fullPage: true });
  await save.click();
  await expect(page.getByText('The zones of parcel L-3 are saved.')).toBeVisible();
  const set = (await asked(page)).filter(([op]) => op === 'land_zone_set');
  expect(set).toHaveLength(1);
  expect(set[0][1]).toEqual({ land: 'L-3', zones: ['old-town', 'seafront'] });
  await expect(rowOf(page, 'L-3').getByTestId('parcel-zones')).toHaveText('Old town, Seafront');
  await expect(page.getByTestId('parcel-zone')).toHaveText(['Old town', 'Seafront']);
});

test('a zone change the realm puts to a vote says so', async ({ page }) => {
  scenario = realm({ permissions: ['realm.configure'], replies: { land_zone_set: { ok: true, proposal: 'P-12' } } });
  await open(page);
  await rowOf(page, 'L-3').click();
  await zoneBox(page, 'Seafront').check();
  await page.getByRole('button', { name: 'Save zones' }).click();
  await expect(page.getByText('Submitted for a vote as proposal P-12.')).toBeVisible();
});

test('a refusal of the realm is shown', async ({ page }) => {
  scenario = realm({ permissions: ['realm.configure'], replies: { land_zone_set: { ok: false, error: 'seafront is not a zone of the realm' } } });
  await open(page);
  await rowOf(page, 'L-3').click();
  await zoneBox(page, 'Seafront').check();
  await page.getByRole('button', { name: 'Save zones' }).click();
  await expect(page.getByText('seafront is not a zone of the realm')).toBeVisible();
});

test('a parcel lies in at most 8 zones: the ninth is out of reach', async ({ page }) => {
  const zones = Array.from({ length: 9 }, (_, i) => ({ id: `z${i + 1}`, name: `Zone ${i + 1}`, kind: 'planning', population: 0 }));
  scenario = realm({ zones, parcels: [parcel(1, 'residential', zones.slice(0, 8).map((z) => z.id))], permissions: ['realm.configure'] });
  await open(page);
  await rowOf(page, 'L-1').click();
  await expect(zoneBox(page, 'Zone 9')).toBeDisabled();
  await expect(page.getByText('A parcel lies in at most 8 zones.')).toBeVisible();
});

test('licences the realm will not list are said to be unavailable, and the parcels still show', async ({ page }) => {
  scenario = realm({ replies: { license_list: { ok: false, error: 'license_list needs realm.data_view' } } });
  await open(page);
  await rowOf(page, 'L-2').click();
  await expect(page.getByTestId('licences-problem')).toHaveText('Licences are not available right now: license_list needs realm.data_view');
  await expect(page.getByTestId('parcel-zone')).toHaveCount(2);
});

test('a realm with no planning zones, licences or parcels shows the registry without an error', async ({ page }) => {
  scenario = realm({ parcels: [parcel(1, 'residential')], zones: [{ id: HOME_CELL, name: '', kind: 'residential', population: 1 }], licences: [] });
  await open(page);
  await expect(page.getByTestId('zone-filter')).toHaveCount(0);
  await rowOf(page, 'L-1').click();
  await expect(page.getByText('The realm has defined no planning zones yet.')).toBeVisible();
  await expect(page.getByText('No licence names this parcel.')).toBeVisible();
  await expect(page.locator('.alert.error')).toHaveCount(0);

  scenario = realm({ parcels: [], zones: [], licences: [] });
  await page.reload();
  await expect(page.getByText('No parcels yet.')).toBeVisible();
});

for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
  test(`the planning reads in ${locale}, with nothing left to fill in`, async ({ page }) => {
    scenario = realm({ permissions: ['realm.configure'], locale });
    await open(page);
    await rowOf(page, 'L-2').click();
    const shown = [
      await page.getByTestId('zone-filter').evaluate((select) => (select.closest('label') as HTMLElement).textContent ?? ''),
      await page.getByTestId('planning-panel').locator('h4').textContent(),
      await page.getByTestId('planning-panel').locator('.muted.note').first().textContent(),
      await page.getByTestId('licences-panel').locator('h4').textContent(),
      ...(await page.getByTestId('licence').allTextContents()),
    ].map((text) => text ?? '');
    await page.getByTestId('zone-filter').selectOption('seafront');
    shown.push((await page.getByTestId('zone-filter-count').textContent()) ?? '');
    for (const text of shown) {
      expect(text, `${locale}: ${text}`).not.toMatch(/[{}]/);
      expect(text.trim().length, locale).toBeGreaterThan(1);
    }
    expect(shown[1], locale).not.toBe('Planning zones');
    expect(shown[3], locale).not.toBe('Licences for this parcel');
    expect(shown.at(-1), locale).not.toContain(' of ');
    await page.screenshot({ path: join(OUT, `land-planning-parcel-${locale}.png`), fullPage: true });
  });
}
