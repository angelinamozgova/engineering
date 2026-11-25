// start: post-deploy UI check — booking shell fixture
import { test, expect } from '@playwright/test';

test('after deploy: critical UI control is visible on fixture', async ({ page }) => {
  await page.goto('/booking-shell.html');
  await expect(page.getByTestId('service')).toBeVisible();
});
// end: post-deploy UI check — booking shell fixture