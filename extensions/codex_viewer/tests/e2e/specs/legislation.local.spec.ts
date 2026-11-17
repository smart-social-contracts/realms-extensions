import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { FrameLocator } from '@playwright/test';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// The codex page and the install proposal on a real local realm (realms local start, realms local setup, then
// `seed_local_realm.py`: README.md). The realm is built from realms-gos with codex_views and official_timezone. The
// tests run in order, change the realm (a check makes the seeded source unknown, the last test reverts the codex) and
// so need a realm seeded again before each run.

const OUT = join(__dirname, '..', 'test-results');
const CODEX_PAGE = '/extensions/codex_viewer';

test.describe.configure({ mode: 'serial' });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));
test.use({ viewport: { width: 1280, height: 1500 } });

const status = () => realmCall('codex_status', { count: 1 });

/** The realm shows an extension's message in a dialog that blocks the page until it is closed. */
async function readMessage(ext: FrameLocator, message: string | RegExp) {
  await expect(ext.getByText(message)).toBeVisible();
  await ext.getByText('Close', { exact: true }).click();
}

test('an admin reads the codex in force, the compliance against Spain and the failing chapters', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'codex_viewer');
  try {
    await expect(ext.getByRole('heading', { name: 'Legislation in force' })).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByTestId('health')).toHaveText('Failing');
    // The realm is on Madrid time: the official time of a realm-wide moment is Madrid's.
    await expect(ext.getByTestId('in-force')).toContainText('Europe/Madrid');
    await expect(ext.getByTestId('in-force').getByRole('row')).toHaveCount(5); // the header and the four layers
    await expect(ext.getByTestId('compliance')).toHaveText('Not compliant');
    await expect(ext.getByTestId('release')).toContainText('eu/es 2.4.0 is published');
    await expect(ext.getByTestId('failures').getByRole('row')).toHaveCount(3);
    await expect(ext.getByTestId('failures')).toContainText('ValueError: no rate for ibi_urban');
    // An admin holds every permission, so the revert is offered to them too: under the team's policy (§10.2).
    await expect(ext.getByRole('button', { name: 'Revert to the previous codex' })).toBeVisible();

    // The flattened view (§5.9) of the town's tax chapter, as the real realm computes it.
    await ext.getByTestId('views').getByLabel('Domain').selectOption('tax');
    await expect(ext.getByTestId('view-table')).toContainText('ibi_urban_cap');
    await expect(ext.getByTestId('view-table')).toContainText('forbid');
    await expect(ext.getByTestId('view-table')).toContainText('compute_tax_assess');
    await expect(ext.getByTestId('view-table')).toContainText('TRLRHL');
    await expect(ext.getByTestId('views')).toContainText('eu/es → eu/es/vc/46250-valencia');
    await page.screenshot({ path: join(OUT, 'local-codex-page.png'), fullPage: true });
  } finally {
    await close();
  }
});

test('Propose install files the release for a vote, and the voting page says what it installs', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'codex_viewer');
  let proposal = '';
  try {
    await ext.getByRole('button', { name: 'Propose install' }).click({ timeout: 120_000 });
    await readMessage(ext, /^Proposal P-\d+ filed$/);
    await expect(ext.getByRole('button', { name: /^Proposal P-\d+$/ })).toBeVisible();
    const filed = realmCall('proposal_list', { status: 'voting' }).proposals.at(-1);
    proposal = filed.id;
    const { proposal: row } = realmCall('proposal_get', { proposal });
    expect(row.action).toEqual({ op: 'codex_install', args: { source: 'eu/es', version: '2.4.0' } });
    expect(row.title).toBe('Install eu/es 2.4.0');
  } finally {
    await close();
  }
  // A page signs in once: the voting page opens in another.
  const votingPage = await page.context().newPage();
  const voting = await openExtension(votingPage, 'voting', { path: `/extensions/voting/proposals/${proposal.replace('P-', '')}` });
  try {
    await expect(voting.ext.getByTestId('release-install')).toContainText('Installs release 2.4.0 of eu/es whole.', { timeout: 120_000 });
    await votingPage.screenshot({ path: join(OUT, 'local-voting-release.png'), fullPage: true });
  } finally {
    await voting.close();
  }
});

test('an install an upgrade paused is resumed by an admin: its step runs again, and its failure is shown', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'codex_viewer');
  try {
    await expect(ext.getByTestId('job-status')).toHaveText('Paused', { timeout: 120_000 });
    await page.screenshot({ path: join(OUT, 'local-paused-job.png'), fullPage: true });
    await ext.getByRole('button', { name: 'Resume install' }).click();
    await readMessage(ext, 'Install J-1 resumed');
    // The job's change list is nobody's: its step cannot do its work, and the page says why.
    await expect(ext.getByTestId('job-status')).toHaveText('Failed', { timeout: 60_000 });
    await expect(ext.getByTestId('job-error')).not.toHaveText('');
    await page.screenshot({ path: join(OUT, 'local-failed-job.png'), fullPage: true });
  } finally {
    await close();
  }
});

test('an admin sets the interval and checks now', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'codex_viewer');
  try {
    const hours = status().check.interval === 6 ? 12 : 6; // a different interval from the one now, or Save stays off
    await ext.getByLabel('Hours between checks').fill(String(hours), { timeout: 120_000 });
    await ext.getByRole('button', { name: 'Save' }).click();
    await readMessage(ext, `The sync sources are now checked every ${hours} hours`);
    expect(status().check.interval).toBe(hours);
    await ext.getByRole('button', { name: 'Check now' }).click();
    await readMessage(ext, 'Checking the sync sources now');
    await expect(ext.getByText(`Checked every ${hours} hours.`)).toBeVisible();
    // The check is real, and the seeded source is a realm that does not exist: it reads "unknown", with the reason.
    await expect(ext.getByTestId('compliance')).toHaveText('Unknown', { timeout: 60_000 });
    await expect(ext.getByTestId('source-error')).toBeVisible();
    await page.screenshot({ path: join(OUT, 'local-source-unknown.png'), fullPage: true });
  } finally {
    await close();
  }
});

test('a member who holds a seat of the IT team reverts the codex; the realm runs the one it replaced', async ({ page }) => {
  const before = status().codex;
  const { ext, principal, close } = await openExtension(page, 'codex_viewer', { asMember: true });
  try {
    await expect(ext.getByRole('heading', { name: 'Legislation in force' })).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByRole('button', { name: 'Revert to the previous codex' })).toHaveCount(0); // a member, not on the team
    realmCall('appoint', { position: 'it.seat', user: principal });
    await page.reload();
    await ext.getByRole('button', { name: 'Revert to the previous codex' }).click({ timeout: 120_000 });
    await expect(ext.getByTestId('revert-confirm')).toContainText(before.previous.slice(0, 15));
    await page.screenshot({ path: join(OUT, 'local-revert-confirm.png'), fullPage: true });
    await ext.getByRole('button', { name: 'Revert', exact: true }).click();
    await readMessage(ext, 'The previous codex is restored');
    await expect.poll(() => status().codex.id, { timeout: 60_000 }).toBe(before.previous);
    await expect(ext.getByTestId('health')).toHaveText('Healthy');
    await expect(ext.getByTestId('in-force').getByRole('row')).toHaveCount(5);
    await page.screenshot({ path: join(OUT, 'local-after-revert.png'), fullPage: true });
  } finally {
    await close();
  }
});
