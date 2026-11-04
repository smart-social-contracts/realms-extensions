import { expect, test } from '@playwright/test';
import { makeOneYesDecideAtOnce, openExtension, passTheOpenProposal, realmCall, setRootPolicy } from '../../../../_shared/testing/e2e/local-realm';

// The realm has a fund and a budget for it. A plain member sees them and cannot change the allocation; an admin
// adopts an allocation rule that sends a share of the treasury's payments to the fund. Checked through the
// extension's own UI, and read back from the realm. The first tests run under a root department of one approval,
// where a change applies at once; the last one makes the root vote, and a change then takes two votes: draft, then
// adopt. It runs once on a realm: it opens a fiscal period.

const RUN = Date.now().toString(36);
const FUND = 'WELFARE';
const CATEGORY = `care_${RUN}`;
const PERIOD = `FY-${RUN}`;
const NEXT_PERIOD = `FY-${RUN}-next`;
const NEXT_CATEGORY = `libraries_${RUN}`;

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
  // The view lists the budgets of one period, the one covering now: the next year's are read when it is chosen.
  realmCall('period_open', { period: NEXT_PERIOD, starts_at: now + 365 * 86_400, ends_at: now + 730 * 86_400 });
  const next = realmCall('budget_draft', { fund: FUND, period: NEXT_PERIOD, category: NEXT_CATEGORY, planned: 120_000 });
  realmCall('budget_propose', { budget: next.budget });
  setRootPolicy(1, 1);
  makeOneYesDecideAtOnce();
});

test('a member sees the budgets and funds, and cannot change the allocation', async ({ page }, testInfo) => {
  const { ext, close } = await openExtension(page, 'budget_manager', { asMember: true });
  try {
    // A member does not read the ledger: no Flow or Timeline, the budgets come first.
    await expect(ext.getByText(CATEGORY.replace(/_/g, ' '))).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByRole('button', { name: 'Flow' })).toHaveCount(0);
    await expect(ext.getByRole('button', { name: 'Timeline' })).toHaveCount(0);
    await expect(ext.getByText('5,000 E2E').first()).toBeVisible();
    await expect(ext.getByText(NEXT_CATEGORY.replace(/_/g, ' '))).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('01-member-budgets.png') });

    // Another period: its budgets are read when it is chosen.
    await ext.locator('select').first().selectOption(NEXT_PERIOD);
    await expect(ext.getByText(NEXT_CATEGORY.replace(/_/g, ' '))).toBeVisible();
    await expect(ext.getByText('1,200 E2E').first()).toBeVisible();
    await expect(ext.getByText(CATEGORY.replace(/_/g, ' '))).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('01b-member-next-period.png') });

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

    // Under one approval it applies at once: no vote.
    await expect(ext.getByText('Allocation rule adopted')).toBeVisible({ timeout: 120_000 });
    await page.screenshot({ path: testInfo.outputPath('04-admin-adopted.png') });
  } finally {
    await close();
  }

  const root = realmCall('budget_view').funds.find((f: { id: string }) => f.id === 'ROOT');
  expect(root.rule.rules).toEqual({ [FUND]: 30 });
});

test('under a voting root a change takes two votes: draft, then adopt', async ({ page }, testInfo) => {
  const rootRule = () => realmCall('budget_view').funds.find((f: { id: string }) => f.id === 'ROOT').rule.rules;
  // Signed in while the root still approves alone: under a vote, adding the admin would be a proposal too.
  const { ext, close } = await openExtension(page, 'budget_manager');
  try {
    await expect(ext.getByRole('button', { name: 'Flow' })).toBeVisible({ timeout: 120_000 });
    setRootPolicy(1, 2);
    await page.reload();

    // Vote 1: draft a rule that sends 40 % to the fund.
    await ext.getByRole('button', { name: 'Allocation' }).click({ timeout: 120_000 });
    await expect(ext.getByText(/a change takes two votes/)).toBeVisible();
    await ext.getByPlaceholder('%').first().fill('40');
    await ext.getByRole('button', { name: 'Adopt rule' }).click();
    await expect(ext.getByRole('heading', { name: 'A vote is required' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('05-vote-needed.png') });
    await ext.getByRole('button', { name: 'Create proposal' }).click();
    await expect(ext.getByText(/Proposal .* created/)).toBeVisible({ timeout: 120_000 });
    passTheOpenProposal();
    // Not in force yet: the 30 % stands.
    expect(rootRule()).toEqual({ [FUND]: 30 });

    // The draft is listed, and adopting it is the second vote.
    await page.reload();
    await ext.getByRole('button', { name: 'Allocation' }).click({ timeout: 120_000 });
    const drafts = ext.getByRole('list', { name: 'Rule drafts' });
    await expect(drafts.getByText(`${FUND}: 40%`)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('06-draft-listed.png') });
    await drafts.getByRole('button', { name: 'Adopt' }).click();
    await ext.getByRole('button', { name: 'Create proposal' }).click();
    await expect(ext.getByText(/Proposal .* created/)).toBeVisible({ timeout: 120_000 });
    passTheOpenProposal();
    expect(rootRule()).toEqual({ [FUND]: 40 });
  } finally {
    setRootPolicy(1, 1);
    await close();
  }
});
