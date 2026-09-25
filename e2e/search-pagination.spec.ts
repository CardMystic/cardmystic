import { expect, test, type Locator, type Page } from '@playwright/test';
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

function result(
  card: ReturnType<typeof createDisplayCards>[number],
  name: string,
  score: number,
  color = 'W',
) {
  return {
    card_name: name,
    ai_normalized_score: score,
    card_data: {
      ...card,
      name,
      card_faces: undefined,
      layout: 'normal',
      colors: [color],
      color_identity: [color],
      type_line: 'Planeswalker',
      image_uris: displayImageUris(card.id),
      prints_search_uri:
        'https://api.scryfall.com/cards/search?pagination-test',
    },
  };
}

async function setup(
  page: Page,
  mode: 'smart' | 'similarity',
  options: { noMatches?: boolean; zeroScores?: boolean } = {},
) {
  const catalog = createDisplayCards(86);
  const seed = result(catalog[0]!, 'The Wandering Emperor', 1);
  const cards = catalog
    .slice(1)
    .map((card, index) =>
      result(
        card,
        `Match ${String(index + 1).padStart(3, '0')}`,
        options.zeroScores ? 0 : index === 0 ? 1 : 0.2,
        index % 2 === 0 ? 'U' : 'W',
      ),
    );
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
      expect(route.request().postDataJSON().limit).toBe(100);
      return options.noMatches
        ? route.fulfill({ status: 204 })
        : route.fulfill({
            json: mode === 'similarity' ? [seed, ...cards] : cards,
          });
    },
  );
  await gotoHydrated(page, '/about');
  return {
    seed,
    names: cards.map((card) => card.card_name),
    requests: () => requests,
    hydrationWarnings,
  };
}

function pagination(page: Page | Locator) {
  return page
    .getByRole('navigation', { name: 'Search results pagination', exact: true })
    .first();
}

async function expectCards(scope: Page | Locator, names: string[]) {
  const cards = scope.locator('.card-root');
  await expect(cards).toHaveCount(names.length);
  await expect
    .poll(() =>
      cards
        .locator('img')
        .evaluateAll((images) =>
          images.map((image) => image.getAttribute('alt')),
        ),
    )
    .toEqual(names);
}

test('mobile pagination exposes every zero-score result and new queries start at page one', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setup(page, 'smart', { zeroScores: true });
  await navigate(page, '/search/all/smart?query=zero');
  const pages = pagination(page);
  await expectCards(page, state.names.slice(0, 40));
  await expect(
    pages.getByRole('button', { name: 'Previous Page', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Load more', exact: true }),
  ).toHaveCount(0);

  await pages.getByRole('button', { name: 'Next Page', exact: true }).click();
  await expectCards(page, state.names.slice(40, 80));
  await pages.getByRole('button', { name: 'Page 3', exact: true }).click();
  await expectCards(page, state.names.slice(80));
  await expect(
    pages.getByRole('button', { name: 'Next Page', exact: true }),
  ).toBeDisabled();
  await pages
    .getByRole('button', { name: 'Previous Page', exact: true })
    .click();
  await expectCards(page, state.names.slice(40, 80));
  expect(state.requests()).toBe(1);

  await navigate(page, '/search/all/smart?query=different');
  await expectCards(page, state.names.slice(0, 40));
  await expect(
    pages.getByRole('button', { name: 'Page 1', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  expect(state.requests()).toBe(2);
  expect(state.hydrationWarnings).toEqual([]);
});

test('grouping shows complete groups and switching back restores 40-card pages', async ({
  page,
}) => {
  const state = await setup(page, 'smart');
  await navigate(page, '/search/all/smart?query=groups&limit=200');
  const pages = pagination(page);
  await expectCards(page, state.names.slice(0, 40));
  await pages.getByRole('button', { name: 'Page 2', exact: true }).click();

  await page
    .getByRole('combobox', { name: 'Search grouping', exact: true })
    .click();
  await page.getByRole('option', { name: 'Color', exact: true }).click();
  const blue = state.names.filter((_, index) => index % 2 === 0);
  const white = state.names.filter((_, index) => index % 2 === 1);
  const group = (name: RegExp) =>
    page.getByRole('button', { name }).and(page.locator('[aria-expanded]'));
  await expectCards(page, [...blue, ...white]);
  await expect(pages).toHaveCount(0);
  await expect(group(/^Blue \(43\)/)).not.toContainText('shown');
  await expect(group(/^White \(42\)/)).not.toContainText('shown');

  await group(/^Blue \(43\)/).click();
  await expect(group(/^Blue \(43\)/)).toHaveAttribute('aria-expanded', 'false');
  await group(/^Blue \(43\)/).click();
  await expectCards(page, [...blue, ...white]);

  await page.getByTitle('Clear grouping', { exact: true }).click();
  await expectCards(page, state.names.slice(0, 40));
  await expect(
    pages.getByRole('button', { name: 'Page 1', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  expect(state.requests()).toBe(1);
  expect(state.hydrationWarnings).toEqual([]);
});

test('similarity counts the searched card on the first page and cached navigation restarts pagination', async ({
  page,
}) => {
  const state = await setup(page, 'similarity');
  const path = '/search/all/similarity?card_name=The%20Wandering%20Emperor';
  await navigate(page, path);
  const pages = pagination(page);
  await expectCards(page, [state.seed.card_name, ...state.names.slice(0, 39)]);
  await pages.getByRole('button', { name: 'Next Page', exact: true }).click();
  await expectCards(page, state.names.slice(39, 79));
  await expect(
    page.locator('.card-root').getByRole('img', {
      name: state.seed.card_name,
      exact: true,
    }),
  ).toHaveCount(0);
  await pages.getByRole('button', { name: 'Page 3', exact: true }).click();
  await expectCards(page, state.names.slice(79));
  expect(state.requests()).toBe(1);

  await navigate(page, '/about');
  await navigate(page, path);
  await expectCards(page, [state.seed.card_name, ...state.names.slice(0, 39)]);

  await page
    .getByRole('combobox', { name: 'Search grouping', exact: true })
    .click();
  await page.getByRole('option', { name: 'Color', exact: true }).click();
  const blue = state.names.filter((_, index) => index % 2 === 0);
  const white = state.names.filter((_, index) => index % 2 === 1);
  const allNames = [state.seed.card_name, ...blue, ...white];
  await expectCards(page, allNames);
  await expect(pages).toHaveCount(0);
  await page.getByRole('combobox').filter({ hasText: 'Card Grid' }).click();
  await page.getByRole('option', { name: 'Card Text', exact: true }).click();
  const rows = page.locator('.card-text-row');
  await expect(rows).toHaveCount(allNames.length);
  await expect(rows.first()).toHaveAttribute(
    'aria-label',
    allNames[0] + ', 1 copies',
  );
  await expect(rows.last()).toHaveAttribute(
    'aria-label',
    allNames.at(-1) + ', 1 copies',
  );
  await page.getByRole('combobox').filter({ hasText: 'Card Text' }).click();
  await page.getByRole('option', { name: 'Card Grid', exact: true }).click();
  await expectCards(page, allNames);
  expect(state.requests()).toBe(1);
  expect(state.hydrationWarnings).toEqual([]);
});

test('card-page similar cards show full groups, then paginate when ungrouped', async ({
  page,
}) => {
  const state = await setup(page, 'similarity');
  await navigate(page, '/card/' + state.seed.card_data.oracle_id);
  await expect(page.locator('.card-title-text')).toHaveText(
    state.seed.card_name,
  );
  const related = page.locator('.similar-cards-section');
  const pages = pagination(related);
  await expectCards(related, state.names);
  await expect(pages).toHaveCount(0);
  await related.getByTitle('Clear grouping', { exact: true }).click();
  await expectCards(related, state.names.slice(0, 40));
  await pages.getByRole('button', { name: 'Next Page', exact: true }).click();
  await expectCards(related, state.names.slice(40, 80));
  await pages.getByRole('button', { name: 'Page 3', exact: true }).click();
  await expectCards(related, state.names.slice(80));
  expect(state.requests()).toBe(1);
  expect(state.hydrationWarnings).toEqual([]);
});

test('similarity search handles a bodyless no-matches response', async ({
  page,
}) => {
  await setup(page, 'similarity', { noMatches: true });
  await navigate(page, '/search/all/similarity?card_name=No%20Match');
  await expect(
    page.getByText('No Similar Cards Found Yet', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.card-root')).toHaveCount(0);
  await expect(pagination(page)).toHaveCount(0);
});

test('deck recommender hides the limit input and always requests 100', async ({
  page,
}) => {
  const state = await setup(page, 'smart');
  let limit: number | undefined;
  await page.route(BACKEND + '/als/recommend', (route) => {
    limit = route.request().postDataJSON().limit;
    return route.fulfill({ json: { results: [state.seed], not_found: [] } });
  });
  await navigate(
    page,
    '/search/all/deckbuilder?commander=The%20Wandering%20Emperor&limit=200',
  );
  await expectCards(page, [state.seed.card_name]);
  expect(limit).toBe(100);
  await expect(page.getByPlaceholder(/Results limit/)).toHaveCount(0);
});
