import { defineConfig, devices } from '@playwright/test';

/**
 * The browser tests of the voting page need no realm: they mount the built bundle (`npm run build` in frontend-rt) on a
 * page that plays the realm, with the replies the canister gives. The addresses a proposal pins are answered by the
 * test; the diff editor loads Monaco from the CDN the code viewer already uses.
 */
export default defineConfig({
  testDir: './specs',
  // Playwright empties its output folder at each run: the screenshots the specs write to test-results/ stay.
  outputDir: './test-results/.playwright',
  testIgnore: '**/*.local.spec.ts', // those need a local realm: playwright.local.config.ts
  timeout: 60 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: { screenshot: 'off', video: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
