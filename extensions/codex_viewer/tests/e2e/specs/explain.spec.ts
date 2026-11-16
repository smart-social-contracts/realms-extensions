/**
 * The Explain button, on a realm that runs two layers.
 *
 * One click is one request: it dispatches `assistant.prompt` with the question it built and the text it is about —
 * the passage selected, or the whole chapter. The realm page sends both up to the portal, where the assistant takes
 * them (realms-gos#723, gos-as-a-service#99); the host here only records what it was handed.
 *
 * `frontend-rt/src/explain.test.ts` covers the wording alone. These specs cover what the click actually sends: put
 * 1.5.0's `dispatch({ type: 'assistant.prompt', autoSend: true })` back in `CodexViewer.svelte` and every test here
 * fails, because the action carries no message and no text.
 */
import { createHash } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { INFO, ME, VIEWS, byArgs, startRealm, status, type Scenario } from '../realm';

test.use({ viewport: { width: 1280, height: 900 } });

let scenario: Scenario;
let url: string;
let close: () => void;

test.beforeAll(async () => {
  const realm = await startRealm(() => scenario);
  url = realm.url;
  close = () => realm.server.close();
});
test.afterAll(() => close());

const chapter = (source: string, version: string, sha256: string) => ({
  source, version, sha256, vouched_by: 'rrkah-fqaaa-aaaaa-aaaaq-cai', route: 'capital',
});

/** Spain's tax chapter, with a citation and three lines, so the question has something to name. */
const ES_TAX = [
  'class Tax(above("tax")):',
  '    @rule(legislation="Ley 58/2003 Art. 8")',
  '    def rate(self): return 21',
].join('\n');

/** València's, which builds on Spain's: the deeper layer, so this is the chapter that runs. */
const VC_TAX = 'class Tax(above("tax")):\n    def rate(self): return 10\n';

const HELD: Record<string, string> = {
  'sha256:es-tax': ES_TAX,
  'sha256:vc-tax': VC_TAX,
  'sha256:es-cal': '{"holidays": ["2026-12-25"]}',
};

/** `tax` is defined twice — València's runs, Spain's is what it builds on — and the calendar is dates, not rules. */
const CODEX = {
  id: 'sha256:bc54c13d', status: 'active', layers: ['eu/es', 'eu/es/vc'], layer_paths: {},
  chapters: {
    'eu/es/tax': chapter('eu/es', '2.6.0', 'sha256:es-tax'),
    'eu/es/vc/tax': chapter('eu/es/vc', '1.1.0', 'sha256:vc-tax'),
    'eu/es/calendar': chapter('eu/es', '2.6.0', 'sha256:es-cal'),
  },
  previous: '', installed_at: 1_800_000_000, activates_at: null, proposal: 'P-12',
};

function realm(config: Record<string, unknown> = {}, texts?: Record<string, any>): Scenario {
  const held = texts ?? Object.fromEntries(
    Object.entries(HELD).map(([sum, text]) => [sum, { ok: true, text }]),
  );
  return {
    locale: 'en',
    config,
    replies: {
      codex_status: status({ codex: CODEX, history: [{ id: CODEX.id, status: 'active', installed_at: 1 }] }),
      me: ME(['proposal.create']),
      realm_info: INFO('Europe/Madrid'),
      codex_views: VIEWS,
      legislation_chapter: byArgs('chapter', held),
    },
  };
}

const sha256 = (text: string) => `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`;

/** What `eu` publishes, which this realm does not run: read at the commit its release was cut from. */
const EU_TEXT = 'class Tax:\n    @rule(legislation="Directive 2006/112/EC Art. 97")\n    def floor(self): return 15\n';
const EU_COMMIT = 'b47a994d0000000000000000000000000000beef';

/** Serve `eu`'s published source, as the page reads it over https. */
async function servePublished(page: Page, delayMs = 0) {
  await page.route(/raw\.githubusercontent\.com/, async (route) => {
    if (delayMs) await new Promise((done) => setTimeout(done, delayMs));
    const path = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': '*' };
    if (path.endsWith('/legislation/eu/releases.json')) {
      return route.fulfill({
        body: JSON.stringify([
          { version: '1.0.1', published: '2026-10-01', effective_from: '2027-01-01', commit: EU_COMMIT,
            chapters: { tax: sha256(EU_TEXT) } },
        ]),
        headers,
      });
    }
    if (path.endsWith(`/${EU_COMMIT}/legislation/eu/tax.py`)) return route.fulfill({ body: EU_TEXT, headers });
    return route.fulfill({ status: 404, body: '', headers });
  });
}

const lines = (page: Page) => page.locator('.monaco-editor .view-lines');
const domain = (page: Page, name: string) => page.locator('.domain-main', { hasText: name });
const explain = (page: Page) => page.locator('.btn-explain');
/** One layer of the stack, by the name it shows (`es` for `eu/es`: `stackOf` names a layer by its last segment). */
const layer = (page: Page, name: string) =>
  page.locator('.layer-item').filter({ has: page.locator('.layer-name', { hasText: new RegExp(`^${name}$`) }) });
const prompts = async (page: Page) =>
  (await dispatched(page)).filter((action: any) => action.type === 'assistant.prompt');

/** Every action the extension asked the host for, in order. */
const dispatched = (page: Page) => page.evaluate(() => (window as any).dispatched);

async function openSource(page: Page, query = '') {
  // No layer above these is installed: nothing is fetched, and a spec must never reach the network.
  await page.route(/raw\.githubusercontent\.com/, (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto(`${url}/extensions/codex_viewer${query}`);
  await page.getByRole('tab', { name: 'Source' }).click();
}

test('one click sends the question and the whole chapter, once', async ({ page }) => {
  scenario = realm();
  await openSource(page);
  await domain(page, 'tax').click();
  await expect(lines(page)).toContainText('return 10', { timeout: 30000 });

  await expect(explain(page)).toHaveAttribute('aria-label', 'Explain codex');
  await explain(page).click();

  const actions = await dispatched(page);
  const prompts = actions.filter((action: any) => action.type === 'assistant.prompt');
  expect(prompts).toHaveLength(1);
  const [prompt] = prompts;
  expect(prompt.autoSend).toBe(true);
  expect(prompt.message).toBe(
    'Explain eu/es/vc/tax.py (layer eu/es/vc, runs here): what it allows, what it forbids, and why.',
  );
  expect(prompt.context.text).toBe(VC_TAX);
  expect(prompt.context.label).toBe('eu/es/vc/tax.py');
  expect(prompt.context.languageId).toBe('python');
  expect(prompt.context.totalLines).toBe(3);
  expect(prompt.context.range).toEqual({ startLine: 1, endLine: 3 });
  expect(prompt.context.uri).toContain('eu%2Fes%2Fvc%2Ftax');
  // The reference: the digest the realm pins the chapter by, and who holds it.
  expect(prompt.context.checksum).toBe('sha256:vc-tax');
  expect(prompt.context.held).toBe('realm');
  expect(prompt.context.url).toBeUndefined();
});

test('the question names the legislation the chapter cites', async ({ page }) => {
  scenario = realm();
  await openSource(page);
  await domain(page, 'tax').click();
  await expect(lines(page)).toContainText('return 10', { timeout: 30000 });
  // Spain's chapter is what València's builds on: it is reached through the chain.
  const tax = page.locator('.domain', { hasText: 'tax' });
  await tax.locator('.domain-fold').click();
  await tax.locator('.chain-item').click();
  await expect(lines(page)).toContainText('return 21', { timeout: 30000 });

  await explain(page).click();

  const [prompt] = (await dispatched(page)).filter((action: any) => action.type === 'assistant.prompt');
  expect(prompt.message).toBe(
    'Explain eu/es/tax.py (layer eu/es, what eu/es/vc/tax.py builds on; cites Ley 58/2003 Art. 8): ' +
      'what it allows, what it forbids, and why.',
  );
  expect(prompt.message).not.toMatch(/overrid/i);
  expect(prompt.context.text).toBe(ES_TAX);
});

test('a selection sends those lines and only those lines', async ({ page }) => {
  scenario = realm();
  // The link opens Spain's chapter with lines 2-3 selected, as a shared link does.
  await openSource(page, '?codex=eu/es/tax&lines=2-3');
  await expect(lines(page)).toContainText('return 21', { timeout: 30000 });
  await expect(explain(page)).toHaveAttribute('aria-label', 'Explain selection');

  await explain(page).click();

  const [prompt] = (await dispatched(page)).filter((action: any) => action.type === 'assistant.prompt');
  expect(prompt.message).toBe(
    'Explain lines 2-3 of eu/es/tax.py (layer eu/es, what eu/es/vc/tax.py builds on; ' +
      'cites Ley 58/2003 Art. 8): what they allow, what they forbid, and why.',
  );
  expect(prompt.context.text).toBe(ES_TAX.split('\n').slice(1).join('\n'));
  expect(prompt.context.text).not.toContain('class Tax');
  expect(prompt.context.range).toEqual({ startLine: 2, endLine: 3 });
  expect(prompt.context.totalLines).toBe(3);
});

test('a calendar is asked about its dates, not about what it forbids', async ({ page }) => {
  scenario = realm();
  await openSource(page);
  await domain(page, 'calendar').click();
  await expect(lines(page)).toContainText('holidays', { timeout: 30000 });

  await explain(page).click();

  const [prompt] = (await dispatched(page)).filter((action: any) => action.type === 'assistant.prompt');
  expect(prompt.message).toBe(
    'Explain eu/es/calendar.json (layer eu/es, runs here): what dates it sets and what they are for.',
  );
  expect(prompt.context.languageId).toBe('json');
});

test('an explain link puts the question in, and does not send it', async ({ page }) => {
  // A link is not a gesture. The portal honours `autoSend` whenever the browser reports a live click — including a
  // click of the reader's own, a few milliseconds earlier, on something else — so the load path never asks for it.
  scenario = realm();
  await openSource(page, '?codex=eu/es/vc/tax&explain=1');
  await expect(lines(page)).toContainText('return 10', { timeout: 30000 });

  await expect.poll(async () => (await prompts(page)).length).toBe(1);
  const [prompt] = await prompts(page);
  expect(prompt.autoSend).toBe(false);
  expect(prompt.context.text).toBe(VC_TAX);

  // The button is what sends: the same question, now on a gesture of the reader's.
  await explain(page).click();
  const sent = await prompts(page);
  expect(sent).toHaveLength(2);
  expect(sent[1].autoSend).toBe(true);
  expect(sent[1].message).toBe(prompt.message);
});

test('an explain link names the lines it names', async ({ page }) => {
  // The lines are the reader's question, and Monaco has not reported them as a selection yet when the link opens.
  scenario = realm();
  await openSource(page, '?codex=eu/es/tax&lines=2-3&explain=1');
  await expect(lines(page)).toContainText('return 21', { timeout: 30000 });

  await expect.poll(async () => (await prompts(page)).length).toBe(1);
  const [prompt] = await prompts(page);
  expect(prompt.autoSend).toBe(false);
  expect(prompt.message).toContain('Explain lines 2-3 of eu/es/tax.py');
  expect(prompt.context.range).toEqual({ startLine: 2, endLine: 3 });
  expect(prompt.context.text).toBe(ES_TAX.split('\n').slice(1).join('\n'));
  expect(prompt.context.text).not.toContain('class Tax');
});

test('a chapter the reader picks while an explain link is still opening is not explained', async ({ page }) => {
  // The claim of `?explain=1` is the link's chapter and nothing else. `eu` is published, not installed, so the
  // link's chapter arrives only once GitHub answers — and the reader does not wait.
  scenario = realm();
  await servePublished(page, 2500);
  await page.goto(`${url}/extensions/codex_viewer?codex=eu/tax&explain=1`);
  await page.getByRole('tab', { name: 'Source' }).click();
  await domain(page, 'tax').click();
  await expect(lines(page)).toContainText('return 10', { timeout: 30000 });

  // Long enough for the published chapter to arrive: the link is spent, and nothing was asked on their click.
  await page.waitForTimeout(4000);
  expect(await prompts(page)).toHaveLength(0);
});

test('an explain link that names no chapter of this realm explains nothing', async ({ page }) => {
  // A stale or mistyped link: the page falls back to the first chapter, which the link never named.
  scenario = realm();
  await openSource(page, '?codex=eu/es/nothing&explain=1');
  await expect(lines(page)).toContainText('holidays', { timeout: 30000 });

  await page.waitForTimeout(1000);
  expect(await prompts(page)).toHaveLength(0);
});

test("the standing is the realm's, not that of the layer being looked at", async ({ page }) => {
  // Looking at `eu/es`, its tax chapter is the deepest in view — but `eu/es/vc/tax.py` is what the realm runs.
  scenario = realm();
  await openSource(page);
  await layer(page, 'es').click();
  await domain(page, 'tax').click();
  await expect(lines(page)).toContainText('return 21', { timeout: 30000 });

  await explain(page).click();

  const [prompt] = await prompts(page);
  expect(prompt.message).toBe(
    'Explain eu/es/tax.py (layer eu/es, what eu/es/vc/tax.py builds on; cites Ley 58/2003 Art. 8): ' +
      'what it allows, what it forbids, and why.',
  );
  expect(prompt.message).not.toContain('runs here');
});

test('a chapter the realm cannot read is still pointed at by its digest', async ({ page }) => {
  // The text could not be read, so the question carries no excerpt — but the digest is how the assistant reads
  // the whole chapter from the realm, so it still goes up.
  scenario = realm({}, {
    'sha256:vc-tax': { ok: false, error: 'NotFound: ChapterSource sha256:vc-tax' },
    'sha256:es-cal': { ok: true, text: HELD['sha256:es-cal'] },
  });
  await openSource(page);
  await domain(page, 'tax').click();
  await expect(page.locator('.editor-title')).toHaveText('eu/es/vc/tax.py');

  await explain(page).click();

  const [prompt] = await prompts(page);
  expect(prompt.message).toBe(
    'Explain eu/es/vc/tax.py (layer eu/es/vc, runs here): what it allows, what it forbids, and why.',
  );
  expect(prompt.context.text).toBeUndefined();
  expect(prompt.context.checksum).toBe('sha256:vc-tax');
  expect(prompt.context.held).toBe('realm');
});

test("a chapter of a layer the realm does not run is referenced where it is published", async ({ page }) => {
  scenario = realm();
  await servePublished(page);
  await page.goto(`${url}/extensions/codex_viewer`);
  await page.getByRole('tab', { name: 'Source' }).click();
  // Look at `eu`, which this realm does not run: its chapter comes from where the layer publishes it.
  await page.locator('.layer-item', { hasText: 'eu' }).first().click();
  await page.locator('.domain-main', { hasText: 'tax' }).click();
  await expect(lines(page)).toContainText('return 15', { timeout: 30000 });

  await explain(page).click();

  const [prompt] = (await dispatched(page)).filter((action: any) => action.type === 'assistant.prompt');
  expect(prompt.message).toBe(
    'Explain eu/tax.py (layer eu, a layer this realm does not run; cites Directive 2006/112/EC Art. 97): ' +
      'what it allows, what it forbids, and why.',
  );
  expect(prompt.context.held).toBe('published');
  expect(prompt.context.checksum).toBe(sha256(EU_TEXT));
  expect(prompt.context.url).toBe(
    `https://raw.githubusercontent.com/smart-social-contracts/realms-codices/${EU_COMMIT}/legislation/eu/tax.py`,
  );
  expect(prompt.context.text).toBe(EU_TEXT);
});

test('there is no button where the realm has no assistant', async ({ page }) => {
  scenario = realm({ aiAssistantEnabled: false });
  await openSource(page);
  await domain(page, 'tax').click();
  await expect(lines(page)).toContainText('return 10', { timeout: 30000 });

  await expect(explain(page)).toHaveCount(0);
  expect((await dispatched(page)).filter((a: any) => a.type === 'assistant.prompt')).toHaveLength(0);
});

test('an earlier codex the realm no longer runs is not said to run here', async ({ page }) => {
  // A realm on a codex of the earlier kind: two versions of one package, one active. Both carry the same display
  // name, so the question names the version, and the standing comes from the history's own status.
  await page.route(/aaaaa-aa\.localhost/, (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': '*' };
    if (path.endsWith('/backend/hooks.py')) return route.fulfill({ body: `HOOKS = "${path}"\n`, headers });
    if (path.endsWith('/manifest.json')) return route.fulfill({ body: '{"name":"Agora","description":"d"}', headers });
    return route.fulfill({ status: 404, body: '' });
  });
  scenario = {
    locale: 'en',
    config: { fileRegistryCanisterId: 'aaaaa-aa' },
    replies: {
      codex_status: status({
        codex: { id: 'agora@1.2.0', version: '1.2.0', status: 'active', installed_at: 300, previous: '' },
        history: [
          { id: 'agora@1.2.0', version: '1.2.0', status: 'active', installed_at: 300 },
          { id: 'agora@1.1.0', version: '1.1.0', status: 'inactive', installed_at: 200 },
        ],
        sync_sources: [],
      }),
      me: ME(['proposal.create']),
      realm_info: INFO('Europe/Madrid'),
      codex_views: { ok: true, views: {} },
    },
  };
  await page.goto(`${url}/extensions/codex_viewer`);
  const tab = page.getByRole('tab', { name: 'Source' });
  if (await tab.count()) await tab.click();
  await expect(lines(page)).toContainText('1.2.0', { timeout: 30000 });

  // The one the realm runs.
  await explain(page).click();
  expect((await prompts(page))[0].message).toBe(
    'Explain agora@1.2.0 (runs here): what it allows, what it forbids, and why.',
  );

  // And the earlier one, which it does not.
  await page.locator('.codex-item').nth(1).click();
  await expect(lines(page)).toContainText('1.1.0', { timeout: 30000 });
  await explain(page).click();

  const prompt = (await prompts(page))[1];
  expect(prompt.message).toBe(
    'Explain agora@1.1.0 (an earlier codex this realm no longer runs): what it allows, what it forbids, and why.',
  );
  expect(prompt.message).not.toContain('runs here');
  expect(prompt.message).not.toMatch(/overrid/i);
  expect(prompt.context.label).toBe('agora@1.1.0');
});
