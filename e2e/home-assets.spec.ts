import { expect, test, type Page } from '@playwright/test';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  // These rendering checks are anonymous and independent of live account data.
  await page.route(BACKEND + '/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const responses: Record<string, unknown> = {
      '/search/example': { query: '', cards: [] },
      '/metrics/query_count': { totalQueries: 346242 },
      '/supabase/card-lists/featured': { decklists: [] },
      '/supabase/card-lists/featured-primers': { primers: [] },
      '/user/featured': { users: [] },
      '/articles/recent': { articles: [] },
      '/bulkdata/card-name-to-oracle-id.min.json': {},
      '/bulkdata/partner-commanders': {
        partner: [],
        chooseABackground: [],
        background: [],
        doctorsCompanion: [],
        timeLordDoctor: [],
      },
    };
    return route.fulfill({ json: responses[path] ?? [] });
  });
  await page.route(SUPABASE + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(
    /https:\/\/(?:www\.googletagmanager\.com|pagead2\.googlesyndication\.com|fundingchoicesmessages\.google\.com)\//,
    (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  await page.route(/https:\/\/(?:api|cards)\.scryfall\.(?:com|io)\//, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect width="100" height="60" fill="#8f6edf"/></svg>',
    }),
  );
});

function trackManaAssets(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    // Nuxt dev includes CSS from every route previously loaded by its SSR
    // module graph. Ignore only that injected source stylesheet: production
    // CSS, browser JS imports of the stylesheet, and font files still count.
    const isInjectedDevStylesheet =
      request.resourceType() === 'stylesheet' &&
      path.startsWith('/_nuxt/') &&
      path.includes('/node_modules/') &&
      path.endsWith('/mana-font/css/mana.min.css');
    if (
      !isInjectedDevStylesheet &&
      /\/mana[.\/-]/i.test(path) &&
      /\.(?:css|woff2?|ttf|otf)$/i.test(path)
    ) {
      requests.push(path);
    }
  });
  return requests;
}

test('mobile home does not download hidden hero artwork or mana font assets', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const heroRequests: string[] = [];
  const manaRequests = trackManaAssets(page);
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/ugin.webp' || path === '/kaalia.webp')
      heroRequests.push(path);
  });

  await gotoHydrated(page, '/');
  const input = page.getByPlaceholder('Describe the cards you want...');
  await input.fill('artifact removal');
  await expect(input).toHaveValue('artifact removal');
  await expect(page.getByAltText('Kaalia of the Vast')).toBeHidden();
  await expect(page.getByAltText('Ugin, the Spirit Dragon')).toBeHidden();
  await expect(
    page.getByText('Angels, demons, and dragons', { exact: true }),
  ).toBeHidden();
  expect(heroRequests).toEqual([]);
  expect(manaRequests).toEqual([]);
});

test.describe('desktop without JavaScript', () => {
  test.use({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
  });

  test('the server-rendered hero and search remain visible and images load', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByPlaceholder('Describe the cards you want...'),
    ).toBeVisible();
    for (const [name, path] of [
      ['Ugin, the Spirit Dragon', '/ugin.webp'],
      ['Kaalia of the Vast', '/kaalia.webp'],
    ]) {
      const image = page.getByAltText(name);
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete &&
              element.naturalWidth > 0 &&
              new URL(element.currentSrc).pathname,
          ),
        )
        .toBe(path);
    }
    await expect(
      page.getByText('Angels, demons, and dragons', { exact: true }),
    ).toBeVisible();
  });
  test('direct visits server-render every deferred search form', async ({
    page,
  }) => {
    for (const [mode, placeholder] of [
      ['similarity', 'Enter a card name...'],
      ['commander', 'Describe the commander you want...'],
      ['keyword', 'Search cards by keywords…'],
      [
        'deckbuilder',
        "Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations.",
      ],
    ]) {
      await page.goto('/search/all/' + mode);
      await expect(
        page.getByPlaceholder(placeholder, { exact: true }),
      ).toBeVisible();
    }
  });
});

test('all deferred search modes work and color filters render SVG symbols without the mana font', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const manaRequests = trackManaAssets(page);
  await gotoHydrated(page, '/');
  // Mode changes can briefly expose the Explore links as the form changes
  // height. Reveal them explicitly so route prefetching cannot escape this
  // asset budget just because the test finishes before the links are visible.
  await page
    .getByRole('navigation', { name: 'Explore CardMystic' })
    .scrollIntoViewIfNeeded();
  // This check measures background network activity, including lazy hydration
  // and any route prefetches triggered by making the navigation visible.
  await page.waitForLoadState('networkidle');
  expect(manaRequests).toEqual([]);

  const search = page.locator('.search-container');

  for (const [mode, placeholder] of [
    ['Similarity Search', 'Enter a card name...'],
    ['Commander Search', 'Describe the commander you want...'],
    ['Keyword Search', 'Search cards by keywords…'],
    [
      'Deck Recommender',
      "Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations.",
    ],
  ]) {
    await search.getByRole('button', { name: mode, exact: true }).click();
    const input = search.getByPlaceholder(placeholder, { exact: true });
    await expect(input).toBeVisible();
    await input.fill('flying');
    await expect(input).toHaveValue('flying');
  }

  await search
    .getByRole('button', { name: 'Smart Search', exact: true })
    .click();
  await search
    .getByRole('button', { name: 'Show advanced search filters' })
    .click();
  await search
    .getByRole('button', { name: 'Select Filters', exact: true })
    .click();
  await search.getByRole('button', { name: 'Colors', exact: true }).click();
  const symbols = search.locator('.color-checkboxes label svg');
  await expect(symbols).toHaveCount(6);
  for (const symbol of await symbols.all()) await expect(symbol).toBeVisible();
  const white = search.getByRole('checkbox', { name: 'White', exact: true });
  await white.check();
  await expect(white).toBeChecked();
  expect(manaRequests).toEqual([]);
});

test('anonymous deck artwork uses native lazy images and appears after scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHydrated(page, '/');
  const recentDecks = page
    .getByRole('heading', { name: 'Recent Decklists', exact: true })
    .locator('..');
  const artwork = recentDecks.locator('img');
  await expect(artwork).toHaveCount(3);
  for (const image of await artwork.all()) {
    await expect(image).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('fetchpriority', 'low');
    await image.scrollIntoViewIfNeeded();
    // Native lazy loading can fetch before visibility; assert eventual display,
    // rather than depending on a browser-specific preload distance.
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete &&
            element.naturalWidth > 0 &&
            Number(getComputedStyle(element).opacity) > 0,
        ),
      )
      .toBe(true);
  }
});
