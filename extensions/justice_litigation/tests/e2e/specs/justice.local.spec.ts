import { expect, test, type FrameLocator } from '@playwright/test';
import { openExtension, randomPrincipal } from '../../../../_shared/testing/e2e/local-realm';

// The admin files a case at the default court against another party, then rules on it.
// Checked through the extension's own UI.

async function fileCase(ext: FrameLocator, title: string) {
  await ext.getByRole('button', { name: 'Create litigation', exact: true }).click({ timeout: 120_000 });

  // The extension sets up a default court when it is installed, so the case has somewhere to be filed.
  await expect(ext.getByText(/Filing at:/)).toBeVisible({ timeout: 120_000 });
  await expect(ext.getByText('Default Court').first()).toBeVisible();

  // Nothing to file without a defendant, a title and a description.
  const create = ext.getByRole('button', { name: 'Create Litigation', exact: true });
  await expect(create).toBeDisabled();
  await ext.locator('#jl-defendant').fill(randomPrincipal());
  await ext.locator('#jl-title').fill(title);
  await expect(create).toBeDisabled();
  await ext.locator('#jl-desc').fill('Created by the justice UI test; safe to ignore.');
  await expect(create).toBeEnabled();

  await create.click();
  await expect(ext.getByText('Litigation case created!')).toBeVisible({ timeout: 120_000 });

  // The admin sees it among all litigations.
  await ext.getByRole('button', { name: 'All litigations', exact: true }).click();
  await expect(ext.getByText(title).first()).toBeVisible({ timeout: 60_000 });
}

test('an admin files a litigation case at the default court', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'justice_litigation');
  try {
    await fileCase(ext, `E2E case ${Date.now()}`);
  } finally {
    await close();
  }
});

test('an admin rules on a case and the case is resolved', async ({ page }) => {
  const title = `E2E ruling ${Date.now()}`;
  const { ext, close } = await openExtension(page, 'justice_litigation');
  try {
    await fileCase(ext, title);

    // Open the case: an admin who is not a party can rule on it.
    await ext.getByText(title).first().click();
    const execute = ext.getByRole('button', { name: 'Execute Verdict', exact: true });
    await expect(execute.first()).toBeVisible({ timeout: 60_000 });
    await execute.first().click();

    // The decision is required.
    await expect(ext.locator('#jl-verdict-decision')).toBeVisible();
    await expect(execute.last()).toBeDisabled();
    await ext.locator('#jl-verdict-decision').fill('for the plaintiff');
    await ext.locator('#jl-verdict-reasoning').fill('Ruled by the justice UI test.');
    await expect(execute.last()).toBeEnabled();
    await execute.last().click();
    await expect(ext.getByText('Verdict issued!')).toBeVisible({ timeout: 120_000 });
    await expect(ext.locator('#jl-verdict-decision')).toBeHidden({ timeout: 30_000 });

    // Reopened from the list, the case holds the verdict and can no longer be ruled on.
    await ext.getByRole('button', { name: 'All litigations', exact: true }).click();
    await ext.getByText(title).first().click();
    await expect(ext.getByText('For the plaintiff')).toBeVisible({ timeout: 60_000 });
    await expect(ext.getByText('Ruled by the justice UI test.')).toBeVisible();
    await expect(execute).toHaveCount(0);
  } finally {
    await close();
  }
});
