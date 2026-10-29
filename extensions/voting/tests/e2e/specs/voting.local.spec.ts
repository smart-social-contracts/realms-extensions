import { expect, test } from '@playwright/test';
import { openExtension, readOp } from '../../../../_shared/testing/e2e/local-realm';

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

test('a member submits a proposal, votes yes on it, and the realm records both', async ({ page }) => {
  const title = `E2E poll ${Date.now()}`;
  const { ext, principal, close } = await openExtension(page, 'voting');
  try {
    await ext.getByRole('button', { name: 'Submit Proposal' }).click({ timeout: 120_000 });
    await ext.locator('#rt-title').fill(title);
    await ext.locator('#rt-desc').fill('Created by the voting UI test; safe to ignore.');
    await ext.locator('form button[type="submit"]').click();
    await expect(ext.getByText(/Proposal \S+ submitted/)).toBeVisible({ timeout: 120_000 });

    // The realm has it, open for voting, proposed by the signed-in admin.
    const listed = await readOp('proposal_list', { status: 'voting' });
    expect(listed.ok, JSON.stringify(listed)).toBe(true);
    const mine = (listed.proposals as { id: string; title: string; proposer: string }[]).find((p) => p.title === title);
    expect(mine, `"${title}" is among the proposals in voting`).toBeDefined();
    expect(mine!.proposer).toBe(principal);

    // Back on the list, vote yes on that card.
    const card = ext.getByText(title).locator('xpath=ancestor::div[.//button[normalize-space()="Yes"]][1]');
    await card.getByRole('button', { name: 'Yes' }).click();

    await expect
      .poll(
        async () => {
          const got = await readOp('proposal_get', { proposal: mine!.id });
          return ((got.votes ?? []) as { voter: string; choice: string }[]).map((v) => `${v.voter}:${v.choice}`);
        },
        { message: "the admin's yes is recorded", timeout: 60_000 },
      )
      .toContain(`${principal}:yes`);
  } finally {
    await close();
  }
});
