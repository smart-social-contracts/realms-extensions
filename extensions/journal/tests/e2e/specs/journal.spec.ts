import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPITAL, INSTALL, issueOf, LOGO, startRealm, type Scenario } from '../realm';

const OUT = join(__dirname, '..', 'test-results');
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
  await expect(paper.getByRole('heading', { name: '瓦伦西亚官方公报' })).toBeVisible();
  await expect(paper.getByText('第 3 期 · 2026年11月9日星期一')).toBeVisible();
  await expect(paper.getByText('本领域现已适用新的立法：eu/es 2.4.0, eu/es/vc 1.1.0。')).toBeVisible();
  await expect(paper.locator('time')).toHaveText('11:30');
  await expect(paper.locator('header img')).toBeVisible();
  await page.screenshot({ path: join(OUT, 'journal-zh-CN.png') });
});

test('the same issue in English, empty days included', async ({ page }) => {
  scenario = {
    locale: 'en',
    realm: { name: 'Agora', logoUrl: LOGO },
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, []), '2026-11-08': issueOf('2026-11-08', 2, []) } } },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).getByText('No news or changes were recorded on this day.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Next day/ })).toBeDisabled();
  await page.getByRole('button', { name: /Previous day/ }).click();
  await expect(sheet(page).getByText('No. 2 · Sunday, November 8, 2026')).toBeVisible();
  expect(await page.evaluate(() => (window as any).asked.at(-1))).toEqual(['journal_issue', { day: '2026-11-08' }]);
  await page.screenshot({ path: join(OUT, 'journal-en-empty.png') });
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
  expect(text).toContain('第 3 期 · 2026年11月9日星期一');
  expect(text).toContain('本领域现已适用新的立法');
  expect(execFileSync('pdfinfo', [file], { encoding: 'utf8' })).toMatch(/Pages:\s+1\b/);
});

test('a quarter shows the capital\'s issue and says whose journal it is', async ({ page }) => {
  scenario = quarter();
  await page.goto(`${url}/extensions/journal`);
  await expect(page.getByText('This quarter publishes no journal of its own.')).toBeVisible();
  // The sheet is the capital's: headed with the capital's name and without the quarter's logo.
  await expect(sheet(page).getByRole('heading', { name: 'Official journal of Agora' })).toBeVisible();
  await expect(sheet(page).locator('header img')).toHaveCount(0);
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
  const change = 'the revert to the codex test@1.0.0, which replaced test@1.1.0';
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
  await expect(sheet(page).getByText('No. 3 · Monday, November 9, 2026')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
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
          '': issueOf('2026-11-09', 3, [{ ...INSTALL, kind: '<svg onload=alert(1)>' }], '<script>alert(1)</script><img src=x onerror=alert(2)>'),
        },
      },
    },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(sheet(page).locator('h1')).toHaveText('Official journal of <script>alert(1)</script><img src=x onerror=alert(2)>');
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
