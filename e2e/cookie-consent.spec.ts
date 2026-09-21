import { expect, test } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test('privacy choices default off, persist, and can be withdrawn from the footer', async ({
  page,
}) => {
  const trackingRequests: string[] = [];
  page.on('request', (request) => {
    if (
      /googletagmanager\.com|googleadservices\.com|posthog\.com/.test(
        request.url(),
      )
    )
      trackingRequests.push(request.url());
  });
  await page.goto('/about');
  const banner = page.getByRole('region', { name: 'Cookie preferences' });
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Customize', exact: true }).click();
  await expect(
    banner.getByRole('checkbox', { name: 'Analytics (PostHog)', exact: true }),
  ).not.toBeChecked();
  await expect(
    banner.getByRole('checkbox', {
      name: 'Advertising measurement (Google Ads)',
      exact: true,
    }),
  ).not.toBeChecked();
  expect(trackingRequests).toEqual([]);
  await page.screenshot({ path: 'test-results/cookie-consent-mobile.png' });
  await banner
    .getByRole('checkbox', { name: 'Analytics (PostHog)', exact: true })
    .check();
  await banner
    .getByRole('button', { name: 'Save preferences', exact: true })
    .click();
  await expect(banner).toBeHidden();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cm.cookie-consent.v1') ?? 'null'),
    ),
  ).toMatchObject({ analytics: true, advertising: false });
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Cookie settings', exact: true }),
  ).toBeVisible();
  await expect(banner).toBeHidden();
  await page
    .getByRole('button', { name: 'Cookie settings', exact: true })
    .click();
  await expect(banner).toBeVisible();
  await expect(
    banner.getByRole('checkbox', { name: 'Analytics (PostHog)', exact: true }),
  ).toBeChecked();
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    banner
      .getByRole('button', { name: 'Reject optional', exact: true })
      .click(),
  ]);
  await expect(banner).toBeHidden();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cm.cookie-consent.v1') ?? 'null'),
    ),
  ).toMatchObject({ analytics: false, advertising: false });
  await page
    .getByRole('button', { name: 'Cookie settings', exact: true })
    .click();
  await expect(
    banner.getByRole('checkbox', { name: 'Analytics (PostHog)', exact: true }),
  ).not.toBeChecked();
});
