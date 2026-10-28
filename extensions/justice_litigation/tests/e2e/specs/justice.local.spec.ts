import { expect, test } from '@playwright/test';
import { openExtension, randomPrincipal } from '../../../../_shared/testing/e2e/local-realm';

// A realm launched with a minimal codex has no courts: the admin sets up the default one from the form,
// then files a case against another party. Checked through the extension's own UI.

test('an admin sets up the default court and files a litigation case', async ({ page }) => {
  const title = `E2E case ${Date.now()}`;
  const { ext, close } = await openExtension(page, 'justice_litigation');
  try {
    await ext.getByRole('button', { name: 'Create litigation' }).click({ timeout: 120_000 });

    // No courts yet: the form says so, and the admin can set one up.
    await expect(ext.getByText('This realm has no courts yet.')).toBeVisible({ timeout: 60_000 });
    await ext.getByRole('button', { name: 'Set up default court' }).click();
    await expect(ext.getByText(/Filing at:/)).toBeVisible({ timeout: 120_000 });

    // Nothing to file without a defendant, a title and a description.
    const create = ext.getByRole('button', { name: 'Create Litigation' });
    await expect(create).toBeDisabled();
    await ext.locator('#jl-defendant').fill(randomPrincipal());
    await ext.locator('#jl-title').fill(title);
    await expect(create).toBeDisabled();
    await ext.locator('#jl-desc').fill('Created by the justice UI test; safe to ignore.');
    await expect(create).toBeEnabled();

    await create.click();
    await expect(ext.getByText('Litigation case created!')).toBeVisible({ timeout: 120_000 });

    // The admin sees it among all litigations.
    await ext.getByRole('button', { name: 'All litigations' }).click();
    await expect(ext.getByText(title).first()).toBeVisible({ timeout: 60_000 });
  } finally {
    await close();
  }
});
