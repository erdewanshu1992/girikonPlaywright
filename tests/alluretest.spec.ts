import { test, expect } from '@playwright/test';

test('Homepage title check', async ({ page }) => {
  test.info().annotations.push(
    { type: 'severity', description: 'critical' },
    { type: 'owner', description: 'dewanshu' },
    { type: 'epic', description: 'Homepage Testing' }
  );

    await page.goto("/");
    await expect(page).toHaveTitle(/Girikon/);
});
