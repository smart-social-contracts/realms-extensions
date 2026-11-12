import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// The kind of an organisation on a real local realm (realms local start, realms local setup, then
// codex_viewer/tests/e2e/seed_local_realm.py, which registers one organisation of each kind and one without a kind).

const OUT = join(__dirname, '..', 'test-results');

test.use({ viewport: { width: 1280, height: 900 } });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

test('the organisations show their kinds, and the kind filter asks the realm for one', async ({ page }) => {
  const explorer = await openExtension(page, 'admin_dashboard');
  try {
    await explorer.ext.locator('#entity-type-select').selectOption('Organization', { timeout: 120_000 });
    const chips = explorer.ext.getByTestId('org-kind');
    // other seeds may add organisations of their own: each seeded one is looked for by name
    const row = (name: string) => explorer.ext.locator('div.p-4', { hasText: name });
    await expect(row('Old Registry')).toBeVisible({ timeout: 60_000 });
    for (const [name, kind] of [['Clinic B', 'Company'], ['Harbour Party', 'Party'], ['Dockers', 'Union'], ['Friends of the Park', 'Association'], ['Cooperativa del Mar', 'Other'], ['Old Registry', 'Unknown']]) {
      await expect(row(name).getByTestId('org-kind')).toHaveText(kind);
    }
    await page.screenshot({ path: join(OUT, 'local-admin-org-kind-list.png'), fullPage: true });

    await explorer.ext.locator('#org-kind-select').selectOption('party');
    await expect(chips).toHaveText(['Party'], { timeout: 60_000 });
    await expect(explorer.ext.getByText('Harbour Party')).toBeVisible();
    await page.screenshot({ path: join(OUT, 'local-admin-org-kind-filter.png'), fullPage: true });

    // the same answer from the realm itself
    const found = realmCall('organization_list', { kind: 'party', count: 100 }).organizations;
    expect(found.map((o: any) => o.id)).toEqual(['Harbour Party']);
    expect(realmCall('organization_list', { count: 100 }).organizations.find((o: any) => o.id === 'Old Registry').kind).toBe('');
  } finally {
    await explorer.close();
  }
});

test('a plain member, whom the realm does not let read organisations, is told what is missing', async ({ page }) => {
  const explorer = await openExtension(page, 'admin_dashboard', { asMember: true });
  try {
    await explorer.ext.locator('#entity-type-select').selectOption('Organization', { timeout: 120_000 });
    await expect(explorer.ext.getByText('Additional permissions needed')).toBeVisible({ timeout: 60_000 });
    await expect(explorer.ext.getByTestId('org-kind')).toHaveCount(0);
    await page.screenshot({ path: join(OUT, 'local-admin-org-kind-member.png'), fullPage: true });
  } finally {
    await explorer.close();
  }
});
