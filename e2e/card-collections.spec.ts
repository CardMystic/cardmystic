import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';
import type { CardCollectionCatalog } from '../models/collectionModel';

test('all collection directories and detail pages expose SEO without JavaScript', async ({
  browser,
  baseURL,
  request,
}) => {
  const response = await request.get('/api/backend/card-collections');
  expect(response.ok()).toBe(true);
  const catalog = (await response.json()) as CardCollectionCatalog;
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  try {
    for (const kind of ['sets', 'themes', 'roles'] as const) {
      const entry = catalog[kind][0];
      expect(entry).toBeDefined();
      for (const path of [`/${kind}`, `/${kind}/${entry.slug}`]) {
        expect((await page.goto(path))?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page).toHaveTitle(/MTG .*\| CardMystic$/);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute(
          'content',
          /Magic: The Gathering/,
        );
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          'href',
          `https://cardmystic.com${path}`,
        );
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          'content',
          'index, follow',
        );
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
          'content',
          `https://cardmystic.com${path}`,
        );
        await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
          'content',
          'summary_large_image',
        );
        const schema = (
          await page
            .locator('script[type="application/ld+json"]')
            .allTextContents()
        )
          .map((text) => JSON.parse(text))
          .find((value) => value['@type'] === 'CollectionPage');
        expect(schema.url).toBe(`https://cardmystic.com${path}`);
        expect(schema.breadcrumb.itemListElement.at(-1).item).toBe(schema.url);
        await expect(
          page.getByRole('navigation', { name: 'Breadcrumb', exact: true }),
        ).toBeVisible();
      }
      await page.goto(`/${kind}/${entry.slug}?query=draw&useRerank=false`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex, follow',
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://cardmystic.com/${kind}/${entry.slug}`,
      );
    }
    expect((await request.get('/sets/not-a-real-collection')).status()).toBe(
      404,
    );
  } finally {
    await context.close();
  }
});

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
  const catalog = (await (
    await page.request.get(BACKEND + '/card-collections')
  ).json()) as CardCollectionCatalog;
  const roleCount = catalog.roles.length;
  await expect(page.getByTestId('collection-tile')).toHaveCount(
    Math.min(40, roleCount > 40 ? roleCount - 40 : roleCount),
  );
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

test('collection detail preserves scope through guest search, filters, and load-more', async ({
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
  expect(requests[0].useRerank).toBe(false);
  expect(requests[0].filters).toMatchObject({ selectedRarities: ['Rare'] });
  await expect(page).toHaveURL(/\/sets\/lea\?/);
  await page
    .getByRole('combobox', { name: 'Search mode', exact: true })
    .click();
  await expect(
    page.getByRole('option', { name: 'Enhanced', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('link', {
      name: 'Sign in for enhanced searches',
      exact: true,
    }),
  ).toBeVisible();
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
