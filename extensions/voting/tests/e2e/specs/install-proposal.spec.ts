import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { startRealm, type Scenario } from '../realm';

const OUT = join(__dirname, '..', 'test-results');
// Tall enough that a screenshot shows the whole proposal.
test.use({ viewport: { width: 1280, height: 1700 } });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
  mkdirSync(OUT, { recursive: true });
});
test.afterAll(() => close());

const hexOf = (text: string) => createHash('sha256').update(text).digest('hex');

const OLD_TAX = 'from realms.legislation import above\n\n\nclass Tax(above("tax")):\n    ibi_bonus = 0\n    ibi_family_bonus = 0\n';
const NEW_TAX = 'from realms.legislation import above\n\n\nclass Tax(above("tax")):\n    ibi_bonus = 0\n    ibi_family_bonus = 5000000  # large families: 5 %\n';
const REPORT = [
  '# Analysis report',
  '',
  '## Newly allowed',
  '- tax_policy_propose: urban IBI between 1.10 % and 1.24 % for capitals',
  '',
  '## Never fires',
  '- none',
  '',
].join('\n');
const RUNNING = 'sha256:4be1c0ffee';
const CHANGE_LIST_URL = 'https://raw.example.org/commit/changes/valencia.json';
const TAX_URL = 'https://raw.example.org/commit/legislation/eu/es/vc/46250-valencia/tax.py';
const REPORT_URL = 'https://raw.example.org/commit/changes/valencia.report.md';

function changeList(over: Record<string, unknown> = {}) {
  return JSON.stringify({
    kind: 'realms-gos/legislation-change',
    format: 1,
    realm: 'eu/es/vc/46250-valencia',
    replaces: RUNNING,
    set: [{ chapter: 'eu/es/vc/46250-valencia/tax', url: TAX_URL, mirrors: [], sha256: hexOf(NEW_TAX), size: NEW_TAX.length }],
    remove: ['eu/es/vc/46250-valencia/water'],
    release: null,
    report: { url: REPORT_URL, sha256: hexOf(REPORT) },
    summary: { 'ca-valencia': 'IBI 2027: bonificació per família nombrosa', es: 'IBI 2027: bonificación por familia numerosa', en: 'IBI 2027: bonus for large families' },
    ...over,
  });
}

function realm(action: unknown, locale = 'en', status = 'voting'): Scenario {
  const proposal = { id: 'P-7', title: 'IBI 2027: large families', description: 'Adopt the bonus', proposer: 'alice', status, opens_at: 1, deadline: 4_102_444_800, action };
  return {
    locale,
    replies: {
      proposal_list: { ok: true, proposals: [], next: null },
      proposal_get: { ok: true, proposal, tally: { yes: 1, no: 0, abstain: 0, eligible: 3, veto: [] }, eligible: 3, votes: [], next: null },
      department_list: { ok: true, departments: [{ id: 'Realm', is_root: true }] },
      realm_info: { ok: true, realm: { timezone: 'Europe/Madrid' } },
      codex_status: { ok: true, codex: { id: RUNNING, chapters: { 'eu/es/vc/46250-valencia/tax': { sha256: `sha256:${hexOf(OLD_TAX)}` } } } },
      legislation_chapter: { ok: true, text: OLD_TAX },
    },
  };
}

/** The addresses the proposal pins are answered here; every other https address is left to the network. */
async function serve(page: Page, files: Record<string, string>) {
  await page.route('https://raw.example.org/**', (route) => {
    const body = files[route.request().url()];
    return body === undefined
      ? route.fulfill({ status: 404, body: 'not found' })
      : route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', headers: { 'access-control-allow-origin': '*' }, body });
  });
}

function consoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  return errors;
}

const codeAction = (text: string) => ({ op: 'codex_install', args: { url: CHANGE_LIST_URL, checksum: `sha256:${hexOf(text)}` } });

test('an install proposal shows its summary, its chapters and its report, labelled as not checked by the realm', async ({ page }) => {
  const list = changeList();
  scenario = realm(codeAction(list));
  await serve(page, { [CHANGE_LIST_URL]: list, [TAX_URL]: NEW_TAX, [REPORT_URL]: REPORT });
  await page.goto(`${url}/extensions/voting/proposals/7`);

  const change = page.getByTestId('legislation-change');
  await expect(change.getByTestId('change-summary')).toHaveText('IBI 2027: bonus for large families');
  await expect(change.getByTestId('change-chapters')).toContainText('eu/es/vc/46250-valencia/tax');
  await expect(change.getByTestId('change-chapters')).toContainText('Changed');
  await expect(change.getByTestId('change-removes')).toHaveText('eu/es/vc/46250-valencia/water');
  await expect(change.getByTestId('report-label')).toContainText('Not checked by the realm.');
  await expect(change.getByTestId('report-text')).toContainText('urban IBI between 1.10 % and 1.24 % for capitals');
  await page.screenshot({ path: join(OUT, 'install-proposal.png'), fullPage: true });
});

test('the changes of a chapter open in the diff editor, the realm\'s text on the left and the proposed on the right', async ({ page }) => {
  const errors = consoleErrors(page);
  const list = changeList();
  scenario = realm(codeAction(list));
  await serve(page, { [CHANGE_LIST_URL]: list, [TAX_URL]: NEW_TAX, [REPORT_URL]: REPORT });
  await page.goto(`${url}/extensions/voting/proposals/7`);
  await page.getByRole('button', { name: 'Show changes' }).click();
  // Monaco renders the two texts as lines of its editors.
  await expect(page.locator('.monaco-diff-editor')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.monaco-diff-editor')).toContainText('ibi_family_bonus = 5000000');
  await page.screenshot({ path: join(OUT, 'install-proposal-diff.png'), fullPage: true });
  await page.getByRole('button', { name: 'Hide changes' }).click();
  await expect(page.locator('.monaco-diff-editor')).toHaveCount(0);
  expect(errors.filter((error) => !/monaco|unpkg|net::/i.test(error))).toEqual([]);
});

test('the summary comes in Catalan for a member who reads Catalan, and the page does not warn about a language', async ({ page }) => {
  const list = changeList();
  scenario = realm(codeAction(list), 'ca-valencia');
  await serve(page, { [CHANGE_LIST_URL]: list, [TAX_URL]: NEW_TAX, [REPORT_URL]: REPORT });
  await page.goto(`${url}/extensions/voting/proposals/7`);
  await expect(page.getByTestId('change-summary')).toHaveText('IBI 2027: bonificació per família nombrosa');
  await expect(page.getByTestId('report-label')).toContainText('El regne no l\'ha comprovat.');
  await page.screenshot({ path: join(OUT, 'install-proposal-ca-valencia.png'), fullPage: true });
});

test('a change list that is not the file the proposal pins is not shown', async ({ page }) => {
  const list = changeList();
  scenario = realm(codeAction(list));
  await serve(page, { [CHANGE_LIST_URL]: list.replace('2027', '2028') });
  await page.goto(`${url}/extensions/voting/proposals/7`);
  await expect(page.getByTestId('change-failure')).toContainText('not the one the proposal pins');
  await expect(page.getByTestId('change-summary')).toHaveCount(0);
  await page.screenshot({ path: join(OUT, 'install-proposal-wrong-bytes.png'), fullPage: true });
});

test('a report that has been swapped is not shown, the rest of the proposal still is', async ({ page }) => {
  const list = changeList();
  scenario = realm(codeAction(list));
  await serve(page, { [CHANGE_LIST_URL]: list, [TAX_URL]: NEW_TAX, [REPORT_URL]: REPORT + '\nNothing to worry about.\n' });
  await page.goto(`${url}/extensions/voting/proposals/7`);
  await expect(page.getByTestId('change-summary')).toBeVisible();
  await expect(page.getByTestId('report')).toContainText('The report cannot be shown');
  await expect(page.getByTestId('report-text')).toHaveCount(0);
});

test('a change list made for another codex than the realm runs is flagged while the vote is open', async ({ page }) => {
  const list = changeList({ replaces: 'sha256:0badc0de' });
  scenario = realm(codeAction(list));
  await serve(page, { [CHANGE_LIST_URL]: list, [REPORT_URL]: REPORT });
  await page.goto(`${url}/extensions/voting/proposals/7`);
  await expect(page.getByTestId('change-stale')).toContainText('the install would be refused as stale');
  await page.screenshot({ path: join(OUT, 'install-proposal-stale.png'), fullPage: true });
});

test('the install of a release says the realm builds its change list when it runs', async ({ page }) => {
  scenario = realm({ op: 'codex_install', args: { source: 'eu/es', version: '2.4.0' } });
  await serve(page, {});
  await page.goto(`${url}/extensions/voting/proposals/7`);
  await expect(page.getByTestId('release-install')).toContainText('Installs release 2.4.0 of eu/es whole.');
  await page.screenshot({ path: join(OUT, 'install-proposal-release.png'), fullPage: true });
});
