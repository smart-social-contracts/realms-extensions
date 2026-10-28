import { defineConfig, devices } from '@playwright/test';

// Runs against a local realm: `.github/actions/local-realm`, or `realms local start` and `realms local setup`.
// No baseURL: the spec opens the realm inside a portal host page it serves itself.
export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 5 * 60 * 1000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'on', screenshot: 'on', video: 'on', headless: true, viewport: { width: 1280, height: 900 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
});
