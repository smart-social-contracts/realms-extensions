import { defineConfig, devices } from '@playwright/test';

// Runs against a local realm seeded by `seed_local_realm.py --only procurement` (README.md). No baseURL: the spec opens the realm inside a
// portal host page it serves itself.
export default defineConfig({
  testDir: './specs',
  // Playwright empties its output folder at each run: the screenshots the specs write to test-results/ stay.
  outputDir: './test-results/.playwright',
  testMatch: '**/*.local.spec.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 5 * 60 * 1000,
  reporter: [['list']],
  use: { screenshot: 'off', video: 'off', headless: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
