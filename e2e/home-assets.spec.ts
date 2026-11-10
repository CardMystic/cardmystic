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
            description: '',
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
            view_count: 0,
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

test('search showcase examples and artwork work on mobile and desktop', async ({
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Describe It. Find It.',
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
    await expect(examples.getByRole('link')).toHaveCount(3);
    const href = await examples.getByRole('link').first().getAttribute('href');
    const target = new URL(href!, 'http://localhost');
    expect(target.pathname).toBe(path);
    expect(target.searchParams.get(parameter)).toBe(value);
    expect(target.searchParams.get('useRerank')).toBe('false');
    if (parameter === 'commander') {
      expect(target.searchParams.get('decklist')).toContain('1 Sol Ring');
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(showcase).not.toContainText('**');
  await expect(
    showcase.getByText('Free · No account required', { exact: true }),
  ).toHaveCount(5);
  await expect(
    showcase
      .getByRole('list', { name: 'CardMystic workflow' })
      .getByRole('listitem'),
  ).toHaveText(['Search', 'Compare', 'Build', 'Recommend']);

  await expect(
    showcase
      .getByText('Free', { exact: false })
      .filter({ hasText: 'No account required' }),
  ).toHaveCount(5);
  await expect(
    showcase.locator('strong').filter({ hasText: 'Describe what you want' }),
  ).toBeVisible();
  for (const demo of await showcase.locator('.search-demo').all()) {
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('.results-ready')).toHaveCount(3);
  }
  await expect(
    showcase
      .locator('.search-demo')
      .first()
      .getByRole('link', { name: 'Toxic Deluge', exact: true }),
  ).toHaveAttribute('href', '/card/afaef788-34d1-460b-b884-9d7ae6ddeb18');
  const source = showcase.locator('.searched-card');
  await expect(source).toHaveAttribute('aria-label', "Teferi's Protection");
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const artwork = showcase.locator('.search-demo img');
  await expect(artwork).toHaveCount(12);
  await expect(
    showcase.getByText('Searched Card', { exact: true }),
  ).toBeVisible();
  await expect(showcase.getByRole('progressbar')).toHaveCount(8);
  await expect(
    showcase.getByRole('progressbar', { name: 'Toxic Deluge: Match score' }),
  ).toHaveAttribute('value', '86');
  const linkedInputs = showcase.locator('.search-demo .demo-input[href]');
  await expect(linkedInputs).toHaveCount(3);
  for (const input of await linkedInputs.all()) {
    await expect(input).toHaveAttribute('href', /\/search\/all\//);
  }
  const examples = showcase.getByRole('navigation', {
    name: 'Example deck and collection',
  });
  await examples.scrollIntoViewIfNeeded();
  await expect(examples.locator('.deck-link')).toHaveCount(2);
  expect(previewRequests).toEqual([]);
  await expect(examples).toContainText('Tutoring toolbox with a pinch of stax');
  await expect(
    examples.getByRole('link', { name: /Iron Man/ }),
  ).toHaveAttribute('href', '/lists/e8cde3f9-5cb3-41d6-8d9c-c07fd2aed77a');
  await expect(
    examples.getByRole('link', { name: /Vintage Collection/ }),
  ).toHaveAttribute('href', '/lists/058da0b2-95f8-4527-b9a1-6eaf3a6da05e');
  const businessSection = showcase.getByRole('region', {
    name: "Create Your Deck's Business Card",
  });
  const businessCard = businessSection.getByRole('article', {
    name: 'Deck business card preview',
  });
  await businessCard.scrollIntoViewIfNeeded();
  await expect(businessCard).toContainText('Commander · 100 cards');
  await expect(businessCard.getByRole('link')).toHaveAttribute(
    'href',
    '/lists/e8cde3f9-5cb3-41d6-8d9c-c07fd2aed77a',
  );
  await expect
    .poll(() =>
      businessCard
        .locator('img')
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  expect(
    await businessSection.evaluate(
      (section) =>
        !!section.previousElementSibling?.querySelector(
          '[aria-label="Deck comparison preview"]',
        ),
    ),
  ).toBe(true);
  await businessSection.screenshot({
    path: '/tmp/cardmystic-business-mobile.png',
  });
  const pro = showcase.getByLabel('Pro tools preview');
  await expect(pro.getByText('Example deck', { exact: true })).toHaveCount(0);
  const deckSearch = pro.getByRole('figure', {
    name: 'Search within your deck example',
  });
  await deckSearch.scrollIntoViewIfNeeded();
  await expect(deckSearch.locator('.demo-typed')).toHaveText(
    'Non artifact board wipe',
  );
  await expect(deckSearch.locator('.results-ready')).toHaveCount(3);
  await expect(deckSearch.locator('.demo-input')).not.toHaveAttribute('href');
  for (const name of ['Whipflare', 'All Is Dust', 'Ugin, the Spirit Dragon']) {
    await expect(
      deckSearch.getByRole('link', { name, exact: true }),
    ).toBeVisible();
  }
  const compare = showcase.getByRole('figure', {
    name: 'Deck comparison preview',
  });
  await compare.scrollIntoViewIfNeeded();
  await expect(compare.locator('.comparison-ready')).toBeVisible();
  await expect(compare.getByRole('listitem')).toHaveCount(4);
  await compare
    .getByRole('combobox', { name: 'Comparison preview cards' })
    .click();
  await page
    .getByRole('option', { name: 'Missing from your deck (2)', exact: true })
    .click();
  await expect(compare.getByRole('listitem')).toHaveCount(2);
  await compare
    .getByRole('button', {
      name: 'Add Foundry Inspector in comparison preview',
      exact: true,
    })
    .click();
  await expect(compare.getByRole('status')).toContainText(
    'updated the comparison preview',
  );
  await expect(pro.getByRole('heading', { level: 3 })).toHaveText([
    'Pro Search',
    'Search within your deck',
    'Suggested adds',
    'Suggested cuts',
    'Recommended decks for each card',
  ]);
  expect(
    await showcase.evaluate((section) => {
      const community = section.previousElementSibling;
      return community?.querySelector('h2')?.textContent?.trim();
    }),
  ).toBe('Awesome Decklists & Users');
  await expect(
    showcase.getByRole('heading', {
      name: 'What Sets CardMystic Apart?',
      exact: true,
    }),
  ).toBeVisible();
  const comparison = showcase.getByRole('region', {
    name: 'Pro and Normal search comparison',
  });
  await expect(comparison).toContainText('35% higher ranking score');
  await expect(comparison.locator('.evidence-value')).toHaveText([
    '59.8',
    '80.6',
  ]);
  await pro
    .getByRole('button', {
      name: 'Add Foundry Inspector in preview',
      exact: true,
    })
    .click();
  await expect(pro.getByRole('status')).toContainText(
    'Foundry Inspector added',
  );
  await pro
    .getByRole('button', { name: 'Cut Manalith in preview', exact: true })
    .click();
  await expect(pro.getByRole('status')).toContainText('Manalith cut');
  await expect(pro.getByRole('textbox')).toHaveCount(0);
  for (const title of ['Suggested adds preview', 'Suggested cuts preview']) {
    await expect(
      pro.getByRole('figure', { name: title, exact: true }).getByRole('link'),
    ).toHaveCount(3);
  }
  await expect(
    pro
      .getByRole('figure', { name: 'Recommended decks for Foundry Inspector' })
      .getByRole('listitem'),
  ).toHaveCount(3);
  await expect(
    pro.getByText('Try this preview by card name.', { exact: false }),
  ).toHaveCount(0);
  await expect(showcase.getByText(/in action|Selected examples/)).toHaveCount(
    0,
  );
  await expect(
    showcase.getByRole('link', { name: 'Master of Cruelties', exact: true }),
  ).toBeVisible();
  await expect(
    showcase.getByRole('progressbar', { name: 'Toxic Deluge: Match score' }),
  ).toHaveAttribute('data-color', 'success');
  await expect(
    showcase.getByRole('progressbar', {
      name: 'Clever Concealment: Similarity score',
    }),
  ).toHaveAttribute('data-color', 'warning');
  for (const demo of await showcase.locator('.search-demo').all()) {
    await demo.scrollIntoViewIfNeeded();
    await expect(demo.locator('img')).toHaveCount(3);
    await expect
      .poll(() =>
        demo.locator('img').evaluateAll((images) =>
          images.every((element) => {
            const image = element as HTMLImageElement;
            return (
              image.complete &&
              image.naturalWidth > 0 &&
              Number(getComputedStyle(image).opacity) > 0
            );
          }),
        ),
      )
      .toBe(true);
    for (const image of await demo.locator('img').all()) {
      await expect(image).toHaveAttribute('loading', 'lazy');
      await expect(image).toHaveAttribute('fetchpriority', 'low');
    }
  }
  const explore = page.getByRole('navigation', { name: 'Explore CardMystic' });
  await explore.scrollIntoViewIfNeeded();
  // The closing call to action follows the navigation groups.
  expect(
    await explore.evaluate((element) => {
      const section = element.closest('section');
      return section?.nextElementSibling?.id === 'home-call-to-action';
    }),
  ).toBe(true);
  const callToAction = page.getByRole('region', {
    name: 'Ready to Give it a Try?',
    exact: true,
  });
  await expect(
    callToAction.getByRole('link', { name: 'Create an account', exact: true }),
  ).toHaveAttribute('href', '/user/register');
  await callToAction.getByRole('link', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await showcase.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
    for (const stage of await showcase.locator('.demo-stage').all()) {
      expect(
        await stage.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
    }
  }
  for (const result of await showcase.locator('.demo-result').all()) {
    await expect(result).toHaveCSS('opacity', '1');
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(page.locator('.home-content')).toHaveCSS('max-width', '2000px');
  expect((await showcase.boundingBox())!.width).toBeCloseTo(1440, 0);
  await businessCard.scrollIntoViewIfNeeded();
  await businessSection.screenshot({
    path: '/tmp/cardmystic-business-desktop.png',
  });
  expect(previewRequests).toEqual([]);
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

test('hero tabs stay on one row and examples populate each search mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoHydrated(page, '/');
  await expect(
    page.getByLabel('CardMystic community statistics'),
  ).toContainText('346,242 searches');
  await expect(
    page.getByLabel('CardMystic community statistics'),
  ).toContainText('1,200 users');
  await expect(
    page.getByLabel('CardMystic community statistics'),
  ).toContainText('2,300 decks');
  const tabs = page.locator('.desktop-search-tabs');
  const similarity = tabs.getByRole('button', {
    name: 'Similarity Search',
    exact: true,
  });
  await expect(similarity.locator('.tab-label')).toHaveCSS('opacity', '0');
  await similarity.hover();
  await expect(similarity.locator('.tab-label')).toHaveCSS('opacity', '1');
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const tops = await tabs
      .getByRole('button')
      .evaluateAll((buttons) =>
        buttons.map((button) => Math.round(button.getBoundingClientRect().top)),
      );
    expect(new Set(tops).size).toBe(1);
    await expect(tabs).toHaveCSS('justify-content', 'center');
    const gaps = await tabs
      .getByRole('button')
      .evaluateAll((buttons) =>
        buttons
          .slice(1)
          .map(
            (button, i) =>
              button.getBoundingClientRect().left -
              buttons[i]!.getBoundingClientRect().right,
          ),
      );
    for (const gap of gaps) expect(gap).toBeCloseTo(8, 0);
    expect(await tabs.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
  }
  await similarity.click();
  const search = page.locator('.search-container');
  await expect(
    search.getByRole('link', { name: "Teferi's Protection", exact: true }),
  ).toBeVisible();
  const filterBounds = await search
    .getByRole('button', { name: 'Filters', exact: true })
    .boundingBox();
  const modeBounds = await search.locator('.search-mode').boundingBox();
  expect(Math.abs(filterBounds!.y - modeBounds!.y)).toBeLessThan(5);
  await tabs
    .getByRole('button', { name: 'Deck Recommender', exact: true })
    .click();
  const query = search.getByPlaceholder(
    "Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations.",
  );
  const button = search.getByRole('button', { name: 'Recommend', exact: true });
  expect(
    Math.abs((await query.boundingBox())!.y - (await button.boundingBox())!.y),
  ).toBeLessThan(5);
  await search
    .getByRole('link', { name: 'Kaalia Angels', exact: true })
    .click();
  await expect(
    page.getByPlaceholder('Paste your decklist here (one card per line)...'),
  ).toHaveValue(/Aurelia, the Warleader/);
  expect(new URL(page.url()).searchParams.get('commander')).toBe(
    'Kaalia of the Vast',
  );
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`showcase plays once with motion preference ${reducedMotion}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await gotoHydrated(page, '/');
    const demo = page.getByRole('figure', {
      name: 'Smart Search example',
      exact: true,
    });
    const typed = demo.locator('.demo-typed');
    // Before scrolling, cards must already be hidden, not reset by the observer.
    await expect(demo.locator('img')).toHaveCount(0);
    await expect(demo.locator('.results-ready')).toHaveCount(0);
    await expect(demo.locator('.demo-skeleton')).toHaveCount(3);
    await expect(demo.locator('.demo-result').first()).toHaveCSS(
      'opacity',
      '0',
    );
    expect(
      await demo
        .locator('.demo-skeleton')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe(
      await demo
        .locator('.demo-stage')
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    );
    await demo.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () => (await typed.innerText()).replace('|', '').trim().length,
      )
      .toBeGreaterThan(0);
    expect(
      (await typed.innerText()).replace('|', '').trim().length,
    ).toBeLessThan('X spell board wipes'.length);
    await expect(demo.locator('img')).toHaveCount(0);
    await expect(typed).toHaveText('X spell board wipes');
    await expect(demo.locator('img')).toHaveCount(3);
    for (const count of [1, 2, 3]) {
      await expect
        .poll(() => demo.locator('.results-ready').count(), {
          intervals: [50],
        })
        .toBe(count);
      expect(await demo.locator('.demo-skeleton').count()).toBe(3 - count);
    }
    await expect(demo.locator('.demo-result').last()).toHaveCSS('opacity', '1');
    // Stay past the former six-second replay timer, then leave and return.
    await page.waitForTimeout(7000);
    expect(await demo.locator('.results-ready').count()).toBe(3);
    await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    expect(await typed.innerText()).toBe('X spell board wipes');
    expect(await demo.locator('.results-ready').count()).toBe(3);
    await expect(demo.locator('.demo-result').first()).toHaveCSS(
      'transform',
      'none',
    );
    await expect(demo.locator('.demo-result').first()).toHaveCSS(
      'transition-duration',
      '0.4s',
    );
    const recommendations = page.getByRole('figure', {
      name: 'Deck Recommender example',
      exact: true,
    });
    await recommendations.scrollIntoViewIfNeeded();
    await expect(recommendations.locator('.demo-skeleton')).toHaveCount(3);
    await expect(recommendations.locator('.demo-typed')).toHaveText(
      'Kaalia of the Vast',
    );
    await expect
      .poll(
        async () => {
          const text = (
            await recommendations.locator('.demo-query-typed').innerText()
          )
            .replace('|', '')
            .trim();
          return text.length > 0 && text.length < 'Finishers'.length;
        },
        { intervals: [50] },
      )
      .toBe(true);
    await expect(recommendations.locator('.demo-query-typed')).toHaveText(
      'Finishers',
    );
    await expect(recommendations.locator('.results-ready')).toHaveCount(3);
    const target = new URL(
      (await recommendations.locator('.demo-query').getAttribute('href'))!,
      'http://localhost',
    );
    expect(target.searchParams.get('description')).toBe('Finishers');
  });
}
