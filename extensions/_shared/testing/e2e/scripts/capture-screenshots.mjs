#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import {
  buildExtensionPath,
  buildJoinUrl,
  discoverExtensionIds,
  inProgressPath,
  isAdminExtension,
  resolveScreenshotPlan,
  writeManifestScreenshots,
} from './screenshot-capture-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// extensions/_shared/testing/e2e/scripts -> repo root. Living under e2e/ is
// what lets Node resolve @playwright/test from e2e/node_modules.
const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const VIEWPORT = { width: 1280, height: 720 };
const LOGIN_WAIT_MS = 10_000;
const NAVIGATION_WAIT_MS = 8_000;
const MIN_TEXT_LENGTH = 20;
const MIN_ELEMENT_COUNT = 5;

function usage() {
  console.error(`Usage: capture-screenshots.mjs [--all] <extension_id> [...]

Environment:
  PLAYWRIGHT_BASE_URL   Realm frontend URL (required)

Examples:
  PLAYWRIGHT_BASE_URL=https://example.icp0.io node capture-screenshots.mjs system_info
  PLAYWRIGHT_BASE_URL=https://example.icp0.io node capture-screenshots.mjs --all`);
}

/**
 * @param {string[]} argv
 * @returns {string[]}
 */
export function parseExtensionArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    usage();
    process.exit(2);
  }

  if (args[0] === '--all') {
    return discoverExtensionIds(REPO_ROOT);
  }

  if (args.includes('--all')) {
    throw new Error('Pass --all alone or provide explicit extension ids, not both');
  }

  return args;
}

/**
 * Resolve the frame holding the extension's own UI.
 *
 * The realm nests frames: a portal realm serves the whole app inside an outer
 * `iframe.realm-frame`, and the extension sits in a further sandbox frame. Only
 * the innermost one is the extension, so match on its registry path — anything
 * shallower would put the realm's sidebar, header and test-mode banner into a
 * marketplace screenshot.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} extensionId
 * @param {number} timeoutMs
 * @returns {Promise<import('@playwright/test').Frame>}
 */
async function waitForExtensionFrame(page, extensionId, timeoutMs = 60_000) {
  const marker = `/ext/${extensionId}/`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const match = page.frames().find((f) => f.url().includes(marker));
    if (match) {
      return match;
    }
    await page.waitForTimeout(500);
  }

  const seen = page.frames().map((f) => f.url()).join('\n  ');
  throw new Error(
    `no frame serving "${marker}" appeared within ${timeoutMs}ms; frames:\n  ${seen}`,
  );
}

/**
 * @param {import('@playwright/test').Frame} frame
 */
async function assertFrameHasMeaningfulContent(frame) {
  const body = frame.locator('body');
  await body.waitFor({ state: 'attached', timeout: 60_000 });

  const text = ((await body.innerText().catch(() => '')) || '').trim();
  const elementCount = await frame.locator('body *').count();
  const visibleTextNodes = await frame
    .locator('body :visible')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => (node.textContent || '').trim())
        .filter((value) => value.length > 0)
        .join(' ')
        .trim(),
    );

  const combinedText = `${text} ${visibleTextNodes}`.trim();
  const looksLikeHardFailure =
    /^(access denied|error occurred|not found|forbidden)\.?$/i.test(combinedText) &&
    elementCount < MIN_ELEMENT_COUNT;

  if (
    combinedText.length < MIN_TEXT_LENGTH ||
    elementCount < MIN_ELEMENT_COUNT ||
    looksLikeHardFailure
  ) {
    throw new Error(
      `extension frame looks empty or errored (text=${combinedText.length} chars, elements=${elementCount})`,
    );
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} extensionId
 */
async function navigateToExtension(page, extensionId, baseUrl) {
  const targetPath = buildExtensionPath(baseUrl, extensionId);
  const navLink = page.locator(`a[href="${targetPath}"], a[href$="${targetPath}"]`).first();

  if (await navLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await navLink.click();
  } else {
    await page.evaluate((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, targetPath);
  }

  await page.waitForURL(
    (url) => url.pathname === targetPath || url.pathname.endsWith(targetPath),
    { timeout: 60_000 },
  );
  await page.waitForTimeout(NAVIGATION_WAIT_MS);
}

/**
 * @param {import('@playwright/test').Page} page
 */
async function completeJoinFlowIfNeeded(page) {
  await page.waitForTimeout(LOGIN_WAIT_MS);

  const pageContent = (await page.textContent('body')) || '';
  const alreadyJoined = /Welcome back|already a member|Go to Dashboard/i.test(
    pageContent,
  );
  const onProfileStep = /Choose your role|Select.*profile/i.test(pageContent);

  if (!alreadyJoined && onProfileStep) {
    const memberCard = page.locator('text=Member').first();
    if (await memberCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await memberCard.click();
      await page.waitForTimeout(1_000);
      const joinBtn = page
        .locator('button')
        .filter({ hasText: /join|continue|submit/i })
        .first();
      await joinBtn.click({ timeout: 10_000 });
      await page.waitForTimeout(15_000);
    }
  }

  const goLink = page.locator('a').filter({ hasText: /Go to Dashboard/i }).first();
  if (await goLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await goLink.click();
    await page.waitForTimeout(NAVIGATION_WAIT_MS);
  }
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').FrameLocator} frame
 * @param {{ file: string, click?: string, waitFor?: string, waitMs?: number }} step
 * @param {string} outputPath
 */
async function captureStep(page, frame, step, outputPath) {
  if (step.click) {
    await frame.locator(step.click).first().click({ timeout: 30_000 });
    await page.waitForTimeout(step.waitMs ?? 3_000);
  }

  if (step.waitFor) {
    await frame.locator(step.waitFor).first().waitFor({
      state: 'visible',
      timeout: 60_000,
    });
  }

  if (step.waitMs && !step.click && !step.waitFor) {
    await page.waitForTimeout(step.waitMs);
  } else if (!step.click && !step.waitFor) {
    await page.waitForTimeout(step.waitMs ?? NAVIGATION_WAIT_MS);
  }

  await assertFrameHasMeaningfulContent(frame);
  await frame.locator('body').screenshot({ path: outputPath });
}

/**
 * @param {string} extensionId
 * @param {string} baseUrl
 * @returns {Promise<{ extensionId: string, ok: boolean, files: string[], error?: string }>}
 */
async function captureExtension(extensionId, baseUrl) {
  const extensionDir = path.join(REPO_ROOT, 'extensions', extensionId);
  const manifestPath = path.join(extensionDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return {
      extensionId,
      ok: false,
      files: [],
      error: `missing manifest at ${manifestPath}`,
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const plan = resolveScreenshotPlan(extensionDir);
  const capturedFiles = [];
  let browser;
  let pendingPath;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();

    const joinUrl = buildJoinUrl(baseUrl, isAdminExtension(manifest));
    await page.goto(joinUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await completeJoinFlowIfNeeded(page);
    await navigateToExtension(page, extensionId, baseUrl);

    const frame = await waitForExtensionFrame(page, extensionId);
    await frame.locator('body').waitFor({ state: 'attached', timeout: 60_000 });

    for (const step of plan.steps) {
      const outputPath = path.join(extensionDir, step.file);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      pendingPath = inProgressPath(outputPath);

      // Rename only once the shot is known good, so a failure leaves the
      // previous release's screenshot in place rather than a broken image.
      await captureStep(page, frame, step, pendingPath);
      fs.renameSync(pendingPath, outputPath);
      pendingPath = undefined;
      capturedFiles.push(step.file);
    }

    writeManifestScreenshots(manifestPath, capturedFiles);

    return { extensionId, ok: true, files: capturedFiles };
  } catch (error) {
    // Only the step that threw can have left a file behind; anything earlier
    // was already renamed. Leaving it would get committed by the release job.
    if (pendingPath && fs.existsSync(pendingPath)) {
      fs.unlinkSync(pendingPath);
    }

    return {
      extensionId,
      ok: false,
      files: capturedFiles,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function printSummary(results) {
  const idWidth = Math.max(
    'extension'.length,
    ...results.map((result) => result.extensionId.length),
  );

  console.log('');
  console.log(`${'extension'.padEnd(idWidth)}  status   screenshots`);
  console.log(`${'-'.repeat(idWidth)}  -------  -----------`);
  for (const result of results) {
    const status = result.ok ? 'ok' : 'FAILED';
    const files = result.files.length > 0 ? result.files.join(', ') : '-';
    console.log(
      `${result.extensionId.padEnd(idWidth)}  ${status.padEnd(7)}  ${files}`,
    );
    if (!result.ok && result.error) {
      console.log(`  error: ${result.error}`);
    }
  }
}

async function main() {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
  if (!baseUrl) {
    console.error('PLAYWRIGHT_BASE_URL is required');
    usage();
    process.exit(2);
  }

  let extensionIds;
  try {
    extensionIds = parseExtensionArgs(process.argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }

  if (extensionIds.length === 0) {
    console.error('No extensions found to capture');
    process.exit(2);
  }

  const results = [];
  for (const extensionId of extensionIds) {
    console.log(`Capturing ${extensionId}...`);
    results.push(await captureExtension(extensionId, baseUrl));
  }

  printSummary(results);

  const failures = results.filter((result) => !result.ok);
  if (failures.length > 0) {
    process.exit(1);
  }
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
