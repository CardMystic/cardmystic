import { test, expect } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, SUPABASE } from './utils/mocks';
import type { DeckAnalytics } from '../utils/deckAnalytics';

test('free users get charts and analytics only after opening Deck Stats', async ({
  page,
}) => {
  await setupDeckDisplay(page);
  let requests = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/analytics`,
    (route) => {
      requests++;
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
  expect(requests).toBe(0);
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page
    .locator('.sticky-footer-wrap')
    .getByRole('button', { name: 'Deck Stats', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Draw odds', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Subscribe for more analytics' }),
  ).toHaveCount(0);
  expect(requests).toBe(1);
});

test('Deck analytics show useful draw odds and incomplete prices on mobile, with retry after a failed load', async ({
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
    ],
    roles: [{ name: 'Removal', count: 10 }],
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
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page.screenshot({ path: '/tmp/cardmystic-new-footer-mobile.png' });
  await page
    .getByRole('button', { name: 'Deck sections', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Deck Stats', exact: true }).click();
  const modal = page.getByTestId('deck-stats');
  await expect(modal.getByRole('alert')).toContainText(
    'Analytics temporarily unavailable.',
  );
  await modal.getByRole('button', { name: 'Retry analytics' }).click();
  await expect(modal.getByText('99', { exact: true })).toBeVisible();
  await expect(
    modal.getByText(
      /Chance to see at least 4 lands by turn 4 \(10 cards seen\)/,
    ),
  ).toBeVisible();
  const before = await modal.getByTestId('land-draw-chance').innerText();
  await expect(modal.getByTestId('average-opening-lands')).toHaveText('2.62');
  await modal
    .getByRole('switch', { name: 'Draw on turn one', exact: true })
    .check();
  await expect(
    modal.getByText(
      /Chance to see at least 4 lands by turn 4 \(11 cards seen\)/,
    ),
  ).toBeVisible();
  await expect(modal.getByTestId('land-draw-chance')).not.toHaveText(before);
  const withoutModalLands = await modal
    .getByTestId('land-draw-chance')
    .innerText();
  await modal.getByRole('checkbox', { name: 'Count MDFCs as lands' }).check();
  await expect(modal.getByTestId('land-draw-chance')).not.toHaveText(
    withoutModalLands,
  );
  await expect(modal.getByTestId('average-opening-lands')).toHaveText('2.90');
  await modal.getByRole('button', { name: 'What are MDFCs?' }).hover();
  await expect(
    page
      .getByText(
        'Modal double-faced cards let you play either side. This count includes spells with a land on the back.',
        { exact: true },
      )
      .first(),
  ).toBeVisible();
  await modal.getByRole('heading', { name: 'Draw odds', exact: true }).hover();
  await modal.getByRole('combobox', { name: 'Analytics draw target' }).click();
  await page
    .getByRole('option', { name: 'Role: Removal', exact: true })
    .click();
  await expect(
    modal.getByText(/10 matching copies in your library/),
  ).toBeVisible();
  await expect(modal.getByText('$82.34', { exact: true })).toBeVisible();
  await expect(
    modal.getByText(/3 card copies have no USD price and are excluded/),
  ).toBeVisible();
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
    .getByRole('heading', { name: 'Draw odds', exact: true })
    .scrollIntoViewIfNeeded();
  await modal.screenshot({
    path: '/tmp/cardmystic-deck-analytics-desktop.png',
  });
});

test('suggestions wait for scrolling and stats wait for opening; cuts fill the price list', async ({
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
  await page.waitForTimeout(400); // IntersectionObserver has settled; no offscreen API work.
  expect(requested).toEqual([]);
  expect(analyticsRequests).toBe(0);
  await page
    .getByRole('region', { name: 'Suggested cards', exact: true })
    .scrollIntoViewIfNeeded();
  await expect.poll(() => requested.includes(false)).toBe(true);
  await page
    .getByRole('region', { name: 'New Cards for Deck', exact: true })
    .scrollIntoViewIfNeeded();
  await expect.poll(() => requested.includes(true)).toBe(true);
  expect(analyticsRequests).toBe(0);
  await page.getByTestId('deck-stats').locator('summary').click();
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
