import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startRealm, type Scenario } from '../realm';

// A proposal's tags (GGG I-GOV-15): the realm's own words for grouping proposals, at most 16 of 1 to 64 characters. The page
// shows them as chips, asks the realm for the proposals that carry a tag (a list can hold thousands, so it never filters them
// itself) and takes tags in its form. The page is the built bundle on a canned realm that lists as realms-gos does: it reads a
// page of rows, then keeps the tagged ones (api/proposals.py proposal_list).
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

const JORDI = 'z32zf-ic72u-jhtqq-ojjqp-jblhx-dxxin-vqelt-ljmo4-ymwmh-gcnzo-hae';
const FUTURE = 4_102_444_800;

type Row = { id: string; title: string; tags?: string[] };
const BASE = { description: 'A trial until March', proposer: JORDI, status: 'voting', opens_at: 1_794_398_964, deadline: FUTURE, department: '' };

const JGL: Row[] = [
  { id: 'P-1', title: 'Bike lane on Main Street', tags: ['mobility', 'district-3'] },
  { id: 'P-2', title: 'Plant 40 trees on Avenida del Puerto', tags: ['parks', 'district-3'] },
  { id: 'P-3', title: 'Minutes of the October council', tags: ['minutes'] },
  { id: 'P-4', title: 'Close Carrer Major to traffic on Sundays', tags: ['mobility'] },
  { id: 'P-5', title: 'A proposal filed before tags existed' },
];

// What the canned realm answers, run in the page: `data` is the proposals it holds.
const proposalList = (args: any, data: any) => {
  const from = args.from || 1;
  const count = args.count || 100;
  const wanted: string[] = args.tags || [];
  const page = data.rows.slice(from - 1, from - 1 + count);
  const kept = page.filter((r: any) => !wanted.length || (r.tags || []).some((t: string) => wanted.includes(t)));
  return {
    ok: true,
    proposals: kept.map((r: any) => ({ id: r.id, title: r.title, status: 'voting', deadline: data.base.deadline, proposer: data.base.proposer, tags: r.tags })),
    next: from - 1 + count < data.rows.length ? from + count : null,
  };
};
const proposalGet = (args: any, data: any) => {
  const row = data.rows.find((r: any) => r.id === args.proposal);
  return {
    ok: true,
    proposal: { ...data.base, ...row },
    tally: { yes: 3, no: 1, abstain: 0, eligible: 12 },
    eligible: 12,
    votes: [],
    next: null,
  };
};

function realm(rows: Row[], extra: Record<string, unknown> = {}, locale = 'en'): Scenario {
  return {
    locale,
    data: { rows, base: BASE },
    replies: {
      proposal_list: proposalList,
      proposal_get: proposalGet,
      department_list: { ok: true, departments: [{ id: 'Realm', is_root: true }] },
      realm_info: { ok: true, realm: { timezone: 'Europe/Madrid' } },
      ...extra,
    },
  };
}

const asked = (page: Page): Promise<[string, any][]> => page.evaluate(() => (window as any).asked);
const listCalls = async (page: Page) => (await asked(page)).filter(([op]) => op === 'proposal_list').map(([, args]) => args);
const cards = (page: Page) => page.locator('[data-proposal-id]');

async function openList(page: Page) {
  await page.goto(`${url}/extensions/voting`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function addToFilter(page: Page, tag: string) {
  const input = page.getByTestId('tag-filter').getByTestId('tag-input');
  await input.fill(tag);
  await input.press('Enter');
}

test('the list shows the tags of each proposal, and an old proposal without tags shows none', async ({ page }) => {
  scenario = realm(JGL);
  await openList(page);
  await expect(cards(page)).toHaveCount(5);
  await expect(page.locator('[data-proposal-id="P-1"]').getByTestId('card-tag')).toHaveText(['mobility', 'district-3']);
  await expect(page.locator('[data-proposal-id="P-3"]').getByTestId('card-tag')).toHaveText(['minutes']);
  await expect(page.locator('[data-proposal-id="P-5"]').getByTestId('card-tag')).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'voting-tags-list.png'), fullPage: true });
});

test('a tag in the filter asks the realm for it, and the list keeps the proposals that carry it', async ({ page }) => {
  scenario = realm(JGL);
  await openList(page);
  await addToFilter(page, 'mobility');
  await expect(cards(page)).toHaveCount(2);
  await expect(page.locator('[data-proposal-id="P-1"]')).toBeVisible();
  await expect(page.locator('[data-proposal-id="P-4"]')).toBeVisible();
  expect((await listCalls(page)).at(-1)).toMatchObject({ tags: ['mobility'] });

  await addToFilter(page, 'parks'); // another tag adds the proposals that carry it: any of the tags
  await expect(cards(page)).toHaveCount(3);
  expect((await listCalls(page)).at(-1)).toMatchObject({ tags: ['mobility', 'parks'] });
  await page.screenshot({ path: join(OUT, 'voting-tags-filter.png'), fullPage: true });

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(cards(page)).toHaveCount(5);
  expect((await listCalls(page)).at(-1)).not.toHaveProperty('tags');
});

test('the filter offers the tags the list carries, and a chip leads to its proposals', async ({ page }) => {
  scenario = realm(JGL);
  await openList(page);
  await expect(page.locator('#' + (await page.getByTestId('tag-filter').getByTestId('tag-input').getAttribute('list')))).toBeAttached();
  const offered = await page.locator('datalist option').evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
  expect(offered).toEqual(['district-3', 'minutes', 'mobility', 'parks']);

  await page.locator('[data-proposal-id="P-2"]').getByTestId('card-tag').first().click();
  await expect(cards(page)).toHaveCount(1);
  expect((await listCalls(page)).at(-1)).toMatchObject({ tags: ['parks'] });
});

test('the proposal page shows its tags, and one leads back to the list of its proposals', async ({ page }) => {
  scenario = realm(JGL);
  await page.goto(`${url}/extensions/voting/proposals/1`);
  await expect(page.getByTestId('proposal-tags')).toBeVisible();
  await expect(page.getByTestId('detail-tag')).toHaveText(['mobility', 'district-3']);
  await page.screenshot({ path: join(OUT, 'voting-tags-detail.png'), fullPage: true });

  await page.getByTestId('detail-tag').nth(1).click();
  await expect(cards(page)).toHaveCount(2); // district-3: P-1 and P-2
  expect((await listCalls(page)).at(-1)).toMatchObject({ tags: ['district-3'] });
});

test('the proposal page of an untagged proposal shows no tags', async ({ page }) => {
  scenario = realm(JGL);
  await page.goto(`${url}/extensions/voting/proposals/5`);
  await expect(page.getByRole('heading', { name: 'A proposal filed before tags existed' })).toBeVisible();
  await expect(page.getByTestId('proposal-tags')).toHaveCount(0);
});

test('the form states the limits, takes tags as they are typed and files them with the proposal', async ({ page }) => {
  scenario = realm(JGL, { proposal_create: { ok: true, proposal: 'P-6' } });
  await openList(page);
  await page.locator('.chrome-btn').nth(1).click();
  await expect(page.getByTestId('tag-picker')).toBeVisible();
  await expect(page.getByTestId('tags-hint')).toContainText('At most 16 tags of 1 to 64 characters each');
  await expect(page.getByTestId('tags-hint')).toContainText('“Parks” and “parks” are two different tags');

  await page.locator('#rt-title').fill('Plant trees on Avenida del Puerto');
  await page.locator('#rt-desc').fill('Forty trees, in the autumn');
  const input = page.getByTestId('tag-picker').getByTestId('tag-input');
  await input.fill('  parks ');
  await input.press('Enter');
  await input.fill('district-3');
  await page.getByTestId('tag-add').click();
  await input.fill('parks');
  await input.press('Enter');
  await expect(page.getByTestId('tag-problem')).toHaveText('“parks” is already there.');
  await input.fill('x'.repeat(65));
  await input.press('Enter');
  await expect(page.getByTestId('tag-problem')).toHaveText('A tag has at most 64 characters.');
  await expect(page.getByTestId('tags-count')).toHaveText('2 of 16 tags');
  await page.screenshot({ path: join(OUT, 'voting-tags-form.png'), fullPage: true });

  await page.getByRole('button', { name: 'Submit Proposal' }).click();
  await expect(page.getByText('Proposal P-6 submitted')).toBeVisible();
  const created = (await asked(page)).filter(([op]) => op === 'proposal_create').map(([, args]) => args);
  expect(created).toHaveLength(1);
  expect(created[0]).toMatchObject({ title: 'Plant trees on Avenida del Puerto', tags: ['parks', 'district-3'] });
});

test('the form stops at 16 tags', async ({ page }) => {
  scenario = realm(JGL);
  await openList(page);
  await page.locator('.chrome-btn').nth(1).click();
  const input = page.getByTestId('tag-picker').getByTestId('tag-input');
  for (let i = 1; i <= 16; i++) {
    await input.fill(`area ${i}`);
    await input.press('Enter');
  }
  await expect(page.getByTestId('tags-count')).toHaveText('16 of 16 tags');
  await expect(input).toBeDisabled();
  await expect(page.getByTestId('tag-add')).toBeDisabled();
  await page.screenshot({ path: join(OUT, 'voting-tags-form-full.png'), fullPage: true });
});

test('a member who may not file proposals sees the reason the realm gives, and the tags stay in the form', async ({ page }) => {
  scenario = realm(JGL); // proposal_create is not open to this member
  await openList(page);
  await page.locator('.chrome-btn').nth(1).click();
  await page.locator('#rt-title').fill('Plant trees');
  await page.locator('#rt-desc').fill('In the park');
  const input = page.getByTestId('tag-picker').getByTestId('tag-input');
  await input.fill('parks');
  await input.press('Enter');
  await page.getByRole('button', { name: 'Submit Proposal' }).click();
  await expect(page.getByText('proposal_create is not open to you')).toBeVisible();
  await expect(page.getByTestId('tag-chip')).toHaveCount(1);
});

test('a rare tag is searched for a page of rows at a time, then the page says how far it got and offers to go on', async ({ page }) => {
  // 5,100 proposals, only the last one tagged: ten calls of 500 rows end the first search
  const rows: Row[] = Array.from({ length: 5_100 }, (_, i) => ({ id: `P-${i + 1}`, title: `Proposal ${i + 1}`, tags: i === 5_099 ? ['rare'] : [] }));
  scenario = realm(rows);
  await openList(page);
  await addToFilter(page, 'rare');
  await expect(page.getByTestId('tags-searched')).toHaveText('None of the 5000 proposals searched carries these tags.');
  const searches = (await listCalls(page)).filter((args) => args.tags);
  expect(searches).toHaveLength(10);
  expect(searches.every((args) => args.count === 500)).toBe(true);
  await page.screenshot({ path: join(OUT, 'voting-tags-searching.png'), fullPage: true });

  await page.getByTestId('tags-search-further').click();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.locator('[data-proposal-id="P-5100"]')).toBeVisible();
});

test('a tag no proposal carries says so, with nothing to search further', async ({ page }) => {
  scenario = realm(JGL);
  await openList(page);
  await addToFilter(page, 'nothing');
  await expect(page.getByText('No proposals match the current filters')).toBeVisible();
  await expect(page.getByTestId('tags-search-further')).toHaveCount(0);
});

test('a realm with no proposals lists none, and the filter and the form still work', async ({ page }) => {
  scenario = realm([]);
  await openList(page);
  await expect(page.getByText('No proposals yet')).toBeVisible();
  await expect(page.getByTestId('card-tag')).toHaveCount(0);
  await addToFilter(page, 'parks');
  await expect(page.getByText('No proposals match the current filters')).toBeVisible();
});

for (const locale of ['es', 'de', 'fr', 'it', 'zh-CN', 'ca-valencia']) {
  test(`the tags read in ${locale}, with nothing left to fill in`, async ({ page }) => {
    scenario = realm(JGL, {}, locale);
    await openList(page);
    const filter = page.getByTestId('tag-filter').getByTestId('tag-input');
    const placeholder = (await filter.getAttribute('placeholder')) ?? '';
    const hint = (await filter.getAttribute('title')) ?? '';
    await page.locator('[data-proposal-id="P-1"]').getByTestId('card-tag').first().hover();
    const chipTitle = (await page.locator('[data-proposal-id="P-1"]').getByTestId('card-tag').first().getAttribute('title')) ?? '';

    await page.locator('.chrome-btn').nth(1).click();
    const picker = page.getByTestId('tag-picker');
    const input = picker.getByTestId('tag-input');
    await input.fill('parks');
    await input.press('Enter');
    await input.fill('parks');
    await input.press('Enter');
    const shown = [
      placeholder,
      hint,
      chipTitle,
      (await page.getByTestId('tags-hint').textContent()) ?? '',
      (await page.getByTestId('tags-count').textContent()) ?? '',
      (await page.getByTestId('tag-problem').textContent()) ?? '',
      (await input.getAttribute('placeholder')) ?? '',
      (await page.getByTestId('tag-chip').getByRole('button').getAttribute('title')) ?? '',
    ];
    for (const text of shown) {
      expect(text, `${locale}: ${text}`).not.toMatch(/[{}]/);
      expect(text.length, locale).toBeGreaterThan(2);
    }
    expect(shown[3], locale).toContain('16');
    expect(shown[3], locale).toContain('64');
    // not English: the placeholders of the filter and the form differ from English's
    expect(placeholder, locale).not.toBe('Filter by tag…');
    expect(shown[3], locale).not.toContain('Words of your own choosing');
    await page.screenshot({ path: join(OUT, `voting-tags-form-${locale}.png`), fullPage: true });
  });
}
