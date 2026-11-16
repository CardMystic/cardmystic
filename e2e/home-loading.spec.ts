import { expect, test, type Page } from '@playwright/test';
import {
  BACKEND,
  backendPath,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
  waitForHydration,
} from './utils/mocks';

const deck = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Recovered featured deck',
  description: '',
  format: 'Commander',
  avatar_card_name: null,
  commanders: [],
  color_ratios: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 1 },
  updated_at: null,
  created_at: '2026-01-01',
  visibility: 'public',
  user_id: FAKE_USER.id,
  username: 'home-reader',
  like_count: 0,
  save_count: 0,
  comment_count: 0,
  view_count: 0,
};
const pagination = { totalCount: 1, totalPages: 1, page: 1, pageSize: 8 };
const sections = [
  {
    path: '/supabase/card-lists',
    title: 'Could not load your recent decklists',
    emptyText: "You haven't created any decklists yet",
    result: 'Recovered recent deck',
    data: {
      decklists: [{ ...deck, name: 'Recovered recent deck' }],
      ...pagination,
    },
    empty: { decklists: [], ...pagination, totalCount: 0 },
  },
  {
    path: '/supabase/card-lists/featured',
    title: 'Could not load featured decklists',
    emptyText: 'No featured decklists yet!',
    result: deck.name,
    data: { decklists: [deck] },
    empty: { decklists: [] },
  },
  {
    path: '/user/featured',
    title: 'Could not load featured users',
    emptyText: 'No featured users yet!',
    result: 'recovered-featured-user',
    data: {
      users: [
        {
          id: FAKE_USER.id,
          username: 'recovered-featured-user',
          avatar_card_name: null,
          is_featured: true,
          follower_count: 2,
        },
      ],
    },
    empty: { users: [] },
  },
  {
    path: '/supabase/card-lists/featured-primers',
    title: 'Could not load suggested primers',
    result: 'Recovered primer',
    data: {
      primers: [
        {
          decklist: { ...deck, name: 'Recovered primer' },
          primer_preview: 'A primer worth reading.',
        },
      ],
    },
    empty: { primers: [] },
  },
  {
    path: '/articles/recent',
    title: 'Could not load recent articles',
    result: 'Recovered article',
    data: {
      articles: [
        {
          id: deck.id,
          title: 'Recovered article',
          description: '',
          image_url: null,
          user_id: FAKE_USER.id,
          username: 'home-reader',
          avatar_card_name: null,
          is_published: true,
          published_at: '2026-01-01',
          created_at: '2026-01-01',
          updated_at: null,
          like_count: 0,
          comment_count: 0,
          view_count: 0,
        },
      ],
    },
    empty: { articles: [] },
  },
];

function sectionResult(page: Page, section: (typeof sections)[number]) {
  return section.path === '/user/featured'
    ? page.getByRole('link').filter({ hasText: section.result })
    : page.getByRole('heading', { name: section.result, exact: true });
}

async function revealHomeSections(page: Page) {
  const recent = page.getByRole('heading', {
    name: 'Recent Decklists',
    exact: true,
  });
  if (await recent.count()) await recent.scrollIntoViewIfNeeded();
  await page
    .getByRole('heading', { name: 'Awesome Decklists & Users', exact: true })
    .scrollIntoViewIfNeeded();
  const articlesHeading = page.getByRole('heading', {
    name: 'Recent Articles',
    exact: true,
  });
  const primersHeading = page.getByRole('heading', {
    name: 'Suggested Primer Reads',
    exact: true,
  });
  if (await primersHeading.count())
    await primersHeading.scrollIntoViewIfNeeded();
  if (await articlesHeading.count())
    await articlesHeading.scrollIntoViewIfNeeded();
  await page
    .getByLabel('CardMystic community statistics')
    .scrollIntoViewIfNeeded();
}

test.beforeEach(async ({ page }, testInfo) => {
  // Keep this fixture-only suite independent of real account data and trackers.
  await page.route(BACKEND + '/**', (route) => {
    const path = backendPath(route.request().url());
    if (path === null) return route.fallback();
    return route.fulfill({
      json: path === '/search/example' ? { query: '', cards: [] } : [],
    });
  });
  await page.route(SUPABASE + '/rest/v1/**', (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(
    /https:\/\/(?:www\.googletagmanager\.com|pagead2\.googlesyndication\.com)\//,
    (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
  if (!testInfo.tags.includes('@anonymous')) {
    await mockSupabaseAuth(page);
    await page.route(SUPABASE + '/rest/v1/profiles**', (route) =>
      route.fulfill({
        json: {
          id: FAKE_USER.id,
          username: 'home-reader',
          avatar_card_name: null,
        },
      }),
    );
    await page.addInitScript(
      ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
      {
        key: 'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
        session: {
          access_token: fakeJwt(),
          refresh_token: 'fake-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: FAKE_USER,
        },
      },
    );
  }
  await page.route(BACKEND + '/metrics/site_stats', (route) =>
    route.fulfill({
      json: { totalQueries: 346242, totalUsers: 1200, totalDecks: 2300 },
    }),
  );
});

for (const failure of ['service error', 'invalid response', '429'] as const) {
  test(`home sections show ${failure} and can recover independently while metrics load`, async ({
    page,
  }) => {
    const recovering = new Set<string>();
    for (const section of sections) {
      await page.route(
        (url) => backendPath(url) === section.path,
        (route) => {
          if (recovering.has(section.path))
            return route.fulfill({ json: section.data });
          return route.fulfill({
            status:
              failure === 'service error' ? 503 : failure === '429' ? 429 : 200,
            json: { message: 'Simulated content failure' },
          });
        },
      );
    }
    await gotoHydrated(page, '/about');
    await page.evaluate(() => {
      const root = document.getElementById('__nuxt') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: {
              $router: { push: (path: string) => Promise<unknown> };
            };
          };
        };
      };
      return root.__vue_app__.config.globalProperties.$router.push('/');
    });
    await revealHomeSections(page);
    const retryAlerts = page.getByRole('alert').filter({
      has: page.getByRole('button', { name: 'Retry', exact: true }),
    });
    await expect(retryAlerts).toHaveCount(5, { timeout: 30_000 });
    for (const section of sections) {
      if (section.emptyText)
        await expect(
          page.getByText(section.emptyText, { exact: true }),
        ).toHaveCount(0);
    }
    const metrics = page.getByLabel('CardMystic community statistics');
    await expect(metrics).toContainText(/3\s*4\s*6\s*,\s*2\s*4\s*2/);
    if (failure === '429') {
      await expect(retryAlerts.first()).toContainText(
        'Try again in 60 seconds',
      );
    }
    for (const section of sections) {
      // Every alert gets its own retry; recovering one must not hide the others.
      const alert =
        failure === '429'
          ? retryAlerts.first()
          : retryAlerts.filter({ hasText: section.title });
      recovering.add(section.path);
      await alert.getByRole('button', { name: 'Retry', exact: true }).click();
      await expect(sectionResult(page, section)).toBeVisible();
      await expect(retryAlerts).toHaveCount(sections.length - recovering.size);
    }
  });
}

test('successful empty responses still show the real empty states', async ({
  page,
}) => {
  for (const section of sections) {
    await page.route(
      (url) => backendPath(url) === section.path,
      (route) => route.fulfill({ json: section.empty }),
    );
  }
  await gotoHydrated(page, '/about');
  await page.evaluate(() => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push('/');
  });
  await revealHomeSections(page);
  for (const section of sections) {
    if (section.emptyText)
      await expect(
        page.getByText(section.emptyText, { exact: true }),
      ).toBeVisible();
  }
  await expect(
    page.getByRole('button', { name: 'Retry', exact: true }),
  ).toHaveCount(0);
});

test('initial mobile home loads recent decks and defers featured refreshes until visible', async ({
  page,
}) => {
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (/hydration.*mismatch/i.test(message.text())) {
      hydrationErrors.push(message.text());
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  // Stale SSR data must refresh only once the corresponding section is visible.
  await page.clock.setFixedTime(new Date(Date.now() + 10 * 60 * 1000));
  const requested: URL[] = [];
  for (const section of sections) {
    await page.route(
      (url) => backendPath(url) === section.path,
      (route) => {
        requested.push(new URL(route.request().url()));
        return route.fulfill({ json: section.data });
      },
    );
  }
  await gotoHydrated(page, '/');
  const input = page.getByPlaceholder('Describe the cards you want...');
  await input.fill('artifact removal');
  await expect(input).toHaveValue('artifact removal');
  await expect(
    page.getByRole('button', { name: 'Search', exact: true }),
  ).toBeEnabled();
  const recentBounds = await page
    .getByRole('heading', { name: 'Recent Decklists', exact: true })
    .boundingBox();
  const showcaseBounds = await page
    .getByRole('heading', { name: 'Your next deck starts here', exact: true })
    .boundingBox();
  expect(recentBounds!.y).toBeLessThan(showcaseBounds!.y);
  // Allow delayed hydration and auth work to settle while staying at the hero.
  await page.waitForTimeout(1000);
  expect(
    requested.some((url) => backendPath(url) === '/supabase/card-lists'),
  ).toBe(true);
  expect(
    requested.filter((url) => backendPath(url) !== '/supabase/card-lists'),
  ).toEqual([]);

  await revealHomeSections(page);
  await expect(
    page.getByText(
      'Browse public decks or try building your own without an account.',
    ),
  ).toHaveCount(0);
  const builder = page.getByRole('region', {
    name: 'Deck & Collection Builder',
    exact: true,
  });
  await builder.scrollIntoViewIfNeeded();
  await expect(
    builder.getByRole('link', { name: 'Build a deck', exact: true }),
  ).toHaveAttribute('href', '/lists');
  expect(hydrationErrors).toEqual([]);
  for (const section of sections) {
    await expect(sectionResult(page, section)).toBeVisible();
  }
  for (const [path, limit] of [
    ['/supabase/card-lists/featured', '3'],
    ['/user/featured', '3'],
    ['/supabase/card-lists/featured-primers', '2'],
  ]) {
    const request = requested.find((url) => backendPath(url) === path);
    expect(request?.searchParams.get('limit')).toBe(limit);
  }
});

for (const signedIn of [false, true]) {
  test(
    `mobile My Decks opens the ${signedIn ? 'account library' : 'guest builder'} in one click`,
    { tag: signedIn ? [] : '@anonymous' },
    async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      const hydrationErrors: string[] = [];
      page.on('console', (message) => {
        if (/hydration.*mismatch/i.test(message.text()))
          hydrationErrors.push(message.text());
      });
      const destination = signedIn ? '/lists' : '/build';
      await gotoHydrated(page, '/about');
      const header = page.getByRole('banner').first();
      const decks = header.getByRole('link', { name: 'My Decks', exact: true });
      for (const reload of [false, true]) {
        if (reload) {
          await page.reload();
          await waitForHydration(page);
        }
        await expect(decks).toHaveAttribute('href', destination);
        await expect(decks).toBeInViewport({ ratio: 1 });
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(320);
      }
      const trigger = header.getByRole('button', {
        name: signedIn ? 'Profile' : 'Open navigation menu',
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
      await decks.click();
      await expect(page).toHaveURL(new RegExp(destination + '$'));
      expect(hydrationErrors).toEqual([]);
    },
  );
}

test(
  'mobile guest can open My Decks without JavaScript',
  { tag: '@anonymous' },
  async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 320, height: 720 },
    });
    try {
      const page = await context.newPage();
      await page.goto('/about');
      const link = page
        .locator('header')
        .getByRole('link', { name: 'My Decks', exact: true });
      await expect(link).toBeInViewport({ ratio: 1 });
      await expect(link).toHaveAttribute('href', '/build');
      await link.click();
      await expect(page).toHaveURL(/\/build$/);
    } finally {
      await context.close();
    }
  },
);

test('signed-in desktop builder link hydrates correctly on direct visit and reload', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  const hydrationErrors: string[] = [];
  page.on('console', (message) => {
    if (/hydration.*mismatch/i.test(message.text()))
      hydrationErrors.push(message.text());
  });
  for (const section of sections) {
    await page.route(
      (url) => backendPath(url) === section.path,
      (route) => route.fulfill({ json: section.data }),
    );
  }
  await gotoHydrated(page, '/');
  for (const reload of [false, true]) {
    if (reload) {
      await page.reload();
      await waitForHydration(page);
    }
    await expect(
      page.getByRole('button', { name: 'Profile', exact: true }),
    ).toBeVisible();
    const stats = page.getByRole('group', {
      name: 'CardMystic community statistics',
    });
    await expect(
      stats.getByRole('link', { name: '1,200 users' }),
    ).toHaveAttribute('href', '/explore/users');
    await expect(
      stats.getByRole('link', { name: '2,300 decks' }),
    ).toHaveAttribute('href', '/explore/decklists');
    const builder = page.getByRole('region', {
      name: 'Deck & Collection Builder',
      exact: true,
    });
    await builder.scrollIntoViewIfNeeded();
    await expect(
      builder.getByRole('link', { name: 'Build a deck', exact: true }),
    ).toHaveAttribute('href', '/lists');
    expect(hydrationErrors).toEqual([]);
  }
});

test(
  'anonymous desktop home loads every section on direct visit and hard reload',
  { tag: '@anonymous' },
  async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Expire any prerendered query snapshot so this checks client requests too.
    await page.clock.setFixedTime(new Date(Date.now() + 10 * 60 * 1000));
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    const publicSections = sections.filter(
      (section) => section.path !== '/supabase/card-lists',
    );
    for (const section of publicSections) {
      await page.route(
        (url) => backendPath(url) === section.path,
        (route) => route.fulfill({ json: section.data }),
      );
    }
    const topQuery = 'card draw';
    await page.route(
      /https:\/\/(?:api|cards)\.scryfall\.(?:com|io)\//,
      (route) =>
        route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="146" height="204"><rect width="146" height="204" fill="#8f6edf"/></svg>',
        }),
    );

    try {
      for (const visit of ['direct visit', 'hard reload']) {
        await test.step(visit, async () => {
          if (visit === 'direct visit') {
            await gotoHydrated(page, '/');
          } else {
            // Reload the document rather than navigating through Vue Router.
            await page.reload();
            await waitForHydration(page);
          }
          await expect(
            page
              .getByRole('link', {
                name: 'Build a deck',
                exact: true,
              })
              .first(),
          ).toBeVisible();
          await revealHomeSections(page);
          await expect(
            page.getByRole('link', { name: deck.name, exact: true }),
          ).toHaveAttribute('href', `/lists/${deck.id}`);
          for (const section of publicSections) {
            await expect(sectionResult(page, section)).toBeVisible();
          }
          const metrics = page.getByLabel('CardMystic community statistics');
          await expect(metrics).toContainText(/3\s*4\s*6\s*,\s*2\s*4\s*2/);
          await expect(
            page.getByRole('heading', { name: 'Your next deck starts here' }),
          ).toBeVisible();
          const top = page.locator('.top-queries-container').first();
          await top.scrollIntoViewIfNeeded();
          await expect(top).toContainText('Popular Searches');
          await expect(top).toContainText(topQuery);
          await expect(
            page.getByRole('button', { name: 'Retry', exact: true }),
          ).toHaveCount(0);
          if (visit === 'direct visit') {
            for (const width of [1600, 1599, 1280, 390, 320]) {
              await page.setViewportSize({ width, height: 844 });
              await page.evaluate(() => window.scrollTo(0, 0));
              if (width < 1600) {
                await page
                  .getByRole('button', { name: 'Open navigation menu' })
                  .click();
              }
              const navigation =
                width < 1600
                  ? page.getByRole('dialog', { name: 'Open navigation menu' })
                  : page.getByRole('navigation', {
                      name: 'Main navigation',
                      exact: true,
                    });
              const pricing = navigation.getByRole('link', {
                name: 'Pro Features',
                exact: true,
              });
              await expect(pricing).toBeVisible();
              await expect(pricing).toHaveAttribute('href', '/memberships');
              if (width < 1600) await page.keyboard.press('Escape');
              expect(
                await page.evaluate(() => document.documentElement.scrollWidth),
              ).toBeLessThanOrEqual(width);
            }
            await page.setViewportSize({ width: 1440, height: 1000 });
          }
        });
      }
    } finally {
      // A startup exception must fail this test even if SSR looks complete.
      expect(pageErrors).toEqual([]);
    }
  },
);
