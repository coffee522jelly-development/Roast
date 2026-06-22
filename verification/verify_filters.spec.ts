import { test, expect } from '@playwright/test';

test('verify filter controls', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for the app to load
  await expect(page.locator('h1')).toContainText('ROAST');

  // Check for Filter System label
  await expect(page.locator('text=Filter System')).toBeVisible();

  // Check for LPF and HPF labels
  await expect(page.locator('text=LPF')).toBeVisible();
  await expect(page.locator('text=HPF')).toBeVisible();

  // Take a screenshot of the footer
  const footer = page.locator('footer');
  await footer.screenshot({ path: 'verification/filter_ui.png' });
});
