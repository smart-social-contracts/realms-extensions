import { expect, test, type Page } from '@playwright/test';
import {
  AMENDMENTS,
  CALL_OFF,
  DEPARTMENTS,
  EXTERNALS,
  INFO,
  LIST,
  ME,
  ORGANIZATIONS,
  OTHER_REALM,
  REALM_CALL_OFF,
  UNNAMED_REALM_CALL_OFF,
  contract,
  detail,
  startRealm,
  tender,
  TENDERS,
  type Scenario,
} from '../realm';

// A browser far from the realm: the days and times shown must be the realm's, not the browser's.
test.use({ viewport: { width: 1280, height: 1500 }, locale: 'en-US', timezoneId: 'America/New_York' });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
});
test.afterAll(() => close());

const AMENDER = ['proposal.create', 'contract.amend'];
const MEMBER = ['proposal.create'];

/** A realm whose contracts are `contracts`; `me` is left out for a visitor (`permissions` null). */
function realm(permissions: string[] | null, contracts: unknown[], replies: Record<string, unknown> = {}, locale = 'en'): Scenario {
  return {
    locale,
    replies: {
      ...(permissions ? { me: ME(permissions) } : {}),
      department_list: DEPARTMENTS,
      organization_list: ORGANIZATIONS,
      realm_info: INFO(),
      external_list: EXTERNALS,
      tender_list: TENDERS([tender()]),
      tender_get: { ok: true, tender: tender() },
      events: { ok: true, events: [] },
      contract_list: LIST(contracts),
      contract_get: detail(contracts[0] as Record<string, unknown>, { amendments: AMENDMENTS }),
      ...replies,
    },
  };
}

function consoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  return errors;
}

const asked = (page: Page, name: string) =>
  page.evaluate((wanted) => (window as any).asked.filter(([op]: [string]) => op === wanted).map(([, args]: [string, unknown]) => args), name);

async function contractsTab(page: Page) {
  await page.goto(`${url}/extensions/procurement`);
  await page.getByRole('tab', { name: /Contracts|Contratos|合同/ }).click();
}

async function openContract(page: Page, id: string) {
  await contractsTab(page);
  await page.getByTestId('contract-row').filter({ hasText: id }).getByRole('button').click();
  await expect(page.getByTestId('contract-page')).toBeVisible();
}

test('the contracts list: supplier, value, term and status, in the realm\'s currency and time zone', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = realm(MEMBER, [contract(), CALL_OFF]);
  await contractsTab(page);

  const rows = page.getByTestId('contract-row');
  await expect(rows).toHaveCount(2);
  const lane = rows.filter({ hasText: 'C-9' });
  await expect(lane).toContainText('Bike lane works');
  await expect(lane).toContainText('buildco');
  await expect(lane).toContainText('50,000 REALM');
  await expect(lane).toContainText('Active');
  await expect(lane).toContainText('2026-01-01 → 2027-03-31');
  await expect(lane.getByTestId('call-off-badge')).toHaveCount(0);
  await expect(rows.filter({ hasText: 'C-14' })).toContainText('no end date');
  expect(await asked(page, 'contract_list')).toEqual([{ from: 1, count: 500 }]);
  expect(errors).toEqual([]);
});

test('the filter keeps the framework call-offs', async ({ page }) => {
  scenario = realm(MEMBER, [contract(), CALL_OFF, REALM_CALL_OFF, contract({ id: 'C-10', title: 'Road works', tender: 'T-5', lot: '1' })]);
  await contractsTab(page);
  await expect(page.getByTestId('contract-row')).toHaveCount(4);
  await expect(page.getByTestId('contract-row').filter({ hasText: 'C-10' })).toContainText('Lot 1');

  await page.getByRole('button', { name: 'Framework call-offs (2)' }).click();
  await expect(page.getByTestId('contract-row')).toHaveCount(2);
  await expect(page.getByTestId('call-off-badge')).toHaveCount(2);
  await page.getByRole('button', { name: 'All contracts (4)' }).click();
  await expect(page.getByTestId('contract-row')).toHaveCount(4);
});

test('a realm without call-offs says so under the filter', async ({ page }) => {
  scenario = realm(MEMBER, [contract()]);
  await contractsTab(page);
  await page.getByRole('button', { name: 'Framework call-offs (0)' }).click();
  await expect(page.getByTestId('no-call-offs')).toBeVisible();
  await expect(page.getByTestId('contract-row')).toHaveCount(0);
});

test('no contracts, and contracts the caller may not read', async ({ page }) => {
  scenario = realm(MEMBER, [], { contract_list: LIST([]) });
  await contractsTab(page);
  await expect(page.getByText('No contracts yet.')).toBeVisible();

  scenario = realm(MEMBER, [], { contract_list: undefined });
  await contractsTab(page);
  await expect(page.getByText('Contracts are not available to you right now.')).toBeVisible();
});

test('the contract page: terms, split by year, the request it came from, what was paid and the budget line', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = realm(AMENDER, [contract()]);
  await openContract(page, 'C-9');

  await expect(page.getByTestId('contract-supplier')).toHaveText('buildco');
  await expect(page.getByTestId('contract-value')).toHaveText('50,000 REALM');
  await expect(page.getByTestId('contract-starts')).toHaveText('2026-01-01');
  await expect(page.getByTestId('contract-ends')).toHaveText('2027-03-31');
  await expect(page.getByTestId('contract-paid')).toHaveText('12,000 REALM of 50,000 REALM');
  await expect(page.getByTestId('contract-budget')).toContainText('ROADS · capital · FY2026');
  await expect(page.getByTestId('contract-status')).toHaveText('Active');

  const split = page.getByTestId('contract-split');
  await expect(split.getByRole('row')).toHaveCount(3); // the header and the two years
  await expect(split).toContainText('FY2026');
  await expect(split).toContainText('30,000 REALM');
  await expect(split).toContainText('20,000 REALM');

  await expect(page.getByTestId('contract-origin')).toContainText('Request T-5 — Bike lane works');
  expect(await asked(page, 'contract_get')).toEqual([{ contract: 'C-9' }]);
  expect(errors).toEqual([]);
});

test('the request a contract came from opens its page, with the lots table', async ({ page }) => {
  scenario = realm(AMENDER, [contract()]);
  await openContract(page, 'C-9');
  await page.getByTestId('contract-origin').getByRole('button').click();
  await expect(page.getByRole('heading', { name: 'Bike lane works' })).toBeVisible();
  await expect(page.getByTestId('lots')).toBeVisible();
});

test('a contract without a split, a budget line or amendments says so', async ({ page }) => {
  scenario = realm(AMENDER, [contract({ split: [], ends_at: 0 })], {
    contract_get: detail(contract({ split: [], ends_at: 0 }), { paid: 0, budgets: [], amendments: [] }),
  });
  await openContract(page, 'C-9');
  await expect(page.getByTestId('contract-split')).toContainText('Not spread over fiscal periods.');
  await expect(page.getByTestId('contract-ends')).toHaveText('no end date');
  await expect(page.getByTestId('contract-budget')).toContainText('None known');
  await expect(page.getByTestId('amendments')).toContainText('This contract has not been amended.');
});

test('the amendments, oldest first: terms before and after, the proposal that carried each, when it took effect', async ({ page }) => {
  scenario = realm(AMENDER, [contract()]);
  await openContract(page, 'C-9');

  const amendments = page.getByTestId('amendment');
  await expect(amendments).toHaveCount(2);
  const first = amendments.nth(0);
  await expect(first).toContainText('Amendment 1');
  await expect(first.getByTestId('amendment-at')).toHaveText('Took effect 2026-01-23 10:30 Europe/Madrid (UTC+01:00)');
  await expect(first.getByTestId('amendment-change')).toHaveCount(1);
  await expect(first.getByTestId('amendment-change')).toContainText(
    'FY2026 30,000 REALM · FY2027 20,000 REALM → FY2026 10,000 REALM · FY2027 40,000 REALM',
  );

  const second = amendments.nth(1);
  await expect(second).toContainText('Amendment 2');
  await expect(second.getByTestId('amendment-change')).toHaveCount(1);
  await expect(second.getByTestId('amendment-change')).toContainText('Ends: 2026-03-31 → 2027-03-31');
  await expect(second.getByTestId('amendment-decision')).toHaveText('Applied directly by the governing department, without a proposal.');

  // The proposal is read in the voting extension, through the realm's router.
  await first.getByRole('link', { name: 'Carried by proposal P-31' }).click();
  expect(await page.evaluate(() => (window as any).navigated)).toEqual(['/extensions/voting/proposals/P-31']);
});

test('more amendments are read a page at a time', async ({ page }) => {
  const byArgs = [
    { when: { from: 2 }, reply: detail(contract(), { amendments: [AMENDMENTS[1]], next: null }) },
    { reply: detail(contract(), { amendments: [AMENDMENTS[0]], next: 2 }) },
  ];
  scenario = realm(AMENDER, [contract()], { contract_get: { byArgs } });
  await openContract(page, 'C-9');
  await expect(page.getByTestId('amendment')).toHaveCount(1);
  await page.getByRole('button', { name: 'Show more amendments' }).click();
  await expect(page.getByTestId('amendment')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Show more amendments' })).toHaveCount(0);
});

test('a contract made from one lot names the lot and its title', async ({ page }) => {
  const lot = contract({ id: 'C-10', title: 'Bike lane works: Road works', lot: '1' });
  scenario = realm(AMENDER, [lot], { contract_get: detail(lot) });
  await openContract(page, 'C-10');
  await expect(page.getByTestId('contract-lot')).toHaveText('Lot 1 — Road works');
});

test('a call-off names the body that holds the framework agreement, its reference and its winners', async ({ page }) => {
  scenario = realm(AMENDER, [CALL_OFF], { contract_get: detail(CALL_OFF, { budgets: [] }) });
  await openContract(page, 'C-14');
  const framework = page.getByTestId('contract-framework');
  await expect(framework.getByTestId('framework-holder')).toHaveText('Province of Alicante (authority)');
  await expect(framework.getByTestId('framework-reference')).toHaveText('AM-2025/04');
  await expect(framework.getByTestId('framework-winners')).toHaveText('buildco, roadco');
  await expect(page.getByTestId('contract-origin')).toHaveCount(0); // no tender of its own
});

test('a framework held by another realm shows the realm\'s name when this one is linked to it', async ({ page }) => {
  scenario = realm(AMENDER, [REALM_CALL_OFF], { contract_get: detail(REALM_CALL_OFF, { budgets: [] }) });
  await openContract(page, 'C-15');
  const framework = page.getByTestId('contract-framework');
  await expect(framework.getByTestId('framework-holder')).toHaveText('Spain');
  await expect(framework.getByTestId('framework-reference')).toHaveText('T-12');
  await expect(framework.getByTestId('framework-winners')).toContainText('does not know the winners');
});

test('a framework held by a realm with no known name shows its capital', async ({ page }) => {
  scenario = realm(AMENDER, [UNNAMED_REALM_CALL_OFF], { contract_get: detail(UNNAMED_REALM_CALL_OFF, { budgets: [] }) });
  await openContract(page, 'C-16');
  const holder = page.getByTestId('framework-holder');
  await expect(holder).toContainText('Realm ryjl3-…-cai');
  await expect(holder.locator('span')).toHaveAttribute('title', OTHER_REALM);
});

// ---- the amendment form ------------------------------------------------------------------------------------------------

test('the form states the paid floor and that the amendment goes to a vote, as the realm says', async ({ page }) => {
  scenario = realm(AMENDER, [contract()]);
  await openContract(page, 'C-9');
  await expect(page.getByTestId('amend-floor')).toHaveText('The value cannot be set below 12,000 REALM, the amount already paid on this contract.');
  await expect(page.getByTestId('amend-vote')).toContainText('Infrastructure governs this contract and decides by vote');
  await expect(page.getByRole('button', { name: 'Propose the amendment' })).toBeVisible();
});

test('an amendment that goes to a vote is filed with only the terms that changed', async ({ page }) => {
  scenario = realm(AMENDER, [contract()], { contract_amend: { ok: true, requires_vote: true, proposal: 'P-40' } });
  await openContract(page, 'C-9');
  const form = page.getByTestId('amendment-form');

  await form.getByRole('textbox').first().fill('45000');
  await expect(form.getByTestId('split-total')).toHaveText('The periods add up to 50,000 REALM of 45,000 REALM.');
  await form.getByTestId('split-row').first().getByRole('textbox').nth(1).fill('25000');
  await expect(form.getByTestId('split-total')).toHaveText('The periods add up to 45,000 REALM of 45,000 REALM.');
  await form.getByRole('button', { name: 'Propose the amendment' }).click();

  await expect(page.getByTestId('amend-filed')).toHaveText('Proposal P-40 opened: the amendment applies if it passes.');
  expect(await asked(page, 'contract_amend')).toEqual([
    {
      contract: 'C-9',
      value: 4_500_000,
      split: [
        { period: 'FY2026', amount: 2_500_000 },
        { period: 'FY2027', amount: 2_000_000 },
      ],
    },
  ]);
});

test('an amendment a department decides directly applies at once and the page shows it', async ({ page }) => {
  const amended = contract({ ends_at: Date.parse('2027-06-30T00:00:00+02:00') / 1000 });
  scenario = realm(AMENDER, [contract()], {
    contract_get: {
      seq: [
        detail(contract(), { needs_vote: false, amendments: [AMENDMENTS[0]] }),
        detail(amended, { needs_vote: false, amendments: AMENDMENTS }),
      ],
    },
    contract_amend: { ok: true, contract: 'C-9' },
  });
  await openContract(page, 'C-9');
  await expect(page.getByTestId('amend-vote')).toHaveText('Infrastructure governs this contract and decides directly: the amendment applies at once.');
  await expect(page.getByTestId('amendment')).toHaveCount(1);

  await page.getByTestId('amendment-form').locator('input[type=date]').nth(1).fill('2027-06-30');
  await page.getByRole('button', { name: 'Amend the contract' }).click();

  await expect(page.getByTestId('amend-applied')).toBeVisible();
  await expect(page.getByTestId('contract-ends')).toHaveText('2027-06-30');
  await expect(page.getByTestId('amendment')).toHaveCount(2);
  expect(await asked(page, 'contract_amend')).toEqual([{ contract: 'C-9', ends_at: Date.parse('2027-06-30T00:00:00+02:00') / 1000 }]);
});

test('the realm\'s refusal is shown as it is, and a form that changes nothing is not sent', async ({ page }) => {
  scenario = realm(AMENDER, [contract()], {
    contract_amend: { ok: false, error: 'a value of 1000 is below the 1200000 paid on C-9', kind: 'conflict' },
  });
  await openContract(page, 'C-9');
  const form = page.getByTestId('amendment-form');

  await form.getByRole('button', { name: 'Propose the amendment' }).click();
  await expect(page.getByTestId('amend-error')).toHaveText('Change at least one term.');
  expect(await asked(page, 'contract_amend')).toEqual([]);

  await form.getByRole('textbox').first().fill('lots');
  await form.getByRole('button', { name: 'Propose the amendment' }).click();
  await expect(page.getByTestId('amend-error')).toHaveText('Enter the value as an amount with at most 2 decimals.');

  await form.getByRole('textbox').first().fill('10');
  await form.getByRole('button', { name: 'Propose the amendment' }).click();
  await expect(page.getByTestId('amend-error')).toHaveText('a value of 1000 is below the 1200000 paid on C-9');
});

test('someone without the permission reads the rule but cannot file', async ({ page }) => {
  scenario = realm(MEMBER, [contract()]);
  await openContract(page, 'C-9');
  await expect(page.getByTestId('amend-floor')).toBeVisible();
  await expect(page.getByTestId('amend-denied')).toHaveText('You do not hold the permission to amend contracts (contract.amend).');
  await expect(page.getByRole('button', { name: 'Propose the amendment' })).toHaveCount(0);
});

test('a visitor signed out is told the contracts are not available, as the realm refuses them', async ({ page }) => {
  const errors = consoleErrors(page);
  // The realm answers reads "sign in first" to a visitor: no reply of ours stands for that.
  scenario = realm(null, [contract()], { contract_list: undefined, contract_get: undefined });
  await contractsTab(page);
  await expect(page.getByText('Contracts are not available to you right now.')).toBeVisible();
  await expect(page.getByTestId('contract-row')).toHaveCount(0);
  expect(errors.filter((error) => error.startsWith('page error'))).toEqual([]);
});

test('a contract that has ended is shown with the realm\'s reason, not an amendment form', async ({ page }) => {
  const ended = contract({ status: 'terminated' });
  scenario = realm(AMENDER, [ended], { contract_get: detail(ended) });
  await openContract(page, 'C-9');
  await expect(page.getByTestId('contract-status')).toHaveText('Terminated');
  await expect(page.getByTestId('amend-ended')).toHaveText('A contract that has ended is not amended.');
  await expect(page.getByTestId('amendment-form')).toHaveCount(0);
});

test('nothing shows amounts or days before the realm has said its currency and zone', async ({ page }) => {
  // A contract page that came first would read 5,000,000,000 REALM for 50,000 (no decimals yet) and a day in UTC.
  scenario = realm(AMENDER, [contract({ value: 5_000_000_000 })], {
    realm_info: { delay: 1500, reply: INFO() },
    budget_view: { ok: true, currency: 'REALM', decimals: 8, funds: [], periods: [] },
  });
  await contractsTab(page);
  await expect(page.getByText('Loading contracts…')).toBeVisible();
  await expect(page.getByTestId('contract-row')).toContainText('50 REALM');
  expect(await page.getByTestId('contracts').innerText()).not.toContain('5,000,000,000');
});

test('an amount in a token reads in that token\'s decimals, and in the currency\'s when it is the currency', async ({ page }) => {
  const gold = contract({ symbol: 'GOLD', value: 4_800_000, split: [] });
  scenario = realm(AMENDER, [gold, contract({ id: 'C-8', value: 5_000_000_000 })], {
    // The realm has no accounting currency set: its payments go in its oldest token, REALM, at 8 decimals.
    realm_info: INFO({ accounting_currency: '', accounting_currency_decimals: 8 }),
    budget_view: { ok: true, currency: 'REALM', decimals: 8, funds: [], periods: [] },
    treasury_view: { ok: true, tokens: [{ id: 'REALM', decimals: 8 }, { id: 'GOLD', decimals: 3 }], funds: {} },
  });
  await contractsTab(page);
  await expect(page.getByTestId('contract-row').filter({ hasText: 'C-9' })).toContainText('4,800 GOLD');
  await expect(page.getByTestId('contract-row').filter({ hasText: 'C-8' })).toContainText('50 REALM');
});

test('a realm that does not say what an amendment is held to offers no form', async ({ page }) => {
  const { paid, governed_by, needs_vote, budgets, ...older } = detail(contract(), { amendments: AMENDMENTS });
  scenario = realm(AMENDER, [contract()], { contract_get: older });
  await openContract(page, 'C-9');
  await expect(page.getByTestId('amend-rule-unknown')).toBeVisible();
  await expect(page.getByTestId('amendment-form')).toHaveCount(0);
  await expect(page.getByTestId('amendment')).toHaveCount(2);
});

test('a contract the realm cannot show says so', async ({ page }) => {
  scenario = realm(AMENDER, [contract()], { contract_get: { ok: false, error: "unknown Contract 'C-9'" } });
  await contractsTab(page);
  await page.getByTestId('contract-row').getByRole('button').click();
  await expect(page.getByText('This contract could not be opened.')).toBeVisible();
});

// ---- other languages and a narrow screen -------------------------------------------------------------------------------

test('the screens read in the realm\'s language, with the same data', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = realm(AMENDER, [contract(), CALL_OFF], {}, 'es');
  await page.goto(`${url}/extensions/procurement`);
  await page.getByRole('tab', { name: 'Contratos' }).click();
  await expect(page.getByRole('button', { name: 'Contratos derivados de un acuerdo marco (1)' })).toBeVisible();
  await expect(page.getByTestId('contract-row').filter({ hasText: 'C-9' })).toContainText('Vigente');
  await page.getByTestId('contract-row').filter({ hasText: 'C-9' }).getByRole('button').click();
  await expect(page.getByTestId('amend-floor')).toContainText('El importe no puede fijarse por debajo de 12,000 REALM');
  await expect(page.getByTestId('amendment-at').first()).toContainText('Entró en vigor 2026-01-23 10:30');
  expect(errors).toEqual([]);
});

test('Chinese and Valencian texts load too', async ({ page }) => {
  scenario = realm(AMENDER, [contract()], {}, 'zh-CN');
  await page.goto(`${url}/extensions/procurement`);
  await expect(page.getByRole('tab', { name: '合同' })).toBeVisible();
  scenario = realm(AMENDER, [contract()], {}, 'ca-valencia');
  await page.goto(`${url}/extensions/procurement`);
  await expect(page.getByRole('tab', { name: 'Contractes' })).toBeVisible();
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 900 } });

  test('the list is cards, the filter and the page still work', async ({ page }) => {
    scenario = realm(AMENDER, [contract(), CALL_OFF], { contract_get: detail(CALL_OFF) });
    await contractsTab(page);
    await expect(page.getByTestId('contract-row')).toHaveCount(2);
    await page.getByRole('button', { name: 'Framework call-offs (1)' }).click();
    await expect(page.getByTestId('contract-row')).toHaveCount(1);
    await page.getByTestId('contract-row').getByRole('button').click();
    await expect(page.getByTestId('contract-framework')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
