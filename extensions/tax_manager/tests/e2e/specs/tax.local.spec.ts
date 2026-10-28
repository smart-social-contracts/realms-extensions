import { expect, test } from '@playwright/test';
import { openExtension } from '../../../../_shared/testing/e2e/local-realm';

// The admin drafts a flat tax and adopts it as the realm's tax policy. Checked through the extension's own UI.

test('an admin adds a flat tax and adopts it as the tax policy', async ({ page }) => {
  const name = `E2E tax ${Date.now()}`;
  const { ext, close } = await openExtension(page, 'tax_manager');
  try {
    await expect(ext.getByText('No tax policy adopted yet.')).toBeVisible({ timeout: 120_000 });

    // Nothing to adopt until a tax is on the draft.
    const adopt = ext.getByRole('button', { name: /^(Adopt|Propose for a vote)$/ });
    await expect(adopt).toBeDisabled();

    await ext.getByRole('button', { name: '+ Flat tax' }).click();
    await expect(adopt).toBeEnabled();
    await ext.getByLabel('Name').first().fill(name);
    await ext.getByLabel(/^Amount/).first().fill('25');
    await ext.getByLabel('Note for this version').fill('Added by the tax UI test');

    await adopt.click();

    // Adopted at once, or turned into a proposal when the realm votes on its taxes.
    await expect(ext.getByText(/Tax policy adopted|Proposal .* created/)).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByText('No tax policy adopted yet.')).toBeHidden({ timeout: 60_000 });
    await expect(ext.getByText(name).first()).toBeVisible();
  } finally {
    await close();
  }
});
