import { test, expect } from '@playwright/test';

test('should load the main index page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SageString/);
  
  // Check that system cards are visible
  const cards = page.locator('.system-card');
  await expect(cards.first()).toBeVisible();
});
