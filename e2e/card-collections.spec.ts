import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';

// E2E_BACKEND_URL must serve the collection catalog (see backend docs/card-collections.md).
test('collection directories, pagination, navigation, and mobile layout', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoHydrated(page, '/sets');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'MTG Sets', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('collection-tile')).toHaveCount(40);
  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  for (const path of ['/sets/lea', '/themes/artifacts', '/roles/ramp']) {
    expect(sitemapXml).toContain(`<loc>https://cardmystic.com${path}</loc>`);
  }
  const navigation = page.getByRole('navigation', {
    name: 'Main navigation',
    exact: true,
  });
  await navigation.getByRole('button', { name: 'Themes', exact: true }).click();
  await page.getByRole('link', { name: 'All themes', exact: true }).click();
  await expect(page).toHaveURL(/\/themes$/);
  await expect(
    page.getByRole('link', { name: 'All themes', exact: true }),
  ).toBeHidden();
  await expect
    .poll(() =>
      page
        .getByTestId('collection-tile')
        .first()
        .locator('img')
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.screenshot({
    path: '.cache/collections-desktop.png',
    fullPage: false,
  });
  await gotoHydrated(page, '/roles?page=2');
  await expect(page.getByTestId('collection-tile')).toHaveCount(40);
  await page.getByRole('searchbox', { name: 'Filter roles' }).fill('ramp');
  await expect(page).toHaveURL(/\/roles$/);
  await expect(page.getByTestId('collection-tile').first()).toContainText(
    /ramp/i,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('button', { name: 'Sets', exact: true }).click();
  await page.getByRole('link', { name: 'All sets', exact: true }).click();
  await expect(page).toHaveURL(/\/sets$/);
  await expect(
    page.getByRole('button', { name: 'Open navigation menu' }),
  ).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByRole('link', { name: 'All sets', exact: true }),
  ).toBeHidden();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: '.cache/collections-mobile.png',
    fullPage: false,
  });
  expect(errors).toEqual([]);
});

test('collection detail preserves scope through search, mode changes, filters, and load-more', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text());
  });
  await gotoHydrated(page, '/sets/lea');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: /Limited Edition Alpha MTG Cards/ }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'All Sets' }),
  ).toHaveAttribute('href', '/sets');
  await expect(page.getByText(/100 of \d+ cards loaded/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Load more cards', exact: true })
    .click();
  await expect(page.getByText(/200 of \d+ cards loaded/)).toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Search filters' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Rarities', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rare', exact: true }).check();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const requests: Record<string, unknown>[] = [];
  await page.route(`${BACKEND}/search/colbert`, (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: [] });
  });
  await page
    .getByRole('textbox', { name: /Search cards in/ })
    .fill('draw cards');
  await page.locator('#a-i-search-form button[type="submit"]').click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0].collection).toEqual({ kind: 'sets', slug: 'lea' });
  expect(requests[0].useRerank).toBe(true);
  expect(requests[0].filters).toMatchObject({ selectedRarities: ['Rare'] });
  await expect(page).toHaveURL(/\/sets\/lea\?/);
  await page
    .getByRole('combobox', { name: 'Search mode', exact: true })
    .click();
  await page.getByRole('option', { name: 'Normal', exact: true }).click();
  await expect.poll(() => requests.at(-1)?.useRerank).toBe(false);
  expect(requests.at(-1)?.collection).toEqual({ kind: 'sets', slug: 'lea' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await page
    .getByRole('link', { name: 'Show all cards in this set', exact: true })
    .click();
  await expect(page).toHaveURL(/\/sets\/lea$/);
  await expect(
    page.getByText('Search to apply filter changes', { exact: true }),
  ).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: '.cache/collection-detail-mobile.png',
    fullPage: false,
  });
  expect(errors).toEqual([]);
});
