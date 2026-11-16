/**
 * The Source tab, on a realm that runs a layered codex: one entry per chapter, and each chapter's text read from the
 * realm with `legislation_chapter`. Until 1.4.0 the tab only knew legacy codex packages in the file registry, so on a
 * layered codex it listed codex ids it could never read and the editor stayed empty.
 *
 * The unit tests in `frontend-rt/src/source.test.ts` cover the decision alone (what is listed, what each entry is
 * called). These specs cover the read itself: put 1.3.0's registry-only read back in `CodexViewer.svelte` and the
 * four tests that name a chapter's text fail.
 */
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

const MEMBER = ['proposal.create'];

/** A chapter as `codex_status` gives it. Each one has a checksum of its own: that is what reads its text. */
const chapter = (source: string, version: string, sha256: string) => ({
  source,
  version,
  sha256,
  vouched_by: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
  route: 'capital',
});

/** Two layers and a calendar, so the list shows layer order, a `.py` and a `.json`. */
const LAYERED = {
  id: 'sha256:bc54c13dba2e4fcebce19b',
  status: 'active',
  layers: ['eu/es', 'eu/es/vc'],
  layer_paths: {},
  chapters: {
    'eu/es/vc/tax': chapter('eu/es/vc', '1.1.0', 'sha256:cc'),
    'eu/es/procedure': chapter('eu/es', '2.6.0', 'sha256:bb'),
    'eu/es/calendar': chapter('eu/es', '2.6.0', 'sha256:ca'),
  },
  previous: 'sha256:edbcc6c22312cedf8a2f58',
  installed_at: Date.UTC(2026, 10, 9, 9, 30) / 1000,
  activates_at: null,
  proposal: 'P-12',
};

/** The text the realm holds for each checksum. A word of its own per chapter, so the editor cannot be mistaken. */
const TEXTS: Record<string, any> = {
  'sha256:ca': { ok: true, text: '{"holidays": ["2026-12-25"], "chapter": "calendar"}' },
  'sha256:bb': { ok: true, text: 'PROCEDURE_TEXT = 1\n' },
  'sha256:cc': { ok: true, text: 'TAX_TEXT = 2\n' },
};

function layered(texts: Record<string, any> = TEXTS, delay: Record<string, number> = {}): Scenario {
  return {
    locale: 'en',
    replies: {
      codex_status: status({
        codex: LAYERED,
        history: [
          { id: LAYERED.id, status: 'active', installed_at: 1 },
          { id: LAYERED.previous, status: 'inactive', installed_at: 0 },
        ],
      }),
      me: ME(MEMBER),
      realm_info: INFO('Europe/Madrid'),
      codex_views: VIEWS,
      legislation_chapter: byArgs('chapter', texts, delay),
    },
  };
}

const lines = (page: Page) => page.locator('.monaco-editor .view-lines');
const names = (page: Page) => page.locator('.domain-main .codex-item-name');
/** 1.5.0 lists a domain per row; the file it opens is the chapter of the deepest layer that defines it. */
const file = (page: Page, domain: string) => page.locator('.domain-main', { hasText: domain });

/** Every `legislation_chapter` the page asked for, in order. */
const chaptersRead = (page: Page) =>
  page.evaluate(() =>
    (window as any).asked.filter((call: any[]) => call[0] === 'legislation_chapter').map((call: any[]) => call[1].chapter),
  );

async function openSource(page: Page) {
  // No layer above these is installed; the tests here are about the realm's own chapters, so nothing is fetched.
  await page.route(/raw\.githubusercontent\.com/, (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto(`${url}/extensions/codex_viewer`);
  await page.getByRole('tab', { name: 'Source' }).click();
}

test('lists one file per chapter, in layer order, and opens the first one', async ({ page }) => {
  scenario = layered();
  await openSource(page);
  await expect(names(page)).toHaveText(['calendar (dates)', 'procedure', 'tax']);
  await expect(page.locator('.editor-title')).toHaveText('eu/es/calendar.json');
  await expect(page.locator('.badge-lang')).toHaveText('json');
  await expect(lines(page)).toContainText('holidays', { timeout: 30000 });
  // The page reads that one chapter and no other. It reads it more than once: a hidden viewer is mounted before
  // `codex_status` answers, which predates 1.4.0 and costs one extra query per visit.
  expect(new Set(await chaptersRead(page))).toEqual(new Set(['sha256:ca']));
});

test("shows a chapter's own text, read by its own checksum", async ({ page }) => {
  scenario = layered();
  await openSource(page);
  await file(page, 'procedure').click();
  await expect(page.locator('.badge-lang')).toHaveText('python');
  await expect(lines(page)).toContainText('PROCEDURE_TEXT', { timeout: 30000 });
  await expect(lines(page)).not.toContainText('TAX_TEXT');
  expect(await chaptersRead(page)).toContain('sha256:bb');

  await file(page, 'tax').click();
  await expect(lines(page)).toContainText('TAX_TEXT', { timeout: 30000 });
  expect(await chaptersRead(page)).toContain('sha256:cc');
});

test('names the file the realm holds no text for, and asks again when it is chosen again', async ({ page }) => {
  scenario = layered({ ...TEXTS, 'sha256:cc': { ok: false, error: 'NotFound: ChapterSource sha256:cc' } });
  await openSource(page);
  await file(page, 'tax').click();
  await expect(page.locator('.monaco-loading')).toHaveText('The realm has no text stored for eu/es/vc/tax.py.');

  await file(page, 'procedure').click();
  await expect(lines(page)).toContainText('PROCEDURE_TEXT', { timeout: 30000 });
  await file(page, 'tax').click();
  await expect(page.locator('.monaco-loading')).toBeVisible();
  // A failed read is not cached as if it were the chapter's text.
  expect((await chaptersRead(page)).filter((sum) => sum === 'sha256:cc').length).toBe(2);
});

test('a slow read does not overwrite the file chosen after it', async ({ page }) => {
  scenario = layered(TEXTS, { 'sha256:bb': 1200 });
  await openSource(page);
  await expect(lines(page)).toContainText('holidays', { timeout: 30000 });
  await file(page, 'procedure').click();
  await file(page, 'tax').click();
  await expect(lines(page)).toContainText('TAX_TEXT', { timeout: 30000 });
  await page.waitForTimeout(2000);
  await expect(page.locator('.editor-title')).toHaveText('eu/es/vc/tax.py');
  await expect(lines(page)).toContainText('TAX_TEXT');
  await expect(lines(page)).not.toContainText('PROCEDURE_TEXT');
});

test('a deep link opens the chapter it names', async ({ page }) => {
  scenario = layered();
  await page.route(/raw\.githubusercontent\.com/, (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto(`${url}/extensions/codex_viewer?codex=eu%2Fes%2Fvc%2Ftax`);
  await page.getByRole('tab', { name: 'Source' }).click();
  await expect(page.locator('.editor-title')).toHaveText('eu/es/vc/tax.py');
  await expect(lines(page)).toContainText('TAX_TEXT', { timeout: 30000 });
});

test('a legacy codex is still read from the file registry, with no chapter read at all', async ({ page }) => {
  const fetched: string[] = [];
  await page.route(/aaaaa-aa\.localhost/, (route) => {
    const path = new URL(route.request().url()).pathname;
    fetched.push(path);
    const headers = { 'access-control-allow-origin': '*' };
    if (path.endsWith('/backend/hooks.py')) return route.fulfill({ body: 'LEGACY_HOOKS = 3\n', headers });
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
      me: ME(MEMBER),
      realm_info: INFO('Europe/Madrid'),
      codex_views: { ok: true, views: {} },
    },
  };
  await page.goto(`${url}/extensions/codex_viewer`);
  const tab = page.getByRole('tab', { name: 'Source' });
  if (await tab.count()) await tab.click();
  await expect(lines(page)).toContainText('LEGACY_HOOKS', { timeout: 30000 });
  expect(fetched).toContain('/ext/agora/1.2.0/backend/hooks.py');
  expect(await chaptersRead(page)).toEqual([]);
});
