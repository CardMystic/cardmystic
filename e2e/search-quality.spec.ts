import { expect, test, type Page } from '@playwright/test';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';
import { createDisplayCards, displayImageUris } from './utils/deckDisplay';

async function navigate(page: Page, path: string) {
  await page.evaluate((destination) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(destination);
  }, path);
}

function result(index: number, name: string, score?: number) {
  const card = createDisplayCards(5)[index]!;
  return {
    card_name: name,
    ai_normalized_score: score,
    card_data: {
      ...card,
      name,
      card_faces: undefined,
      layout: 'normal',
      colors: ['W'],
      color_identity: ['W'],
      type_line: 'Planeswalker',
      image_uris: displayImageUris(card.id),
      prints_search_uri: 'https://api.scryfall.com/cards/search?quality-test',
    },
  };
}

async function setup(
  page: Page,
  mode: 'smart' | 'similarity',
  noMatches = false,
  zeroScores = false,
) {
  const seed = result(0, 'The Wandering Emperor');
  const cards = [
    result(1, 'Strong Match', 0.8),
    result(2, 'Close Match', 0.76),
    result(3, 'Boundary Match', mode === 'smart' ? 0.68 : 0.64),
    result(4, 'Weak Tail', 0.45),
  ];
  if (zeroScores) for (const card of cards) card.ai_normalized_score = 0;
  let requests = 0;
  const hydrationWarnings: string[] = [];
  page.on('console', (message) => {
    if (/hydration/i.test(message.text()))
      hydrationWarnings.push(message.text());
  });
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(SUPABASE + '/**', (route) => route.fulfill({ json: [] }));
  await page.route('https://cards.scryfall.io/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="488" height="680"><rect width="488" height="680" fill="#30556b"/></svg>',
    }),
  );
  await page.route('https://api.scryfall.com/**', (route) =>
    route.fulfill({ json: { data: [seed.card_data] } }),
  );
  await page.route(
    BACKEND + '/cards/with-llm/' + seed.card_data.oracle_id,
    (route) => route.fulfill({ json: { card: seed.card_data, llm: null } }),
  );
  await page.route(
    BACKEND + '/search/' + (mode === 'smart' ? 'colbert' : 'similarity'),
    (route) => {
      requests++;
      return noMatches
        ? route.fulfill({ status: 204 })
        : route.fulfill({
            json: mode === 'similarity' ? [seed, ...cards] : cards,
          });
    },
  );
  await gotoHydrated(page, '/about');
  return { seed, requests: () => requests, hydrationWarnings };
}

test('similarity Load more preserves display state and cached navigation restores the cutoff', async ({
  page,
}) => {
  const state = await setup(page, 'similarity');
  const path = '/search/all/similarity?card_name=The%20Wandering%20Emperor';
  await navigate(page, path);
  await expect(page.locator('.card-root')).toHaveCount(4);
  for (const name of ['Strong Match', 'Close Match', 'Boundary Match']) {
    await expect(
      page.locator('.card-root').getByRole('img', { name, exact: true }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole('img', { name: 'Weak Tail', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator('.card-root').first().getByRole('img'),
  ).toHaveAttribute('alt', 'The Wandering Emperor');

  await page
    .getByRole('combobox', { name: 'Search grouping', exact: true })
    .click();
  await page.getByRole('option', { name: 'Color', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Search sorting', exact: true })
    .click();
  await page.getByRole('option', { name: 'Price', exact: true }).click();
  await expect(
    page.getByRole('img', { name: 'Weak Tail', exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole('button', { name: 'White (3)', exact: true })
      .and(page.locator('[aria-expanded]')),
  ).toBeVisible();

  const group = (count: number) =>
    page
      .getByRole('button', { name: `White (${count})`, exact: true })
      .and(page.locator('[aria-expanded]'));
  await group(3).click();
  await expect(group(3)).toHaveAttribute('aria-expanded', 'false');
  const loadMore = page.getByRole('button', {
    name: 'Load more',
    exact: true,
  });
  await loadMore.click();
  await expect(group(4)).toHaveAttribute('aria-expanded', 'false');
  await expect(loadMore).toHaveCount(0);
  await expect(
    page.getByRole('combobox', { name: 'Search sorting', exact: true }),
  ).toContainText('Price');
  await expect(
    page.getByRole('combobox', { name: 'Search grouping', exact: true }),
  ).toContainText('Color');
  await group(4).click();
  await expect(
    page
      .locator('.card-root')
      .getByRole('img', { name: 'Weak Tail', exact: true }),
  ).toBeVisible();
  expect(state.requests()).toBe(1);

  await navigate(page, '/about');
  await navigate(page, path);
  await expect(page.locator('.card-root')).toHaveCount(4);
  await expect(
    page.getByRole('img', { name: 'Weak Tail', exact: true }),
  ).toHaveCount(0);
  expect(state.requests()).toBe(1);
  expect(state.hydrationWarnings).toEqual([]);
});

test('card-page similar cards reveal lower scores while still excluding the searched card', async ({
  page,
}) => {
  const state = await setup(page, 'similarity');
  await navigate(page, '/card/' + state.seed.card_data.oracle_id);
  await expect(page.locator('.card-title-text')).toHaveText(
    'The Wandering Emperor',
  );
  const related = page.locator('.similar-cards-section');
  await expect(related.locator('.card-root')).toHaveCount(3);
  await expect(
    related.getByRole('img', { name: 'Weak Tail', exact: true }),
  ).toHaveCount(0);
  await expect(
    related.getByRole('img', { name: 'The Wandering Emperor', exact: true }),
  ).toHaveCount(0);
  await related.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(related.locator('.card-root')).toHaveCount(4);
  await expect(
    related
      .locator('.card-root')
      .getByRole('img', { name: 'Weak Tail', exact: true }),
  ).toBeVisible();
  await expect(
    related.getByRole('img', { name: 'The Wandering Emperor', exact: true }),
  ).toHaveCount(0);
  await expect(
    related.getByRole('button', { name: 'Load more', exact: true }),
  ).toHaveCount(0);
  expect(state.requests()).toBe(1);
});

test('similarity search handles a bodyless no-matches response', async ({
  page,
}) => {
  await setup(page, 'similarity', true);
  await navigate(page, '/search/all/similarity?card_name=No%20Match');
  await expect(
    page.getByText('No Similar Cards Found Yet', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.card-root')).toHaveCount(0);
});

test('mobile Load more reveals the rest and a new query restores the cutoff', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setup(page, 'smart');
  await navigate(page, '/search/all/smart?query=quality');
  await expect(page.locator('.card-root')).toHaveCount(3);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.locator('.card-root')).toHaveCount(4);
  await expect(
    page.getByRole('button', { name: 'Load more', exact: true }),
  ).toHaveCount(0);
  expect(state.requests()).toBe(1);
  await navigate(page, '/search/all/smart?query=different');
  await expect(page.locator('.card-root')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'Load more', exact: true }),
  ).toBeVisible();
  expect(state.requests()).toBe(2);
});

test('Load more is reachable even when all initial scored matches are hidden', async ({
  page,
}) => {
  const state = await setup(page, 'smart', false, true);
  await navigate(page, '/search/all/smart?query=zero');
  await expect(page.locator('.card-root')).toHaveCount(0);
  await page.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(page.locator('.card-root')).toHaveCount(4);
  await expect(
    page.getByRole('button', { name: 'Load more', exact: true }),
  ).toHaveCount(0);
  expect(state.requests()).toBe(1);
});
