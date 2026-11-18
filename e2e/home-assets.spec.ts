import { DECK_BUSINESS_CARDS_ENABLED } from '../utils/featureFlags';
import { expect, test, type Page } from '@playwright/test';
import { BACKEND, backendPath, SUPABASE, gotoHydrated } from './utils/mocks';

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  // These rendering checks are anonymous and independent of live account data.
  await page.route(BACKEND + '/**', (route) => {
    const path = backendPath(route.request().url());
    if (path === null) return route.fallback();
    if (path === '/supabase/card-lists/summaries') {
      const ids = new URL(route.request().url()).searchParams
        .get('ids')!
        .split(',');
      return route.fulfill({
        json: {
          decklists: ids.map((id) => ({
            id,
            kind: id.startsWith('058da0b2') ? 'collection' : 'deck',
            name: id.startsWith('058da0b2')
              ? 'Vintage Collection'
              : 'Iron Man Living Forge',
            description: id.startsWith('058da0b2')
              ? 'A vintage cube collection.'
              : 'An artifact toolbox deck.',
            format: 'Commander',
            avatar_card_name: null,
            commanders: [],
            color_ratios: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 1 },
            updated_at: null,
            created_at: '2026-01-01',
            visibility: 'public',
            user_id: 'example-owner',
            username: 'Andrew',
            like_count: 0,
            save_count: 0,
            comment_count: 0,
            view_count: id.startsWith('058da0b2') ? 19 : 47,
          })),
        },
      });
    }

    const responses: Record<string, unknown> = {
      '/search/example': { query: '', cards: [] },
      '/metrics/site_stats': {
        totalQueries: 346242,
        totalUsers: 1200,
        totalDecks: 2300,
      },
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
  const unnecessaryRequests: string[] = [];
  const manaRequests = trackManaAssets(page);
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      path === '/api/backend/card-collections' ||
      path === '/api/backend/cache/popular'
    )
      unnecessaryRequests.push(path);
    if (
      /\/(adrix-and-nev|mondrak)[./].*\.(?:jpg|webp)$/.test(path) ||
      /\/(adrix-and-nev|mondrak)\.(?:jpg|webp)$/.test(path)
    )
      heroRequests.push(path);
  });

  await gotoHydrated(page, '/');
  const input = page.getByPlaceholder('Describe the cards you want...');
  await input.fill('artifact removal');
  await expect(input).toHaveValue('artifact removal');
  await expect(page.getByAltText('Mondrak, Glory Dominus')).toBeHidden();
  await expect(page.getByAltText('Adrix and Nev, Twincasters')).toBeHidden();
  await expect(
    page.getByText('“Creatures that double your tokens”', { exact: true }),
  ).toBeHidden();
  expect(heroRequests).toEqual([]);
  expect(unnecessaryRequests).toEqual([]);
  expect(manaRequests).toEqual([]);
  const tabs = page.locator('.desktop-search-tabs');
  for (const mode of [
    'Similarity Search',
    'Deck Recommender',
    'Smart Search',
  ]) {
    await tabs.getByRole('button', { name: mode, exact: true }).click();
    await expect(tabs.locator('.active')).toHaveAttribute('aria-label', mode);
    await expect(tabs.locator('.active .tab-label')).toHaveCSS('opacity', '1');
    for (const label of await tabs
      .locator('button:not(.active) .tab-label')
      .all()) {
      await expect(label).toHaveCSS('max-width', '0px');
      await expect(label).toHaveCSS('opacity', '0');
    }
    expect(
      await tabs
        .getByRole('button')
        .evaluateAll(
          (buttons) =>
            new Set(
              buttons.map((button) =>
                Math.round(button.getBoundingClientRect().top),
              ),
            ).size,
        ),
    ).toBe(1);
  }
  await page.getByRole('link', { name: 'Learn more', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Your next deck starts here',
      exact: true,
    }),
  ).toBeInViewport();
});

test.describe('desktop without JavaScript', () => {
  test.use({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
  });

  test('community statistics link to the public search directories', async ({
    page,
  }) => {
    const stats = page.getByRole('group', {
      name: 'CardMystic community statistics',
    });
    for (const [label, path] of [
      ['users', '/explore/users'],
      ['decks', '/explore/decklists'],
    ]) {
      await page.goto('/');
      const link = stats.getByRole('link', { name: label });
      await expect(link).toHaveAttribute('href', path);
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(path + '$'));
    }
  });

  test('homepage workflow links navigate by keyboard without JavaScript', async ({
    page,
  }) => {
    const workflow = page.getByRole('list', { name: 'CardMystic workflow' });
    for (const [index, [label, path]] of [
      ['Search', '/search/all/smart'],
      ['Compare', '/search/all/similarity'],
      ['Build', '/build'],
      ['Recommend', '/search/all/deckbuilder'],
    ].entries()) {
      await page.goto('/');
      const link = workflow.getByRole('link', { name: label, exact: true });
      await expect(link).toHaveAttribute('href', path);
      await workflow.getByRole('link').first().focus();
      for (let step = 0; step < index; step++) await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      const [response] = await Promise.all([
        page.waitForNavigation(),
        page.keyboard.press('Enter'),
      ]);
      expect(response?.ok()).toBe(true);
      expect(new URL(page.url()).pathname).toBe(path);
    }
  });

  test('the server-rendered hero and search remain visible and images load', async ({
    page,
  }) => {
    await page.goto('/');
    // Server HTML must not expose finished cards before hydration starts the animation.
    const demos = page.locator('.showcase-row > .search-demo');
    await expect(demos).toHaveCount(3);
    await expect(demos.locator('img')).toHaveCount(0);
    await expect(demos.locator('.results-ready')).toHaveCount(0);
    await expect(demos.locator('.demo-skeleton')).toHaveCount(9);
    await expect(
      page.getByPlaceholder('Describe the cards you want...'),
    ).toBeVisible();
    for (const [name, path] of [
      ['Adrix and Nev, Twincasters', 'adrix-and-nev'],
      ['Mondrak, Glory Dominus', 'mondrak'],
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
        .toMatch(new RegExp(`/_nuxt/${path}\\.[^/]+\\.webp$`));
    }
    await expect(
      page.getByText('“Creatures that double your tokens”', { exact: true }),
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
  await search.getByRole('button', { name: 'Filters', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: 'Search filters' });
  await drawer.getByRole('button', { name: 'Colors', exact: true }).click();
  const symbols = drawer.locator('.color-checkboxes label svg');
  await expect(symbols).toHaveCount(6);
  const white = drawer.getByRole('checkbox', { name: 'White', exact: true });
  await white.check();
  await expect(white).toBeChecked();
  expect(manaRequests).toEqual([]);
});

test('homepage examples open the intended search and load deck summaries once', async ({
  page,
}) => {
  const previewRequests: URL[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (/\/card-lists\/(summaries|view\/)|\/business-card$/.test(url.pathname))
      previewRequests.push(url);
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHydrated(page, '/');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const showcase = page.locator(
    'section[aria-labelledby=search-showcase-title]',
  );
  for (const [title, path, parameter, value] of [
    ['Smart Search', '/search/all/smart', 'query', 'X spell board wipes'],
    [
      'Similarity Search',
      '/search/all/similarity',
      'card_name',
      "Teferi's Protection",
    ],
    [
      'Deck Recommender',
      '/search/all/deckbuilder',
      'commander',
      'Kaalia of the Vast',
    ],
  ]) {
    const examples = showcase.getByRole('navigation', {
      name: `${title} examples`,
    });
    const target = new URL(
      (await examples.getByRole('link').first().getAttribute('href'))!,
      page.url(),
    );
    expect(target.pathname).toBe(path);
    expect(target.searchParams.get(parameter)).toBe(value);
    expect(target.searchParams.get('useRerank')).toBe('false');
    if (parameter === 'commander')
      expect(target.searchParams.get('decklist')).toContain('1 Sol Ring');
  }
  // One demo is enough to catch broken rendering of the shared animated component.
  const demo = showcase.getByRole('figure', {
    name: 'Smart Search example',
    exact: true,
  });
  await demo.scrollIntoViewIfNeeded();
  await expect(demo.locator('.results-ready')).toHaveCount(3);
  await expect(
    demo.getByRole('link', { name: 'Toxic Deluge', exact: true }),
  ).toHaveAttribute('href', '/card/afaef788-34d1-460b-b884-9d7ae6ddeb18');
  const decks = showcase.getByRole('navigation', {
    name: 'Example deck and collection',
  });
  await decks.scrollIntoViewIfNeeded();
  await expect(decks.getByRole('link', { name: /Iron Man/ })).toHaveAttribute(
    'href',
    '/lists/e8cde3f9-5cb3-41d6-8d9c-c07fd2aed77a',
  );
  await expect(
    decks.getByRole('link', { name: /Vintage Collection/ }),
  ).toHaveAttribute('href', '/lists/058da0b2-95f8-4527-b9a1-6eaf3a6da05e');
  await expect.poll(() => previewRequests.length).toBe(1);
  expect(previewRequests[0]!.pathname).toMatch(/\/card-lists\/summaries$/);
  await showcase
    .getByRole('link', { name: 'Search: X spell board wipes', exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/search\/all\/smart\?query=X\+spell\+board\+wipe/,
  );
  await expect(
    page.getByPlaceholder('Describe the cards you want...'),
  ).toHaveValue('X spell board wipes');
});

test('hidden business cards are not advertised in public feature pages', async ({
  request,
}) => {
  test.skip(DECK_BUSINESS_CARDS_ENABLED, 'Business cards are enabled.');
  const home = await request.get('/');
  expect(home.ok()).toBe(true);
  expect(await home.text()).not.toContain("Create Your Deck's Business Card");
  const memberships = await request.get('/memberships');
  expect(memberships.ok()).toBe(true);
  expect(await memberships.text()).not.toContain(
    'Deck business cards and QR codes',
  );
});
