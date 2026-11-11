import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPITAL, CODEX_ID, FOUND, INSTALL, issueOf, LOGO, NOT_RECORDED, PUBLISHED, REVERT, startRealm, type Scenario } from '../realm';

const OUT = join(__dirname, '..', 'test-results', '.playwright');
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

function chinese(): Scenario {
  return {
    locale: 'zh-CN',
    realm: { name: '瓦伦西亚', logoUrl: LOGO },
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, [INSTALL], '瓦伦西亚') } } },
  };
}

function quarter(): Scenario {
  return {
    locale: 'en',
    realm: { name: 'Agora North', logoUrl: LOGO },
    replies: {
      journal_issue: { ok: true, issued: false, capital: CAPITAL },
      journal_capital_issue: { ...issueOf('2026-11-09', 3, [INSTALL], 'Agora'), issued: false },
    },
  };
}

function consoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  return errors;
}

function sheet(page: Page): FrameLocator {
  return page.frameLocator('iframe.sheet');
}

/** The sheet as the browser prints it: its own document, on A4. */
async function printedPdf(page: Page): Promise<Buffer> {
  const html = await page.locator('iframe.sheet').evaluate((frame) => (frame as HTMLIFrameElement).srcdoc);
  const paper = await page.context().newPage();
  await paper.setContent(html);
  const pdf = await paper.pdf({ preferCSSPageSize: true, printBackground: true });
  await paper.close();
  return pdf;
}

test('today\'s issue is shown as paper with the realm\'s logo, in Chinese', async ({ page }) => {
  scenario = chinese();
  await page.goto(`${url}/extensions/journal`);
  const paper = sheet(page);
  await expect(paper.getByRole('heading', { name: '瓦伦西亚官方公报', level: 1 })).toBeVisible();
  await expect(paper.getByText('第 3 期')).toBeVisible();
  await expect(paper.getByText('2026年11月9日星期一')).toBeVisible();
  await expect(paper.getByRole('heading', { name: 'I. 立法', level: 2 })).toBeVisible();
  await expect(paper.getByText('本领域现已适用新的立法：eu/es 2.4.0, eu/es/vc 1.1.0。')).toBeVisible();
  await expect(paper.locator('article time')).toHaveText('11:30');
  await expect(paper.locator('.masthead img')).toBeVisible();
  await page.screenshot({ path: join(OUT, 'journal-zh-CN.png') });
});

test('the same issue in English, empty days included', async ({ page }) => {
  scenario = {
    locale: 'en',
    realm: { name: 'Agora', logoUrl: LOGO },
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, []), '2026-11-08': issueOf('2026-11-08', 2, []) } } },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).getByText('No entries were published on this day.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Next day/ })).toBeDisabled();
  await page.getByRole('button', { name: /Previous day/ }).click();
  await expect(sheet(page).getByText('No. 2', { exact: true })).toBeVisible();
  await expect(sheet(page).getByText('Sunday, November 8, 2026')).toBeVisible();
  expect(await page.evaluate(() => (window as any).asked.at(-1))).toEqual(['journal_issue', { day: '2026-11-08' }]);
  await page.screenshot({ path: join(OUT, 'journal-en-empty.png') });
});

test('the releases a check found and the realm published are lines of the sheet, in Chinese too, and print to a PDF', async ({
  page,
}) => {
  scenario = chinese();
  scenario.replies.journal_issue.byDay[''] = issueOf('2026-11-09', 3, [FOUND, PUBLISHED, INSTALL], '瓦伦西亚');
  await page.goto(`${url}/extensions/journal`);
  const paper = sheet(page);
  await expect(paper.getByText('本领域获悉 eu/es 的立法发布了新版本：版本 2.5.0，自 2027年1月1日 起生效。')).toBeVisible();
  await expect(paper.getByText('本领域发布了其立法的一个版本：eu/es/vc 版本 1.2.0，自 2027年1月1日 起生效。')).toBeVisible();
  await expect(paper.locator('article time')).toHaveText(['09:15', '10:45', '11:30']);
  await page.screenshot({ path: join(OUT, 'journal-zh-CN-releases.png') });
  const file = join(OUT, 'journal-zh-CN-releases.pdf');
  writeFileSync(file, await printedPdf(page));
  const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  expect(text).toContain('版本 2.5.0，自 2027年1月1日'); // the line wraps after it
  expect(execFileSync('pdfinfo', [file], { encoding: 'utf8' })).toMatch(/Pages:\s+1\b/);

  scenario.locale = 'en';
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).getByText('The realm learned of a release of legislation from eu/es: version 2.5.0, in force from January 1, 2027.')).toBeVisible();
  await expect(sheet(page).getByText('The realm published a release of its legislation: eu/es/vc version 1.2.0, in force from January 1, 2027.')).toBeVisible();
});

test('the print route shows the sheet alone and its button prints the sheet, not the realm\'s page', async ({ page }) => {
  scenario = chinese();
  scenario.replies.journal_issue.byDay['2026-11-09'] = issueOf('2026-11-09', 3, [INSTALL], '瓦伦西亚');
  await page.goto(`${url}/extensions/journal/2026-11-09/print`);
  await expect(sheet(page).getByRole('heading', { name: '瓦伦西亚官方公报' })).toBeVisible();
  await expect(page.getByRole('button', { name: '前一天' })).toHaveCount(0);
  await page.locator('iframe.sheet').evaluate((frame) => {
    (frame as HTMLIFrameElement).contentWindow!.print = () => ((window as any).printed += 1);
  });
  await page.getByRole('button', { name: '打印或另存为 PDF' }).click();
  expect(await page.evaluate(() => (window as any).printed)).toBe(1);
});

test('the sheet prints to a PDF with the Chinese text in it', async ({ page }) => {
  scenario = chinese();
  await page.goto(`${url}/extensions/journal/2026-11-09/print`);
  await expect(sheet(page).locator('h1')).toBeVisible();
  const file = join(OUT, 'journal-zh-CN.pdf');
  writeFileSync(file, await printedPdf(page));
  const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  expect(text).toContain('瓦伦西亚官方公报');
  expect(text).toMatch(/第\s*3\s*期/); // the text of a PDF has its own spacing
  expect(text).toContain('2026年11月9日星期一');
  expect(text).toContain('本领域现已适用新的立法');
  expect(text).toContain('第 1 页，共 1 页'); // the foot of the page
  expect(execFileSync('pdfinfo', [file], { encoding: 'utf8' })).toMatch(/Pages:\s+1\b/);
});

test('a quarter shows the capital\'s issue and says whose journal it is', async ({ page }) => {
  scenario = quarter();
  await page.goto(`${url}/extensions/journal`);
  await expect(page.getByText('This quarter publishes no journal of its own.')).toBeVisible();
  // The sheet is the capital's: headed with the capital's name and without the quarter's logo.
  await expect(sheet(page).getByRole('heading', { name: 'Official Journal of Agora' })).toBeVisible();
  await expect(sheet(page).locator('.masthead img')).toHaveCount(0);
  await expect(sheet(page).getByText(`Realm identity: ${CAPITAL}`)).toBeVisible(); // the capital's, whose journal it is
  await expect(sheet(page).getByText('The realm now runs new legislation: eu/es 2.4.0, eu/es/vc 1.1.0.')).toBeVisible();
  expect((await page.evaluate(() => (window as any).asked)).map(([name]: [string]) => name)).toEqual([
    'journal_issue',
    'journal_capital_issue',
  ]);
  await page.screenshot({ path: join(OUT, 'journal-quarter.png') });
});

test('a revert whose entry could not be recorded is a notice on the page and a line on the sheet', async ({ page }) => {
  const missed = {
    ...INSTALL,
    id: 'E-2',
    kind: 'not_recorded',
    details: { kind: 'codex_reverted', codex: 'test@1.0.0', reverted: 'test@1.1.0' },
  };
  scenario = {
    locale: 'en',
    realm: { name: 'Agora', logoUrl: LOGO },
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, [missed]) } } },
  };
  await page.goto(`${url}/extensions/journal`);
  const change = 'the revert from the codex test@1.1.0 back to the codex test@1.0.0';
  await expect(page.getByRole('alert')).toHaveText(`This issue is missing an entry: ${change}, at 11:30.`); // Madrid's time
  await expect(sheet(page).getByText(`An entry could not be recorded: ${change}.`)).toBeVisible();
});

test('a visitor on a quarter is asked to log in, and an error is shown as one', async ({ page }) => {
  scenario = {
    locale: 'en',
    realm: { name: 'Agora North', logoUrl: '' },
    replies: {
      journal_issue: { ok: true, issued: false, capital: CAPITAL },
      journal_capital_issue: { ok: false, denied: true, error: 'anonymous callers may not call this' },
    },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(page.getByRole('alert')).toContainText('Log in to read the capital\'s journal from this quarter.');
  scenario.replies = {
    journal_issue: {
      byDay: {
        '2026-11-10': { ok: false, error: 'there is no issue for 2026-11-10: today is 2026-11-09' },
        '': issueOf('2026-11-09', 3, [], 'Agora'),
      },
    },
  };
  await page.goto(`${url}/extensions/journal/2026-11-10`);
  await expect(page.getByRole('alert')).toContainText('there is no issue for 2026-11-10');
  // Today is offered beside the error, so a refused day is no dead end.
  await page.getByRole('button', { name: 'Today' }).click();
  await expect(sheet(page).getByText('No. 3', { exact: true })).toBeVisible();
  await expect(sheet(page).getByText('Monday, November 9, 2026')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

/** A day with every kind of entry the journal has: the realm's check and publication, an install and a revert by a vote, and a notice. */
function gazette(locale: string, realm: string): Scenario {
  return {
    locale,
    realm: { name: realm, logoUrl: LOGO },
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, [FOUND, PUBLISHED, INSTALL, REVERT, NOT_RECORDED], realm) } } },
  };
}

function pdfText(file: string): string {
  return execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
}

/** The sheet as one tall picture, since the page's own height is the iframe's. */
async function noHorizontalScroll(page: Page): Promise<boolean> {
  return page.locator('iframe.sheet').evaluate((frame) => {
    const doc = (frame as HTMLIFrameElement).contentDocument!.documentElement;
    return doc.scrollWidth <= doc.clientWidth;
  });
}

const GAZETTES = [
  { locale: 'en', realm: 'Agora', title: 'Official Journal of Agora', sections: ['I. Legislation', 'II. Notices'], date: 'Monday, November 9, 2026', page: /Page 1 of \d/ },
  { locale: 'es', realm: 'Valencia', title: 'Diario Oficial de Valencia', sections: ['I. Legislación', 'II. Avisos'], date: 'lunes, 9 de noviembre de 2026', page: /Página 1 de \d/ },
];

for (const { locale, realm, title, sections, date, page: pageNumber } of GAZETTES) {
  test(`the issue reads as a gazette on screen, on a phone and on paper, in ${locale}`, async ({ page }) => {
    scenario = gazette(locale, realm);
    await page.goto(`${url}/extensions/journal`);
    const paper = sheet(page);
    await expect(paper.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    await expect(paper.getByText(date)).toBeVisible();
    await expect(paper.getByText(`${CAPITAL}`)).toBeVisible();
    await expect(paper.getByRole('heading', { level: 2, name: sections[0] })).toBeVisible();
    await expect(paper.getByRole('heading', { level: 2, name: sections[1] })).toBeVisible();
    // The entries are numbered in the order they were recorded; the notice, recorded last, is printed last.
    await expect(paper.locator('article .ref')).toHaveText([/^2026\/3-1 · /, /^2026\/3-2 · /, /^2026\/3-3 · /, /^2026\/3-4 · /, /^2026\/3-5 · /]);
    await expect(paper.locator('article h3')).toHaveCount(5);
    // The codex id is short on the screen, with the whole id on hover; the links are there to follow.
    await expect(paper.locator('abbr.short').first()).toHaveAttribute('title', CODEX_ID);
    await expect(paper.locator('abbr.short').first()).toHaveText('sha256:4be1a2c3…');
    await expect(paper.locator('.links a').first()).toBeVisible();
    await expect(paper.locator('.authentication[data-slot="signature"]')).toBeVisible();
    await page.screenshot({ path: join(OUT, `journal-gazette-${locale}.png`), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(paper.getByRole('heading', { name: title, level: 1 })).toBeVisible();
    expect(await noHorizontalScroll(page)).toBe(true);
    await page.screenshot({ path: join(OUT, `journal-gazette-${locale}-mobile.png`), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });

    const file = join(OUT, `journal-gazette-${locale}.pdf`);
    writeFileSync(file, await printedPdf(page));
    const text = pdfText(file);
    expect(text).toContain(title);
    expect(text).toContain(`${title} · 2026/3`); // the foot of the page: the issue,
    expect(text).toMatch(pageNumber); // and its page number
    expect(text).toContain(CODEX_ID); // the whole id on paper, where nothing can be hovered
    expect(text).not.toContain('sha256:4be1a2c3…');
    expect(text).not.toMatch(/Proposal P-12|Propuesta P-12/); // the links are for the screen
    expect(execFileSync('pdfinfo', [file], { encoding: 'utf8' })).toMatch(/Page size:\s+59\d\.\d+ x 84\d\.\d+ pts \(A4\)/);
    execFileSync('pdftoppm', ['-png', '-r', '90', file, join(OUT, `journal-gazette-${locale}-print`)]);
  });
}

test('a long issue runs onto more pages, each with its page number, and no entry is cut in two', async ({ page }) => {
  const many = Array.from({ length: 14 }, (_, n) => ({ ...INSTALL, id: `E-${n}`, at: INSTALL.at + n * 60 }));
  scenario = {
    locale: 'en',
    realm: { name: 'Agora', logoUrl: LOGO },
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, many) } } },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).locator('article')).toHaveCount(14);
  const file = join(OUT, 'journal-en-long.pdf');
  writeFileSync(file, await printedPdf(page));
  const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [file], { encoding: 'utf8' }))![1]);
  expect(pages).toBeGreaterThan(1);
  const text = pdfText(file);
  for (let n = 1; n <= pages; n++) expect(text).toContain(`Page ${n} of ${pages}`);
  // Each entry's title and its facts are on the same page: a page break (form feed) never falls between them.
  for (const part of text.split('\f')) {
    expect((part.match(/New legislation in force/g) ?? []).length).toBe((part.match(/Decided by proposal P-12/g) ?? []).length);
  }
});

test('the sheet fits a phone: no sideways scroll, no scroll inside the frame, and it follows the width of the window', async ({ page }) => {
  scenario = gazette('en', 'Agora');
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).locator('h1')).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  const frame = page.locator('iframe.sheet');
  const heights = async () => frame.evaluate((element) => [element.clientHeight, (element as HTMLIFrameElement).contentDocument!.body.scrollHeight]);
  const [narrow, narrowContent] = await heights();
  expect(Math.abs(narrow - narrowContent)).toBeLessThan(2);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect.poll(async () => (await heights())[0]).toBeLessThan(narrow); // wider, so fewer lines: the frame shrinks with it
  const [wide, wideContent] = await heights();
  expect(Math.abs(wide - wideContent)).toBeLessThan(2);
});

test('the links of an entry go to the realm\'s pages through its router, under the realm\'s own path', async ({ page }) => {
  scenario = gazette('en', 'Agora');
  await page.goto(`${url}/r/agora/extensions/journal`);
  const paper = sheet(page);
  await expect(paper.getByRole('link', { name: 'Proposal P-12' })).toHaveAttribute('href', '/r/agora/extensions/voting/proposals/P-12');
  await paper.getByRole('link', { name: 'Proposal P-12' }).click();
  expect(new URL(page.url()).pathname).toBe('/r/agora/extensions/voting/proposals/P-12'); // the realm's navigate, not the frame's
  await expect(page.locator('iframe.sheet')).toHaveAttribute('srcdoc', /Official Journal of Agora/); // the sheet is still the sheet
  await paper.getByRole('link', { name: 'The codex' }).first().click();
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(`/r/agora/extensions/codex_viewer?codex=${encodeURIComponent(CODEX_ID)}`);
});

// The trace is off here. With it on, Playwright's tracer injects its snapshot script into every frame and Chromium
// logs "Blocked script execution in 'about:srcdoc'" for a sandboxed frame like the sheet's; that is the tracer, not the
// page, and the realm's own e2e lets that exact message through. The next test is the proof the sheet has no script.
test('the page, the print route and a quarter log no console errors', async ({ page }) => {
  const errors = consoleErrors(page);
  scenario = chinese();
  for (const path of ['/extensions/journal', '/extensions/journal/2026-11-09', '/extensions/journal/2026-11-09/print']) {
    await page.goto(`${url}${path}`);
    await expect(sheet(page).locator('h1')).toBeVisible();
  }
  scenario = quarter();
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).locator('h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the sheet has no script, whatever the realm\'s text says, and its frame may not run one', async ({ page }) => {
  scenario = {
    locale: 'en',
    realm: { name: 'Agora', logoUrl: LOGO },
    replies: {
      journal_issue: {
        byDay: {
          '': issueOf(
            '2026-11-09',
            3,
            [{ ...INSTALL, kind: '<svg onload=alert(1)>' }, { ...INSTALL, details: { proposal: '" onmouseover="alert(3)', codex: '"><svg onload=alert(4)>' } }],
            '<script>alert(1)</script><img src=x onerror=alert(2)>',
          ),
        },
      },
    },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).locator('h1')).toHaveText('Official Journal of <script>alert(1)</script><img src=x onerror=alert(2)>');
  const frame = page.locator('iframe.sheet');
  expect(await frame.getAttribute('sandbox')).not.toContain('allow-scripts');
  const scripted = await frame.evaluate((element) =>
    [...(element as HTMLIFrameElement).contentDocument!.querySelectorAll('*')]
      .filter(
        (node) =>
          node.localName === 'script' || [...node.attributes].some((a) => /^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)),
      )
      .map((node) => node.localName),
  );
  expect(scripted).toEqual([]);
});
