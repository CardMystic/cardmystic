import { test, expect } from '@playwright/test';
import { gotoHydrated, BACKEND } from './utils/mocks';
test('installation instructions match the selected device and use the CardMystic manifest', async ({
  page,
}) => {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: {} }));
  await gotoHydrated(page, '/install');
  await expect(
    page.getByRole('heading', { name: 'Install CardMystic', exact: true }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Installation device' }).click();
  await page.getByRole('option', { name: 'iPhone / iPad' }).click();
  await expect(
    page.getByText('Open CardMystic in Safari.', { exact: true }),
  ).toBeVisible();
  const manifest = await page.request.get('/site.webmanifest');
  const data = await manifest.json();
  expect(data.name).toBe('CardMystic');
  expect(data.display).toBe('standalone');
  expect(data.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual([
    '192x192',
    '512x512',
  ]);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    'href',
    '/site.webmanifest',
  );
});
