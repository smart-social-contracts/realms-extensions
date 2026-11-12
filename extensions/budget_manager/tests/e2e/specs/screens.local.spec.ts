import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// The three screens of budget_manager 2.2.0 on a real local realm, seeded by
// `codex_viewer/tests/e2e/seed_local_realm.py --budget-screens` (the realm is a capital with two quarters, which the
// seed makes it: use a realm of its own). Each screen is checked against what the realm itself says.
const OUT = join(__dirname, '..', 'test-results');
const ZONE = 'Europe/Madrid'; // the seed sets the realm's time zone
// The realm's money has two decimals; the page writes it as the browser does.
const money = (raw: number, symbol = 'REALM') => `${(raw / 100).toLocaleString('en-US', { maximumFractionDigits: 4 })} ${symbol}`;
const day = (epoch: number) => new Date(epoch * 1000).toLocaleDateString('sv-SE', { timeZone: ZONE });

test.use({ viewport: { width: 1280, height: 1200 } });
test.describe.configure({ mode: 'serial' });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

async function open(page: Page) {
  const { ext, close } = await openExtension(page, 'budget_manager');
  await expect(ext.getByRole('button', { name: 'Budgets' })).toBeVisible({ timeout: 120_000 });
  return { ext, close };
}

test('the spending stages of each expense line, the totals of each fund and of the budget', async ({ page }) => {
  const { budgets } = realmCall('budget_list');
  const adopted = budgets.filter((b: any) => b.kind === 'expense' && ['adopted', 'extended'].includes(b.status));
  const { ext, close } = await open(page);
  try {
    await ext.getByRole('button', { name: 'Budgets' }).click();
    const stages = ext.getByTestId('stages');
    const figures = (b: any) => [money(b.planned), money(b.reserved), money(b.committed), money(b.actual), money(b.planned - b.reserved - b.committed - b.actual)];
    for (const line of adopted) {
      await expect(stages.locator(`[data-line="${line.id}"]`).getByRole('cell')).toHaveText([line.category.replace(/_/g, ' '), '', ...figures(line)]);
    }
    const sum = (key: string) => adopted.reduce((total: number, b: any) => total + b[key], 0);
    const total = { planned: sum('planned'), reserved: sum('reserved'), committed: sum('committed'), actual: sum('actual') };
    await expect(stages.locator('[data-total="budget"]').getByRole('cell')).toHaveText(['Total budget', '', ...figures(total)]);
    for (const fund of new Set(adopted.map((b: any) => b.fund))) {
      await expect(stages.locator(`[data-total="${fund}"]`)).toBeVisible();
    }
    // The line of ggg's example holds money in every stage, and the bar says how much of it.
    const capital = adopted.find((b: any) => b.category === 'capital');
    expect(capital.reserved).toBeGreaterThan(0);
    expect(capital.committed).toBeGreaterThan(0);

    // Lines not in force plan only.
    const pending = stages.getByTestId('unadopted').getByRole('listitem');
    await expect(pending).toHaveCount(budgets.filter((b: any) => ['draft', 'proposed'].includes(b.status)).length);
    await expect(pending.filter({ hasText: 'street lighting' })).toContainText('Draft');
    await expect(pending.filter({ hasText: 'schools' })).toContainText('Proposed');
    await page.screenshot({ path: join(OUT, 'real-stages.png'), fullPage: true });
  } finally {
    await close();
  }
});

test('the scheduled payments: due days, the overdue one marked, the cancelled one, the line each is charged to', async ({ page }) => {
  const now = Math.floor(Date.now() / 1000);
  const scheduled = realmCall('transfer_list', { status: 'scheduled' }).transfers;
  const cancelled = realmCall('transfer_list', { status: 'cancelled' }).transfers;
  expect(scheduled.length).toBeGreaterThanOrEqual(3);
  expect(cancelled.length).toBeGreaterThanOrEqual(1);
  const { ext, close } = await open(page);
  try {
    await ext.getByRole('button', { name: 'Scheduled payments' }).click();
    const payments = ext.getByTestId('payments');
    await expect(payments.locator('[data-payment]')).toHaveCount(scheduled.length + cancelled.length, { timeout: 60_000 });
    for (const t of scheduled) {
      const row = payments.locator(`[data-payment="${t.id}"]`);
      await expect(row.getByRole('cell').nth(0)).toHaveText(day(t.due_at));
      await expect(row.getByRole('cell').nth(3)).toHaveText(money(t.amount));
      if (t.due_at < now) {
        await expect(row.getByRole('cell').nth(5)).toHaveText(`Overdue since ${day(t.due_at)}`);
        await expect(row).toHaveClass(/bg-red-50/);
      } else {
        await expect(row.getByRole('cell').nth(5)).toHaveText('Scheduled');
      }
      await expect(row.getByRole('cell').nth(4).getByRole('button')).toContainText(/^ROADS|WELFARE/); // linked to its line
    }
    for (const t of cancelled) {
      await expect(payments.locator(`[data-payment="${t.id}"]`).getByRole('cell').nth(5)).toHaveText('Cancelled, unpaid');
    }
    await page.screenshot({ path: join(OUT, 'real-payments.png'), fullPage: true });

    const overdue = scheduled.filter((t: any) => t.due_at < now);
    await payments.getByRole('button', { name: 'Overdue' }).click();
    await expect(payments.locator('[data-payment]')).toHaveCount(overdue.length);
    await page.screenshot({ path: join(OUT, 'real-payments-overdue.png'), fullPage: true });
    await payments.getByRole('button', { name: 'Due this month' }).click();
    const month = (epoch: number) => day(epoch).slice(0, 7);
    await expect(payments.locator('[data-payment]')).toHaveCount(scheduled.filter((t: any) => month(t.due_at) === month(now)).length);
  } finally {
    await close();
  }
});

test('the sweep rules and the sweeps of the quarters, with the capital\'s booking of each', async ({ page }) => {
  const rules = realmCall('budget_view').config.sweep;
  const { sweeps } = realmCall('sweep_list');
  expect(rules.length).toBe(2);
  expect(sweeps.length).toBe(3);
  const { ext, close } = await open(page);
  try {
    await ext.getByRole('button', { name: 'Quarter sweeps' }).click();
    const screen = ext.getByTestId('sweeps');
    await expect(screen.getByRole('heading', { name: 'Sweeps from the quarters' })).toBeVisible();
    await expect(screen.getByTestId('rules').getByRole('row')).toHaveCount(rules.length + 1);
    for (const s of sweeps) {
      const row = screen.locator(`[data-sweep="${s.id}"]`);
      await expect(row.getByRole('cell').nth(0)).toHaveText(day(s.created_at));
      await expect(row.getByRole('cell').nth(3)).toContainText(money(s.amount));
      await expect(row.getByRole('cell').nth(4)).toContainText('Booked');
      // The booking on the capital's books: the ledger entries that name the sweep (needs ledger_view's `sweep`).
      await expect(row.getByRole('cell').nth(5)).toContainText('Booked as T-');
      await expect(row.getByRole('cell').nth(5).getByRole('listitem')).toHaveText([`cash: debit ${money(s.amount)}`, `sweep: credit ${money(s.amount)}`]);
    }
    await page.screenshot({ path: join(OUT, 'real-sweeps.png'), fullPage: true });
  } finally {
    await close();
  }
});

test('a plain member reads the stages and the sweep rules, not the payments or the books of the sweeps', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'budget_manager', { asMember: true });
  try {
    await expect(ext.getByTestId('stages')).toBeVisible({ timeout: 120_000 });
    await expect(ext.getByTestId('stages').getByTestId('unadopted')).toHaveCount(0);
    await expect(ext.getByRole('button', { name: 'Scheduled payments' })).toHaveCount(0);
    await ext.getByRole('button', { name: 'Quarter sweeps' }).click();
    await expect(ext.getByTestId('rules')).toBeVisible();
    await expect(ext.getByText('Only those who may read the treasury see the sweeps.')).toBeVisible();
    await page.screenshot({ path: join(OUT, 'real-member.png'), fullPage: true });
  } finally {
    await close();
  }
});
