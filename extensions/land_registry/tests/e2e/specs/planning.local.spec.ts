import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// Planning on a real local realm (realms local start, realms local setup, then codex_viewer/tests/e2e/seed_local_realm.py, which defines
// two planning zones, registers four parcels in them and files two licences that name one of the parcels).

const OUT = join(__dirname, '..', 'test-results');

test.use({ viewport: { width: 1440, height: 1000 } });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

/** The id of the parcel the seed registered at ``x``. */
const parcelAt = (x: number): string => realmCall('land_list', { count: 500 }).lands.find((land: any) => land.x === x).id;

test('the list names the zones of each parcel, and the filter keeps the parcels of a zone', async ({ page }) => {
  const registry = await openExtension(page, 'land_registry');
  try {
    const rows = registry.ext.locator('.parcel-row');
    await expect(rows.first()).toBeVisible({ timeout: 120_000 });
    await expect(registry.ext.getByTestId('parcel-zones')).toHaveText(['Seafront', 'Seafront, Old town', 'Old town']);
    await page.screenshot({ path: join(OUT, 'local-land-planning-list.png'), fullPage: true });

    await registry.ext.getByTestId('zone-filter').selectOption('old-town');
    await expect(rows).toHaveCount(2);
    await expect(registry.ext.getByTestId('zone-filter-count')).toHaveText('2 of 4 parcels');
    await page.screenshot({ path: join(OUT, 'local-land-planning-filter.png'), fullPage: true });
  } finally {
    await registry.close();
  }
});

test('a parcel shows its zones and the licences that name it', async ({ page }) => {
  const second = parcelAt(3);
  const registry = await openExtension(page, 'land_registry');
  try {
    await registry.ext.locator('.parcel-row', { hasText: second }).click({ timeout: 120_000 });
    await expect(registry.ext.getByTestId('parcel-zone')).toHaveText(['Seafront', 'Old town']);
    await expect(registry.ext.getByTestId('licence')).toHaveText([
      /building · Active · Org Seafront Estates · until 2030-01-01 01:00 Europe\/Madrid \(UTC\+01:00\)/,
      /demolition · Applied · Org Seafront Estates/,
    ]);
    await page.screenshot({ path: join(OUT, 'local-land-planning-parcel.png'), fullPage: true });

    await registry.ext.locator('.parcel-row', { hasText: parcelAt(0) }).click();
    await expect(registry.ext.getByText('No licence names this parcel.')).toBeVisible();
  } finally {
    await registry.close();
  }
});

test('an admin sets the zones of a parcel, and the realm holds them', async ({ page }) => {
  const third = parcelAt(6); // agricultural, in no zone
  const registry = await openExtension(page, 'land_registry');
  try {
    await registry.ext.locator('.parcel-row', { hasText: third }).click({ timeout: 120_000 });
    await expect(registry.ext.getByText('This parcel lies in no planning zone.')).toBeVisible();
    await registry.ext.locator('.zone-option', { hasText: 'Old town' }).locator('input').check();
    await page.screenshot({ path: join(OUT, 'local-land-planning-set-zones.png'), fullPage: true });
    await registry.ext.getByRole('button', { name: 'Save zones' }).click();
    await expect(registry.ext.getByText(`The zones of parcel ${third} are saved.`)).toBeVisible({ timeout: 120_000 });
    await expect(registry.ext.getByTestId('parcel-zone')).toHaveText(['Old town']);
    expect(realmCall('land_list', { count: 500 }).lands.find((land: any) => land.id === third).lies_in).toEqual(['old-town']);

    // put it back, as the other tests expect the seed's zones
    realmCall('land_zone_set', { land: third, zones: [] });
  } finally {
    await registry.close();
  }
});

test('a plain member sees what the realm lets them, and the reason they cannot set zones', async ({ page }) => {
  const registry = await openExtension(page, 'land_registry', { asMember: true });
  try {
    const rows = registry.ext.locator('.parcel-row');
    const denied = registry.ext.getByText('Additional permissions needed');
    await expect(rows.first().or(denied)).toBeVisible({ timeout: 120_000 });
    await page.screenshot({ path: join(OUT, 'local-land-planning-member.png'), fullPage: true });
    if (await denied.isVisible()) return; // the realm keeps its land from a member: nothing of planning shows either
    await rows.first().click();
    await expect(registry.ext.getByTestId('planning-reason')).toHaveText('Setting zones needs the realm.configure permission.');
    await expect(registry.ext.getByRole('button', { name: 'Save zones' })).toHaveCount(0);
  } finally {
    await registry.close();
  }
});
