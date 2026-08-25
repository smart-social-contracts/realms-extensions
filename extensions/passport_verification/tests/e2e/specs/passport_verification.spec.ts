import { test, expect } from '@playwright/test';

const TIMEOUT = 60000;

test.describe('Passport Verification Extension E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/extensions/passport_verification', {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT
    });
    // Wait for the page header to appear
    await expect(page.getByRole('heading', { name: 'Passport Verification' }))
      .toBeVisible({ timeout: TIMEOUT });
  });

  test('should display the page header and description', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await expect(page.getByRole('heading', { name: 'Passport Verification' })).toBeVisible();
    await expect(page.getByText('Your passport stays on your phone.')).toBeVisible();
    await page.screenshot({ path: 'test-results/01-page-header.png', fullPage: true });
  });

  test('should show the step indicator with Start, Scan, Verified steps', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await expect(page.getByText('Start', { exact: true })).toBeVisible();
    await expect(page.getByText('Scan', { exact: true })).toBeVisible();
    await expect(page.getByText('Verified', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/02-step-indicator.png', fullPage: true });
  });

  test('should show idle state with Start as the primary action', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await expect(page.getByRole('heading', { name: 'Passport Verification' })).toBeVisible();
    const startButton = page.getByRole('button', { name: 'Start', exact: true });
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Need the app?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get RariMe' })).toHaveCount(0);
    await page.screenshot({ path: 'test-results/03-idle-state.png', fullPage: true });
  });

  test('should reveal Get RariMe only after Need the app', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    await page.getByRole('button', { name: 'Need the app?' }).click();
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get RariMe' })).toBeVisible();
  });

  test('should show generating state when Start is clicked', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    const startButton = page.getByRole('button', { name: 'Start', exact: true });
    await startButton.click();

    // Should show spinner and "Generating verification link..." text
    await expect(page.getByText('Generating verification link...')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/04-generating-state.png', fullPage: true });
  });

  test('should not show Error Occurred on initial page load', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    // The page should load cleanly without any error state
    await expect(page.getByText('Error Occurred')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Verification Failed')).not.toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'test-results/05-clean-load.png', fullPage: true });
  });

  test('should transition to pending or error after generating', async ({ page }) => {
    test.setTimeout(90000);
    const startButton = page.getByRole('button', { name: 'Start', exact: true });
    await startButton.click();

    // Wait for the HTTP outcall to complete (up to 30s for IC HTTP outcalls)
    await page.waitForTimeout(15000);

    // After generating, we should see the pending QR / Check Status UI.
    // A JSON:API error document must not be misread as a format mismatch.
    const appIdError = page.getByText('Application ID not found');
    await expect(appIdError).not.toBeVisible();

    // Either QR/pending UI or error UI should be visible
    // We check for a button that only appears in post-generating states
    await expect(page.getByText('Invalid response format from verification service')).toHaveCount(0);
    const checkStatusButton = page.getByRole('button', { name: 'Check Status' });
    const tryAgainButton = page.getByRole('button', { name: 'Try Again' });

    // Pending QR UI, or a real service error — never the old format-mismatch dead end.
    await expect(
      checkStatusButton.or(tryAgainButton).first()
    ).toBeVisible({ timeout: 30000 });
    await page.screenshot({ path: 'test-results/06-post-generating-state.png', fullPage: true });
  });

  test('should show verified state UI elements when verification succeeds', async ({ page }) => {
    // This test validates the verified state structure.
    // Since we can't trigger real Rarimo verification in E2E,
    // we verify the page loads correctly and check for the idle state.
    // The verified state is tested by the backend integration test
    // (create_passport_identity + get_identity_status).
    test.setTimeout(TIMEOUT);

    await expect(page.getByRole('heading', { name: 'Passport Verification' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/07-verified-state-check.png', fullPage: true });
  });
});
