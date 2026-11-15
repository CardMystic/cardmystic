import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated, waitForHydration } from './utils/mocks';
import type { CardCollectionCatalog } from '../models/collectionModel';

test('collection detail banners render their artwork on the right over a blurred backdrop', async ({
  page,
  request,
}) => {
  const response = await request.get('/api/backend/card-collections');
  expect(response.ok()).toBe(true);
  const catalog = (await response.json()) as CardCollectionCatalog;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      /hydrat/i.test(message.text()) &&
      ['error', 'warning'].includes(message.type())
    )
      errors.push(message.text());
  });
  for (const kind of ['sets', 'roles', 'themes'] as const) {
    const entry = catalog[kind].find((entry) => entry.imageUrl)!;
    const path = `/${kind}/${entry.slug}`;
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const response =
        width === 1440 ? await page.goto(path) : await page.reload();
      expect(response?.ok()).toBe(true);
      expect(await response!.text()).toMatch(/<img[^>]+class="banner-art"/);
      await waitForHydration(page);
      const banner = page.locator(
        'section[aria-labelledby="collection-title"]',
      );
      const art = banner.locator('.banner-art');
      const backdrop = banner.locator('.banner-backdrop');
      await expect(art).toHaveAttribute('src', entry.imageUrl!);
      await expect
        .poll(() => art.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
      await expect(backdrop).toHaveAttribute('src', entry.imageUrl!);
      await expect(backdrop).toHaveCSS('filter', /blur\(32px\)/);
      await expect(art).toHaveCSS('filter', 'none');
      const bounds = (await banner.boundingBox())!;
      const picture = (await art.boundingBox())!;
      expect(picture.x).toBeGreaterThan(bounds.x);
      expect(picture.x + picture.width).toBeCloseTo(bounds.x + bounds.width, 0);
      const link = banner.getByRole('link', { name: /^Go To All/ });
      await link.focus();
      await expect(link).toBeFocused();
      await expect(link).toHaveAttribute('href', '/' + kind);
    }
  }
  expect(errors).toEqual([]);
});

test('reviewed taxonomy has distinct Proliferate pages and permanent legacy redirects', async ({
  page,
  request,
  browser,
  baseURL,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (/hydrat/i.test(m.text()) && ['warning', 'error'].includes(m.type()))
      errors.push(m.text());
  });
  for (const [source, target] of [
    ['/roles/proliferate-engine', '/roles/proliferate'],
    ['/roles/cycling', '/themes/cycling'],
  ]) {
    const res = await request.get(source + '?query=draw', { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(new URL(res.headers().location, baseURL).pathname).toBe(target);
    expect(new URL(res.headers().location, baseURL).search).toBe('?query=draw');
  }
  for (const path of ['/themes/1-1-counters', '/roles/beater']) {
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(404);
  }
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  try {
    const plain = await context.newPage();
    for (const kind of ['themes', 'roles'] as const) {
      const path = `/${kind}/proliferate`;
      const definition =
        kind === 'themes'
          ? /rewards proliferating/i
          : /directly repeats proliferate/i;
      expect((await plain.goto(path))?.status()).toBe(200);
      await expect(
        plain.getByRole('region', { name: /MTG Proliferate/ }),
      ).toContainText(definition);
      await expect(plain.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        definition,
      );
      await expect(plain.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://cardmystic.com' + path,
      );
      await expect(
        plain.getByRole('link', {
          name: new RegExp('^Go To All ' + kind + '$', 'i'),
        }),
      ).toHaveAttribute('href', '/' + kind);
      const listed: string[] = [];
      let total: number;
      do {
        const result = await request.get(
          `/api/backend/card-collections${path}?offset=${listed.length}&limit=100`,
        );
        expect(result.ok()).toBe(true);
        const body = await result.json();
        total = body.total;
        expect(body.results.length).toBeGreaterThan(0);
        listed.push(
          ...body.results.map((row: { card_name: string }) => row.card_name),
        );
      } while (listed.length < total);
      expect(listed.includes('Voidwing Hybrid')).toBe(kind === 'themes');
      await gotoHydrated(page, path);
      await page.reload();
      await waitForHydration(page);
      await expect(
        page.getByRole('region', { name: /MTG Proliferate/ }),
      ).toContainText(definition);
      if (kind === 'themes') {
        const card = page.getByRole('img', {
          name: 'Voidwing Hybrid',
          exact: true,
        });
        const pagination = page
          .getByLabel('Search results pagination', { exact: true })
          .first();
        for (const button of await pagination.getByRole('button').all()) {
          if (await card.count()) break;
          if (/^\d+$/.test((await button.innerText()).trim()))
            await button.click();
        }
        await expect(card.first()).toBeVisible();
      }
    }
    const link = page.getByRole('link', {
      name: 'Go To All Roles',
      exact: true,
    });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/roles$/);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});

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
  await page.setViewportSize({ width: 1600, height: 1000 });
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
  await page.getByRole('combobox', { name: 'Filter roles' }).fill('ramp');
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
    page.getByRole('option', { name: 'Pro', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('link', {
      name: 'Sign in for Pro searches',
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
