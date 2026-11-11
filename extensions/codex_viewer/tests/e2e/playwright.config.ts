import { defineConfig, devices } from '@playwright/test';

/**
 * The browser tests of the codex page need no realm: they mount the built bundle (`npm run build` in frontend-rt) on a
 * page that plays the realm, with the replies the canister gives (realms-gos tests/deployed/test_legislation_runtime.py
 * and test_sync_checks.py hold the canister to those shapes).
 */
export default defineConfig({
  testDir: './specs',
  testIgnore: '**/*.local.spec.ts', // those need a local realm: playwright.local.config.ts
  timeout: 30 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: { screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
