import { expect, test } from '@playwright/test';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// The realm has a fund and a budget for it. A plain member sees them and cannot change the allocation; an admin
// adopts an allocation rule that sends a share of the treasury's payments to the fund. Checked through the
// extension's own UI, and read back from the realm. It runs once on a realm: it opens a fiscal period.

const RUN = Date.now().toString(36);
const FUND = 'WELFARE';
const CATEGORY = `care_${RUN}`;
const PERIOD = `FY-${RUN}`;

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  const now = Math.floor(Date.now() / 1000);
  realmCall('token_register', { symbol: 'E2E', ledger: 'aaaaa-aa', decimals: 2, fee: 10 });
  realmCall('realm_configure_tokens', { accounting_currency: 'E2E' });
  // The treasury's payments land in ROOT, which a codex seeds: this realm has none.
  realmCall('fund_create', { fund: 'ROOT', name: 'Root' });
  realmCall('fund_create', { fund: FUND, name: 'Welfare' });
  realmCall('period_open', { period: PERIOD, starts_at: now - 86_400, ends_at: now + 365 * 86_400 });
  const { budget } = realmCall('budget_draft', { fund: FUND, period: PERIOD, category: CATEGORY, planned: 500_000 });
  realmCall('budget_propose', { budget });
});

test('a member sees the budgets and funds, and cannot change the allocation', async ({ page }, testInfo) => {
  const { ext, close } = await openExtension(page, 'budget_manager', { asMember: true });
  try {
    // A member does not read the ledger: no Flow or Timeline, the budgets come first.
    await expect(ext.getByText(CATEGORY.replace(/_/g, ' '))).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByRole('button', { name: 'Flow' })).toHaveCount(0);
    await expect(ext.getByRole('button', { name: 'Timeline' })).toHaveCount(0);
    await expect(ext.getByText('5,000 E2E').first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('01-member-budgets.png') });

    await ext.getByRole('button', { name: 'Allocation' }).click();
    await expect(ext.getByText(FUND).first()).toBeVisible();
    await expect(ext.getByRole('button', { name: 'Adopt rule' })).toBeDisabled();
    await expect(ext.getByText('Only those who hold org.manage_budget can change the rule.')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('02-member-allocation.png') });
  } finally {
    await close();
  }
});

test('an admin adopts an allocation rule', async ({ page }, testInfo) => {
  const { ext, close } = await openExtension(page, 'budget_manager');
  try {
    await expect(ext.getByRole('button', { name: 'Flow' })).toBeVisible({ timeout: 120_000 });
    await ext.getByRole('button', { name: 'Allocation' }).click();
    await ext.locator('select').filter({ hasText: '— fund —' }).first().selectOption(FUND);
    await ext.getByPlaceholder('%').first().fill('30');
    await page.screenshot({ path: testInfo.outputPath('03-admin-rule.png') });

    await ext.getByRole('button', { name: 'Adopt rule' }).click();

    // Adopted at once, or turned into a proposal when the realm votes on its treasury.
    await expect(ext.getByText(/Allocation rule adopted|Proposal .* created/)).toBeVisible({ timeout: 120_000 });
    await page.screenshot({ path: testInfo.outputPath('04-admin-adopted.png') });
  } finally {
    await close();
  }

  const root = realmCall('budget_view').funds.find((f: { id: string }) => f.id === 'ROOT');
  expect(root.rule.rules).toEqual({ [FUND]: 30 });
});
