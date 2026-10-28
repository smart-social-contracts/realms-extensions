import { expect, test } from '@playwright/test';
import { openExtension, randomPrincipal } from '../../../../_shared/testing/e2e/local-realm';

// The admin files a case at the default court against another party. Checked through the extension's own UI.

test('an admin files a litigation case at the default court', async ({ page }) => {
  const title = `E2E case ${Date.now()}`;
  const { ext, close } = await openExtension(page, 'justice_litigation');
  try {
    await ext.getByRole('button', { name: 'Create litigation' }).click({ timeout: 120_000 });

    // The extension sets up a default court when it is installed, so the case has somewhere to be filed.
    await expect(ext.getByText(/Filing at:/)).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByText('Default Court').first()).toBeVisible();

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
