import { expect, test, type Page } from '@playwright/test';
import {
  BACKEND,
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

async function revealHomeSections(page: Page) {
  await page
    .getByRole('heading', { name: 'Recent Decklists', exact: true })
    .scrollIntoViewIfNeeded();
  await page
    .getByRole('heading', { name: 'Awesome Decklists & Users', exact: true })
    .scrollIntoViewIfNeeded();
  const articlesHeading = page.getByRole('heading', {
    name: 'Recent Articles',
    exact: true,
  });
  if (await articlesHeading.count())
    await articlesHeading.scrollIntoViewIfNeeded();
  await page
    .getByText('Total Searches Resolved', { exact: true })
    .scrollIntoViewIfNeeded();
}

test.beforeEach(async ({ page }, testInfo) => {
  // Keep this fixture-only suite independent of real account data and trackers.
  await page.route(BACKEND + '/**', (route) => {
    const path = new URL(route.request().url()).pathname;
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
  await page.route(BACKEND + '/metrics/query_count', (route) =>
    route.fulfill({ json: { totalQueries: 346242 } }),
  );
});

for (const failure of ['service error', 'invalid response', '429'] as const) {
  test(`home sections show ${failure} and can recover independently while metrics load`, async ({
    page,
  }) => {
    const recovering = new Set<string>();
    for (const section of sections) {
      await page.route(
        (url) =>
          url.origin === new URL(BACKEND).origin &&
          url.pathname === section.path,
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
    const metrics = page
      .getByText('Total Searches Resolved', { exact: true })
      .locator('..')
      .locator('..');
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
      await expect(
        page.getByText(section.result, { exact: true }),
      ).toBeVisible();
      await expect(retryAlerts).toHaveCount(sections.length - recovering.size);
    }
  });
}

test('successful empty responses still show the real empty states', async ({
  page,
}) => {
  for (const section of sections) {
    await page.route(
      (url) =>
        url.origin === new URL(BACKEND).origin && url.pathname === section.path,
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

test('initial mobile home loads recent decks and defers featured content until visible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // Stale SSR data must refresh only once the corresponding section is visible.
  await page.clock.setFixedTime(new Date(Date.now() + 10 * 60 * 1000));
  const requested: URL[] = [];
  for (const section of sections) {
    await page.route(
      (url) =>
        url.origin === new URL(BACKEND).origin && url.pathname === section.path,
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
  // Allow delayed hydration and auth work to settle while staying at the hero.
  await page.waitForTimeout(1000);
  expect(requested.some((url) => url.pathname === '/supabase/card-lists')).toBe(
    true,
  );
  expect(
    requested.filter((url) => url.pathname !== '/supabase/card-lists'),
  ).toEqual([]);

  await revealHomeSections(page);
  for (const section of sections) {
    await expect(page.getByText(section.result, { exact: true })).toBeVisible();
  }
  for (const [path, limit] of [
    ['/supabase/card-lists/featured', '3'],
    ['/user/featured', '3'],
    ['/supabase/card-lists/featured-primers', '2'],
  ]) {
    const request = requested.find((url) => url.pathname === path);
    expect(request?.searchParams.get('limit')).toBe(limit);
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
        (url) =>
          url.origin === new URL(BACKEND).origin &&
          url.pathname === section.path,
        (route) => route.fulfill({ json: section.data }),
      );
    }
    const exampleQuery = 'Artifacts that produce mana';
    const topQuery = 'Creatures that draw cards';
    await page.route(BACKEND + '/search/example', (route) =>
      route.fulfill({
        json: {
          query: exampleQuery,
          cards: [
            {
              card_name: 'Sol Ring',
              rank: 1,
              card_data: {
                id: '20000000-0000-4000-8000-000000000001',
                oracle_id: '20000000-0000-4000-8000-000000000002',
                name: 'Sol Ring',
                mana_cost: '{1}',
                cmc: 1,
                type_line: 'Artifact',
                oracle_text: '{T}: Add {C}{C}.',
                colors: [],
                color_identity: [],
                keywords: [],
                games: ['paper'],
                legalities: { commander: 'legal' },
                prices: { usd: '1.00' },
                image_uris: {
                  normal: 'https://cards.scryfall.io/normal/sol-ring.jpg',
                },
                layout: 'normal',
                rarity: 'uncommon',
                set: 'cmm',
                collector_number: '396',
              },
            },
          ],
        },
      }),
    );
    await page.route(BACKEND + '/cache/top', (route) =>
      route.fulfill({
        json: [
          {
            query: topQuery,
            hitCount: 42,
            lastAccessed: '2026-01-01T00:00:00Z',
            isCached: true,
          },
        ],
      }),
    );
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
            page.getByText('Login To Create Decklists!', { exact: true }),
          ).toBeVisible();
          await revealHomeSections(page);
          for (const section of publicSections) {
            await expect(
              page.getByText(section.result, { exact: true }),
            ).toBeVisible();
          }
          const metrics = page
            .getByText('Total Searches Resolved', { exact: true })
            .locator('..')
            .locator('..');
          await expect(metrics).toContainText(/3\s*4\s*6\s*,\s*2\s*4\s*2/);
          const example = page.locator('.example-content');
          await example.scrollIntoViewIfNeeded();
          await expect(example).toContainText(exampleQuery);
          await expect(
            example.getByAltText('Sol Ring', { exact: true }),
          ).toBeVisible();
          const top = page.locator('.top-queries-container').first();
          await top.scrollIntoViewIfNeeded();
          await expect(top).toContainText('Top Searches This Week');
          await expect(top).toContainText(topQuery);
          await expect(
            page.getByRole('button', { name: 'Retry', exact: true }),
          ).toHaveCount(0);
        });
      }
    } finally {
      // A startup exception must fail this test even if SSR looks complete.
      expect(pageErrors).toEqual([]);
    }
  },
);
