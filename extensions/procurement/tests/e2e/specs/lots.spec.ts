import { expect, test, type Page } from '@playwright/test';
import {
  DEPARTMENTS,
  EXTERNALS,
  INFO,
  LIST,
  ME,
  ORGANIZATIONS,
  PLAIN_TENDER,
  contract,
  detail,
  startRealm,
  tender,
  TENDERS,
  type Scenario,
} from '../realm';

test.use({ viewport: { width: 1280, height: 1500 }, locale: 'en-US', timezoneId: 'America/New_York' });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
});
test.afterAll(() => close());

const MANAGER = ['tender.manage', 'bid.submit', 'bid.evaluate'];
const READER: string[] = [];

/** A realm with one tender, `shown`, listed and readable. */
function realm(permissions: string[] | null, shown: Record<string, unknown>, replies: Record<string, unknown> = {}): Scenario {
  return {
    locale: 'en',
    replies: {
      ...(permissions ? { me: ME(permissions) } : {}),
      department_list: DEPARTMENTS,
      organization_list: ORGANIZATIONS,
      realm_info: INFO(),
      external_list: EXTERNALS,
      tender_list: TENDERS([shown]),
      tender_get: { ok: true, tender: shown },
      events: { ok: true, events: [] },
      contract_list: LIST([]),
      contract_get: detail(contract({ id: 'C-10', lot: '1', title: 'Bike lane works: Road works' })),
      ...replies,
    },
  };
}

const asked = (page: Page, name: string) =>
  page.evaluate((wanted) => (window as any).asked.filter(([op]: [string]) => op === wanted).map(([, args]: [string, unknown]) => args), name);

function consoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  return errors;
}

async function openTender(page: Page) {
  await page.goto(`${url}/extensions/procurement`);
  await page.getByRole('table').getByRole('button', { name: 'Open', exact: true }).first().click();
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
}

test('a tender with lots shows each lot: name, budget, bids, winner, status and contract', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = realm(READER, tender());
  await openTender(page);

  const lots = page.getByTestId('lots');
  await expect(lots).toContainText('Lots (2)');
  const rows = lots.getByTestId('lot-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('Road works');
  await expect(rows.nth(0)).toContainText('50,000 REALM');
  await expect(rows.nth(0).getByRole('cell').nth(3)).toHaveText('2'); // two bids for lot 1
  await expect(rows.nth(0)).toContainText('buildco'); // the winner
  await expect(rows.nth(0)).toContainText('Awarded');
  await expect(rows.nth(0)).toContainText('C-10');
  await expect(rows.nth(1)).toContainText('Bike racks');
  await expect(rows.nth(1).getByRole('cell').nth(3)).toHaveText('1');
  await expect(rows.nth(1).getByRole('cell').nth(4)).toHaveText('—'); // no winner yet
  await expect(rows.nth(1)).toContainText('Open');
  expect(errors).toEqual([]);
});

test('the contract of a lot opens the contract page, which names the lot', async ({ page }) => {
  scenario = realm(READER, tender());
  await openTender(page);
  await page.getByTestId('lot-row').first().getByRole('button', { name: 'C-10' }).click();
  await expect(page.getByTestId('contract-page')).toBeVisible();
  await expect(page.getByTestId('contract-lot')).toContainText('Lot 1');
  expect(await asked(page, 'contract_get')).toEqual([{ contract: 'C-10' }]);
});

test('the table of lots does not show counts or winners, nor the bids, before the bids are read', async ({ page }) => {
  scenario = realm(MANAGER, tender(), { tender_get: { delay: 1500, reply: { ok: true, tender: tender() } } });
  await openTender(page);
  const row = page.getByTestId('lot-row').first();
  await expect(row.getByRole('cell').nth(3)).toHaveText('…');
  await expect(row.getByRole('cell').nth(4)).toHaveText('…');
  await expect(page.getByRole('heading', { name: 'Bids (…)' })).toBeVisible();
  await expect(page.getByTestId('lot-award')).toHaveCount(0); // nothing to choose among yet
  await expect(page.getByRole('heading', { name: 'Bids (3)' })).toBeVisible();
  await expect(row.getByRole('cell').nth(3)).toHaveText('2');
  await expect(row.getByRole('cell').nth(4)).toHaveText('buildco');
  await expect(page.getByTestId('lot-award')).toHaveCount(1);
});

test('a request the realm will not give shows no bids, and no lot can be decided on it', async ({ page }) => {
  scenario = realm(MANAGER, tender(), { tender_get: { ok: false, error: 'unknown Tender \'T-5\'', kind: 'not_found' } });
  await openTender(page);
  await expect(page.getByText('This request could not be opened.')).toBeVisible();
  const row = page.getByTestId('lot-row').first();
  await expect(row.getByRole('cell').nth(3)).toHaveText('…');
  await expect(row.getByRole('cell').nth(4)).toHaveText('…');
  await expect(page.getByRole('heading', { name: 'Bids (…)' })).toBeVisible();
  await expect(page.getByTestId('lot-award')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Leave this lot unawarded' })).toHaveCount(0);
});

test('the late reply of a request that was left does not replace the one now open', async ({ page }) => {
  const second = tender('evaluation', { id: 'T-7', title: 'Street lights', lots: [], bids: [] });
  scenario = realm(MANAGER, tender(), {
    tender_list: TENDERS([tender(), second]),
    tender_get: {
      byArgs: [
        { when: { tender: 'T-5' }, reply: { delay: 2500, reply: { ok: true, tender: tender() } } },
        { when: { tender: 'T-7' }, reply: { ok: true, tender: second } },
      ],
    },
  });
  await page.goto(`${url}/extensions/procurement`);
  await page.getByRole('row').filter({ hasText: 'T-5' }).getByRole('button', { name: 'Open', exact: true }).click();
  await page.getByRole('button', { name: 'All requests' }).click();
  await page.getByRole('row').filter({ hasText: 'T-7' }).getByRole('button', { name: 'Open', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Street lights' })).toBeVisible();
  // T-5's reply lands about two seconds from now: the page stays on T-7.
  await page.waitForTimeout(3500);
  await expect(page.getByRole('heading', { name: 'Street lights' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bike lane works' })).toHaveCount(0);
  await expect(page.getByTestId('lots')).toHaveCount(0);
});

test('a visitor whose permissions are not known is offered no award', async ({ page }) => {
  scenario = realm(null, tender());
  await openTender(page);
  await expect(page.getByRole('heading', { name: 'Bids (3)' })).toBeVisible();
  await expect(page.getByTestId('lot-row')).toHaveCount(2);
  await expect(page.getByTestId('lot-award')).toHaveCount(0);
});

test('a reader without the permission to manage sees the lots and no way to award them', async ({ page }) => {
  scenario = realm(READER, tender());
  await openTender(page);
  await expect(page.getByTestId('lots')).toBeVisible();
  await expect(page.getByTestId('lot-award')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Award this lot' })).toHaveCount(0);
});

test('each open lot is awarded on its own: the chosen bid, the justification and the lot go to the realm', async ({ page }) => {
  scenario = realm(MANAGER, tender(), {
    tender_award: { ok: true, winner: 'B-3', score: 80, contract: 'C-11', justification: '' },
  });
  await openTender(page);

  const award = page.getByTestId('lot-award');
  await expect(award).toHaveCount(1); // lot 1 is awarded already
  await expect(award).toContainText('Lot 2: Bike racks');
  // The tender as a whole has no award button: its lots are awarded one by one.
  await expect(page.getByRole('button', { name: 'Award', exact: true })).toHaveCount(0);

  await award.getByRole('radio').check();
  await award.getByRole('button', { name: 'Award this lot' }).click();
  await expect(page.getByText('Lot 2 awarded to B-3 — contract C-11 signed')).toBeVisible();
  expect(await asked(page, 'tender_award')).toEqual([{ tender: 'T-5', lot: '2', bid: 'B-3' }]);
});

test('a lot may be left without an award, with the reason', async ({ page }) => {
  scenario = realm(MANAGER, tender(), { tender_lot_void: { ok: true } });
  await openTender(page);
  const award = page.getByTestId('lot-award');
  await award.getByLabel('Reason for leaving the lot unawarded (optional)').fill('the only bid was above the budget');
  await award.getByRole('button', { name: 'Leave this lot unawarded' }).click();
  await expect(page.getByText('Lot 2 left without an award')).toBeVisible();
  expect(await asked(page, 'tender_lot_void')).toEqual([{ tender: 'T-5', lot: '2', reason: 'the only bid was above the budget' }]);
});

test('the realm\'s refusal of an award is shown', async ({ page }) => {
  scenario = realm(MANAGER, tender(), {
    tender_award: { ok: false, error: 'B-3 scored 80, more than B-4\'s 70: justify the deviation', kind: 'invalid_argument' },
  });
  await openTender(page);
  await page.getByTestId('lot-award').getByRole('button', { name: 'Award this lot' }).click();
  await expect(page.getByText('justify the deviation')).toBeVisible();
});

test('a bid on a tender with lots names the lot, and its sealed scope does too', async ({ page }) => {
  scenario = realm(MANAGER, tender('open'), { bid_submit: { ok: true, bid: 'B-9' }, department_get: { ok: true, department: { id: 'Infrastructure', head: 'dana' }, positions: [] } });
  await openTender(page);
  await expect(page.getByTestId('lot-award')).toHaveCount(0); // nothing to award while it is open
  await expect(page.getByTestId('lots').getByTestId('lot-row')).toHaveCount(2);

  await page.getByLabel('Amount (quote)').fill('900000');
  await page.getByRole('button', { name: 'Submit sealed bid' }).click();
  await expect(page.getByText('Choose the lot your bid is for.')).toBeVisible();
  expect(await asked(page, 'bid_submit')).toEqual([]);

  await page.getByTestId('bid-lot').selectOption('2');
  await page.getByRole('button', { name: 'Submit sealed bid' }).click();
  await expect(page.getByText('Sealed bid B-9 submitted')).toBeVisible();
  const [bid] = (await asked(page, 'bid_submit')) as Record<string, unknown>[];
  expect(bid).toMatchObject({ tender: 'T-5', vendor: 'buildco', lot: '2' });
  // Granting a scope again replaces its keys, so the bids of one vendor on two lots need two scopes.
  expect(await page.evaluate(() => (window as any).granted.map(([scope]: [string]) => scope))).toEqual(['user:carla:procurement:T-5:buildco:2']);
});

test('a tender without lots reads as it did: no lots table, one award for the whole tender', async ({ page }) => {
  const plain = { ...PLAIN_TENDER(), bids: [{ id: 'B-1', vendor: 'roadco', lot: '', sealed: false, payload_hash: 'sha256:1', payload_ref: '', price: 10, score: 70, submitted_at: 1 }] };
  scenario = realm(MANAGER, plain, { tender_award: { ok: true, winner: 'B-1', score: 70, contract: 'C-12' } });
  await openTender(page);
  await expect(page.getByTestId('lots')).toHaveCount(0);
  await expect(page.getByTestId('lot-award')).toHaveCount(0);
  await page.getByRole('button', { name: 'Award', exact: true }).click();
  await expect(page.getByText('Awarded to B-1 — contract C-12 signed')).toBeVisible();
  expect(await asked(page, 'tender_award')).toEqual([{ tender: 'T-6' }]);
});

test('a tender without lots takes bids without a lot, as before', async ({ page }) => {
  scenario = realm(MANAGER, PLAIN_TENDER('open'), { bid_submit: { ok: true, bid: 'B-9' }, department_get: { ok: true, department: { id: 'Infrastructure', head: 'dana' }, positions: [] } });
  await openTender(page);
  await expect(page.getByTestId('bid-lot')).toHaveCount(0);
  await page.getByLabel('Amount (quote)').fill('900000');
  await page.getByRole('button', { name: 'Submit sealed bid' }).click();
  await expect(page.getByText('Sealed bid B-9 submitted')).toBeVisible();
  const [bid] = (await asked(page, 'bid_submit')) as Record<string, unknown>[];
  expect(bid).not.toHaveProperty('lot');
  expect(await page.evaluate(() => (window as any).granted.map(([scope]: [string]) => scope))).toEqual(['user:carla:procurement:T-6:buildco']);
});

// ---- creating a tender with lots ---------------------------------------------------------------------------------------

async function openCreateForm(page: Page) {
  await page.goto(`${url}/extensions/procurement`);
  await page.getByRole('button', { name: 'New Request For Proposal' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Bike lane works');
}

test('the form that creates a tender takes lots, their budgets in the currency\'s base units', async ({ page }) => {
  scenario = realm(MANAGER, PLAIN_TENDER('draft'), { tender_create: { ok: true, tender: 'T-7' } });
  await openCreateForm(page);
  const form = page.getByTestId('lots-form');
  await form.getByRole('button', { name: 'Add a lot' }).click();
  await form.getByRole('button', { name: 'Add a lot' }).click();
  const rows = form.getByTestId('lot-form-row');
  await rows.nth(0).getByPlaceholder('Lot').fill('1');
  await rows.nth(0).getByPlaceholder('Name').fill('Road works');
  await rows.nth(0).getByPlaceholder('Budget').fill('50000');
  await rows.nth(1).getByPlaceholder('Lot').fill('2');
  await rows.nth(1).getByPlaceholder('Name').fill('Bike racks');
  await page.getByRole('button', { name: 'Create draft' }).click();

  await expect(page.getByText('Created T-7')).toBeVisible();
  const [created] = (await asked(page, 'tender_create')) as Record<string, unknown>[];
  expect(created.lots).toEqual([
    { id: '1', title: 'Road works', estimated_value: 5_000_000 },
    { id: '2', title: 'Bike racks' },
  ]);
});

test('a tender created without lots sends none', async ({ page }) => {
  scenario = realm(MANAGER, PLAIN_TENDER('draft'), { tender_create: { ok: true, tender: 'T-7' } });
  await openCreateForm(page);
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByText('Created T-7')).toBeVisible();
  const [created] = (await asked(page, 'tender_create')) as Record<string, unknown>[];
  expect(created).not.toHaveProperty('lots');
});

test('a lot without a name is not sent', async ({ page }) => {
  scenario = realm(MANAGER, PLAIN_TENDER('draft'));
  await openCreateForm(page);
  const form = page.getByTestId('lots-form');
  await form.getByRole('button', { name: 'Add a lot' }).click();
  await form.getByPlaceholder('Lot').fill('1');
  await page.getByRole('button', { name: 'Create draft' }).click();
  await expect(page.getByText('Give each lot an identifier and a name.')).toBeVisible();
  expect(await asked(page, 'tender_create')).toEqual([]);
});

test('the lots read in Spanish too', async ({ page }) => {
  scenario = { ...realm(READER, tender()), locale: 'es' };
  await openTender(page);
  await expect(page.getByTestId('lots')).toContainText('Lotes (2)');
  await expect(page.getByTestId('lots')).toContainText('Adjudicado');
});
