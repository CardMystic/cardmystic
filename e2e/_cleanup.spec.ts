import { expect, test } from '@playwright/test';
import {
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  gotoHydrated,
  reliableFill,
  setupRecaptchaStubs,
} from './utils/mocks';

/**
 * Manual cleanup utility — deletes any leaked `e2e-list-*` lists from
 * the test user's account. Skipped by default; run explicitly with:
 *
 *   PLAYWRIGHT_RUN_CLEANUP=1 pnpm test:e2e --project=chromium e2e/_cleanup.spec.ts
 */
test('cleanup leaked e2e-list-* decklists', async ({ page }) => {
  test.skip(
    !process.env.PLAYWRIGHT_RUN_CLEANUP,
    'Set PLAYWRIGHT_RUN_CLEANUP=1 to run this cleanup utility',
  );
  test.skip(
    !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
    'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set',
  );

  test.setTimeout(5 * 60_000);

  await setupRecaptchaStubs(page);
  await gotoHydrated(page, '/login');
  await reliableFill(page.getByPlaceholder('Email'), TEST_USER_EMAIL);
  await reliableFill(page.getByPlaceholder('Password'), TEST_USER_PASSWORD);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 20_000 });

  await gotoHydrated(page, '/lists');

  // Loop until no e2e-list-* cards remain.
  for (let i = 0; i < 50; i++) {
    const card = page
      .locator('div.group:has(h3)')
      .filter({ hasText: /^e2e-list-/ })
      .first();
    if ((await card.count()) === 0) break;
    await card.getByRole('button', { name: /delete list/i }).click({
      force: true,
    });
    const dialog = page.getByRole('dialog', { name: /delete list/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: /^delete$/i }).click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    // Wait for grid to settle.
    await page.waitForTimeout(300);
  }

  await expect(
    page.locator('h3').filter({ hasText: /^e2e-list-/ }),
  ).toHaveCount(0);
});
