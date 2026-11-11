import { defineConfig, devices } from '@playwright/test';

// Runs against a local realm seeded by seed_local_realm.py (README.md). No baseURL: the spec opens the realm inside a
// portal host page it serves itself.
export default defineConfig({
  testDir: './specs',
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
