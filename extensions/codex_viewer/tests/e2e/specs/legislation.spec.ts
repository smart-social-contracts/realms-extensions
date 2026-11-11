import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { CODEX, INFO, ME, SECONDS, SPAIN, VIEWS, startRealm, status, type Scenario } from '../realm';

const OUT = join(__dirname, '..', 'test-results');
// Tall enough that a screenshot shows the whole page: it scrolls inside the extension's frame.
test.use({ viewport: { width: 1280, height: 1500 } });

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

const ADMIN = ['all'];
const MEMBER = ['proposal.create', 'self.join'];
const IT_SEAT = ['codex.revert_fast', 'proposal.create'];

function realm(permissions: string[], over: Record<string, unknown> = {}, timezone = 'Europe/Madrid', official?: string): Scenario {
  return {
    locale: 'en',
    replies: {
      codex_status: status(over),
      me: ME(permissions),
      realm_info: INFO(timezone, official),
      codex_views: VIEWS,
      proposal_create: { ok: true, proposal: 'P-21' },
      codex_install_resume: { ok: true, job: 'J-3', step: 'build' },
      codex_check_now: { ok: true },
      codex_check_config: { ok: true, interval: 6, due: 0 },
      codex_revert_fast: { ok: true, codex: CODEX.previous },
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
const notices = (page: Page) => page.evaluate(() => (window as any).notices);

test('the codex in force, its layers, the compliance against Spain and the flattened view', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = realm(MEMBER);
  await page.goto(`${url}/extensions/codex_viewer`);

  const inForce = page.getByTestId('in-force');
  await expect(inForce.getByText('sha256:3f1c9a7b…')).toBeVisible();
  await expect(page.getByTestId('health')).toHaveText('Healthy');
  await expect(inForce.getByText('adopted by proposal P-12')).toBeVisible();
  await expect(inForce.getByRole('row')).toHaveCount(4); // the header and the three layers
  await expect(inForce.getByText('this realm\'s own layer')).toBeVisible();

  const spain = page.getByTestId('source');
  await expect(page.getByTestId('compliance')).toHaveText('Not compliant');
  await expect(spain).toContainText('Behind since 2026-11-01 01:00 Europe/Madrid (UTC+01:00)');
  await expect(spain).toContainText('Layers behind: eu/es');
  await expect(spain).toContainText('Last checked 2026-11-11 11:00 Europe/Madrid (UTC+01:00)');
  await expect(page.getByTestId('release')).toContainText('eu/es 2.4.0 is published');
  await expect(page.getByTestId('schedule')).toContainText('Checked every 24 hours.');

  // The domains are listed in order: the first is shown, and València's tax chapter is one choice away.
  const views = page.getByTestId('views');
  await expect(views.getByLabel('Domain')).toHaveValue('procedure');
  await expect(page.getByTestId('view-table')).toContainText('guard · extension');
  await expect(page.getByTestId('view-table')).toContainText('Ley 39/2015 Art. 30');
  await views.getByLabel('Domain').selectOption('tax');
  await expect(views).toContainText('eu/es → eu/es/vc/46250-valencia');
  await expect(page.getByTestId('view-table')).toContainText('capital = true');
  await expect(page.getByTestId('view-table')).toContainText('TRLRHL Art. 72.3');
  await expect(page.getByTestId('view-table')).toContainText('overrides eu/es');
  await page.screenshot({ path: join(OUT, 'legislation-member.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('a member without admin rights can propose the install and cannot change the checks', async ({ page }) => {
  scenario = realm(MEMBER);
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('release')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check now' })).toHaveCount(0);
  await expect(page.getByLabel('Hours between checks')).toHaveCount(0);

  await page.getByRole('button', { name: 'Propose install' }).click();
  await expect(page.getByRole('button', { name: 'Proposal P-21' })).toBeVisible();
  expect(await asked(page, 'proposal_create')).toEqual([
    {
      title: 'Install eu/es 2.4.0',
      description: 'Install release 2.4.0 of eu/es whole, from the record of the sync source that vouches for it. The realm\'s own layer stays as it is.',
      action: { op: 'codex_install', args: { source: 'eu/es', version: '2.4.0' } },
    },
  ]);
  expect(await notices(page)).toEqual([['success', 'Proposal P-21 filed']]);

  await page.getByRole('button', { name: 'Proposal P-21' }).click();
  expect(await page.evaluate(() => (window as any).navigated)).toEqual(['/extensions/voting/proposals/P-21']);
});

test('an admin sets the interval and checks now', async ({ page }) => {
  scenario = realm(ADMIN);
  await page.goto(`${url}/extensions/codex_viewer`);
  const save = page.getByRole('button', { name: 'Save' });
  await expect(save).toBeDisabled();
  await page.getByLabel('Hours between checks').fill('0');
  await expect(page.getByText('A whole number of hours, from 1 to 168.')).toBeVisible();
  await expect(save).toBeDisabled();
  await page.getByLabel('Hours between checks').fill('6');
  await save.click();
  expect(await asked(page, 'codex_check_config')).toEqual([{ interval: 6 }]);
  await page.getByRole('button', { name: 'Check now' }).click();
  expect(await asked(page, 'codex_check_now')).toEqual([{}]);
  await page.screenshot({ path: join(OUT, 'legislation-admin-checks.png'), fullPage: true });
});

test('a source whose record could not be read is unknown, with the reason', async ({ page }) => {
  const source = status().sync_sources[0];
  scenario = realm(MEMBER, {
    sync_sources: [{ ...source, compliance: 'unknown', error: 'the record is refused: it lists 3 releases twice', installable: [] }],
  });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('compliance')).toHaveText('Unknown');
  await expect(page.getByTestId('source-error')).toContainText('the record is refused: it lists 3 releases twice');
  await expect(page.getByText('Nothing newer to install.')).toBeVisible();
});

test('a paused install is resumed by an admin only', async ({ page }) => {
  const job = { id: 'J-3', proposal: 'P-12', step: 'build', status: 'paused', error: '', started_at: SECONDS('2026-11-11T08:00:00Z'), finished_at: null };
  scenario = realm(ADMIN, { job });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('job-status')).toHaveText('Paused');
  await expect(page.getByTestId('install-job')).toContainText('Step: Building the codex');
  await page.screenshot({ path: join(OUT, 'legislation-paused-job.png'), fullPage: true });
  await page.getByRole('button', { name: 'Resume install' }).click();
  expect(await asked(page, 'codex_install_resume')).toEqual([{ job: 'J-3' }]);
  expect(await notices(page)).toContainEqual(['success', 'Install J-3 resumed']);

  scenario = realm(MEMBER, { job });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByText('Only an admin of the realm can resume it.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume install' })).toHaveCount(0);
});

test('a failed install shows its error and nothing to resume', async ({ page }) => {
  const job = {
    id: 'J-4',
    proposal: 'P-13',
    step: 'check_sources',
    status: 'failed',
    error: 'eu/es/vc/tax is not vouched for by any record',
    started_at: SECONDS('2026-11-10T08:00:00Z'),
    finished_at: SECONDS('2026-11-10T08:05:00Z'),
  };
  scenario = realm(ADMIN, { job });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('job-status')).toHaveText('Failed');
  await expect(page.getByTestId('job-error')).toHaveText('eu/es/vc/tax is not vouched for by any record');
  await expect(page.getByRole('button', { name: 'Resume install' })).toHaveCount(0);
});

const FAILURES = {
  'eu/es/vc/46250-valencia/tax': { compute_tax_assess: { count: 4, error: 'ValueError: no rate for ibi_urban', at: SECONDS('2026-11-11T11:30:00Z') } },
  'eu/es/procedure': { check_proposal_create: { count: 1, error: 'KeyError: working_days', at: SECONDS('2026-11-11T09:00:00Z') } },
};

test('the failing chapters, and the revert button for the IT team only', async ({ page }) => {
  scenario = realm(IT_SEAT, { healthy: false, failures: FAILURES });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('health')).toHaveText('Failing');
  const failures = page.getByTestId('failures');
  await expect(failures.getByRole('row')).toHaveCount(3);
  await expect(failures.getByRole('row').nth(1)).toContainText('eu/es/vc/46250-valencia/tax');
  await expect(failures.getByRole('row').nth(1)).toContainText('ValueError: no rate for ibi_urban');
  await page.screenshot({ path: join(OUT, 'legislation-failing.png'), fullPage: true });

  await failures.getByRole('button', { name: 'Revert to the previous codex' }).click();
  await expect(page.getByTestId('revert-confirm')).toContainText('sha256:01234567…');
  await page.screenshot({ path: join(OUT, 'legislation-revert-confirm.png'), fullPage: true });
  await failures.getByRole('button', { name: 'Revert', exact: true }).click();
  expect(await asked(page, 'codex_revert_fast')).toEqual([{ codex: CODEX.previous }]);
  expect(await notices(page)).toContainEqual(['success', 'The previous codex is restored']);

  scenario = realm(MEMBER, { healthy: false, failures: FAILURES });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('failures')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revert to the previous codex' })).toHaveCount(0);
});

test('a revert that needs the team\'s votes says a vote is required', async ({ page }) => {
  scenario = realm(IT_SEAT, { healthy: false, failures: FAILURES });
  scenario.replies.codex_revert_fast = { ok: true, requires_vote: true, proposal: 'P-30' };
  await page.goto(`${url}/extensions/codex_viewer`);
  await page.getByRole('button', { name: 'Revert to the previous codex' }).click();
  await page.getByRole('button', { name: 'Revert', exact: true }).click();
  await expect.poll(() => notices(page)).toContainEqual(['success', 'Proposal P-30 created — a vote is required']);
});

test('without an IT team the page says a fast revert is not available', async ({ page }) => {
  scenario = realm(ADMIN, { healthy: false, failures: FAILURES, it_team: '' });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByText('This realm has designated no IT admin team')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Revert to the previous codex' })).toHaveCount(0);
});

test('a staged codex waits for its time, shown in the realm\'s official time and the quarter\'s own beside it', async ({ page }) => {
  // The official time is the capital's; this quarter keeps Tokyo time (§4.5). 1 December 2026, 00:00 in Madrid.
  const pending = { ...CODEX, id: 'sha256:aabbccddeeff00112233', status: 'pending', activates_at: SECONDS('2026-11-30T23:00:00Z') };
  scenario = realm(MEMBER, { pending }, 'Asia/Tokyo', 'Europe/Madrid');
  await page.goto(`${url}/extensions/codex_viewer`);
  const waiting = page.getByTestId('pending');
  await expect(waiting).toContainText('sha256:aabbccdd…');
  await expect(waiting).toContainText('2026-12-01 00:00 Europe/Madrid (UTC+01:00)');
  await expect(waiting).toContainText('2026-12-01 08:00 Asia/Tokyo (UTC+09:00) (local)');
  await page.screenshot({ path: join(OUT, 'legislation-quarter-time.png'), fullPage: true });

  scenario = realm(MEMBER, { pending }, 'Europe/Madrid');
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('pending')).toContainText('2026-12-01 00:00 Europe/Madrid (UTC+01:00)');
  await expect(page.getByTestId('pending')).not.toContainText('(local)');
});

test('the page in Spanish', async ({ page }) => {
  scenario = { ...realm(ADMIN, { healthy: false, failures: FAILURES }), locale: 'es' };
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByRole('heading', { name: 'Legislación en vigor' })).toBeVisible();
  await expect(page.getByTestId('compliance')).toHaveText('Incumple');
  await expect(page.getByRole('button', { name: 'Proponer instalación' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Capítulos con fallos' })).toBeVisible();
  await page.screenshot({ path: join(OUT, 'legislation-es.png'), fullPage: true });
});

test('a realm that runs a legacy codex and follows no one has no legislation tab', async ({ page }) => {
  scenario = {
    locale: 'en',
    replies: {
      codex_status: status({ codex: { id: 'agora@1.0.0', version: '1.0.0', status: 'active' }, sync_sources: [], failures: {} }),
      me: ME(MEMBER),
      realm_info: INFO('UTC'),
    },
  };
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByRole('heading', { name: 'Codex Viewer' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
});

test('a realm that follows another, with no codex of its own yet, has the page', async ({ page }) => {
  scenario = realm(MEMBER, { codex: null, history: [] });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByText('No codex is in force.')).toBeVisible();
  await expect(page.getByTestId('compliance')).toBeVisible();
  await expect(page.getByTestId('views')).toHaveCount(0);
});

test('the source of the codices is one tab away', async ({ page }) => {
  scenario = realm(MEMBER);
  await page.goto(`${url}/extensions/codex_viewer`);
  await page.getByRole('tab', { name: 'Source' }).click();
  await expect(page.getByRole('heading', { name: 'Codex Viewer' })).toBeVisible();
  await page.getByRole('tab', { name: 'Legislation' }).click();
  await expect(page.getByTestId('in-force')).toBeVisible();
});

test('a sync source with no name is shown by its capital', async ({ page }) => {
  const source = status().sync_sources[0];
  scenario = realm(MEMBER, { sync_sources: [{ ...source, name: '' }] });
  await page.goto(`${url}/extensions/codex_viewer`);
  await expect(page.getByTestId('source')).toContainText(SPAIN);
});
