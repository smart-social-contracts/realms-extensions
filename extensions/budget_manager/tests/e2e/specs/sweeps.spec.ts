import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOW, budgeting, capital, capitalWithoutBookings, capitalWithoutSweeps, quarter, startRealm, type Scenario } from '../realm';

// Money paid in a quarter reaches its capital's funds (ggg I-FED-5 to I-FED-7). On the capital: the sweep rules and
// the sweeps its quarters reported, each booked once as `<quarter>/<id>`. On a quarter: what it swept to the capital.
// The page is the built bundle on a canned realm.
const OUT = join(__dirname, '..', 'test-results');
test.use({ viewport: { width: 1280, height: 1100 } });

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
test.beforeEach(async ({ page }) => page.clock.setFixedTime(NOW));

const NORTH = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
const SOUTH = 'renrk-eyaaa-aaaaa-aaada-cai';

function consoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  return errors;
}

async function openSweeps(page: Page, name = 'Quarter sweeps') {
  await page.goto(`${url}/extensions/budget_manager`);
  await page.getByRole('button', { name }).click({ timeout: 15_000 });
}

const listed = (page: Page) => page.locator('[data-sweep]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-sweep')));

test('on the capital: the sweep rules, and the sweeps of the quarters with the booking of each', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = capital();
  await openSweeps(page);
  const sweeps = page.getByTestId('sweeps');
  await expect(sweeps.getByRole('heading', { name: 'Sweeps from the quarters' })).toBeVisible();

  // The rules: what each quarter fund moves into which capital fund, and what the quarter keeps.
  await expect(sweeps.getByTestId('rules').getByRole('row')).toHaveCount(3);
  await expect(sweeps.getByTestId('rules').getByRole('row').nth(1).getByRole('cell')).toHaveText(['ROOT', 'REALM', 'ROADS', '100 REALM']);
  await expect(sweeps.getByTestId('rules').getByRole('row').nth(2).getByRole('cell')).toHaveText(['WELFARE', 'REALM', 'WELFARE', '0 REALM']);

  // The history, newest first, in the realm's days.
  expect(await listed(page)).toEqual([`${SOUTH}/SW-1`, `${NORTH}/SW-1`, `${NORTH}/SW-2`]);
  await expect(sweeps.getByTestId('swept')).toHaveText('Swept up: 1,620 REALM');
  const first = sweeps.locator(`[data-sweep="${NORTH}/SW-1"]`);
  await expect(first.getByRole('cell').nth(0)).toHaveText('2026-11-01');
  await expect(first.getByRole('cell').nth(1)).toContainText('North');
  await expect(first.getByRole('cell').nth(1)).toContainText('on the quarter: SW-1'); // the quarter's own id for it
  await expect(first.getByRole('cell').nth(2)).toHaveText('ROOT → ROADS');
  await expect(first.getByRole('cell').nth(3)).toContainText('890 REALM');
  await expect(first.getByRole('cell').nth(3)).toContainText('fee 0.1 REALM, paid by the quarter');
  await expect(first.getByRole('cell').nth(4)).toHaveText('Booked ledger block 90113'); // the status, and the block of the move

  // The capital's booking of it: one transaction and its lines.
  const booking = first.getByRole('cell').nth(5);
  await expect(booking).toContainText('Booked as T-20');
  await expect(booking.getByRole('listitem')).toHaveText(['cash: debit 890 REALM', 'sweep: credit 890 REALM']);

  await page.screenshot({ path: join(OUT, 'sweeps-capital.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('a member of the capital reads the rules, and not the books of the sweeps', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = capital('member');
  await openSweeps(page);
  const sweeps = page.getByTestId('sweeps');
  await expect(sweeps.getByTestId('rules')).toBeVisible();
  await expect(sweeps.getByText('Only those who may read the treasury see the sweeps.')).toBeVisible();
  expect(await page.evaluate(() => (window as any).asked.map(([op]: [string]) => op))).not.toContain('sweep_list');
  await page.screenshot({ path: join(OUT, 'sweeps-capital-member.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('a capital with no rule and no sweep says so', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = capitalWithoutSweeps();
  await openSweeps(page);
  const sweeps = page.getByTestId('sweeps');
  await expect(sweeps.getByText('The capital has set no sweep rules: its quarters keep what they receive.')).toBeVisible();
  await expect(sweeps.getByText('No sweep has been recorded yet.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('on a quarter: what it swept to the capital, the sweeps that moved nothing set apart', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = quarter();
  await openSweeps(page);
  const sweeps = page.getByTestId('sweeps');
  await expect(sweeps.getByRole('heading', { name: 'Sweeps to the capital' })).toBeVisible();
  await expect(sweeps.getByTestId('rules')).toHaveCount(0); // the capital sets the rules

  expect(await listed(page)).toEqual(['SW-3', 'SW-2', 'SW-1']);
  await expect(sweeps.getByTestId('swept')).toHaveText('Swept up: 890 REALM'); // the failed and the sending ones moved nothing known

  const done = sweeps.locator('[data-sweep="SW-1"]');
  await expect(done.getByRole('cell').nth(1)).toHaveText('SW-1');
  await expect(done.getByRole('cell').nth(4)).toContainText('Booked');
  await expect(done.getByRole('cell').nth(5).getByRole('listitem')).toHaveText([
    'cash: credit 890.1 REALM',
    'sweep: debit 890 REALM',
    'ledger_fee: debit 0.1 REALM',
  ]);
  await expect(done.getByRole('cell').nth(5)).toContainText('Booked as T-5');

  const failed = sweeps.locator('[data-sweep="SW-2"]');
  await expect(failed.getByRole('cell').nth(4)).toContainText('Failed');
  await expect(failed.getByRole('cell').nth(4)).toContainText('InsufficientFunds');
  await expect(failed.getByRole('cell').nth(5)).toHaveText('—');
  await expect(sweeps.locator('[data-sweep="SW-3"]').getByRole('cell').nth(4)).toHaveText('Sending');

  await page.screenshot({ path: join(OUT, 'sweeps-quarter.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('on a realm that does not name the sweep on its ledger entries there is no booking column, and the rest stands', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = capitalWithoutBookings();
  await openSweeps(page);
  const sweeps = page.getByTestId('sweeps');
  expect(await listed(page)).toEqual([`${SOUTH}/SW-1`, `${NORTH}/SW-1`, `${NORTH}/SW-2`]);
  await expect(sweeps.getByRole('columnheader', { name: 'Booking' })).toHaveCount(0);
  await expect(sweeps.getByText(/Booked as/)).toHaveCount(0);
  await expect(sweeps.locator(`[data-sweep="${NORTH}/SW-1"]`).getByRole('cell').nth(4)).toContainText('ledger block 90113');
  await expect(sweeps.getByTestId('swept')).toHaveText('Swept up: 1,620 REALM');
  expect(errors).toEqual([]);
});

test('a realm that is in no federation has no sweeps tab', async ({ page }) => {
  scenario = budgeting('admin');
  await page.goto(`${url}/extensions/budget_manager`);
  await expect(page.getByRole('button', { name: 'Budgets' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Quarter sweeps' })).toHaveCount(0);
});

test('on a narrow screen each sweep is a card', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.setViewportSize({ width: 390, height: 900 });
  scenario = capital();
  await openSweeps(page);
  const card = page.getByTestId('sweeps').locator(`[data-sweep="${NORTH}/SW-1"]`);
  await expect(card).toContainText('North');
  await expect(card).toContainText('890 REALM');
  await expect(card).toContainText('ROOT → ROADS');
  await expect(card).toContainText('Booked as T-20');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: join(OUT, 'sweeps-narrow.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the texts come in the realm\'s language', async ({ page }) => {
  scenario = capital('admin', 'fr');
  await openSweeps(page, 'Remontées des quartiers');
  const sweeps = page.getByTestId('sweeps');
  await expect(sweeps.getByRole('heading', { name: 'Remontées des quartiers' })).toBeVisible();
  await expect(sweeps.locator(`[data-sweep="${NORTH}/SW-1"]`)).toContainText('Comptabilisée sous T-20');
  await page.screenshot({ path: join(OUT, 'sweeps-fr.png'), fullPage: true });
});
