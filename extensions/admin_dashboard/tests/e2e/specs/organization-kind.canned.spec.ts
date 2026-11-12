import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startRealm, type Scenario } from '../realm';

// What an organization is (GGG I-ORG-9): a kind chip on each organisation of the data explorer, and a filter by kind that asks the
// realm (`organization_list` takes a `kind`). The page is the built bundle on a canned realm that lists as realms-gos does: a page
// of rows, the matching ones kept, and `next`.
const OUT = join(__dirname, '..', 'test-results');
test.use({ viewport: { width: 1280, height: 900 } });

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

type Org = { id: string; description: string; status: string; kind?: string };
const TOWN: Org[] = [
  { id: 'Clinic B', description: 'A private clinic', status: 'active', kind: 'company' },
  { id: 'Harbour Party', description: 'The party of the harbour', status: 'active', kind: 'party' },
  { id: 'Dockers', description: 'The dockers union', status: 'active', kind: 'union' },
  { id: 'Friends of the Park', description: 'A neighbours association', status: 'active', kind: 'association' },
  { id: 'Cooperativa del Mar', description: 'A fishing cooperative', status: 'active', kind: 'other' },
  { id: 'Old Registry', description: 'Registered before kinds existed', status: 'suspended' },
];

// What the canned realm answers, run in the page: `data.orgs` are the organisations it holds.
const organizationList = (args: any, data: any) => {
  const from = args.from || 1;
  const count = Math.min(args.count || 100, 500);
  const rows = data.orgs.slice(from - 1, from - 1 + count);
  return {
    ok: true,
    organizations: rows.filter((o: any) => !args.kind || o.kind === args.kind),
    next: from - 1 + count < data.orgs.length ? from + count : null,
  };
};

function realm(orgs: Org[], extra: Record<string, unknown> = {}, locale = 'en'): Scenario {
  return {
    locale,
    data: { orgs },
    replies: { organization_list: organizationList, user_list: { ok: true, users: [], next: null }, ...extra },
  };
}

const asked = (page: Page): Promise<[string, any][]> => page.evaluate(() => (window as any).asked);
const organizationCalls = async (page: Page) => (await asked(page)).filter(([op]) => op === 'organization_list').map(([, args]) => args);

async function openOrganisations(page: Page) {
  await page.goto(`${url}/extensions/admin_dashboard`);
  await page.locator('#entity-type-select').selectOption('Organization');
}

test('every organisation shows its kind, and one registered without a kind reads as unknown', async ({ page }) => {
  scenario = realm(TOWN);
  await openOrganisations(page);
  await expect(page.getByTestId('org-kind')).toHaveText(['Company', 'Party', 'Union', 'Association', 'Other', 'Unknown']);
  await expect(page.getByTestId('org-kind').last()).toHaveAttribute('title', 'The realm states no kind for this organisation.');
  await page.screenshot({ path: join(OUT, 'admin-org-kind-list.png'), fullPage: true });
});

test('the kind filter asks the realm for the kind and lists the organisations of that kind', async ({ page }) => {
  scenario = realm(TOWN);
  await openOrganisations(page);
  await expect(page.locator('#org-kind-select option')).toHaveText(['All kinds', 'Company', 'Party', 'Union', 'Association', 'Other']);

  await page.locator('#org-kind-select').selectOption('party');
  await expect(page.getByTestId('org-kind')).toHaveText(['Party']);
  await expect(page.getByText('Harbour Party')).toBeVisible();
  await expect(page.getByText('Clinic B')).toHaveCount(0);
  expect((await organizationCalls(page)).at(-1)).toMatchObject({ kind: 'party' });
  await page.screenshot({ path: join(OUT, 'admin-org-kind-filter.png'), fullPage: true });

  await page.locator('#org-kind-select').selectOption('');
  await expect(page.getByTestId('org-kind')).toHaveCount(6);
  expect((await organizationCalls(page)).at(-1)).not.toHaveProperty('kind');
});

test('the kind filter belongs to the organisations: other record types show neither it nor kinds', async ({ page }) => {
  scenario = realm(TOWN);
  await page.goto(`${url}/extensions/admin_dashboard`);
  await expect(page.locator('#org-kind-select')).toHaveCount(0);
  await page.locator('#entity-type-select').selectOption('Organization');
  await expect(page.locator('#org-kind-select')).toBeVisible();
  await page.locator('#entity-type-select').selectOption('User');
  await expect(page.locator('#org-kind-select')).toHaveCount(0);
  await expect(page.getByTestId('org-kind')).toHaveCount(0);
});

test('the next page of a filtered list keeps the kind, and a rare kind far down the list is found', async ({ page }) => {
  const many: Org[] = Array.from({ length: 1_200 }, (_, i) => ({ id: `Org ${i + 1}`, description: 'x', status: 'active', kind: i === 1_149 ? 'party' : i % 2 ? 'union' : 'company' }));
  scenario = realm(many);
  await openOrganisations(page);
  await page.locator('#org-kind-select').selectOption('union');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Page 2')).toBeVisible();
  expect((await organizationCalls(page)).at(-1)).toMatchObject({ kind: 'union', from: 501, count: 500 });

  await page.locator('#org-kind-select').selectOption('party'); // the only one, at row 1,150: three calls of 500 rows
  await expect(page.getByTestId('org-kind')).toHaveText(['Party']);
  await expect(page.getByText('Org 1150')).toBeVisible();
});

test('a kind no organisation has says so', async ({ page }) => {
  scenario = realm(TOWN.filter((o) => o.kind !== 'union'));
  await openOrganisations(page);
  await page.locator('#org-kind-select').selectOption('union');
  await expect(page.getByText('No organisations of this kind.')).toBeVisible();
});

test('a realm with no organisations lists none, without an error', async ({ page }) => {
  scenario = realm([]);
  await openOrganisations(page);
  await expect(page.getByText('No items found.')).toBeVisible();
  await expect(page.getByTestId('org-kind')).toHaveCount(0);
});

test('a reader the realm refuses is told which permission is missing', async ({ page }) => {
  scenario = realm(TOWN, { organization_list: { ok: false, error: 'organization_list needs realm.data_view' } });
  await openOrganisations(page);
  await expect(page.getByText('Additional permissions needed')).toBeVisible();
  await expect(page.getByText('realm.data_view')).toBeVisible();
  await expect(page.getByTestId('org-kind')).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'admin-org-kind-refused.png'), fullPage: true });
});

for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
  test(`the kinds read in ${locale}, with nothing left to fill in`, async ({ page }) => {
    scenario = realm(TOWN, {}, locale);
    await openOrganisations(page);
    await expect(page.getByTestId('org-kind')).toHaveCount(6);
    const chips = await page.getByTestId('org-kind').allTextContents();
    expect(new Set(chips).size, `${locale}: ${chips}`).toBe(6);
    for (const chip of chips) {
      expect(chip, locale).not.toMatch(/[{}]|org_kind_/);
    }
    const english = ['Company', 'Party', 'Union', 'Association', 'Other', 'Unknown'];
    // some words are the same in two languages ("Association" in French): the page is not in English when most differ
    expect(chips.filter((chip, i) => chip !== english[i]).length, `${locale}: ${chips}`).toBeGreaterThanOrEqual(4);
    const options = await page.locator('#org-kind-select option').allTextContents();
    expect(options[0], locale).not.toBe('All kinds');
    await page.screenshot({ path: join(OUT, `admin-org-kind-list-${locale}.png`), fullPage: true });
  });
}
