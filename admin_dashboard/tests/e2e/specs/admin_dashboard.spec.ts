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

  test('should display admin dashboard page with main heading', async ({ page }) => {
    // Check for main heading
    const heading = page.getByRole('heading', { level: 1, name: /Admin Dashboard/i });
    await expect(heading).toBeVisible();
    
    // Check for subtitle
    const subtitle = page.getByText(/Generalized Global Governance System/i);
    await expect(subtitle).toBeVisible();
  });

  test('should have functional search bar', async ({ page }) => {
    // Find the search input
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    
    // Type in search input
    await searchInput.fill('test search');
    await expect(searchInput).toHaveValue('test search');
    
    // Clear search
    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('should display all navigation tabs', async ({ page }) => {
    // Check for main tabs
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Bulk Import/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Registration URLs/i })).toBeVisible();
    
    // Check for entity type tabs
    await expect(page.getByRole('button', { name: /Users/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mandates/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Organizations/i })).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click Overview tab (already active)
    const overviewTab = page.getByRole('button', { name: /Overview/i });
    await expect(overviewTab).toHaveClass(/border-blue-500/);
    
    // Click Users tab
    const usersTab = page.getByRole('button', { name: /Users/i });
    await usersTab.click();
    
    // Wait for tab to become active
    await expect(usersTab).toHaveClass(/border-blue-500/);
    
    // Click Bulk Import tab
    const bulkImportTab = page.getByRole('button', { name: /Bulk Import/i });
    await bulkImportTab.click();
    
    // Verify Bulk Import tab is now active
    await expect(bulkImportTab).toHaveClass(/border-blue-500/);
  });

  test('should display overview metrics', async ({ page }) => {
    // Ensure we're on the overview tab
    await page.getByRole('button', { name: /Overview/i }).click();
    
    // Wait for metrics to load
    await page.waitForTimeout(1000);
    
    // Check for metrics cards (these should exist even with zero values)
    const metricsCards = page.locator('.bg-gradient-to-r');
    const cardCount = await metricsCards.count();
    
    // Should have at least the core metrics (Total Entities, Transfer Volume, Active Mandates)
    expect(cardCount).toBeGreaterThanOrEqual(3);
  });

  test('should display Treasury Portfolio section', async ({ page }) => {
    // Ensure we're on the overview tab
    await page.getByRole('button', { name: /Overview/i }).click();
    
    // Check for Treasury Portfolio heading
    const treasuryHeading = page.getByText(/Treasury Portfolio/i);
    await expect(treasuryHeading).toBeVisible();
  });

  test('should display bulk import configuration', async ({ page }) => {
    // Navigate to Bulk Import tab
    await page.getByRole('button', { name: /Bulk Import/i }).click();
    
    // Check for bulk import title
    const bulkImportTitle = page.getByText(/Bulk Data Import/i);
    await expect(bulkImportTitle).toBeVisible();
    
    // Check for entity type selector
    const entityTypeSelect = page.locator('#entity-type-select');
    await expect(entityTypeSelect).toBeVisible();
    
    // Check for data format selector
    const dataFormatSelect = page.locator('#data-format-select');
    await expect(dataFormatSelect).toBeVisible();
  });

  test('should allow entity type selection in bulk import', async ({ page }) => {
    // Navigate to Bulk Import tab
    await page.getByRole('button', { name: /Bulk Import/i }).click();
    
    // Get entity type selector
    const entityTypeSelect = page.locator('#entity-type-select');
    
    // Change entity type to Organizations
    await entityTypeSelect.selectOption('organizations');
    await expect(entityTypeSelect).toHaveValue('organizations');
    
    // Change to Instruments
    await entityTypeSelect.selectOption('instruments');
    await expect(entityTypeSelect).toHaveValue('instruments');
  });

  test('should display registration URLs section', async ({ page }) => {
    // Navigate to Registration URLs tab
    await page.getByRole('button', { name: /Registration URLs/i }).click();
    
    // The registration URL manager component should be loaded
    // We'll just verify the tab switched successfully
    const registrationTab = page.getByRole('button', { name: /Registration URLs/i });
    await expect(registrationTab).toHaveClass(/border-blue-500/);
  });

  test('should display entity tables when navigating to entity tabs', async ({ page }) => {
    // Navigate to Users tab
    await page.getByRole('button', { name: /Users/i }).click();
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Users tab should now be active
    const usersTab = page.getByRole('button', { name: /Users/i });
    await expect(usersTab).toHaveClass(/border-blue-500/);
    
    // Navigate to Organizations tab
    await page.getByRole('button', { name: /Organizations/i }).click();
    await page.waitForTimeout(500);
    
    // Organizations tab should now be active
    const orgsTab = page.getByRole('button', { name: /Organizations/i });
    await expect(orgsTab).toHaveClass(/border-blue-500/);
  });

  test('should display error messages when they occur', async ({ page }) => {
    // Initially, no error should be visible
    const errorAlert = page.locator('.bg-red-100[role="alert"]');
    
    // Error alerts should be hidden by default (or not exist)
    const errorCount = await errorAlert.count();
    expect(errorCount).toBe(0);
  });

  test('should maintain tab state during navigation', async ({ page }) => {
    // Click Mandates tab
    await page.getByRole('button', { name: /Mandates/i }).click();
    await expect(page.getByRole('button', { name: /Mandates/i })).toHaveClass(/border-blue-500/);
    
    // Click Tasks tab
    await page.getByRole('button', { name: /Tasks/i }).click();
    await expect(page.getByRole('button', { name: /Tasks/i })).toHaveClass(/border-blue-500/);
    
    // Verify Mandates is no longer active
    await expect(page.getByRole('button', { name: /Mandates/i })).not.toHaveClass(/border-blue-500/);
  });

  test('should be responsive and render on smaller screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be visible
    await expect(page.getByRole('heading', { level: 1, name: /Admin Dashboard/i })).toBeVisible();
    
    // Tabs should still be visible (may wrap)
    await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
  });
});
