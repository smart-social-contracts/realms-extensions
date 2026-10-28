import { expect, test } from '@playwright/test';
import { openExtension } from '../../../../_shared/testing/e2e/local-realm';

// Checked through the extension's own list, not through realm operations, so the test holds for
// every realm release the extension supports.

test('the form refuses a proposal without a title or description', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'voting');
  try {
    await ext.getByRole('button', { name: 'Submit Proposal' }).click({ timeout: 120_000 });
    const submit = ext.locator('form button[type="submit"]');
    await expect(submit).toBeDisabled();
    await ext.locator('#rt-title').fill('A title and nothing else');
    await expect(submit).toBeDisabled();
    await ext.locator('#rt-desc').fill('Now with a description.');
    await expect(submit).toBeEnabled();
  } finally {
    await close();
  }
});

test('a member submits a proposal, votes yes on it, and it is executed', async ({ page }) => {
  const title = `E2E poll ${Date.now()}`;
  const { ext, close } = await openExtension(page, 'voting');
  try {
    await ext.getByRole('button', { name: 'Submit Proposal' }).click({ timeout: 120_000 });
    await ext.locator('#rt-title').fill(title);
    await ext.locator('#rt-desc').fill('Created by the voting UI test; safe to ignore.');
    await ext.locator('form button[type="submit"]').click();
    await expect(ext.getByText(/Proposal .*submitted/)).toBeVisible({ timeout: 120_000 });

    // The list shows it open for voting, with no votes; the card nearest the title holds the vote buttons.
    const card = ext.getByText(title).locator('xpath=ancestor::div[.//button[normalize-space()="Yes"]][1]');
    await expect(card.getByText(/Y:0\b/)).toBeVisible({ timeout: 60_000 });
    await card.getByRole('button', { name: 'Yes' }).click();

    // The admin is the realm's only voter, so one yes passes the poll and it is executed at once.
    const done = ext.locator('div').filter({ hasText: title }).filter({ hasText: 'Executed' });
    await expect(done.first()).toBeVisible({ timeout: 60_000 });
    await expect(ext.getByRole('button', { name: 'Yes' })).toHaveCount(0);
  } finally {
    await close();
  }
});
