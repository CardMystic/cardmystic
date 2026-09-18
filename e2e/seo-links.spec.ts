import { expect, test } from '@playwright/test';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';

test.beforeEach(async ({ page }) => {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(SUPABASE + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(
    /https:\/\/(?:www\.googletagmanager\.com|pagead2\.googlesyndication\.com)\//,
    (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});

test('suggestions expose curated destinations before JavaScript runs', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  try {
    for (const [mode, label, path] of [
      ['similarity', 'Lightning Bolt', '/search/all/similarity/lightning-bolt'],
      ['keyword', 'Draw a card', '/search/all/keyword/card-draw'],
      [
        'deckbuilder',
        'Kaalia of the Vast',
        '/search/all/deckbuilder/best-cards-for-kaalia-of-the-vast',
      ],
    ]) {
      await page.goto('/search/all/' + mode);
      await expect(
        page.getByRole('link', { name: 'Try ' + label, exact: true }),
      ).toHaveAttribute('href', path);
    }
    await page.goto('/search/arena/similarity');
    const href = await page
      .getByRole('link', { name: 'Try Lightning Bolt', exact: true })
      .getAttribute('href');
    const url = new URL(href!, baseURL);
    expect(url.pathname).toBe('/search/arena/similarity');
    expect(url.searchParams.get('card_name')).toBe('Lightning Bolt');
  } finally {
    await context.close();
  }
});

test('home suggestion links preserve their exact queries and More remains a button', async ({
  page,
}) => {
  await gotoHydrated(page, '/');
  const link = page.getByRole('link', { name: 'token doublers', exact: true });
  const url = new URL((await link.getAttribute('href'))!, page.url());
  expect(url.pathname).toBe('/search/all/smart');
  expect(url.searchParams.get('query')).toBe('token doublers');
  await page
    .getByRole('button', { name: 'Show more suggested searches' })
    .click();
  await expect(
    page.getByRole('link', { name: 'graveyard recursion', exact: true }),
  ).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/search\/all\/smart\?query=token\+doublers$/);
});

test('curated similarity introductions link the source card in server HTML', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  try {
    await page.goto('/search/all/similarity/thassas-oracle');
    await expect(
      page.getByRole('link', { name: "Thassa's Oracle", exact: true }),
    ).toHaveAttribute('href', '/card/1de1b591-a73f-4974-b507-8c63e07a0868');
    await page.goto('/search/all/similarity/fetchlands');
    await expect(
      page.getByRole('link', { name: 'Flooded Strand', exact: true }),
    ).toHaveAttribute('href', '/card/f3c7af78-a77d-4134-82a2-a5ce84285a84');
  } finally {
    await context.close();
  }
});

test('card actions are links to curated similarity, recommendation, and popularity pages', async ({
  page,
}) => {
  const oracleId = '8d11aa49-d4cd-48b1-aa0f-8548fa733416';
  const name = 'Kinnan, Bonder Prodigy';
  await page.route(BACKEND + '/bulkdata/commanders.min.json', (route) =>
    route.fulfill({ json: [name] }),
  );
  await page.route(BACKEND + '/cards/with-llm/' + oracleId, (route) =>
    route.fulfill({
      json: {
        card: {
          id: '10000000-0000-4000-8000-000000000001',
          oracle_id: oracleId,
          name,
          layout: 'normal',
          rarity: 'mythic',
          type_line: 'Legendary Creature — Human Druid',
          oracle_text: 'Add mana.',
          mana_cost: '{G}{U}',
          cmc: 2,
          colors: ['G', 'U'],
          color_identity: ['G', 'U'],
          image_uris: { normal: '/kaalia.webp', art_crop: '/kaalia.webp' },
          legalities: { commander: 'legal' },
          prices: { usd: '1.00' },
          set: 'test',
          set_name: 'Test',
          games: ['paper'],
        },
        llm: null,
      },
    }),
  );
  await gotoHydrated(page, '/about');
  await page.evaluate((path) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(path);
  }, '/card/' + oracleId);
  const similar = page
    .getByRole('link', { name: 'Cards similar to ' + name, exact: true })
    .first();
  await expect(similar).toHaveAttribute(
    'href',
    '/search/all/similarity/kinnan-bonder-prodigy',
  );
  await expect(
    page
      .getByRole('link', { name: 'Recommended cards for ' + name, exact: true })
      .first(),
  ).toHaveAttribute(
    'href',
    '/search/all/deckbuilder/best-cards-for-kinnan-bonder-prodigy',
  );
  await expect(
    page
      .getByRole('link', { name: 'Popular cards for ' + name, exact: true })
      .first(),
  ).toHaveAttribute(
    'href',
    '/popular-by-commander/all/most-played-cards-for-kinnan-bonder-prodigy',
  );
  await similar.click();
  await expect(page).toHaveURL(
    /\/search\/all\/similarity\/kinnan-bonder-prodigy$/,
  );
});
