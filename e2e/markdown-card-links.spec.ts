import { expect, test, type Page } from '@playwright/test';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';

const ARTICLE_ID = '10000000-0000-4000-8000-000000000901';
const LIST_ID = '10000000-0000-4000-8000-000000000902';
const BOLT_ID = '4457ed35-7c10-48c8-9776-456485fdf070';
const ORACLE_ID = '6d3f4ed9-6d6f-4fec-89c9-1f39da1c2a2f';
const OWNER_ID = '10000000-0000-4000-8000-000000000903';
const SEARCH_HREF =
  '/search/all/smart?searchType=smart&query=draw%20cards&limit=12';
const SEARCH_SYNTAX = '@[search](https://cardmystic.com' + SEARCH_HREF + ')';
const content = [
  '# Markdown card links',
  SEARCH_SYNTAX,
  '[draw cards](https://cardmystic.com' + SEARCH_HREF + ')',
  String.fromCharCode(96).repeat(3) +
    'md\n' +
    SEARCH_SYNTAX +
    '\n' +
    String.fromCharCode(96).repeat(3),
  "[[Lightning Bolt]] and [[Thassa's Oracle]].",
  'Repeated mention: [[Lightning Bolt]].',
  '[[Unknown Card]] and [[Invalid ID Card]].',
  '[[<img src=x onerror="window.__markdownInjected=1">]]',
  '((<img src=x onerror="window.__markdownInjected=1">))',
  '((Lightning Bolt))',
].join('\n\n');

const cards = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    oracle_id: BOLT_ID,
    name: 'Lightning Bolt',
    image_uris: { normal: '/ugin.webp' },
    mana_cost: '{R}',
    type_line: 'Instant',
    oracle_text: 'Lightning Bolt deals 3 damage to any target.',
    legalities: {},
    color_identity: ['R'],
    colors: ['R'],
    prices: { usd: '1.00' },
    set_name: 'Test set',
    rarity: 'common',
    games: ['paper'],
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    oracle_id: ORACLE_ID,
    name: "Thassa's Oracle",
    image_uris: { normal: '/kaalia.webp' },
    prices: { usd: '1.00' },
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    oracle_id: 'not-an-oracle-id',
    name: 'Invalid ID Card',
    image_uris: { normal: '/ugin.webp' },
  },
];

const article = {
  id: ARTICLE_ID,
  title: 'Markdown interaction fixture',
  description: 'Fixture for contextual card links.',
  content,
  image_url: null,
  is_published: true,
  published_at: '2026-01-15T12:00:00Z',
  created_at: '2026-01-10T12:00:00Z',
  updated_at: null,
  like_count: 0,
  comment_count: 0,
  view_count: 0,
  user_id: OWNER_ID,
  username: 'writer',
  avatar_card_name: null,
};

async function navigateInApp(page: Page, href: string) {
  await page.evaluate((target) => {
    const app = (
      document.getElementById('__nuxt') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: {
              $router: { push: (path: string) => Promise<unknown> };
            };
          };
        };
      }
    ).__vue_app__;
    return app.config.globalProperties.$router.push(target);
  }, href);
}

async function openMarkdown(
  page: Page,
  kind: 'article' | 'primer' = 'article',
) {
  const batches: string[][] = [];
  await page.route('**/googletagmanager.com/**', (route) =>
    route.fulfill({ body: '' }),
  );
  await page.route('**/pagead2.googlesyndication.com/**', (route) =>
    route.fulfill({ body: '' }),
  );
  await page.route(`${SUPABASE}/**`, (route) => route.fulfill({ json: [] }));
  await page.route(`${BACKEND}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/cards/cards-by-names') {
      batches.push(route.request().postDataJSON().cardNames);
      return route.fulfill({ json: cards });
    }
    if (path.startsWith('/cards/with-llm/')) {
      const id = path.split('/').pop();
      const card = cards.find(
        (entry) => entry.oracle_id === id || entry.id === id,
      );
      return route.fulfill({
        status: card ? 200 : 404,
        json: card
          ? { card: { ...cards[0], ...card }, llm: null }
          : { message: 'Card not found' },
      });
    }
    if (path === `/articles/view/${ARTICLE_ID}`) {
      return route.fulfill({ json: { article } });
    }
    if (path.startsWith('/articles/comments/')) {
      return route.fulfill({ json: { comments: [], nextCursor: null } });
    }
    if (path === `/supabase/card-lists/primer/${LIST_ID}`) {
      return route.fulfill({ json: { listId: LIST_ID, text: content } });
    }
    if (path === `/supabase/card-lists/view/${LIST_ID}`) {
      return route.fulfill({
        json: {
          decklist: {
            id: LIST_ID,
            name: 'Public primer fixture',
            description: '',
            format: 'commander',
            avatar_card_name: null,
            commanders: [],
            color_ratios: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 0 },
            updated_at: null,
            created_at: '2026-01-01T00:00:00Z',
            visibility: 'public',
            user_id: OWNER_ID,
            username: 'writer',
            like_count: 0,
            save_count: 0,
            comment_count: 0,
            view_count: 0,
          },
          items: [],
          owner: {
            id: OWNER_ID,
            username: 'writer',
            avatar_card_name: null,
            is_featured: false,
          },
        },
      });
    }
    return route.fulfill({ json: [] });
  });

  // Client navigation keeps both the page and card-data requests in the fixture.
  await gotoHydrated(page, '/about');
  await navigateInApp(
    page,
    kind === 'article' ? `/articles/${ARTICLE_ID}` : `/lists/${LIST_ID}/primer`,
  );
  await expect(page.locator('a.card-inline-link').first()).toBeVisible();
  return batches;
}

test('article mentions expose canonical links with one batch lookup and safe unresolved text', async ({
  page,
}) => {
  const batches = await openMarkdown(page);
  const links = page.locator('a.card-inline-link');
  await expect(links).toHaveCount(3);
  await expect(links.nth(0)).toHaveAttribute('href', `/card/${BOLT_ID}`);
  await expect(links.nth(1)).toHaveAttribute('href', `/card/${ORACLE_ID}`);
  await expect(links.nth(1)).toHaveText("Thassa's Oracle");
  await expect(links.nth(2)).toHaveAttribute('href', `/card/${BOLT_ID}`);
  await expect(
    page.locator('.card-unknown').filter({ hasText: 'Unknown Card' }),
  ).toHaveCount(1);
  await expect(
    page.locator('.card-unknown').filter({ hasText: 'Invalid ID Card' }),
  ).toHaveCount(1);
  await expect(page.locator('.card-unknown img')).toHaveCount(0);
  expect(await page.evaluate(() => '__markdownInjected' in window)).toBe(false);
  expect(batches).toHaveLength(1);
  expect(batches[0].filter((name) => name === 'Lightning Bolt')).toHaveLength(
    1,
  );
  await expect(page.locator('.card-inline-img-link')).toHaveAttribute(
    'href',
    `/card/${BOLT_ID}`,
  );

  await links.first().hover();
  await expect(page.locator('.editor-card-preview img')).toHaveAttribute(
    'src',
    '/ugin.webp',
  );
  await links.first().click();
  await expect(page).toHaveURL(new RegExp(`/card/${BOLT_ID}$`));
});

test('primer mentions use the same crawlable card links and keyboard navigation', async ({
  page,
}) => {
  await openMarkdown(page, 'primer');
  const link = page.locator('a.card-inline-link').first();
  await expect(link).toHaveAttribute('href', `/card/${BOLT_ID}`);
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/card/${BOLT_ID}$`));
});

test('Back from a primer card link keeps the card visible while the primer loads', async ({
  page,
}) => {
  await openMarkdown(page, 'primer');
  await page.locator('a.card-inline-link').first().click();
  await expect(page).toHaveURL(new RegExp('/card/' + BOLT_ID + '$'));
  await expect(page.locator('img.card-image')).toHaveAttribute(
    'src',
    '/ugin.webp',
  );

  const wrongCardRequests: string[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (path === '/cards/with-llm/' + LIST_ID) {
      wrongCardRequests.push(path);
    }
  });
  await page.evaluate(() => {
    const state = window as unknown as { sawCardNotFound: boolean };
    state.sawCardNotFound = false;
    const observe = () => {
      if (
        [...document.querySelectorAll('h2')].some(
          (heading) => heading.textContent?.trim() === 'Card Not Found',
        )
      ) {
        state.sawCardNotFound = true;
      }
    };
    new MutationObserver(observe).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });

  let releasePrimer!: () => void;
  const primerGate = new Promise<void>((resolve) => {
    releasePrimer = resolve;
  });
  let primerWaiting = false;
  await page.route(
    BACKEND + '/supabase/card-lists/view/' + LIST_ID,
    async (route) => {
      primerWaiting = true;
      await primerGate;
      await route.fallback();
    },
  );

  const back = page.goBack();
  try {
    await expect.poll(() => primerWaiting).toBe(true);
    // Hold the destination's setup open. The outgoing card must still show its
    // own data while the global route already contains the primer's list ID.
    await expect(page.locator('img.card-image')).toHaveAttribute(
      'src',
      '/ugin.webp',
    );
    await expect(
      page.getByRole('heading', { name: 'Card Not Found', exact: true }),
    ).toHaveCount(0);
    expect(wrongCardRequests).toEqual([]);
  } finally {
    releasePrimer();
    await back;
  }

  await expect(page.locator('a.card-inline-link').first()).toBeVisible();
  await expect(page).toHaveURL(new RegExp('/lists/' + LIST_ID + '/primer$'));
  expect(wrongCardRequests).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { sawCardNotFound: boolean }).sawCardNotFound,
    ),
  ).toBe(false);
});

test('card-to-card navigation and canonical redirects keep each card request scoped', async ({
  page,
}) => {
  await openMarkdown(page, 'primer');
  await page.locator('a.card-inline-link').first().click();
  await expect(page.locator('img.card-image')).toHaveAttribute(
    'src',
    '/ugin.webp',
  );

  await navigateInApp(page, '/card/' + ORACLE_ID);
  await expect(page).toHaveURL(new RegExp('/card/' + ORACLE_ID + '$'));
  await expect(page.locator('img.card-image')).toHaveAttribute(
    'src',
    '/kaalia.webp',
  );

  await page.goBack();
  await expect(page).toHaveURL(new RegExp('/card/' + BOLT_ID + '$'));
  await expect(page.locator('img.card-image')).toHaveAttribute(
    'src',
    '/ugin.webp',
  );

  await navigateInApp(
    page,
    '/card/' + cards[1].id + '?source=markdown#details',
  );
  await expect(page).toHaveURL(
    new RegExp('/card/' + ORACLE_ID + '\\?source=markdown#details$'),
  );
  await expect(page.locator('img.card-image')).toHaveAttribute(
    'src',
    '/kaalia.webp',
  );
});

test('article card links leave modified clicks to the browser', async ({
  page,
}) => {
  await openMarkdown(page);
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        const link = (event.target as HTMLElement).closest(
          'a.card-inline-link',
        );
        if (!link) return;
        // This document listener runs after the component's bubbling handler.
        // Record whether the app intercepted the gesture before cancelling the
        // native popup so its lifecycle cannot make this assertion flaky.
        (
          window as unknown as { cardLinkActivation: unknown }
        ).cardLinkActivation = {
          prevented: event.defaultPrevented,
          modified: event.ctrlKey || event.metaKey,
          href: link.getAttribute('href'),
        };
        event.preventDefault();
      },
      { once: true },
    );
  });
  await page
    .locator('a.card-inline-link')
    .first()
    .click({ modifiers: ['ControlOrMeta'] });
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { cardLinkActivation: unknown })
          .cardLinkActivation,
    ),
  ).toEqual({
    prevented: false,
    modified: true,
    href: `/card/${BOLT_ID}`,
  });
  await expect(page).toHaveURL(new RegExp(`/articles/${ARTICLE_ID}$`));
});

test('article card links leave middle clicks to the browser', async ({
  page,
}) => {
  await openMarkdown(page);
  await page.evaluate(() => {
    document.addEventListener(
      'auxclick',
      (event) => {
        const link = (event.target as HTMLElement).closest(
          'a.card-inline-link',
        );
        if (!link) return;
        // Observe the application's behavior, then suppress the browser's new tab
        // to keep this check independent of headless popup lifecycle events.
        (
          window as unknown as { cardLinkActivation: unknown }
        ).cardLinkActivation = {
          prevented: event.defaultPrevented,
          button: event.button,
          href: link.getAttribute('href'),
        };
        event.preventDefault();
      },
      { once: true },
    );
  });
  await page.locator('a.card-inline-link').first().click({ button: 'middle' });
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { cardLinkActivation: unknown })
          .cardLinkActivation,
    ),
  ).toEqual({
    prevented: false,
    button: 1,
    href: `/card/${BOLT_ID}`,
  });
  await expect(page).toHaveURL(new RegExp(`/articles/${ARTICLE_ID}$`));
});

test.describe('touch card mentions', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test('a single tap previews; slow taps stay previews and a quick double tap navigates', async ({
    page,
  }) => {
    await openMarkdown(page, 'primer');
    const link = page.locator('a.card-inline-link').first();
    await link.tap();
    await expect(page.locator('.editor-card-preview img')).toHaveAttribute(
      'src',
      '/ugin.webp',
    );
    await expect(page).toHaveURL(new RegExp(`/lists/${LIST_ID}/primer$`));

    // Deliberately exceed the gesture window: two ordinary taps must not navigate.
    await page.waitForTimeout(600);
    await expect(page.locator('.editor-card-preview')).toBeVisible();
    await link.tap();
    await expect(page).toHaveURL(new RegExp(`/lists/${LIST_ID}/primer$`));
    await page.waitForTimeout(600);
    await link.tap();
    await link.tap();
    await expect(page).toHaveURL(new RegExp(`/card/${BOLT_ID}$`));
  });

  test('switching cards or dismissing the preview resets the pending double tap', async ({
    page,
  }) => {
    await openMarkdown(page);
    const links = page.locator('a.card-inline-link');
    await links.nth(0).tap();
    await links.nth(1).tap();
    await expect(page.locator('.editor-card-preview img')).toHaveAttribute(
      'src',
      '/kaalia.webp',
    );
    await expect(page).toHaveURL(new RegExp(`/articles/${ARTICLE_ID}$`));
    await page
      .getByRole('heading', { name: 'Markdown card links', exact: true })
      .tap();
    await expect(page.locator('.editor-card-preview')).toHaveCount(0);
    await links.nth(1).tap();
    await expect(page).toHaveURL(new RegExp(`/articles/${ARTICLE_ID}$`));
    await expect(page.locator('.editor-card-preview img')).toHaveAttribute(
      'src',
      '/kaalia.webp',
    );
  });

  test('keyboard activation on a touch device still navigates in one step', async ({
    page,
  }) => {
    await openMarkdown(page);
    await page.locator('a.card-inline-link').first().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/card/${BOLT_ID}$`));
  });
});

for (const kind of ['article', 'primer'] as const) {
  test(
    kind + ' search embed edits the query and starts the selected search',
    async ({ page }) => {
      await openMarkdown(page, kind);
      const embed = page.locator('.search-embed');
      await expect(embed).toHaveCount(1);
      await expect(
        embed.getByRole('link', {
          name: 'Smart Search: draw cards',
          exact: true,
        }),
      ).toHaveAttribute('href', SEARCH_HREF);
      await expect(
        page.getByRole('link', { name: 'draw cards', exact: true }),
      ).toHaveAttribute('href', 'https://cardmystic.com' + SEARCH_HREF);
      await expect(
        page.locator('.primer-preview pre code').last(),
      ).toContainText('@[search](');
      await expect(
        embed.getByRole('searchbox', { name: 'Smart Search query' }),
      ).toHaveValue('draw cards');
      await page.route(BACKEND + '/search/colbert**', (route) =>
        route.fulfill({ json: { results: [] } }),
      );
      const search = page.waitForRequest(
        (request) =>
          request.url().includes('/search/colbert') &&
          request.method() === 'POST',
      );
      await embed
        .getByRole('searchbox', { name: 'Smart Search query' })
        .fill('creatures that draw cards');
      await embed.getByRole('button', { name: 'TRY ME' }).click();
      await expect(page).toHaveURL(/\/search\/all\/smart\?/);
      const destination = new URL(page.url());
      expect(destination.searchParams.get('query')).toBe(
        'creatures that draw cards',
      );
      expect(destination.searchParams.get('limit')).toBe('12');
      expect((await search).postDataJSON()).toMatchObject({
        query: 'creatures that draw cards',
      });
    },
  );
}

test('search embed links preserve the original query and support narrow screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openMarkdown(page);
  const embed = page.locator('.search-embed');
  await expect(embed.getByRole('button', { name: 'TRY ME' })).toBeVisible();
  const box = await embed.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await expect(embed.getByRole('searchbox')).toHaveValue('draw cards');
  await embed
    .getByRole('link', { name: 'Smart Search: draw cards', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp('/search/all/smart'));
  expect(new URL(page.url()).searchParams.get('query')).toBe('draw cards');
  expect(new URL(page.url()).searchParams.get('limit')).toBe('12');
});
