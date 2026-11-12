import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// The procurement screens on a real local realm: `realms local start` from a realms-gos build that has contract_list and
// the added fields of contract_get, then `seed_local_realm.py --only procurement` (README.md). The tests run in order and
// change the realm (an amendment is filed, a lot is awarded, another left unawarded, a tender created), so the realm is
// seeded again (`realms local start --fresh`) before each run. Screenshots land in test-results/.

const OUT = join(__dirname, '..', 'test-results');

test.describe.configure({ mode: 'serial' });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));
test.use({ viewport: { width: 1280, height: 1500 } });

const SLOW = { timeout: 120_000 };

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(OUT, `local-${name}.png`), fullPage: true });
}

async function contractsTab(ext: FrameLocator) {
  await ext.getByRole('tab', { name: 'Contracts' }).click(SLOW);
}

async function openContract(ext: FrameLocator, title: string) {
  await contractsTab(ext);
  await ext.getByTestId('contract-row').filter({ hasText: title }).getByRole('button', { name: 'Open' }).click(SLOW);
  await expect(ext.getByTestId('contract-page')).toBeVisible();
}

const contractOf = (title: string) =>
  realmCall('contract_list', { count: 500 }).contracts.find((c: { title: string }) => c.title === title);

test('the contracts list: supplier, value, term, status and the call-offs filter, as the real realm answers', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement');
  try {
    await contractsTab(ext);
    const rows = ext.getByTestId('contract-row');
    await expect(rows).toHaveCount(4, SLOW);
    const lane = rows.filter({ hasText: 'Bike lane works' }).filter({ hasNotText: 'old town' });
    await expect(lane).toContainText('BuildCo');
    await expect(lane).toContainText('50,000 REALM');
    await expect(lane).toContainText('Active');
    await expect(lane).toContainText(/\d{4}-\d{2}-\d{2} → \d{4}-\d{2}-\d{2}/);
    // The contract of lot 1 of the tender: the realm made it at the award, and it names its lot.
    await expect(rows.filter({ hasText: 'old town: Bike lanes' })).toContainText('Lot 1');
    await shot(page, 'contracts-list');

    await ext.getByRole('button', { name: /^Framework call-offs \(2\)$/ }).click();
    await expect(rows).toHaveCount(2);
    await expect(ext.getByTestId('call-off-badge')).toHaveCount(2);
    await shot(page, 'contracts-call-offs');
  } finally {
    await close();
  }
});

test('the contract page and its amendments, oldest first, as the realm recorded them', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement');
  try {
    await openContract(ext, 'Bike lane works');
    const lane = contractOf('Bike lane works');
    const detail = realmCall('contract_get', { contract: lane.id });

    await expect(ext.getByTestId('contract-supplier')).toHaveText('BuildCo');
    await expect(ext.getByTestId('contract-value')).toHaveText('50,000 REALM');
    await expect(ext.getByTestId('contract-paid')).toHaveText('12,000 REALM of 50,000 REALM');
    await expect(ext.getByTestId('contract-budget')).toContainText('ROADS · capital · FY2026');
    await expect(ext.getByTestId('contract-origin')).toContainText('Bike lane along the river');
    const split = ext.getByTestId('contract-split');
    await expect(split).toContainText('12,000 REALM');
    await expect(split).toContainText('38,000 REALM');

    const amendments = ext.getByTestId('amendment');
    await expect(amendments).toHaveCount(2);
    // The first the department decided alone (the end of the term moved); the second a proposal carried (the split).
    await expect(amendments.nth(0).getByTestId('amendment-change')).toHaveCount(1);
    await expect(amendments.nth(0).getByTestId('amendment-change')).toContainText('Ends:');
    await expect(amendments.nth(0).getByTestId('amendment-decision')).toHaveText('Applied directly by the governing department, without a proposal.');
    await expect(amendments.nth(1).getByTestId('amendment-change')).toContainText('Split by year');
    await expect(amendments.nth(1).getByTestId('amendment-decision')).toContainText(/^Carried by proposal P-\d+$/);
    await expect(amendments.nth(1).getByTestId('amendment-at')).toContainText(/Took effect \d{4}-\d{2}-\d{2} \d{2}:\d{2} /);
    expect(detail.amendments.map((a: { proposal: string }) => a.proposal)).toEqual(['', expect.stringMatching(/^P-\d+$/)]);

    // The rule the form states is the realm's own: what has been paid, and who governs, by vote.
    await expect(ext.getByTestId('amend-floor')).toContainText('cannot be set below 12,000 REALM');
    await expect(ext.getByTestId('amend-vote')).toContainText('Infrastructure governs this contract and decides by vote');
    expect([detail.governed_by, detail.needs_vote]).toEqual(['Infrastructure', true]);
    await shot(page, 'contract-page');
  } finally {
    await close();
  }
});

test('an amendment below what has been paid is refused by the realm, and one that is allowed opens a proposal', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement');
  try {
    await openContract(ext, 'Bike lane works');
    const form = ext.getByTestId('amendment-form');
    await form.getByRole('textbox').first().fill('10000');
    await form.getByTestId('split-row').nth(1).getByRole('button', { name: 'Remove' }).click();
    await form.getByTestId('split-row').nth(0).getByRole('button', { name: 'Remove' }).click();
    await form.getByRole('button', { name: 'Propose the amendment' }).click();
    await expect(ext.getByTestId('amend-error')).toContainText(/below the \d+ paid/, SLOW);
    await shot(page, 'amendment-refused');

    await form.getByRole('textbox').first().fill('45000');
    await form.getByRole('button', { name: 'Add a period' }).click();
    await form.getByTestId('split-row').nth(0).getByRole('textbox').nth(0).fill('FY2026');
    await form.getByTestId('split-row').nth(0).getByRole('textbox').nth(1).fill('15000');
    await form.getByRole('button', { name: 'Add a period' }).click();
    await form.getByTestId('split-row').nth(1).getByRole('textbox').nth(0).fill('FY2027');
    await form.getByTestId('split-row').nth(1).getByRole('textbox').nth(1).fill('30000');
    await expect(form.getByTestId('split-total')).toHaveText('The periods add up to 45,000 REALM of 45,000 REALM.');
    await form.getByRole('button', { name: 'Propose the amendment' }).click();
    await expect(ext.getByTestId('amend-filed')).toContainText(/^Proposal P-\d+ opened/, SLOW);
    await shot(page, 'amendment-filed');

    const proposal = (await ext.getByTestId('amend-filed').innerText()).match(/P-\d+/)![0];
    const filed = realmCall('proposal_get', { proposal }).proposal;
    expect(filed.action.op).toBe('contract_amend');
    expect(filed.action.args.contract).toBe(contractOf('Bike lane works').id);
    expect(filed.action.args.value).toBe(45_000 * 10 ** 8);
  } finally {
    await close();
  }
});

test('a call-off names the body that holds the agreement, its reference and its winners', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement');
  try {
    await openContract(ext, 'Electricity for the council buildings');
    const framework = ext.getByTestId('contract-framework');
    await expect(framework.getByTestId('framework-holder')).toHaveText('The Province (authority)', SLOW);
    await expect(framework.getByTestId('framework-reference')).toHaveText('AM-2025/04');
    await expect(framework.getByTestId('framework-winners')).toHaveText('BuildCo, RoadCorp');
    await shot(page, 'call-off-external');

    await ext.getByRole('button', { name: 'All contracts' }).click();
    await ext.getByTestId('contract-row').filter({ hasText: 'Street lighting' }).getByRole('button', { name: 'Open' }).click();
    // Another realm, which this one is not linked to: its capital, shortened.
    await expect(ext.getByTestId('framework-holder')).toContainText('Realm rrkah-…-cai', SLOW);
    await expect(ext.getByTestId('framework-winners')).toContainText('does not know the winners');
    await shot(page, 'call-off-realm');
  } finally {
    await close();
  }
});

test('a tender in lots: the table, the contract of an awarded lot, and each open lot awarded or left unawarded', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement');
  try {
    await ext.getByTestId('sections').getByRole('tab', { name: 'Requests' }).click(SLOW);
    await ext.getByRole('row').filter({ hasText: 'Bike lane works in the old town' }).getByRole('button', { name: 'Open', exact: true }).click(SLOW);
    const rows = ext.getByTestId('lot-row');
    await expect(rows).toHaveCount(3, SLOW);
    await expect(rows.nth(0)).toContainText('Bike lanes');
    await expect(rows.nth(0)).toContainText('40,000 REALM');
    await expect(rows.nth(0)).toContainText('Awarded');
    await expect(rows.nth(0)).toContainText('BuildCo'); // the best-scored bid of lot 1
    await expect(rows.nth(0).getByRole('cell').nth(3)).toHaveText('2');
    await expect(rows.nth(1)).toContainText('Open');
    await expect(rows.nth(2)).toContainText('Open');
    await expect(ext.getByTestId('lot-award')).toHaveCount(2);
    await shot(page, 'tender-lots');

    // The contract of lot 1 names its lot, and is worth the winning bid.
    await rows.nth(0).getByRole('button', { name: /^C-\d+$/ }).click();
    await expect(ext.getByTestId('contract-lot')).toContainText('Lot 1 — Bike lanes');
    await expect(ext.getByTestId('contract-value')).toHaveText('48,000 REALM');
    await shot(page, 'lot-contract');
    await ext.getByRole('button', { name: 'All contracts' }).click();
    await ext.getByTestId('sections').getByRole('tab', { name: 'Requests' }).click();
    await ext.getByRole('row').filter({ hasText: 'Bike lane works in the old town' }).getByRole('button', { name: 'Open', exact: true }).click();

    // Lot 2 to its best-scored bid; lot 3 left unawarded, with the reason.
    await ext.getByTestId('lot-award').filter({ hasText: 'Lot 2' }).getByRole('button', { name: 'Award this lot' }).click();
    await expect(ext.getByText(/^Lot 2 awarded to B-\d+ — contract C-\d+ signed$/)).toBeVisible(SLOW);
    await ext.getByTestId('lot-award').filter({ hasText: 'Lot 3' }).getByLabel('Reason for leaving the lot unawarded (optional)').fill('no bid within the estimate');
    await ext.getByTestId('lot-award').filter({ hasText: 'Lot 3' }).getByRole('button', { name: 'Leave this lot unawarded' }).click();
    await expect(ext.getByText('Lot 3 left without an award')).toBeVisible(SLOW);
    await expect(rows.nth(1)).toContainText('Awarded');
    await expect(rows.nth(2)).toContainText('Not awarded');
    await expect(ext.getByTestId('lot-award')).toHaveCount(0);
    const tender = realmCall('tender_list', { count: 500 }).tenders.find((t: { title: string }) => t.title === 'Bike lane works in the old town');
    expect(tender.lots.map((lot: { status: string }) => lot.status)).toEqual(['awarded', 'awarded', 'void']);
    expect(tender.status).toBe('contracted');
    await shot(page, 'tender-lots-decided');
  } finally {
    await close();
  }
});

test('a tender is created with lots, their budgets in the currency\'s base units', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement');
  try {
    await ext.getByRole('button', { name: 'New Request For Proposal' }).click(SLOW);
    await ext.getByLabel('Title', { exact: true }).fill('Bike racks for the schools');
    const form = ext.getByTestId('lots-form');
    await form.getByRole('button', { name: 'Add a lot' }).click();
    await form.getByRole('button', { name: 'Add a lot' }).click();
    const rows = form.getByTestId('lot-form-row');
    await rows.nth(0).getByPlaceholder('Lot').fill('north');
    await rows.nth(0).getByPlaceholder('Name').fill('North schools');
    await rows.nth(0).getByPlaceholder('Budget').fill('5000');
    await rows.nth(1).getByPlaceholder('Lot').fill('south');
    await rows.nth(1).getByPlaceholder('Name').fill('South schools');
    await shot(page, 'create-with-lots');
    await ext.getByRole('button', { name: 'Create draft' }).click();
    await expect(ext.getByText(/^Created T-\d+$/)).toBeVisible(SLOW);
    const created = realmCall('tender_list', { count: 500 }).tenders.find((t: { title: string }) => t.title === 'Bike racks for the schools');
    expect(created.lots).toEqual([
      { id: 'north', title: 'North schools', estimated_value: 5_000 * 10 ** 8, status: 'open', winner: null, contract: null },
      { id: 'south', title: 'South schools', estimated_value: null, status: 'open', winner: null, contract: null },
    ]);
  } finally {
    await close();
  }
});

test('a member without the permissions reads the contracts and the lots, and is offered no action', async ({ page }) => {
  const { ext, close } = await openExtension(page, 'procurement', { asMember: true });
  try {
    await openContract(ext, 'Bike lane works');
    await expect(ext.getByTestId('amendment')).toHaveCount(2, SLOW);
    await expect(ext.getByTestId('amend-floor')).toBeVisible();
    await expect(ext.getByTestId('amend-denied')).toBeVisible();
    await expect(ext.getByRole('button', { name: 'Propose the amendment' })).toHaveCount(0);
    await shot(page, 'member-contract');

    await ext.getByRole('button', { name: 'All contracts' }).click();
    await ext.getByTestId('sections').getByRole('tab', { name: 'Requests' }).click();
    await ext.getByRole('row').filter({ hasText: 'Bike lane works in the old town' }).getByRole('button', { name: 'Open', exact: true }).click();
    await expect(ext.getByTestId('lot-row')).toHaveCount(3, SLOW);
    await expect(ext.getByRole('button', { name: 'Award this lot' })).toHaveCount(0);
    await shot(page, 'member-lots');
  } finally {
    await close();
  }
});
