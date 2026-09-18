import { expect, test, type Page } from '@playwright/test';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';

test.beforeEach(async ({ page }) => {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(BACKEND + '/bulkdata/partner-commanders', (route) =>
    route.fulfill({
      json: {
        partner: [],
        chooseABackground: [],
        background: [],
        doctorsCompanion: [],
        timeLordDoctor: [],
      },
    }),
  );
  await page.route(SUPABASE + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(
    /https:\/\/(?:www\.googletagmanager\.com|pagead2\.googlesyndication\.com)\//,
    (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});

const curatedPages = [
  {
    path: '/search/all/smart/best-planeswalkers',
    input: 'Describe the cards you want...',
    value: 'most powerful planeswalkers',
  },
  {
    path: '/search/all/keyword/card-draw',
    input: 'Search cards by keywords…',
    value: 'draw a card',
  },
  {
    path: '/search/all/similarity/lightning-bolt',
    input: 'Enter a card name...',
    value: 'Lightning Bolt',
  },
  {
    path: '/search/all/commander/graveyard-recursion',
    input: 'Describe the commander you want...',
    value: 'graveyard recursion commander',
  },
  {
    path: '/search/all/deckbuilder/best-cards-for-kaalia-of-the-vast',
    input: 'Select a commander (optional)...',
    value: 'Kaalia of the Vast',
  },
  {
    path: '/popular-by-commander/all/most-played-cards-for-kaalia-of-the-vast',
    input: 'Select a commander...',
    value: 'Kaalia of the Vast',
  },
];

async function navigateInApp(page: Page, path: string) {
  await page.evaluate((target) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(target);
  }, path);
}

for (const curated of curatedPages) {
  test(`curated controls and URL override saved history: ${curated.path}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      for (const key of [
        'smart_search_query',
        'keyword_search_query',
        'similarity_search_card_name',
        'commander_search_query',
        'recommend_search_query',
        'popular_by_commander_search_query',
      ]) {
        sessionStorage.setItem(
          key,
          JSON.stringify({
            query: 'old unrelated search',
            card_name: 'Sol Ring',
            commander: 'The Ur-Dragon',
            filters: JSON.stringify({ isArena: true }),
          }),
        );
      }
    });

    await gotoHydrated(page, curated.path);
    await expect(
      page.getByPlaceholder(curated.input, { exact: true }),
    ).toHaveValue(curated.value);
    expect(new URL(page.url()).pathname).toBe(curated.path);
    expect(new URL(page.url()).search).toBe('');
  });
}

for (const suggestion of [
  {
    mode: 'similarity',
    label: 'Lightning Bolt',
    storageKey: 'similarity_search_card_name',
    saved: { card_name: 'Sol Ring' },
    curated: curatedPages[2],
  },
  {
    mode: 'keyword',
    label: 'Draw a card',
    storageKey: 'keyword_search_query',
    saved: { query: 'flying' },
    curated: curatedPages[1],
  },
  {
    mode: 'deckbuilder',
    label: 'Kaalia of the Vast',
    storageKey: 'recommend_search_query',
    saved: { commander: 'The Ur-Dragon' },
    curated: curatedPages[4],
  },
]) {
  test(`clicking ${suggestion.mode} suggestion keeps its curated page and input`, async ({
    page,
  }) => {
    await gotoHydrated(page, '/search/all/' + suggestion.mode);
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, JSON.stringify(value)),
      { key: suggestion.storageKey, value: suggestion.saved },
    );
    await page
      .getByRole('link', { name: 'Try ' + suggestion.label, exact: true })
      .click();
    await expect(
      page.getByPlaceholder(suggestion.curated.input, { exact: true }),
    ).toHaveValue(suggestion.curated.value);
    expect(new URL(page.url()).pathname).toBe(suggestion.curated.path);
    expect(new URL(page.url()).search).toBe('');
    if (suggestion.mode === 'similarity') {
      expect(
        await page.evaluate(() =>
          JSON.parse(sessionStorage.getItem('similarity_search_card_name')!),
        ),
      ).toEqual({ searchType: 'similarity', card_name: 'Lightning Bolt' });
    }
  });
}

test('refining a curated search preserves its active filters', async ({
  page,
}) => {
  await gotoHydrated(page, '/search/all/smart/best-planeswalkers');
  await page
    .getByPlaceholder('Describe the cards you want...', { exact: true })
    .fill('planeswalkers that draw cards');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await expect(page).toHaveURL(/\/search\/all\/smart\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get('query')).toBe('planeswalkers that draw cards');
  expect(JSON.parse(url.searchParams.get('filters')!)).toMatchObject({
    selectedCardTypes: ['Planeswalker'],
  });
});

test('in-app navigation between curated modes keeps the destination query and URL', async ({
  page,
}) => {
  await gotoHydrated(page, curatedPages[2].path);
  await page.evaluate(() => {
    for (const key of [
      'smart_search_query',
      'keyword_search_query',
      'similarity_search_card_name',
      'commander_search_query',
      'recommend_search_query',
    ]) {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          query: 'old unrelated search',
          card_name: 'Sol Ring',
          commander: 'The Ur-Dragon',
          filters: JSON.stringify({ isArena: true }),
        }),
      );
    }
  });

  for (const curated of curatedPages.slice(0, 5)) {
    await navigateInApp(page, curated.path);
    await expect(
      page.getByPlaceholder(curated.input, { exact: true }),
    ).toHaveValue(curated.value);
    await expect(page).toHaveURL(curated.path);
  }
});

test('Back and Forward preserve a curated suggestion after changing modes', async ({
  page,
}) => {
  await gotoHydrated(page, '/search/all/similarity');
  await page
    .getByRole('link', { name: 'Try Lightning Bolt', exact: true })
    .click();
  await expect(page.getByPlaceholder('Enter a card name...')).toHaveValue(
    'Lightning Bolt',
  );
  await expect(page).toHaveURL(curatedPages[2].path);

  await page.evaluate(() => {
    sessionStorage.setItem(
      'smart_search_query',
      JSON.stringify({
        query: 'creatures that draw cards',
        filters: JSON.stringify({ isArena: true }),
      }),
    );
  });
  await page.getByRole('button', { name: 'Smart Search', exact: true }).click();
  await expect(
    page.getByPlaceholder('Describe the cards you want...'),
  ).toHaveValue('creatures that draw cards');
  await expect(page).toHaveURL(/\/search\/arena\/smart\?/);
  const smartUrl = page.url();

  await page.goBack();
  await expect(page.getByPlaceholder('Enter a card name...')).toHaveValue(
    'Lightning Bolt',
  );
  await expect(page).toHaveURL(curatedPages[2].path);

  await page.goForward();
  await expect(
    page.getByPlaceholder('Describe the cards you want...'),
  ).toHaveValue('creatures that draw cards');
  await expect(page).toHaveURL(smartUrl);
});

test('search tabs restore each mode with its saved platform filters', async ({
  page,
}) => {
  const smartQuery = new URLSearchParams({
    query: 'creatures that draw cards',
    filters: JSON.stringify({ isArena: true }),
  });
  await gotoHydrated(page, '/search/arena/smart?' + smartQuery);
  await page.evaluate(() => {
    sessionStorage.setItem(
      'keyword_search_query',
      JSON.stringify({ query: 'flying' }),
    );
    sessionStorage.setItem(
      'similarity_search_card_name',
      JSON.stringify({
        card_name: 'Sol Ring',
        filters: JSON.stringify({ isMTGO: true }),
      }),
    );
  });

  await page
    .getByRole('button', { name: 'Keyword Search', exact: true })
    .click();
  await expect(page.getByPlaceholder('Search cards by keywords…')).toHaveValue(
    'flying',
  );
  await expect(page).toHaveURL('/search/all/keyword?query=flying');
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('smart_search_query')!),
    ),
  ).toEqual(Object.fromEntries(smartQuery));

  await page
    .getByRole('button', { name: 'Similarity Search', exact: true })
    .click();
  await expect(page.getByPlaceholder('Enter a card name...')).toHaveValue(
    'Sol Ring',
  );
  await expect(page).toHaveURL(/\/search\/mtgo\/similarity\?/);
  expect(JSON.parse(new URL(page.url()).searchParams.get('filters')!)).toEqual({
    isMTGO: true,
  });

  await page.getByRole('button', { name: 'Smart Search', exact: true }).click();
  await expect(
    page.getByPlaceholder('Describe the cards you want...'),
  ).toHaveValue('creatures that draw cards');
  await expect(page).toHaveURL(/\/search\/arena\/smart\?/);
  expect(JSON.parse(new URL(page.url()).searchParams.get('filters')!)).toEqual({
    isArena: true,
  });
  expect(
    await page.evaluate(() => ({
      smart: JSON.parse(sessionStorage.getItem('smart_search_query')!),
      keyword: JSON.parse(sessionStorage.getItem('keyword_search_query')!),
      similarity: JSON.parse(
        sessionStorage.getItem('similarity_search_card_name')!,
      ),
    })),
  ).toEqual({
    smart: Object.fromEntries(smartQuery),
    keyword: { query: 'flying' },
    similarity: {
      card_name: 'Sol Ring',
      filters: JSON.stringify({ isMTGO: true }),
    },
  });
});

test('home search tabs switch forms without navigating', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page
    .getByRole('button', { name: 'Similarity Search', exact: true })
    .click();
  await expect(page.getByPlaceholder('Enter a card name...')).toBeVisible();
  await expect(page).toHaveURL('/');

  await page.getByRole('button', { name: 'Smart Search', exact: true }).click();
  await expect(
    page.getByPlaceholder('Describe the cards you want...'),
  ).toBeVisible();
  await expect(page).toHaveURL('/');
});
