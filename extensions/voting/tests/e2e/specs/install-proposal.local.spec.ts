import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openExtension, realmCall } from '../../../../_shared/testing/e2e/local-realm';

// An install proposal on a real local realm, under the realm frontend's own content security policy (realms local
// start, realms local setup, then codex_viewer/tests/e2e/seed_local_realm.py: its README.md). The addresses a proposal
// pins are answered here, whatever frame asks; they are on raw.githubusercontent.com, which the policy allows a page of
// the realm to read (connect-src), where any other host is refused by the browser.

const OUT = join(__dirname, '..', 'test-results');
const hexOf = (text: string) => createHash('sha256').update(text).digest('hex');

const COMMIT = '0123456789abcdef0123456789abcdef01234567';
const BASE = `https://raw.githubusercontent.com/smart-social-contracts/realms-codices/${COMMIT}`;
const CHANGE_LIST_URL = `${BASE}/changes/eu/es/vc/46250-valencia/ibi-2027.json`;
const REPORT_URL = `${BASE}/changes/eu/es/vc/46250-valencia/ibi-2027.report.md`;
const CHAPTER = 'eu/es/vc/46250-valencia/local_regime'; // in every codex the realm has been seeded with
const CHAPTER_URL = `${BASE}/legislation/${CHAPTER}.py`;
const REPORT = '# Analysis report\n\n## Newly allowed\n- tax_policy_propose: urban IBI between 1.10 % and 1.24 % for capitals\n';

// València's procedure (Art. 65.2) refuses an ordinance that takes effect sooner than 15 working days after the vote
// closes: a change list of the town's own layer states when it takes effect, six weeks away here.
const TAKES_EFFECT = () => Math.floor(Date.now() / 1000) + 42 * 24 * 3600;

test.use({ viewport: { width: 1280, height: 1700 } });
test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

test('a change list shows its summary, its chapter next to the running one, and a report not checked by the realm', async ({ page }) => {
  const running = realmCall('codex_status', { count: 1 }).codex;
  const { text: current } = realmCall('legislation_chapter', { chapter: running.chapters[CHAPTER].sha256 });
  const changed = `${current}\n# IBI 2027: bonus for large families\n`;
  const list = JSON.stringify({
    kind: 'realms-gos/legislation-change',
    format: 1,
    realm: 'eu/es/vc/46250-valencia',
    replaces: running.id,
    set: [{ chapter: CHAPTER, url: CHAPTER_URL, mirrors: [], sha256: hexOf(changed), size: Buffer.byteLength(changed) }],
    remove: [],
    release: null,
    report: { url: REPORT_URL, sha256: hexOf(REPORT) },
    summary: { 'ca-valencia': 'IBI 2027: bonificació per família nombrosa', es: 'IBI 2027: bonificación por familia numerosa', en: 'IBI 2027: bonus for large families' },
  });
  const files: Record<string, string> = { [CHANGE_LIST_URL]: list, [CHAPTER_URL]: changed, [REPORT_URL]: REPORT };
  await page.route('https://raw.githubusercontent.com/**', (route) => {
    const body = files[route.request().url()];
    return route.fulfill({ status: body === undefined ? 404 : 200, headers: { 'access-control-allow-origin': '*' }, body: body ?? '' });
  });
  const reply = realmCall('proposal_create', {
    title: 'IBI 2027: large families',
    description: 'A bonus on the urban IBI',
    effective_at: TAKES_EFFECT(),
    action: { op: 'codex_install', args: { url: CHANGE_LIST_URL, checksum: `sha256:${hexOf(list)}` } },
  });
  const voting = await openExtension(page, 'voting', { path: `/extensions/voting/proposals/${String(reply.proposal).replace('P-', '')}` });
  try {
    const change = voting.ext.getByTestId('legislation-change');
    await expect(change.getByTestId('change-summary')).toHaveText('IBI 2027: bonus for large families', { timeout: 120_000 });
    await expect(change.getByTestId('change-chapters')).toContainText(CHAPTER);
    await expect(change.getByTestId('change-chapters')).toContainText('Changed');
    await expect(change.getByTestId('report-label')).toContainText('Not checked by the realm.');
    await expect(change.getByTestId('report-text')).toContainText('urban IBI between 1.10 % and 1.24 % for capitals');
    await expect(change.getByTestId('change-stale')).toHaveCount(0);
    await voting.ext.getByRole('button', { name: 'Show changes' }).click();
    await expect(voting.ext.locator('.monaco-diff-editor')).toContainText('IBI 2027: bonus for large families', { timeout: 60_000 });
    await page.screenshot({ path: join(OUT, 'local-voting-change-list.png'), fullPage: true });
  } finally {
    await voting.close();
  }
});

test('a host the realm\'s pages may not read is unreachable, and the change list is not shown', async ({ page }) => {
  const url = 'https://raw.example.org/commit/change.json';
  const list = '{"kind":"realms-gos/legislation-change","format":1,"realm":"x","set":[],"remove":["x/tax"]}';
  await page.route('https://raw.example.org/**', (route) => route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: list }));
  const reply = realmCall('proposal_create', {
    title: 'A change list on another host',
    description: 'Its host is not one a page of the realm reads',
    effective_at: TAKES_EFFECT(),
    action: { op: 'codex_install', args: { url, checksum: `sha256:${hexOf(list)}` } },
  });
  const voting = await openExtension(page, 'voting', { path: `/extensions/voting/proposals/${String(reply.proposal).replace('P-', '')}` });
  try {
    await expect(voting.ext.getByTestId('change-failure')).toContainText("The realm's pages read only from some hosts.", { timeout: 120_000 });
    await page.screenshot({ path: join(OUT, 'local-voting-refused-host.png'), fullPage: true });
  } finally {
    await voting.close();
  }
});
