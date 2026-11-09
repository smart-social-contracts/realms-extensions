import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INSTALL, issueOf, LOGO, startRealm, type Scenario } from '../realm';

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
    replies: { journal_issue: { byDay: { '': issueOf('2026-11-09', 3, [INSTALL]) } } },
  };
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
  scenario.replies.journal_issue.byDay['2026-11-09'] = issueOf('2026-11-09', 3, [INSTALL]);
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
  const pdf = await printedPdf(page);
  const dir = mkdtempSync(join(tmpdir(), 'journal-pdf-'));
  const file = join(dir, 'issue.pdf');
  writeFileSync(file, pdf);
  writeFileSync(join(OUT, 'journal-zh-CN.pdf'), pdf);
  const text = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  expect(text).toContain('瓦伦西亚官方公报');
  expect(text).toContain('第 3 期 · 2026年11月9日星期一');
  expect(text).toContain('本领域现已适用新的立法');
  expect(execFileSync('pdfinfo', [file], { encoding: 'utf8' })).toMatch(/Pages:\s+1\b/);
});

test('a quarter shows the capital\'s issue and says whose journal it is', async ({ page }) => {
  scenario = {
    locale: 'en',
    realm: { name: 'Agora North', logoUrl: LOGO },
    replies: {
      journal_issue: { ok: true, issued: false, capital: 'rrkah-fqaaa-aaaaa-aaaaq-cai' },
      journal_capital_issue: { ok: true, ...issueOf('2026-11-09', 3, [INSTALL]), issued: false },
    },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(page.getByText('This quarter publishes no journal of its own.')).toBeVisible();
  await expect(sheet(page).getByText('The realm now runs new legislation: eu/es 2.4.0, eu/es/vc 1.1.0.')).toBeVisible();
  expect((await page.evaluate(() => (window as any).asked)).map(([name]: [string]) => name)).toEqual([
    'journal_issue',
    'journal_capital_issue',
  ]);
  await page.screenshot({ path: join(OUT, 'journal-quarter.png') });
});

test('a visitor on a quarter is asked to log in, and an error is shown as one', async ({ page }) => {
  scenario = {
    locale: 'en',
    realm: { name: 'Agora North', logoUrl: '' },
    replies: {
      journal_issue: { ok: true, issued: false, capital: 'rrkah-fqaaa-aaaaa-aaaaq-cai' },
      journal_capital_issue: { ok: false, denied: true, error: 'anonymous callers may not call this' },
    },
  };
  await page.goto(`${url}/extensions/journal`);
  await expect(page.getByRole('alert')).toContainText('Log in to read the capital\'s journal from this quarter.');
  scenario.replies = { journal_issue: { ok: false, error: 'there is no issue for 2026-11-10: today is 2026-11-09' } };
  await page.goto(`${url}/extensions/journal/2026-11-10`);
  await expect(page.getByRole('alert')).toContainText('there is no issue for 2026-11-10');
});
