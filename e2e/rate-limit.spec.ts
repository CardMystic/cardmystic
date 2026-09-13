import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated, stubRecaptcha } from './utils/mocks';

for (const endpoint of ['/recaptcha/verify', '/user/login']) {
  test(`login displays 429 from ${endpoint}`, async ({ page }) => {
    await stubRecaptcha(page);
    await page.route(`${BACKEND}/recaptcha/verify`, (route) =>
      route.fulfill({ json: { success: true } }),
    );
    let requests = 0;
    await page.route(`${BACKEND}${endpoint}`, (route) => {
      requests++;
      return route.fulfill({ status: 429, body: 'Too many requests' });
    });
    await gotoHydrated(page, '/user/login');
    await page.getByPlaceholder('Email').fill('rate-limit@example.test');
    await page.getByPlaceholder('Password').fill('not-a-real-password');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(
      page.getByText('429 Too Many Requests', { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText('Try again in 60 seconds', { exact: true }).first(),
    ).toBeVisible();
    await page.waitForTimeout(1500);
    expect(requests).toBe(1);
  });
}
