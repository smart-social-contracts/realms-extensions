import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// The tags of a proposal on a real local realm (realms local start, realms local setup, then
// codex_viewer/tests/e2e/seed_local_realm.py, which files the tagged proposals: its README.md). Run with
// `--bulk-proposals 3600` as well for the last test, which times a tag search over a year of the JGL's proposals.

const OUT = join(__dirname, '..', 'test-results');

/** The proposals that carry one of ``tags``: the realm filters a page of rows at a time, so every page is read. */
function findTagged(tags: string[]): any[] {
  const found: any[] = [];
  let from: number | null = 1;
  while (from != null) {
    const reply: Record<string, any> = realmCall('proposal_list', { from, count: 500, tags });
    found.push(...reply.proposals);
    from = reply.next;
  }
  return found;
}

/** What the realm says when it refuses ``name`` (the command line fails, and its output holds the reply). */
function refusal(name: string, args: Record<string, unknown>): string {
  try {
    realmCall(name, args);
  } catch (e: any) {
    return `${e.stdout ?? ''}${e.message ?? ''}`;
  }
  throw new Error(`${name} was not refused`);
}

test.use({ viewport: { width: 1280, height: 1500 } });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

test('the list shows the tags of the seeded proposals and a tag filter asks the realm for them', async ({ page }) => {
  const voting = await openExtension(page, 'voting');
  try {
    const cards = voting.ext.locator('[data-proposal-id]');
    await expect(cards.first()).toBeVisible({ timeout: 120_000 });
    await expect(voting.ext.locator('[data-proposal-id]', { hasText: 'Bike lane on Main Street' }).getByTestId('card-tag')).toHaveText(['mobility', 'district-3']);
    await expect(voting.ext.locator('[data-proposal-id]', { hasText: 'A proposal filed without tags' }).getByTestId('card-tag')).toHaveCount(0);
    await page.screenshot({ path: join(OUT, 'local-voting-tags-list.png'), fullPage: true });

    const input = voting.ext.getByTestId('tag-filter').getByTestId('tag-input');
    await input.fill('mobility');
    await input.press('Enter');
    await expect(voting.ext.locator('[data-proposal-id]', { hasText: 'Plant 40 trees' })).toHaveCount(0, { timeout: 60_000 });
    await expect(voting.ext.locator('[data-proposal-id]', { hasText: 'Close Carrer Major' })).toBeVisible();
    await expect(voting.ext.locator('[data-proposal-id]', { hasText: 'Bike lane on Main Street' })).toBeVisible();
    await page.screenshot({ path: join(OUT, 'local-voting-tags-filter.png'), fullPage: true });
  } finally {
    await voting.close();
  }
});

test('a proposal filed with tags in the form carries them in the realm, as the realm stores them', async ({ page }) => {
  const voting = await openExtension(page, 'voting');
  try {
    await voting.ext.getByRole('button', { name: 'Submit Proposal' }).first().click();
    await expect(voting.ext.getByTestId('tag-picker')).toBeVisible({ timeout: 120_000 });
    await expect(voting.ext.getByTestId('tags-hint')).toContainText('At most 16 tags of 1 to 64 characters each');
    await voting.ext.locator('#rt-title').fill('Resurface Carrer del Mar');
    await voting.ext.locator('#rt-desc').fill('Filed from the form with tags');
    const input = voting.ext.getByTestId('tag-picker').getByTestId('tag-input');
    for (const tag of ['mobility', 'district-3', 'Carrer del Mar']) {
      await input.fill(tag);
      await input.press('Enter');
    }
    await page.screenshot({ path: join(OUT, 'local-voting-tags-form.png'), fullPage: true });
    await voting.ext.locator('button[type="submit"]').click();
    await expect(voting.ext.getByText(/Proposal P-\d+ submitted/)).toBeVisible({ timeout: 120_000 });

    const found = findTagged(['Carrer del Mar']);
    expect(found.at(-1).title).toBe('Resurface Carrer del Mar'); // the latest, when the spec has run before
    expect(found.at(-1).tags).toEqual(['mobility', 'district-3', 'Carrer del Mar']);
  } finally {
    await voting.close();
  }
});

test('the realm refuses what the form refuses: 17 tags, and a tag of 65 characters', async () => {
  const sixteen = Array.from({ length: 16 }, (_, i) => `t${i}`);
  const filed = (tags: string[]) => refusal('proposal_create', { title: 'x', description: 'y', tags });
  expect(filed([...sixteen, 'one more'])).toMatch(/at most 16 tags/);
  expect(filed(['x'.repeat(65)])).toMatch(/1 to 64 code points/);
  expect(filed([' padded'])).toMatch(/no whitespace at either end/);
  expect(filed(['a', 'a'])).toMatch(/each named once/);
});

test('a search for a tag only the last of a year of proposals carries, timed', async ({ page }) => {
  test.skip(!process.env.JGL_YEAR, 'JGL_YEAR=<number of proposals the seed filed with --bulk-proposals>');
  const total = Number(process.env.JGL_YEAR);
  const calls: number[] = [];
  let from: number | null = 1;
  const started = Date.now();
  while (from != null) {
    const t = Date.now();
    const reply: Record<string, any> = realmCall('proposal_list', { from, count: 500, tags: ['rare-last'] });
    calls.push(Date.now() - t);
    from = reply.next;
    if (reply.proposals.length) expect(reply.proposals.map((p: any) => p.tags)).toEqual([expect.arrayContaining(['rare-last'])]);
  }
  console.log(`tag search over ${total} proposals: ${calls.length} calls of 500 rows, ${calls.map((ms) => `${ms} ms`).join(', ')}; ${Date.now() - started} ms in all (each includes the CLI's own start)`);
  expect(calls.length).toBe(Math.ceil((total + 6) / 500)); // the seed's six tagged proposals come first

  const voting = await openExtension(page, 'voting');
  try {
    const input = voting.ext.getByTestId('tag-filter').getByTestId('tag-input');
    await expect(input).toBeVisible({ timeout: 120_000 });
    const shown = Date.now();
    await input.fill('rare-last');
    await input.press('Enter');
    await expect(voting.ext.locator('[data-proposal-id]')).toHaveCount(1, { timeout: 300_000 });
    console.log(`the page found it in ${Date.now() - shown} ms`);
    await page.screenshot({ path: join(OUT, 'local-voting-tags-rare.png'), fullPage: true });
  } finally {
    await voting.close();
  }
});
