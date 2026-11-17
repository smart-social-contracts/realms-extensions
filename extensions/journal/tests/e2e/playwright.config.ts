import { defineConfig, devices } from '@playwright/test';

/**
 * The journal's browser tests need no realm: they mount the built bundle (`npm run build` in frontend-rt) on a page
 * that plays the realm, with the replies the canister gives (tests/deployed/test_journal.py of realms-gos holds the
 * canister to those shapes).
 */
export default defineConfig({
  testDir: './specs',
  outputDir: './test-results/.playwright',
  timeout: 30 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: { screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
