import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { NOW, budgeting, budgetingIncomeOnly, startRealm, type Scenario } from '../realm';

// The spending stages of every expense line (ggg I-FIN-9): planned, reserved, committed, actual and available, as a
// stacked bar and as numbers, with the totals of each fund and of the budget. The page is the built bundle on a
// canned realm; the lines are those of ggg's example (Roads, capital: 300,000 planned, 40,000 reserved, 90,000
// committed, 120,500 charged, 49,500 available).
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

const asked = (page: Page) => page.evaluate(() => (window as any).asked.map(([op]: [string]) => op));

async function openBudgets(page: Page, tab = 'Budgets') {
  await page.goto(`${url}/extensions/budget_manager`);
  await page.getByRole('button', { name: tab }).click({ timeout: 15_000 });
}

test('an admin sees each expense line from planned to available, and the totals of each fund and of the budget', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = budgeting('admin');
  await openBudgets(page);
  const stages = page.getByTestId('stages');

  await expect(stages.getByRole('heading', { name: 'Spending stages — FY2026' })).toBeVisible();
  const cells = (selector: string) => stages.locator(selector).getByRole('cell');
  await expect(cells('[data-line="B-1"]')).toHaveText(['capital', '', '300,000 REALM', '40,000 REALM', '90,000 REALM', '120,500 REALM', '49,500 REALM']);
  await expect(cells('[data-line="B-2"]')).toHaveText(['upkeep', '', '50,000 REALM', '0 REALM', '0 REALM', '10,000 REALM', '40,000 REALM']);
  await expect(cells('[data-total="ROADS"]')).toHaveText(['Total ROADS', '', '350,000 REALM', '40,000 REALM', '90,000 REALM', '130,500 REALM', '89,500 REALM']);
  await expect(cells('[data-total="WELFARE"]')).toHaveText(['Total WELFARE', '', '120,000 REALM', '0 REALM', '0 REALM', '30,000 REALM', '90,000 REALM']);
  await expect(cells('[data-total="budget"]')).toHaveText(['Total budget', '', '470,000 REALM', '40,000 REALM', '90,000 REALM', '160,500 REALM', '179,500 REALM']);

  // A line the realm extended from the period before holds nothing reserved or committed, and says so.
  await expect(stages.locator('[data-line="B-4"]')).toContainText('care · extended');

  // The bar: charged, committed, reserved, available, as shares of what is planned.
  const bar = stages.locator('[data-line="B-1"]').getByRole('img');
  await expect(bar).toHaveAttribute(
    'aria-label',
    '300,000 REALM planned: 120,500 REALM charged, 90,000 REALM committed, 40,000 REALM reserved, 49,500 REALM available',
  );
  await expect(bar.locator('[data-stage="actual"]')).toHaveAttribute('style', /width: 40\.16/);
  await expect(bar.locator('[data-stage="committed"]')).toHaveAttribute('style', /width: 30%/);
  await expect(bar.locator('[data-stage="reserved"]')).toHaveAttribute('style', /width: 13\.33/);
  await expect(bar.locator('[data-stage="available"]')).toHaveAttribute('style', /width: 16\.5%/);
  await expect(stages.getByRole('list', { name: 'Stages of the money' }).getByRole('listitem')).toHaveText(['Actual', 'Committed', 'Reserved', 'Available']);

  // Income lines are not spending: they stay in the table of planned against actual, and are not in the stages.
  await expect(stages.getByText('tolls')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'tolls' })).toHaveCount(1);

  // A line still being drafted or proposed shows what it plans and nothing else.
  const pending = stages.getByTestId('unadopted');
  await expect(pending.getByRole('listitem')).toHaveCount(2);
  await expect(pending.getByRole('listitem').nth(0)).toContainText('WELFARE · schools');
  await expect(pending.getByRole('listitem').nth(0)).toContainText('Proposed');
  await expect(pending.getByRole('listitem').nth(0)).toContainText('75,000 REALM');
  await expect(pending.getByRole('listitem').nth(1)).toContainText('ROADS · street lighting');
  await expect(pending.getByRole('listitem').nth(1)).toContainText('Draft');
  await expect(stages.locator('[data-line="B-6"], [data-line="B-7"]')).toHaveCount(0);

  await page.screenshot({ path: join(OUT, 'stages-admin.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('a member sees the stages of the lines in force, and no line that is not', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = budgeting('member');
  await page.goto(`${url}/extensions/budget_manager`);
  const stages = page.getByTestId('stages');
  await expect(stages.locator('[data-line="B-1"]').getByRole('cell').nth(6)).toHaveText('49,500 REALM', { timeout: 15_000 });
  await expect(stages.getByTestId('unadopted')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Scheduled payments' })).toHaveCount(0);
  expect(await asked(page)).not.toContain('budget_list'); // the lines not in force are for those who read the treasury
  expect(errors).toEqual([]);
});

test('a period with no expense line in force says so', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = budgetingIncomeOnly();
  await page.goto(`${url}/extensions/budget_manager`);
  await expect(page.getByTestId('stages').getByText('No expense line is in force for this period.')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('cell', { name: 'tolls' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('on a narrow screen each line is a card with its bar and its numbers', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.setViewportSize({ width: 390, height: 900 });
  scenario = budgeting('member');
  await page.goto(`${url}/extensions/budget_manager`);
  const card = page.getByTestId('stages').locator('[data-line="B-1"]');
  await expect(card).toContainText('Planned 300,000 REALM', { timeout: 15_000 });
  await expect(card.getByRole('term')).toHaveText(['Reserved', 'Committed', 'Actual', 'Available']);
  await expect(card.getByRole('definition')).toHaveText(['40,000 REALM', '90,000 REALM', '120,500 REALM', '49,500 REALM']);
  await expect(page.getByTestId('stages').locator('[data-total="budget"]')).toContainText('Total budget');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: join(OUT, 'stages-narrow.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('the texts come in the realm\'s language', async ({ page }) => {
  scenario = budgeting('member', 'es');
  await page.goto(`${url}/extensions/budget_manager`);
  const stages = page.getByTestId('stages');
  await expect(stages.getByRole('heading', { name: 'Fases del gasto — FY2026' })).toBeVisible({ timeout: 15_000 });
  await expect(stages.getByRole('columnheader', { name: 'Ejecutado' })).toBeVisible();
  await expect(stages.locator('[data-total="budget"]')).toContainText('Total del presupuesto');
  await page.screenshot({ path: join(OUT, 'stages-es.png'), fullPage: true });
});
