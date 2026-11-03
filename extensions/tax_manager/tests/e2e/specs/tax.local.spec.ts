import { expect, test } from '@playwright/test';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// An admin drafts a tax policy of a flat tax and a declared tax and adopts it; a plain member then reads the
// policy and declares the tax they owe themselves. Checked through the extension's own UI, and read back from the
// realm. It runs once on a realm: it starts from one with no tax policy.

const RUN = Date.now().toString(36);
const RESIDENCE = `E2E residence ${RUN}`;
const REVENUE = `E2E revenue tax ${RUN}`;

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  // Invoices are billed in the realm's accounting currency, so the realm needs a token. Nothing here pays one, so
  // any principal does for its ledger.
  realmCall('token_register', { symbol: 'E2E', ledger: 'aaaaa-aa', decimals: 2, fee: 10 });
  realmCall('realm_configure_tokens', { accounting_currency: 'E2E' });
});

test('an admin drafts a policy and adopts it', async ({ page }, testInfo) => {
  const { ext, close } = await openExtension(page, 'tax_manager');
  try {
    await expect(ext.getByText('No tax policy adopted yet.').first()).toBeVisible({ timeout: 120_000 });

    // Nothing to adopt until a tax is on the draft.
    const adopt = ext.getByRole('button', { name: /^(Adopt|Propose for a vote)$/ });
    await expect(adopt).toBeDisabled();

    await ext.getByRole('button', { name: '+ Flat tax' }).click();
    await ext.getByLabel('Name').fill(RESIDENCE);
    await ext.getByLabel('Code').fill('residence');
    await ext.getByLabel(/^Amount/).fill('2500');

    await ext.getByRole('button', { name: '+ Declared tax' }).click();
    await ext.getByLabel('Name').fill(REVENUE);
    await ext.getByLabel('Code').fill('revenue');
    await ext.getByLabel('Rate (%)').fill('2');
    await ext.getByLabel('Note for this version').fill('Added by the tax UI test');
    await page.screenshot({ path: testInfo.outputPath('01-draft.png') });

    await expect(adopt).toBeEnabled();
    await adopt.click();

    // Adopted at once, or turned into a proposal when the realm votes on its taxes.
    await expect(ext.getByText(/Tax policy adopted|Proposal .* created/)).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByText('No tax policy adopted yet.')).toBeHidden({ timeout: 60_000 });
    await expect(ext.getByText(RESIDENCE).first()).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('02-adopted.png') });
  } finally {
    await close();
  }

  const policy = realmCall('tax_policy_view').policy;
  expect(policy.document.taxes.map((t: { code: string }) => t.code)).toEqual(['residence', 'revenue']);
  expect(policy.document.taxes[1]).toMatchObject({ base: 'declared', method: 'proportional', rate_bp: 200 });
});

test('a member reads the policy and cannot change it', async ({ page }, testInfo) => {
  const { ext, close } = await openExtension(page, 'tax_manager', { asMember: true });
  try {
    await expect(ext.getByText(RESIDENCE).first()).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByText(REVENUE).first()).toBeVisible();
    await expect(ext.getByText('Only those who hold tax.manage can change the tax policy.')).toBeVisible();
    await expect(ext.getByRole('button', { name: '+ Flat tax' })).toHaveCount(0);
    await expect(ext.getByRole('button', { name: 'Run assessment' })).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('03-member-policy.png') });
  } finally {
    await close();
  }
});

test('a member declares a tax once and sees it among their declarations', async ({ page }, testInfo) => {
  const period = `2026-${RUN}`;
  const { ext, close } = await openExtension(page, 'tax_manager', { asMember: true });
  try {
    await ext.getByRole('button', { name: 'My taxes' }).click();
    await ext.getByLabel('Period').fill(period);
    await ext.getByLabel('Amount to declare').fill('100000');
    await page.screenshot({ path: testInfo.outputPath('04-declare.png') });
    await ext.getByRole('button', { name: 'Declare', exact: true }).click();

    // 2.00 % of 100 000
    await expect(ext.getByText(/Declared: you owe 2,000/)).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByText(`revenue · ${period}`)).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('05-declared.png') });
    await ext.getByLabel('Close', { exact: true }).click();

    // Once only.
    await ext.getByLabel('Amount to declare').fill('5');
    await ext.getByRole('button', { name: 'Declare', exact: true }).click();
    await expect(ext.getByText(/already declared revenue/)).toBeVisible({ timeout: 60_000 });
  } finally {
    await close();
  }
});
