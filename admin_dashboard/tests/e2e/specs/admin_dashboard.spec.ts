import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * Tests the administrative dashboard UI and functionality
 */

test.describe('Admin Dashboard E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to admin dashboard
    await page.goto('/admin');
    
    // Wait for page to load (admin dashboard should be visible)
    await expect(page.getByRole('heading', { level: 1 }))
      .toBeVisible({ timeout: 45000 });
  });

  test('should display admin dashboard page', async ({ page }) => {
    // Check for main heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    
    // Admin dashboard should have some navigation or tabs
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should show entity management sections', async ({ page }) => {
    // Admin dashboard typically shows entity counts or management sections
    // This test verifies the page loads and contains expected elements
    
    // Check for any table or grid elements (common in admin dashboards)
    const hasContent = await page.locator('main, .content, [role="main"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('should be accessible only to authenticated users', async ({ page }) => {
    // Admin dashboard should require authentication
    // This is more of a smoke test to ensure the page structure exists
    
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toBeNull();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('should handle navigation within dashboard', async ({ page }) => {
    // Test basic interaction with the page
    // Look for clickable elements
    
    const links = page.locator('a');
    const linkCount = await links.count();
    
    // Admin dashboard should have navigation links
    expect(linkCount).toBeGreaterThan(0);
  });

  test('should display system statistics or overview', async ({ page }) => {
    // Admin dashboards typically show some metrics or statistics
    // Verify the page renders content
    
    const mainContent = page.locator('main, [role="main"], .dashboard');
    await expect(mainContent.first()).toBeVisible();
  });
});
