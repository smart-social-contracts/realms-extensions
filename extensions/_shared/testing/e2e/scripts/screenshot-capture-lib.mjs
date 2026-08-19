import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_OVERVIEW_FILE = 'screenshots/01-overview.png';
const CONFIG_CANDIDATES = [
  'tests/e2e/screenshots.config.json',
  'tests/e2e/screenshots.config.mjs',
];
// Playwright can only encode png/jpeg, and it picks the encoding from the
// output file extension — an unknown one makes screenshot() throw.
export const CAPTURABLE_SUFFIXES = ['.png', '.jpg', '.jpeg'];

/**
 * Discover extension ids that have a manifest.json under extensions/.
 * @param {string} repoRoot
 * @returns {string[]}
 */
export function discoverExtensionIds(repoRoot) {
  const extensionsDir = path.join(repoRoot, 'extensions');
  return fs
    .readdirSync(extensionsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .filter((entry) =>
      fs.existsSync(path.join(extensionsDir, entry.name, 'manifest.json')),
    )
    .map((entry) => entry.name)
    .sort();
}

/**
 * @param {unknown} manifest
 * @returns {boolean}
 */
export function isAdminExtension(manifest) {
  const profiles = Array.isArray(manifest.profiles) ? manifest.profiles : [];
  const permissions = Array.isArray(manifest.permissions)
    ? manifest.permissions
    : [];
  const defaultAccess = manifest.entry_access?.default ?? '';

  if (permissions.includes('admin')) {
    return true;
  }
  if (profiles.length > 0 && profiles.every((p) => p === 'admin')) {
    return true;
  }
  if (typeof defaultAccess === 'string' && defaultAccess.startsWith('realm.admin')) {
    return true;
  }
  return false;
}

/**
 * Path prefix a realm is served under. Sheet realms sit at the origin root,
 * wizard realms at "/r/<slug>/" — a root-absolute URL would drop that slug.
 * @param {string} baseUrl
 * @returns {string} prefix without a trailing slash, "" at the root
 */
export function basePathOf(baseUrl) {
  return new URL(baseUrl).pathname.replace(/\/+$/, '');
}

/**
 * Realm-relative path for an extension's page.
 * @param {string} baseUrl
 * @param {string} extensionId
 * @returns {string}
 */
export function buildExtensionPath(baseUrl, extensionId) {
  return `${basePathOf(baseUrl)}/extensions/${extensionId}`;
}

/**
 * Build the join-page URL with test-mode auth bypass params.
 * @param {string} baseUrl
 * @param {boolean} admin
 * @returns {string}
 */
export function buildJoinUrl(baseUrl, admin = false) {
  const base = new URL(baseUrl);
  const url = new URL(`${basePathOf(baseUrl)}/join`, base.origin);
  url.searchParams.set('testmode', '1');
  url.searchParams.set('ii_bypass', '1');
  url.searchParams.set('skip_terms', '1');
  if (admin) {
    url.searchParams.set('admin_self_reg', '1');
  }
  return url.toString();
}

/**
 * @param {string} extensionDir
 * @returns {{ steps: Array<{ file: string, click?: string, waitFor?: string, waitMs?: number }> } | null}
 */
export function loadScreenshotConfig(extensionDir) {
  for (const relativePath of CONFIG_CANDIDATES) {
    const configPath = path.join(extensionDir, relativePath);
    if (!fs.existsSync(configPath)) {
      continue;
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    if (configPath.endsWith('.mjs')) {
      throw new Error(
        `Dynamic screenshot config modules are not supported: ${configPath}`,
      );
    }

    const parsed = JSON.parse(raw);
    return normalizeScreenshotConfig(parsed, configPath);
  }

  return null;
}

/**
 * @param {unknown} parsed
 * @param {string} configPath
 * @returns {{ steps: Array<{ file: string, click?: string, waitFor?: string, waitMs?: number }> }}
 */
export function normalizeScreenshotConfig(parsed, configPath = 'config') {
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.steps)) {
    throw new Error(
      `${configPath}: expected an object with a "steps" array`,
    );
  }

  const steps = parsed.steps.map((step, index) => {
    if (!step || typeof step !== 'object') {
      throw new Error(`${configPath}: step ${index} must be an object`);
    }
    if (typeof step.file !== 'string' || step.file.trim() === '') {
      throw new Error(`${configPath}: step ${index} requires a "file" string`);
    }
    if (step.file.includes('..') || path.isAbsolute(step.file)) {
      throw new Error(
        `${configPath}: step ${index} file must be a package-relative screenshots path`,
      );
    }
    if (!step.file.startsWith('screenshots/')) {
      throw new Error(
        `${configPath}: step ${index} file must start with "screenshots/"`,
      );
    }
    if (!CAPTURABLE_SUFFIXES.some((suffix) => step.file.toLowerCase().endsWith(suffix))) {
      throw new Error(
        `${configPath}: step ${index} file must end with one of ` +
          `${CAPTURABLE_SUFFIXES.join(', ')}`,
      );
    }

    const normalized = { file: step.file };
    if (step.click != null) {
      if (typeof step.click !== 'string' || step.click.trim() === '') {
        throw new Error(`${configPath}: step ${index} "click" must be a string`);
      }
      normalized.click = step.click;
    }
    if (step.waitFor != null) {
      if (typeof step.waitFor !== 'string' || step.waitFor.trim() === '') {
        throw new Error(
          `${configPath}: step ${index} "waitFor" must be a string`,
        );
      }
      normalized.waitFor = step.waitFor;
    }
    if (step.waitMs != null) {
      if (typeof step.waitMs !== 'number' || step.waitMs < 0) {
        throw new Error(
          `${configPath}: step ${index} "waitMs" must be a non-negative number`,
        );
      }
      normalized.waitMs = step.waitMs;
    }
    return normalized;
  });

  if (steps.length === 0) {
    throw new Error(`${configPath}: "steps" must contain at least one entry`);
  }

  return { steps };
}

/**
 * Default capture plan when no per-extension config exists.
 * @returns {{ steps: Array<{ file: string, waitMs: number }> }}
 */
export function defaultScreenshotPlan() {
  return {
    steps: [{ file: DEFAULT_OVERVIEW_FILE, waitMs: 8000 }],
  };
}

/**
 * Resolve the capture plan for an extension directory.
 * @param {string} extensionDir
 * @returns {{ steps: Array<{ file: string, click?: string, waitFor?: string, waitMs?: number }> }}
 */
export function resolveScreenshotPlan(extensionDir) {
  return loadScreenshotConfig(extensionDir) ?? defaultScreenshotPlan();
}

/**
 * Name a capture is written under before it is known good. The image extension
 * has to survive so Playwright can still infer the encoding.
 * @param {string} outputPath
 * @returns {string}
 */
export function inProgressPath(outputPath) {
  const extension = path.extname(outputPath);
  if (!extension) {
    throw new Error(`screenshot path needs an image extension: ${outputPath}`);
  }
  return `${outputPath.slice(0, -extension.length)}.inprogress${extension}`;
}

/**
 * Update only the manifest "screenshots" array while preserving formatting.
 * @param {string} manifestText
 * @param {string[]} screenshotPaths package-relative paths
 * @returns {string}
 */
export function updateManifestScreenshots(manifestText, screenshotPaths) {
  JSON.parse(manifestText);

  const screenshotsMatch = manifestText.match(/^(\s*)"screenshots"\s*:/m);
  const indent = screenshotsMatch?.[1] ?? '  ';
  const itemIndent = `${indent}  `;
  const arrayBody = screenshotPaths
    .map((entry) => `${itemIndent}"${entry}"`)
    .join(',\n');
  const arrayLiteral =
    screenshotPaths.length === 0
      ? '[]'
      : `[\n${arrayBody}\n${indent}]`;

  let updated;
  if (/^\s*"screenshots"\s*:/m.test(manifestText)) {
    updated = manifestText.replace(
      /"screenshots"\s*:\s*\[[\s\S]*?\]/,
      `"screenshots": ${arrayLiteral}`,
    );
  } else {
    const closingBraceIndex = manifestText.lastIndexOf('}');
    if (closingBraceIndex === -1) {
      throw new Error('manifest.json is missing a closing brace');
    }

    const beforeClose = manifestText.slice(0, closingBraceIndex).trimEnd();
    const needsComma = !beforeClose.endsWith('{') && !beforeClose.endsWith(',');
    const insertion = `${needsComma ? ',' : ''}\n${indent}"screenshots": ${arrayLiteral}\n`;
    updated = `${beforeClose}${insertion}${manifestText.slice(closingBraceIndex)}`;
  }

  if (!updated.endsWith('\n')) {
    updated += '\n';
  }

  // The edit above is textual so the diff stays minimal; re-parse to be certain
  // it did not corrupt the manifest a release depends on.
  const roundTripped = JSON.parse(updated);
  const written = JSON.stringify(roundTripped.screenshots ?? null);
  if (written !== JSON.stringify(screenshotPaths)) {
    throw new Error(
      `manifest screenshots rewrite produced ${written} instead of ` +
        `${JSON.stringify(screenshotPaths)}`,
    );
  }

  return updated;
}

/**
 * @param {string} manifestPath
 * @param {string[]} screenshotPaths
 */
export function writeManifestScreenshots(manifestPath, screenshotPaths) {
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const updated = updateManifestScreenshots(manifestText, screenshotPaths);
  fs.writeFileSync(manifestPath, updated, 'utf8');
}
