import { test, expect } from '@playwright/test';

const TIMEOUT = 300000; // 5 minutes for vault operations

test.describe('Vault Extension E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the vault extension
    await page.goto('/extensions/vault');
    await page.waitForLoadState('networkidle');
  });

  test('should display vault manager page with all tabs', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Check page title
    await expect(page.getByRole('heading', { name: 'Vault Manager' })).toBeVisible();
    
    // Check all tabs are present
    await expect(page.getByRole('button', { name: 'Balance' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transactions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transfer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible();
    
    // Check refresh button
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });

  test('should display vault principal and last refresh time', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Check vault principal is displayed
    await expect(page.getByText('Vault Principal:')).toBeVisible();
    
    // Click refresh to populate last refresh time
    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    await refreshButton.click();
    
    // Wait for refresh to complete
    await page.waitForTimeout(2000);
    
    // Check last refresh time appears
    await expect(page.getByText('Last Refresh:')).toBeVisible();
  });

  test('should show transaction history with pagination', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Switch to Transactions tab
    await page.getByRole('button', { name: 'Transactions' }).click();
    
    // Check table headers
    await expect(page.getByText('ID', { exact: true })).toBeVisible();
    await expect(page.getByText('FROM')).toBeVisible();
    await expect(page.getByText('TO')).toBeVisible();
    await expect(page.getByText('AMOUNT')).toBeVisible();
    await expect(page.getByText('WHEN')).toBeVisible();
    await expect(page.getByText('TYPE')).toBeVisible();
    
    // Check if pagination controls exist (they may not if there are no transactions yet)
    const paginationText = page.getByText(/Page \d+ of \d+/);
    if (await paginationText.isVisible()) {
      // Check Previous and Next buttons
      await expect(page.getByRole('button', { name: /Previous/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Next/ })).toBeVisible();
    }
  });

  test('should copy principal to clipboard when clicked', async ({ page, context }) => {
    test.setTimeout(TIMEOUT);
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Switch to Transactions tab
    await page.getByRole('button', { name: 'Transactions' }).click();
    
    // Wait for transactions to load
    await page.waitForTimeout(1000);
    
    // Find first principal link (if any transactions exist)
    const principalButton = page.locator('button.text-blue-600').first();
    
    if (await principalButton.isVisible()) {
      await principalButton.click();
      
      // Check for "Copied!" message
      await expect(page.getByText('✓')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should copy timestamp to clipboard when clicked', async ({ page, context }) => {
    test.setTimeout(TIMEOUT);
    
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Switch to Transactions tab
    await page.getByRole('button', { name: 'Transactions' }).click();
    
    // Wait for transactions to load
    await page.waitForTimeout(1000);
    
    // Find first timestamp button (if any transactions exist)
    const timestampButton = page.locator('td button[title*="Click to copy"]').first();
    
    if (await timestampButton.isVisible()) {
      await timestampButton.click();
      
      // Check for "Copied!" checkmark
      await expect(page.getByText('✓')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should navigate between pages using pagination', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Switch to Transactions tab
    await page.getByRole('button', { name: 'Transactions' }).click();
    
    // Wait for data to load
    await page.waitForTimeout(1000);
    
    // Check if there are multiple pages
    const paginationText = page.getByText(/Page \d+ of \d+/);
    
    if (await paginationText.isVisible()) {
      const text = await paginationText.textContent();
      const match = text?.match(/Page (\d+) of (\d+)/);
      
      if (match && parseInt(match[2]) > 1) {
        // We have multiple pages, test pagination
        const nextButton = page.getByRole('button', { name: /Next/ });
        
        // Click Next
        await nextButton.click();
        await page.waitForTimeout(500);
        
        // Verify we're on page 2
        await expect(page.getByText('Page 2 of')).toBeVisible();
        
        // Click Previous
        const previousButton = page.getByRole('button', { name: /Previous/ });
        await previousButton.click();
        await page.waitForTimeout(500);
        
        // Verify we're back on page 1
        await expect(page.getByText('Page 1 of')).toBeVisible();
      }
    }
  });

  test('should display balance information', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Balance tab should be active by default
    await expect(page.getByRole('heading', { name: 'Your Balance' })).toBeVisible();
    
    // Check satoshis display
    await expect(page.getByText(/satoshis/)).toBeVisible();
    
    // Check ckBTC conversion display
    await expect(page.getByText(/ckBTC/)).toBeVisible();
  });

  test('should show transfer form in transfer tab', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Switch to Transfer tab
    await page.getByRole('button', { name: 'Transfer' }).click();
    
    // Check form elements
    await expect(page.getByText('Recipient Principal')).toBeVisible();
    await expect(page.getByText('Amount (satoshis)')).toBeVisible();
    
    // Check input fields
    await expect(page.getByPlaceholder(/xxxxx-xxxxx/)).toBeVisible();
    await expect(page.getByPlaceholder('100000000')).toBeVisible();
    
    // Check transfer button
    const transferButton = page.getByRole('button', { name: 'Transfer' });
    await expect(transferButton).toBeVisible();
    
    // Button should be disabled when form is empty
    await expect(transferButton).toBeDisabled();
  });

  test('should show admin information in admin tab', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Switch to Admin tab
    await page.getByRole('button', { name: 'Admin' }).click();
    
    // Check admin heading
    await expect(page.getByRole('heading', { name: 'Vault Admin' })).toBeVisible();
    
    // Check balance system info
    await expect(page.getByText(/All Balances in System/)).toBeVisible();
    
    // Check transfers info
    await expect(page.getByText('All Transfers in System')).toBeVisible();
  });

  test('should refresh vault data when refresh button is clicked', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    const refreshButton = page.getByRole('button', { name: 'Refresh' });
    
    // Click refresh
    await refreshButton.click();
    
    // Button should show "Refreshing..." while loading
    await expect(page.getByRole('button', { name: 'Refreshing...' })).toBeVisible({ timeout: 1000 });
    
    // Wait for refresh to complete
    await expect(refreshButton).toBeEnabled({ timeout: 30000 });
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });

  test('should display human-readable timestamps', async ({ page }) => {
    test.setTimeout(TIMEOUT);
    
    // Switch to Transactions tab
    await page.getByRole('button', { name: 'Transactions' }).click();
    
    // Wait for transactions to load
    await page.waitForTimeout(1000);
    
    // Look for time ago format (e.g., "5m ago", "2h ago", "3d ago")
    const timeAgoPattern = /\d+[smhd]\s+ago/;
    const timeAgoElements = page.locator(`text=${timeAgoPattern}`);
    
    // If there are transactions, check they have readable timestamps
    const count = await timeAgoElements.count();
    if (count > 0) {
      await expect(timeAgoElements.first()).toBeVisible();
    }
  });
});
