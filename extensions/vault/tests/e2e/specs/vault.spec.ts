import { test, expect } from '@playwright/test';

const TIMEOUT = 30000;

test.describe('Vault Extension E2E Tests', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/extensions/vault', {
			waitUntil: 'domcontentloaded',
			timeout: 60000,
		});

		await expect(page.getByRole('heading', { name: 'Vault' })).toBeVisible({ timeout: 45000 });
		await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible({ timeout: 15000 });
	});

	test('should display vault page with everyday tabs', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await expect(page.getByRole('heading', { name: 'Vault' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Activity' })).toBeVisible();
		await expect(page.locator('nav').getByRole('button', { name: 'Send' })).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Lookup' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
	});

	test('should show technical details with vault principal and last refresh', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByText('Technical details').click();

		await expect(page.getByText('Vault Principal:')).toBeVisible();

		const refreshButton = page.getByRole('button', { name: 'Refresh' });
		await refreshButton.click();
		await page.waitForTimeout(2000);

		await expect(page.getByText('Last refresh:')).toBeVisible();
	});

	test('should show activity table with pagination', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByRole('button', { name: 'Activity' }).click();
		await page.waitForTimeout(500);

		const table = page.getByRole('table');
		if (await table.isVisible()) {
			const headerRow = page.locator('thead tr').first();
			await expect(headerRow.locator('text=When')).toBeVisible();
			await expect(headerRow.locator('text=Type')).toBeVisible();
			await expect(headerRow.locator('text=From')).toBeVisible();
			await expect(headerRow.locator('text=To')).toBeVisible();
			await expect(headerRow.locator('text=Amount')).toBeVisible();
			await expect(headerRow.locator('text=ID')).not.toBeVisible();

			const paginationText = page.getByText(/Page \d+ of \d+/);
			if (await paginationText.isVisible()) {
				await expect(page.getByText(/Showing \d+–\d+ of \d+/)).toBeVisible();
				await expect(page.getByRole('button', { name: 'Prev' })).toBeVisible();
				await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
			}
		}
	});

	test('should copy principal to clipboard when clicked', async ({ page, context }) => {
		test.setTimeout(TIMEOUT);
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		await page.getByRole('button', { name: 'Activity' }).click();
		await page.waitForTimeout(1000);

		const principalButton = page.locator('tbody tr:first-child td:nth-child(3) button').first();
		if (await principalButton.isVisible()) {
			await principalButton.click();
			await expect(
				page.locator('tbody tr:first-child td:nth-child(3) .text-green-600'),
			).toBeVisible({ timeout: 2000 });
		}
	});

	test('should copy timestamp to clipboard when clicked', async ({ page, context }) => {
		test.setTimeout(TIMEOUT);
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);

		await page.getByRole('button', { name: 'Activity' }).click();
		await page.waitForTimeout(1000);

		const timestampButton = page.locator('tbody tr:first-child td:first-child button').first();
		if (await timestampButton.isVisible()) {
			await timestampButton.click();
			await expect(
				page.locator('tbody tr:first-child td:first-child .text-green-600'),
			).toBeVisible({ timeout: 2000 });
		}
	});

	test('should navigate between pages using pagination', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByRole('button', { name: 'Activity' }).click();
		await page.waitForTimeout(1000);

		const paginationText = page.getByText(/Page \d+ of \d+/);
		if (await paginationText.isVisible()) {
			const text = await paginationText.textContent();
			const match = text?.match(/Page (\d+) of (\d+)/);

			if (match && parseInt(match[2]) > 1) {
				await page.getByRole('button', { name: 'Next' }).click();
				await page.waitForTimeout(500);
				await expect(page.getByText('Page 2 of')).toBeVisible();

				await page.getByRole('button', { name: 'Prev' }).click();
				await page.waitForTimeout(500);
				await expect(page.getByText('Page 1 of')).toBeVisible();
			}
		}
	});

	test('should display hero balance card', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await expect(
			page.getByText("On-chain ledger balance for this realm's vault"),
		).toBeVisible();
	});

	test('should show send form from the balance-card Send CTA', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByRole('button', { name: 'Send' }).first().click();

		await expect(page.getByRole('heading', { name: 'Send tokens' })).toBeVisible();
		await expect(page.getByText('Recipient')).toBeVisible();
		await expect(page.getByPlaceholder('0.00')).toBeVisible();
		await expect(page.getByPlaceholder(/xxxxx-xxxxx/)).toBeVisible();

		const sendButton = page.locator('form button[type="submit"]').first();
		await expect(sendButton).toBeVisible();
		await expect(sendButton).toBeDisabled();
	});

	test('should show admin information in admin tab', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		const adminTab = page.getByRole('button', { name: 'Admin' });
		if (await adminTab.isVisible()) {
			await adminTab.click();
			await expect(page.getByRole('heading', { name: 'Vault Admin' })).toBeVisible();
			await expect(page.getByText(/All Balances in System/)).toBeVisible();
			await expect(page.getByText('All Transfers in System')).toBeVisible();
		}
	});

	test('should refresh vault data when refresh button is clicked', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		const refreshButton = page.getByRole('button', { name: 'Refresh' });
		await refreshButton.click();
		await expect(refreshButton).toBeDisabled({ timeout: 1000 });
		await expect(refreshButton).toBeEnabled({ timeout: 30000 });
	});

	test('should display human-readable timestamps', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByRole('button', { name: 'Activity' }).click();
		await page.waitForTimeout(1000);

		const timeAgoPattern = /\d+[smhd]\s+ago/;
		const timeAgoElements = page.locator(`text=${timeAgoPattern}`);
		const count = await timeAgoElements.count();
		if (count > 0) {
			await expect(timeAgoElements.first()).toBeVisible();
		}
	});

	test('should display user-friendly error message for insufficient funds', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByRole('button', { name: 'Send' }).first().click();

		const recipientInput = page.getByPlaceholder(/xxxxx-xxxxx/);
		const amountInput = page.getByPlaceholder('0.00');

		await recipientInput.fill('64fpo-jgpms-fpewi-hrskb-f3n6u-3z5fy-bv25f-zxjzg-q5m55-xmfpq-hqe');
		await amountInput.fill('999999999');

		const sendButton = page.locator('form button[type="submit"]').first();
		await sendButton.click();

		const confirmButton = page.getByRole('dialog').getByRole('button', { name: 'Send' });
		if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
			await confirmButton.click();
		}

		const errorMessage = page
			.locator('.bg-red-50, [class*="error"]')
			.filter({ hasText: /Insufficient funds/i });
		await expect(errorMessage).toBeVisible({ timeout: 10000 });
	});

	test('should validate send form inputs', async ({ page }) => {
		test.setTimeout(TIMEOUT);

		await page.getByRole('button', { name: 'Send' }).first().click();

		const recipientInput = page.getByPlaceholder(/xxxxx-xxxxx/);
		const amountInput = page.getByPlaceholder('0.00');
		const sendButton = page.locator('form button[type="submit"]').first();

		await expect(sendButton).toBeDisabled();

		await recipientInput.fill('64fpo-jgpms-fpewi-hrskb-f3n6u-3z5fy-bv25f-zxjzg-q5m55-xmfpq-hqe');
		await expect(sendButton).toBeDisabled();

		await recipientInput.clear();
		await amountInput.fill('1.00');
		await expect(sendButton).toBeDisabled();

		await recipientInput.fill('64fpo-jgpms-fpewi-hrskb-f3n6u-3z5fy-bv25f-zxjzg-q5m55-xmfpq-hqe');
		await expect(sendButton).toBeEnabled();
	});
});
