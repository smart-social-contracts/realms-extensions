import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOW, budgeting, owing, owingNothing, startRealm, type Scenario } from '../realm';

// The payments the realm owes (ggg I-FIN-10): scheduled transfers with their due day, overdue ones marked, the ones
// revoked unpaid shown as cancelled, each with the budget line it is charged to. The page is the built bundle on a
// canned realm, read on 12 November 2026, in the realm's time zone (Europe/Madrid).
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

function consoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  return errors;
}

async function openPayments(page: Page, name = 'Scheduled payments') {
  await page.goto(`${url}/extensions/budget_manager`);
  await page.getByRole('button', { name }).click({ timeout: 15_000 });
}

const listed = (page: Page) => page.locator('[data-payment]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-payment')));

test('lists what is owed by due date, overdue ones marked, cancelled ones as such, each with its budget line', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = owing();
  await openPayments(page);
  const payments = page.getByTestId('payments');
  await expect(payments.getByRole('heading', { name: 'Scheduled payments' })).toBeVisible();
  await expect(payments.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

  // The owed ones by due date, then the cancelled one.
  expect(await listed(page)).toEqual(['T-11', 'T-15', 'T-10', 'T-12', 'T-13']);
  await expect(payments.getByTestId('owed')).toHaveText('Owed: 25,500 REALM'); // the cancelled one is owed no more

  // Overdue: past its due day, marked and highlighted.
  const overdue = payments.locator('[data-payment="T-11"]');
  await expect(overdue.getByRole('cell')).toHaveText(['2026-11-03', 'ROADS', 'O-4', '4,500 REALM', 'ROADS · upkeep (FY2026)', 'Overdue since 2026-11-03']);
  await expect(overdue).toHaveClass(/bg-red-50/);
  await expect(payments.locator('[data-payment="T-10"]')).not.toHaveClass(/bg-red-50/);

  // Due on the realm's day, with the exact time and zone on hover; paid from committed money, under a contract.
  const due = payments.locator('[data-payment="T-10"]');
  await expect(due.getByRole('cell').nth(0)).toHaveText('2026-11-30');
  await expect(due.locator('time')).toHaveAttribute('title', '2026-11-30 10:00 Europe/Madrid (UTC+01:00)');
  await expect(due.getByRole('cell').nth(4)).toContainText('ROADS · capital (FY2026)');
  await expect(due.getByRole('cell').nth(4)).toContainText('paid from committed money');
  await expect(due.getByRole('cell').nth(4)).toContainText('contract C-1');
  await expect(due.getByRole('cell').nth(5)).toHaveText('Scheduled');

  // Revoked unpaid: cancelled, its amount struck out, still tied to the line (a version since amended) it charged.
  const cancelled = payments.locator('[data-payment="T-13"]');
  await expect(cancelled.getByRole('cell').nth(5)).toHaveText('Cancelled, unpaid');
  await expect(cancelled.getByRole('cell').nth(3)).toHaveClass(/line-through/);
  await expect(cancelled.getByRole('cell').nth(4)).toContainText('ROADS · capital (FY2026)');

  // Charged to no line: nothing to link.
  await expect(payments.locator('[data-payment="T-15"]').getByRole('cell').nth(4)).toHaveText('—');

  await page.screenshot({ path: join(OUT, 'payments-all.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('can be filtered to what falls due this month, or what is overdue', async ({ page }) => {
  scenario = owing();
  await openPayments(page);
  const payments = page.getByTestId('payments');

  await payments.getByRole('button', { name: 'Due this month' }).click();
  expect(await listed(page)).toEqual(['T-11', 'T-15', 'T-10']); // T-11 fell due earlier this month; December's and the cancelled are out
  await expect(payments.getByTestId('owed')).toHaveText('Owed: 17,500 REALM');
  await page.screenshot({ path: join(OUT, 'payments-month.png'), fullPage: true });

  await payments.getByRole('button', { name: 'Overdue' }).click();
  expect(await listed(page)).toEqual(['T-11']);
  await expect(payments.getByTestId('owed')).toHaveText('Owed: 4,500 REALM');
  await page.screenshot({ path: join(OUT, 'payments-overdue.png'), fullPage: true });

  await payments.getByRole('button', { name: 'All' }).click();
  expect(await listed(page)).toHaveLength(5);
});

test('the line a payment is charged to opens among the spending stages, and is pointed at', async ({ page }) => {
  scenario = owing();
  await openPayments(page);
  await page.getByTestId('payments').locator('[data-payment="T-10"]').getByRole('button', { name: 'ROADS · capital (FY2026)' }).click();
  const line = page.getByTestId('stages').locator('[data-line="B-1"]');
  await expect(line).toBeVisible();
  await expect(line).toHaveAttribute('aria-current', 'true');
  await expect(line).toHaveClass(/bg-amber-50/);
  await expect(page.getByTestId('stages').locator('[data-line="B-2"]')).not.toHaveAttribute('aria-current', 'true');
  await expect(page.getByTestId('line-gone')).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'payments-line-shown.png'), fullPage: true });
});

test('a payment charged to a line that is no longer in force says so rather than show nothing', async ({ page }) => {
  scenario = owing();
  await openPayments(page);
  // T-13 was charged to B-5, the version of the capital line that a later budget amended.
  await page.getByTestId('payments').locator('[data-payment="T-13"]').getByRole('button', { name: 'ROADS · capital (FY2026)' }).click();
  await expect(page.getByTestId('line-gone')).toHaveText('That line is no longer among the lines in force: a later budget amended it, or its period has closed.');
  await expect(page.getByTestId('stages').locator('[data-line="B-5"]')).toHaveCount(0);
});

test('an amount in a token the realm does not list is said to be in the smallest unit', async ({ page }) => {
  scenario = owing();
  const [first] = scenario.replies.transfer_list.cases.scheduled.transfers;
  Object.assign(first, { symbol: 'XYZ', amount: 12345 });
  await openPayments(page);
  await expect(page.getByTestId('payments').locator(`[data-payment="${first.id}"]`).getByRole('cell').nth(3)).toHaveText('12345 XYZ (smallest units)');
});

test('says so when nothing is owed, whatever the filter', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = owingNothing();
  await openPayments(page);
  const payments = page.getByTestId('payments');
  await expect(payments.getByText('The realm has no scheduled payments.')).toBeVisible();
  await expect(payments.getByTestId('owed')).toHaveCount(0);
  await payments.getByRole('button', { name: 'Due this month' }).click();
  await expect(payments.getByText('No payment falls due this month.')).toBeVisible();
  await payments.getByRole('button', { name: 'Overdue' }).click();
  await expect(payments.getByText('No payment is overdue.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('says why when the realm refuses the payments, and does not wait for ever', async ({ page }) => {
  scenario = owing();
  delete scenario.replies.transfer_list;
  await openPayments(page);
  await expect(page.getByText('transfer_list is not open to you')).toBeVisible();
  await expect(page.getByTestId('payments')).toHaveCount(0);
});

test('is for those who read the treasury: a member neither sees the tab nor asks for the payments', async ({ page }) => {
  scenario = budgeting('member');
  await page.goto(`${url}/extensions/budget_manager`);
  await expect(page.getByRole('button', { name: 'Budgets' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Scheduled payments' })).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).asked.map(([op]: [string]) => op))).not.toContain('transfer_list');
});

test('on a narrow screen each payment is a card', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.setViewportSize({ width: 390, height: 900 });
  scenario = owing();
  await openPayments(page);
  const card = page.getByTestId('payments').locator('[data-payment="T-11"]');
  await expect(card).toContainText('2026-11-03');
  await expect(card).toContainText('ROADS → O-4');
  await expect(card).toContainText('4,500 REALM');
  await expect(card).toContainText('Overdue since 2026-11-03');
  await expect(card).toHaveClass(/bg-red-50/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: join(OUT, 'payments-narrow.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the texts come in the realm\'s language', async ({ page }) => {
  scenario = owing('de');
  await openPayments(page, 'Geplante Zahlungen');
  const payments = page.getByTestId('payments');
  await expect(payments.getByRole('button', { name: 'Fällig diesen Monat' })).toBeVisible();
  await expect(payments.locator('[data-payment="T-11"]')).toContainText('Überfällig seit 2026-11-03');
  await expect(payments.locator('[data-payment="T-13"]')).toContainText('Storniert, unbezahlt');
  await page.screenshot({ path: join(OUT, 'payments-de.png'), fullPage: true });
});
