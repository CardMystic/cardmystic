import { test, expect } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, SUPABASE } from './utils/mocks';
import type { DeckAnalytics } from '../utils/deckAnalytics';
import { openDeckAction } from './utils/deckActions';

test('visitors open free analytics directly from the mobile Deck Stats button', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupDeckDisplay(page, { owner: false });
  let requests = 0;
  let releaseStats!: () => void;
  const statsGate = new Promise<void>((resolve) => {
    releaseStats = resolve;
  });
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/analytics`,
    async (route) => {
      requests++;
      await statsGate;
      return route.fulfill({
        json: {
          librarySize: 3,
          lands: 1,
          modalLands: 0,
          commanders: 0,
          averageManaValue: 2,
          types: [],
          roles: [],
          prices: { knownPriceCents: 300, missingPrices: 0, topCards: [] },
        },
      });
    },
  );
  await page.reload();
  const stats = page.getByTestId('deck-stats');
  try {
    await expect(stats.getByRole('status')).toHaveText('Loading deck stats…');
    await expect(
      stats.getByRole('figure', { name: 'Mana curve' }),
    ).toBeVisible();
    expect(await stats.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
  } finally {
    releaseStats();
  }
  await expect(stats).toHaveAttribute('open', '');
  await expect(
    stats.getByRole('heading', { name: 'Opening hand' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Deck sections', exact: true }),
  ).toHaveCount(0);
  await stats.locator('summary').click();
  await expect(stats).not.toHaveAttribute('open', '');
  await page
    .locator('.sticky-footer-wrap')
    .getByRole('button', { name: 'Deck Stats', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Opening hand', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Subscribe for more analytics' }),
  ).toHaveCount(0);
  expect(requests).toBe(1);
});

test('Top Tags ranks mainboard copies and expands beyond the first four', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { cards, items } = await setupDeckDisplay(page);
  items[2].board = 'Sideboard';
  const names = [
    'Utility',
    'Staple',
    'Draw',
    'Favorite',
    'Testing',
    'Side only',
  ];
  const tags = names.map((name) => ({ id: name, name }));
  await page.route(BACKEND + '/library/tags', (route) =>
    route.fulfill({ json: { tags } }),
  );
  await page.route(BACKEND + '/library/tags/assignments', (route) =>
    route.fulfill({
      json: {
        assignments: [
          ...['Utility', 'Staple', 'Draw'].map((tag_id) => ({
            oracle_id: cards[0].oracle_id,
            tag_id,
          })),
          ...['Staple', 'Favorite', 'Testing'].map((tag_id) => ({
            oracle_id: cards[1].oracle_id,
            tag_id,
          })),
          { oracle_id: cards[2].oracle_id, tag_id: 'Side only' },
        ],
      },
    }),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const section = page.getByRole('region', { name: 'Top Tags' });
  await expect(section.locator('dt')).toHaveText([
    'Staple',
    'Draw',
    'Utility',
    'Favorite',
  ]);
  await expect(section.locator('dd')).toHaveText(['3', '2', '2', '1']);
  await section.getByRole('button', { name: 'Show all' }).click();
  await expect(section.locator('dt')).toHaveText([
    'Staple',
    'Draw',
    'Utility',
    'Favorite',
    'Testing',
  ]);
  await section.getByRole('button', { name: 'Show less' }).click();
  await expect(section.locator('dt')).toHaveCount(4);
});

for (const width of [390, 1280]) {
  test(`Jump To keeps the footer visible while choosing a group at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await setupDeckDisplay(page, { cardCount: 30, groupBy: 'type' });
    await page.getByRole('button', { name: 'Reject all', exact: true }).click();
    const footer = page.locator('.sticky-footer-wrap');
    const jump = footer.getByRole('button', {
      name: 'Jump to group',
      exact: true,
    });
    await expect(footer).toBeVisible();
    await jump.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(footer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(footer).toBeVisible();
    await jump.click();
    await page.getByRole('menuitem').first().click();
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(100);
    await expect(footer).toBeVisible();
  });
}

test('Deck analytics show opening-hand odds and incomplete prices on mobile, with retry after a failed load', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setupDeckDisplay(page, { pro: true });
  const response: DeckAnalytics = {
    librarySize: 99,
    lands: 37,
    modalLands: 4,
    commanders: 1,
    averageManaValue: 2.76,
    types: [
      { name: 'Creature', count: 20 },
      { name: 'Instant', count: 12 },
      { name: 'Land', count: 42 },
    ],
    roles: [{ name: 'Removal', count: 10 }],
    themes: [
      { name: 'Artifacts', count: 15 },
      { name: 'Reanimator', count: 2 },
    ],
    mainboardRoles: { Removal: 11, 'Board wipe': 2, Tutor: 0 },
    topThemes: [
      { name: 'Artifacts', count: 16 },
      { name: 'Card advantage', count: 12 },
      { name: 'Tokens', count: 10 },
      { name: 'Blink', count: 8 },
    ],
    prices: {
      knownPriceCents: 8234,
      missingPrices: 3,
      topCards: [
        {
          oracleId: state.cards[0].oracle_id,
          name: 'Test card',
          quantity: 2,
          unitPriceCents: 1000,
          totalCents: 2000,
        },
      ],
    },
  };
  let requests = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/analytics`,
    (route) => {
      requests++;
      return requests === 1
        ? route.fulfill({
            status: 503,
            json: { message: 'Analytics temporarily unavailable.' },
          })
        : route.fulfill({ json: response });
    },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page.screenshot({ path: '/tmp/cardmystic-new-footer-mobile.png' });
  await page.getByRole('button', { name: 'Deck Stats', exact: true }).click();
  await expect(page.locator('.sticky-footer-wrap')).toBeVisible();
  const modal = page.getByTestId('deck-stats');
  await expect(modal.getByRole('alert')).toContainText(
    'Analytics temporarily unavailable.',
  );
  await modal.getByRole('button', { name: 'Retry analytics' }).click();
  const roles = modal.getByRole('region', { name: 'Cards by Role' });
  await expect(roles.locator('dt')).toHaveText([
    'Removal',
    'Ramp',
    'Board Wipe',
    'Card Draw',
    'Game Changers',
  ]);
  await expect(roles.locator('dd')).toHaveText(['11', '0', '2', '0', '0']);
  await expect(
    roles.getByRole('link', { name: 'Game Changers' }),
  ).toHaveAttribute('href', '/roles/game-changers');
  await expect(roles.getByRole('link', { name: 'Board Wipe' })).toHaveAttribute(
    'href',
    '/roles/board-wipe',
  );
  const themes = modal.getByRole('region', { name: 'Top Themes' });
  await expect(
    themes.getByRole('link', { name: 'Top Themes' }),
  ).toHaveAttribute('href', '/themes');
  await expect(
    roles.getByRole('link', { name: 'Cards by Role' }),
  ).toHaveAttribute('href', '/roles');
  const sets = modal.getByRole('region', { name: 'Top Sets' });
  await expect(sets.getByRole('link', { name: 'Top Sets' })).toHaveAttribute(
    'href',
    '/sets',
  );
  await expect(
    sets.getByRole('link', { name: 'Test', exact: true }),
  ).toHaveAttribute('href', '/sets/test');
  await expect(themes.locator('dt a')).toHaveText([
    'Artifacts',
    'Card advantage',
    'Tokens',
    'Blink',
  ]);
  await expect(themes.locator('dd')).toHaveText(['16', '12', '10', '8']);
  await expect(
    themes.getByRole('link', { name: 'Card advantage' }),
  ).toHaveAttribute('href', '/themes/card-advantage');
  await expect(themes.getByRole('button')).toHaveCount(0);
  await expect(themes.getByRole('combobox')).toHaveCount(0);
  await expect(roles.getByRole('button', { name: /^Remove / })).toHaveCount(0);
  const rolePicker = roles.getByRole('combobox', { name: 'Add a role' });
  await rolePicker.fill('tut');
  await page.getByRole('option', { name: 'Tutor', exact: true }).click();
  await expect(roles.locator('dt').last()).toHaveText('Tutor');
  await expect(roles.locator('dd').last()).toHaveText('0');
  await expect(modal.getByText('99', { exact: true })).toBeVisible();
  await expect(modal.getByTestId('average-opening-lands')).toHaveText('2.97');
  const chance = modal.getByTestId('target-draw-chance');
  await expect(chance).toHaveText('80.5%');
  const picker = modal.getByRole('combobox', {
    name: 'Role, theme, or card type',
  });
  for (const [query, option, probability] of [
    ['remov', 'Role: Removal', '53.7%'],
    ['reanim', 'Theme: Reanimator', '13.7%'],
    ['land', 'Land', '98.2%'],
  ]) {
    await picker.fill(query);
    await page.getByRole('option', { name: option, exact: true }).click();
    await expect(chance).toHaveText(probability);
  }
  const costs = modal.getByRole('region', { name: 'Deck cost' });
  await expect(costs.getByText('$82.34 known-price subtotal')).toBeVisible();
  await expect(costs.getByText('3 copies have no USD price.')).toBeVisible();
  await expect(costs.getByRole('listitem')).toContainText('$20.00');
  await expect(costs.getByRole('listitem')).toContainText('24.3%');
  expect(requests).toBe(2); // Changing analysis controls is local and spends no searches.
  expect(state.writes).toHaveLength(0);
  expect(errors).toEqual([]);
  expect(
    await modal.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await expect(modal.getByRole('table')).toHaveCount(0);
  await expect(
    modal.getByRole('figure', { name: 'Color identity', exact: true }),
  ).toBeVisible();
  await expect(
    modal
      .getByRole('figure', { name: 'Color identity', exact: true })
      .getByRole('listitem')
      .first(),
  ).toContainText('100.0%');
  await modal.screenshot({ path: '/tmp/cardmystic-deck-analytics-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await modal
    .getByRole('heading', { name: 'Opening hand', exact: true })
    .scrollIntoViewIfNeeded();
  await modal.screenshot({
    path: '/tmp/cardmystic-deck-analytics-desktop.png',
  });
  await page.reload();
  await expect(page.getByTestId('deck-stats')).toHaveAttribute('open', '');
  await expect(roles.locator('dt')).toHaveText([
    'Removal',
    'Ramp',
    'Board Wipe',
    'Card Draw',
    'Game Changers',
    'Tutor',
  ]);
  await roles.getByRole('button', { name: 'Remove Tutor' }).click();
  await expect(roles.locator('dt')).toHaveCount(5);
  await expect(roles.getByRole('button', { name: /^Remove / })).toHaveCount(0);
});

test('stats open automatically, suggestions wait for their menu actions, and cuts fill the price list', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true, cardCount: 21 });
  const requested: boolean[] = [];
  let analyticsRequests = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/suggestions`,
    (route) => {
      requested.push(route.request().postDataJSON().newestSet);
      return route.fulfill({ json: { results: [] } });
    },
  );
  await page.route(SUPABASE + '/rest/v1/card_list_items**', (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    const id = new URL(route.request().url()).searchParams
      .get('oracle_id')
      ?.replace('eq.', '');
    state.items.splice(
      0,
      state.items.length,
      ...state.items.filter((item) => item.oracle_id !== id),
    );
    return route.fulfill({ status: 204 });
  });
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/analytics`,
    (route) => {
      analyticsRequests++;
      const topCards = state.cards
        .filter((card) =>
          state.items.some((item) => item.oracle_id === card.oracle_id),
        )
        .map((card, i) => ({
          oracleId: card.oracle_id,
          name: card.name,
          quantity: 1,
          unitPriceCents: 1000 - i,
          totalCents: 1000 - i,
        }));
      return route.fulfill({
        json: {
          librarySize: 21,
          lands: 1,
          modalLands: 0,
          commanders: 0,
          averageManaValue: 2,
          mana: [],
          types: [],
          roles: [],
          prices: {
            knownPriceCents: topCards.reduce(
              (sum, card) => sum + card.totalCents,
              0,
            ),
            missingPrices: 0,
            topCards,
          },
        },
      });
    },
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'More deck actions' }),
  ).toBeVisible();
  expect(requested).toEqual([]);
  await expect.poll(() => analyticsRequests).toBe(1);
  await openDeckAction(page, 'Suggest Adds · Pro');
  await expect.poll(() => requested.includes(false)).toBe(true);
  await openDeckAction(page, 'Suggest New Cards · Pro');
  await expect.poll(() => requested.includes(true)).toBe(true);
  expect(analyticsRequests).toBe(1);
  const stats = page.getByTestId('deck-stats');
  await expect(
    stats.getByRole('button', { name: /^Cut .* from deck$/ }),
  ).toHaveCount(5);
  await stats.getByRole('button', { name: 'Load more', exact: true }).click();
  await expect(
    stats.getByRole('button', { name: /^Cut .* from deck$/ }),
  ).toHaveCount(10);
  await stats
    .getByRole('button', {
      name: `Cut ${state.cards[0].name} from deck`,
      exact: true,
    })
    .click();
  await expect(
    stats.getByRole('button', {
      name: `Cut ${state.cards[0].name} from deck`,
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    stats.getByRole('button', {
      name: `Cut ${state.cards[10].name} from deck`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    stats.getByRole('button', { name: /^Cut .* from deck$/ }),
  ).toHaveCount(10);
});
