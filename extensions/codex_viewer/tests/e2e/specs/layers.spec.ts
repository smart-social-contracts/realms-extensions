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
  // The banner belongs to the chapter it names: reading another one puts it away.
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('ES_TAX', { timeout: 30000 });
  await expect(page.getByTestId('published-error')).toHaveCount(0);
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

test('a published source that never answers still shows the legislation the realm holds', async ({ page }) => {
  // B1 of the #113 review. A 404 was already covered; a request that never completes is the case that matters,
  // because that is what a network silently dropping raw.githubusercontent.com does, and `eu` is not installed
  // here. The realm's own chapters must not wait for it.
  scenario = realm();
  const held: Promise<void>[] = [];
  await page.route(/raw\.githubusercontent\.com/, () => {
    // Never fulfilled, never aborted: the page is left waiting, as a blackholed host leaves it.
    held.push(new Promise<void>(() => {}));
  });
  await openSource(page);
  // Under the published fetch's own 10 s bound: waiting for that fetch at all is the fault, not waiting for ever.
  await expect(domains(page)).toHaveText(['calendar (dates)', 'data_protection', 'procedure', 'tax'], {
    timeout: 6000,
  });
  await expect(page.locator('.list-loading')).toHaveCount(0);
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('ES_TAX', { timeout: 30000 });
  expect(held.length).toBeGreaterThan(0);
});

test('a link to a published chapter opens that chapter, not another layer of the same domain', async ({ page }) => {
  // B3 of the #113 review. This is the link the page itself writes once a published chapter is chosen, and
  // `data_protection` is a domain both layers define: resolving it before `eu` is loaded opens Spain's.
  scenario = realm();
  await servePublished(page);
  await openSource(page, '?codex=eu%2Fdata_protection&layer=eu%2Fes');
  await expect(page.locator('.editor-title')).toHaveText('eu/data_protection.py', { timeout: 30000 });
  await expect(lines(page)).toContainText('EU_DATA_PROTECTION', { timeout: 30000 });
});

test('a sibling sync source and the realm keep their own places in the stack', async ({ page }) => {
  // B2 of the #113 review, on the built page: EMSHI and the realm's own layer have the same number of segments.
  scenario = realm();
  scenario.replies.codex_status = status({
    codex: {
      ...CODEX,
      layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/emshi', 'eu/es/vc/46250-valencia'],
      chapters: {
        ...CODEX.chapters,
        'eu/es/vc/emshi/water': chapter('eu/es/vc/emshi', '1.0.0', 'sha256:emshi-water'),
        'eu/es/vc/46250-valencia/tax': chapter('eu/es/vc/46250-valencia', '', 'sha256:own-tax'),
      },
    },
    history: [{ id: CODEX.id, status: 'active', installed_at: 1 }],
  });
  scenario.replies.legislation_chapter = byArgs('chapter', {
    ...Object.fromEntries(Object.entries(HELD).map(([sum, text]) => [sum, { ok: true, text }])),
    'sha256:emshi-water': { ok: true, text: 'EMSHI_WATER = 1\n' },
    'sha256:own-tax': { ok: true, text: 'OWN_TAX = 1\n' },
  });
  await servePublished(page);
  await openSource(page);
  await expect(layers(page)).toHaveText(['eu', 'es', 'vc', 'emshi', '46250-valencia']);
  // The realm's own layer is the one the tab opens on, and its own tax is what governs there.
  await expect(page.locator('.layer-item.selected .layer-name')).toHaveText('46250-valencia');
  await expect(domains(page)).toHaveText(['calendar (dates)', 'data_protection', 'procedure', 'tax', 'water']);
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('OWN_TAX', { timeout: 30000 });
  // EMSHI is above the realm in the path, so its water is inherited here even though its id is not a prefix.
  await page.locator('.domain-main', { hasText: 'water' }).click();
  await expect(lines(page)).toContainText('EMSHI_WATER', { timeout: 30000 });
});

test('a chapter the reader picks is not taken from them when the published layer arrives', async ({ page }) => {
  // N1 of the #113 re-review. The held tree shows before GitHub answers, so a reader can choose first. The link's
  // chapter must not then open over theirs: it opens without touching the URL, so the editor and the address bar
  // would name different chapters and the link they copied would share neither.
  scenario = realm();
  await page.route(/raw\.githubusercontent\.com/, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': '*' };
    await new Promise((wait) => setTimeout(wait, 3000));
    if (path.endsWith('/legislation/eu/releases.json')) return route.fulfill({ body: euReleases(), headers });
    if (path.endsWith(`/${EU_COMMIT}/legislation/eu/data_protection.py`)) {
      return route.fulfill({ body: EU_TEXT, headers });
    }
    return route.fulfill({ status: 404, body: '', headers });
  });
  await openSource(page, '?codex=eu%2Fdata_protection&layer=eu%2Fes');
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('ES_TAX', { timeout: 30000 });
  // Well past the 3 s the published layer takes.
  await page.waitForTimeout(5000);
  await expect(page.locator('.editor-title')).toHaveText('eu/es/tax.py');
  expect(new URL(page.url()).searchParams.get('codex')).toBe('eu/es/tax');
});

test('an uninstalled layer above that is nobody’s ancestor is still read', async ({ page }) => {
  // The stack says what is above, so a layer that no running id has as a prefix is fetched like any other. Reading
  // the path out of the chosen layer's id instead would leave `eu/fr` out and its chapter off the tree.
  scenario = realm();
  scenario.replies.codex_status = status({
    codex: { ...CODEX, layers: ['eu/es', 'eu/fr/vc', 'eu/es/own'] },
    history: [{ id: CODEX.id, status: 'active', installed_at: 1 }],
  });
  const FR = 'FR_HOUSING = 1\n';
  const FR_COMMIT = 'c58b115e1111111111111111111111111111dead';
  await page.route(/raw\.githubusercontent\.com/, (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': '*' };
    if (path.endsWith('/legislation/eu/releases.json')) return route.fulfill({ body: euReleases(), headers });
    if (path.endsWith(`/${EU_COMMIT}/legislation/eu/data_protection.py`)) {
      return route.fulfill({ body: EU_TEXT, headers });
    }
    if (path.endsWith('/legislation/eu/fr/releases.json')) {
      return route.fulfill({
        body: JSON.stringify([{
          version: '1.0.0', published: '2026-05-01', effective_from: '2027-01-01',
          commit: FR_COMMIT, chapters: { housing: sha256(FR) },
        }]),
        headers,
      });
    }
    if (path.endsWith(`/${FR_COMMIT}/legislation/eu/fr/housing.py`)) return route.fulfill({ body: FR, headers });
    return route.fulfill({ status: 404, body: '', headers });
  });
  await openSource(page);
  await expect(layers(page)).toHaveText(['eu', 'es', 'fr', 'vc', 'own']);
  await expect(domains(page)).toContainText(['housing']);
  await page.locator('.domain-main', { hasText: 'housing' }).click();
  await expect(lines(page)).toContainText('FR_HOUSING', { timeout: 30000 });
});

test('the stack indents by how deep a layer sits, not by its place in the list', async ({ page }) => {
  scenario = realm();
  scenario.replies.codex_status = status({
    codex: {
      ...CODEX,
      layers: ['eu/es', 'eu/es/vc', 'eu/es/vc/emshi', 'eu/es/vc/46250-valencia'],
      chapters: {
        ...CODEX.chapters,
        'eu/es/vc/emshi/water': chapter('eu/es/vc/emshi', '1.0.0', 'sha256:emshi-water'),
      },
    },
    history: [{ id: CODEX.id, status: 'active', installed_at: 1 }],
  });
  await servePublished(page);
  await openSource(page);
  const pads = await page.locator('.layer-item').evaluateAll((items) =>
    items.map((item) => getComputedStyle(item as HTMLElement).paddingLeft),
  );
  // eu, es, vc, then the two siblings at the same depth.
  expect(pads).toEqual(['8px', '18px', '28px', '38px', '38px']);
});

test('a link cannot leave the checkbox off at the top of the stack', async ({ page }) => {
  // `eu` inherits nothing, so the checkbox is disabled; `inherited=0` would leave it disabled and unchecked over a
  // tree that is the whole layer anyway.
  scenario = realm();
  await servePublished(page);
  await openSource(page, '?layer=eu&inherited=0');
  await expect(page.locator('.layer-item.selected .layer-name')).toHaveText('eu');
  await expect(page.locator('.layer-inherited input')).toBeChecked();
  await expect(page.locator('.layer-inherited input')).toBeDisabled();
});
