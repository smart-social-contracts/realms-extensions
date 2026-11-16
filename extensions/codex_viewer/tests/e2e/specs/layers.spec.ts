/**
 * The layer stack, the domain tree and the inherited checkbox of the Source tab.
 *
 * The realm here runs `eu/es`; `eu` above it is published but not installed, so its chapter is read from where the
 * layer publishes it and checked against the digest its release pins. Those fetches are served by the test, so what
 * is under test is the page's own rules: which layers are shown, what each view keeps, and that a digest that does
 * not match stops the text being shown.
 */
import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { INFO, ME, VIEWS, byArgs, startRealm, status, type Scenario } from '../realm';

test.use({ viewport: { width: 1280, height: 1000 } });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
});
test.afterAll(() => close());

const sha256 = (text: string) => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;

const chapter = (source: string, version: string, sha: string) => ({
  source, version, sha256: sha, vouched_by: 'rrkah-fqaaa-aaaaa-aaaaq-cai', route: 'capital',
});

/** What the realm holds: Spain's own layer, four chapters. */
const HELD: Record<string, string> = {
  'sha256:es-tax': 'ES_TAX = 1\n',
  'sha256:es-proc': 'ES_PROCEDURE = 1\n',
  'sha256:es-dp': 'ES_DATA_PROTECTION = 1\n',
  'sha256:es-cal': '{"es": "calendar"}',
};

const CODEX = {
  id: 'sha256:bc54c13d', status: 'active', layers: ['eu/es'], layer_paths: {},
  chapters: {
    'eu/es/tax': chapter('eu/es', '2.6.0', 'sha256:es-tax'),
    'eu/es/procedure': chapter('eu/es', '2.6.0', 'sha256:es-proc'),
    'eu/es/data_protection': chapter('eu/es', '2.6.0', 'sha256:es-dp'),
    'eu/es/calendar': chapter('eu/es', '2.6.0', 'sha256:es-cal'),
  },
  previous: '', installed_at: 1_800_000_000, activates_at: null, proposal: 'P-12',
};

/** What `eu` publishes: one chapter, at a commit of its own. */
const EU_TEXT = 'EU_DATA_PROTECTION = 1\n';
const EU_COMMIT = 'b47a994d0000000000000000000000000000beef';

function euReleases(digest = sha256(EU_TEXT)) {
  return JSON.stringify([
    { version: '1.0.0', published: '2026-01-01', effective_from: '2027-01-01', commit: 'old', chapters: { data_protection: 'sha256:stale' } },
    { version: '1.0.1', published: '2026-10-01', effective_from: '2027-01-01', commit: EU_COMMIT, chapters: { data_protection: digest } },
  ]);
}

/** Serve the published source of `eu`; `body` and `digest` let a test break one of them. */
async function servePublished(page: Page, opts: { body?: string; digest?: string; fail?: boolean } = {}) {
  const asked: string[] = [];
  await page.route(/raw\.githubusercontent\.com/, (route) => {
    const path = new URL(route.request().url()).pathname;
    asked.push(path);
    const headers = { 'access-control-allow-origin': '*' };
    if (opts.fail) return route.fulfill({ status: 404, body: '', headers });
    if (path.endsWith('/legislation/eu/releases.json')) {
      return route.fulfill({ body: euReleases(opts.digest), headers });
    }
    if (path.endsWith(`/${EU_COMMIT}/legislation/eu/data_protection.py`)) {
      return route.fulfill({ body: opts.body ?? EU_TEXT, headers });
    }
    return route.fulfill({ status: 404, body: '', headers });
  });
  return asked;
}

function realm(): Scenario {
  return {
    locale: 'en',
    replies: {
      codex_status: status({ codex: CODEX, history: [{ id: CODEX.id, status: 'active', installed_at: 1 }] }),
      me: ME(['proposal.create']),
      realm_info: INFO('Europe/Madrid'),
      codex_views: VIEWS,
      legislation_chapter: byArgs('chapter', Object.fromEntries(
        Object.entries(HELD).map(([sum, text]) => [sum, { ok: true, text }]),
      )),
    },
  };
}

const lines = (page: Page) => page.locator('.monaco-editor .view-lines');
const domains = (page: Page) => page.locator('.domain-main .codex-item-name');
const layers = (page: Page) => page.locator('.layer-item .layer-name');

async function openSource(page: Page, query = '') {
  await page.goto(`${url}/extensions/codex_viewer${query}`);
  await page.getByRole('tab', { name: 'Source' }).click();
}

test('the stack shows every layer down to the realm, and says which it runs', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page);
  await expect(page.getByTestId('layer-stack')).toBeVisible();
  await expect(layers(page)).toHaveText(['eu', 'es']);
  await expect(page.locator('.layer-item', { hasText: 'es' }).locator('.layer-mark')).toHaveText('runs here');
  await expect(page.locator('.layer-item', { hasText: 'eu' }).first().locator('.layer-mark')).toHaveText('published');
});

test('the tree is by domain, and opens on the chapter that governs', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page);
  await expect(domains(page)).toHaveText(['calendar (dates)', 'data_protection', 'procedure', 'tax']);
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('ES_TAX', { timeout: 30000 });
});

test('a domain several layers define keeps the chain folded until it is opened', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page);
  const dp = page.locator('.domain', { hasText: 'data_protection' });
  // Only data_protection has anything above it: the others show no fold control.
  await expect(page.locator('.domain-fold:not(.empty)')).toHaveCount(1);
  await expect(dp.locator('.domain-chain')).toHaveCount(0);
  await dp.locator('.domain-fold').click();
  await expect(dp.locator('.domain-chain')).toBeVisible();
  await expect(dp.locator('.chain-item .codex-item-name')).toHaveText('eu/data_protection.py');
});

test("a published chapter's text is fetched at its release commit and shown", async ({ page }) => {
  scenario = realm();
  const asked = await servePublished(page);
  await openSource(page);
  const dp = page.locator('.domain', { hasText: 'data_protection' });
  await dp.locator('.domain-fold').click();
  await dp.locator('.chain-item').click();
  await expect(lines(page)).toContainText('EU_DATA_PROTECTION', { timeout: 30000 });
  expect(asked.some((path) => path.endsWith('/legislation/eu/releases.json'))).toBe(true);
  expect(asked.some((path) => path.includes(`/${EU_COMMIT}/`))).toBe(true);
});

test('text whose digest is not the published one is refused, not shown', async ({ page }) => {
  scenario = realm();
  await servePublished(page, { body: 'EU_TAMPERED = 666\n' });
  await openSource(page);
  const dp = page.locator('.domain', { hasText: 'data_protection' });
  await dp.locator('.domain-fold').click();
  await dp.locator('.chain-item').click();
  await expect(page.getByTestId('published-error')).toContainText('is not the published', { timeout: 30000 });
  // Nothing of the text reaches the page: there is no editor to hold it.
  await expect(page.locator('.codex-editor-pane')).not.toContainText('EU_TAMPERED');
  await expect(lines(page)).toHaveCount(0);
});

test('choosing the layer above shows what it publishes, and nothing of the realm', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page);
  await page.locator('.layer-item', { hasText: 'eu' }).first().click();
  await expect(domains(page)).toHaveText(['data_protection']);
  // Nothing is inherited at the top of the stack, so the checkbox can do nothing there.
  await expect(page.locator('.layer-inherited input')).toBeDisabled();
});

test('unchecked, a layer shows only the chapters it publishes itself', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page);
  const dp = page.locator('.domain', { hasText: 'data_protection' });
  await dp.locator('.domain-fold').click();
  await expect(dp.locator('.chain-item')).toHaveCount(1);

  await page.locator('.layer-inherited input').uncheck();
  await expect(domains(page)).toHaveText(['calendar (dates)', 'data_protection', 'procedure', 'tax']);
  // The EU chapter is gone with the inheritance, so no domain has a chain any more.
  await expect(page.locator('.domain-fold:not(.empty)')).toHaveCount(0);
  await expect(page.locator('.stats')).toContainText('this layer alone');
});

test('the link carries the layer and how it is read', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page);
  await page.locator('.layer-inherited input').uncheck();
  await page.locator('.domain-main', { hasText: 'procedure' }).click();
  await expect(lines(page)).toContainText('ES_PROCEDURE', { timeout: 30000 });
  await expect(page).toHaveURL(/layer=eu%2Fes/);
  await expect(page).toHaveURL(/inherited=0/);
});

test('a link to a layer opens it, read the way the link says', async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await openSource(page, '?codex=eu%2Fes%2Ftax&layer=eu%2Fes&inherited=0');
  await expect(page.locator('.layer-inherited input')).not.toBeChecked();
  await expect(page.locator('.editor-title')).toHaveText('eu/es/tax.py');
  await expect(lines(page)).toContainText('ES_TAX', { timeout: 30000 });
});

test('the published source being unreachable says so and leaves the realm readable', async ({ page }) => {
  scenario = realm();
  await servePublished(page, { fail: true });
  await openSource(page);
  // What the realm holds is unaffected by a layer above being out of reach.
  await expect(domains(page)).toHaveText(['calendar (dates)', 'data_protection', 'procedure', 'tax']);
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('ES_TAX', { timeout: 30000 });
  // Out of reach is not an error: the stack says so, and no banner is raised.
  await expect(page.locator('.layer-item', { hasText: 'eu' }).first().locator('.layer-mark')).toHaveText(
    'source unavailable',
  );
  await expect(page.getByTestId('published-error')).toHaveCount(0);
});
