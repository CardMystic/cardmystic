import { expect, test } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { openDeckAction } from './utils/deckActions';
import { BACKEND } from './utils/mocks';

test('All Set stays dismissed across visits until a later release, with manual reopening', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true, extraCards: 1 });
  let releasedAt = '2026-10-01';
  let acknowledgedAt: string | null = null;
  let recommendationRequests = 0;
  let acknowledgements = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/new-cards`,
    (route) =>
      route.fulfill({
        json: {
          set: { slug: 'new', name: 'New expansion', releasedAt },
          acknowledgedAt,
          shouldSuggest:
            acknowledgedAt === null ||
            Date.parse(releasedAt) > Date.parse(acknowledgedAt),
        },
      }),
  );
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/new-cards/acknowledge`,
    (route) => {
      expect(route.request().method()).toBe('PUT');
      expect(route.request().postDataJSON()).toEqual({});
      acknowledgements++;
      acknowledgedAt = '2026-10-10T15:00:00Z';
      return route.fulfill({ json: { acknowledgedAt } });
    },
  );
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/suggestions`,
    (route) => {
      recommendationRequests++;
      return route.fulfill({
        json: {
          set: { name: 'New expansion' },
          results: [
            {
              card_name: state.catalog[3].name,
              card_data: state.catalog[3],
              ai_rerank_score: 0.92,
            },
          ],
        },
      });
    },
  );
  await page.reload();
  const panel = page.getByRole('region', {
    name: 'New Cards for Deck',
    exact: true,
  });
  await expect(panel).toBeVisible();
  expect(recommendationRequests).toBe(1);
  const panelBottom = await panel.evaluate(
    (element) => element.getBoundingClientRect().bottom,
  );
  const firstDeckCard = page.locator('.list-card').first();
  expect(
    await firstDeckCard.evaluate(
      (element) => element.getBoundingClientRect().top,
    ),
  ).toBeGreaterThanOrEqual(panelBottom);
  await panel.getByRole('button', { name: 'All Set', exact: true }).click();
  await expect(panel).toHaveCount(0);
  expect(acknowledgements).toBe(1);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'More deck actions' }),
  ).toBeVisible();
  await expect(panel).toHaveCount(0);
  expect(recommendationRequests).toBe(1);
  await openDeckAction(page, 'Suggest New Cards · Pro');
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(1);
  expect(recommendationRequests).toBe(2);
  await panel
    .getByRole('button', { name: 'Close new-card suggestions' })
    .click();
  releasedAt = '2026-11-01';
  await page.reload();
  await expect(panel).toBeVisible();
  expect(recommendationRequests).toBe(3);
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page.screenshot({ path: '/tmp/cardmystic-new-cards-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.getByRole('button', { name: 'All Set' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({ path: '/tmp/cardmystic-new-cards-mobile.png' });
});

for (const outcome of ['no matches', 'ranking unavailable'] as const) {
  test(`automatic alerts stay hidden for ${outcome}; manual action explains the result`, async ({
    page,
  }) => {
    await setupDeckDisplay(page, { pro: true });
    await page.route(BACKEND + '/library/lists/*/new-cards', (route) =>
      route.fulfill({
        json: {
          set: { slug: 'new', name: 'New expansion', releasedAt: '2026-11-01' },
          acknowledgedAt: null,
          shouldSuggest: true,
        },
      }),
    );
    let requests = 0;
    await page.route(BACKEND + '/library/lists/*/suggestions', (route) => {
      requests++;
      return outcome === 'no matches'
        ? route.fulfill({
            json: { results: [], set: { name: 'New expansion' } },
          })
        : route.fulfill({
            status: 503,
            json: {
              message: 'Relevance checks are unavailable. Please retry.',
            },
          });
    });
    await page.reload();
    await expect.poll(() => requests).toBe(1);
    const panel = page.getByRole('region', {
      name: 'New Cards for Deck',
      exact: true,
    });
    await expect(panel).toBeHidden();
    await openDeckAction(page, 'Suggest New Cards · Pro');
    await expect(panel).toBeVisible();
    await expect(
      panel.getByText(
        outcome === 'no matches'
          ? 'No more suggestions right now.'
          : 'Relevance checks are unavailable. Please retry.',
        { exact: true },
      ),
    ).toBeVisible();
  });
}

test('failed All Set keeps the panel open and allows retry', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true, extraCards: 1 });
  await page.route(BACKEND + '/library/lists/*/suggestions', (route) =>
    route.fulfill({
      json: {
        results: [
          { card_name: state.catalog[3].name, card_data: state.catalog[3] },
        ],
      },
    }),
  );
  let attempts = 0;
  await page.route(
    BACKEND + '/library/lists/*/new-cards/acknowledge',
    (route) => {
      attempts++;
      return attempts === 1
        ? route.fulfill({
            status: 503,
            json: { message: 'Could not save dismissal.' },
          })
        : route.fulfill({ json: { acknowledgedAt: '2026-11-09T12:00:00Z' } });
    },
  );
  await openDeckAction(page, 'Suggest New Cards · Pro');
  const panel = page.getByRole('region', {
    name: 'New Cards for Deck',
    exact: true,
  });
  await panel.getByRole('button', { name: 'All Set' }).click();
  await expect(panel.getByRole('alert')).toHaveText(
    'Could not save dismissal.',
  );
  await expect(panel).toBeVisible();
  await panel.getByRole('button', { name: 'All Set' }).click();
  await expect(panel).toHaveCount(0);
  expect(attempts).toBe(2);
});

test('Suggest Adds opens above the deck and closes without leaving a bottom panel', async ({
  page,
}) => {
  await setupDeckDisplay(page, { pro: true });
  const panel = page.getByRole('region', {
    name: 'Suggested cards',
    exact: true,
  });
  await expect(panel).toHaveCount(0);
  await openDeckAction(page, 'Suggest Adds · Pro');
  await expect(panel).toBeVisible();
  expect(await page.locator('#deck-suggestions').count()).toBe(1);
  const top = await panel.evaluate(
    (element) => element.getBoundingClientRect().bottom,
  );
  expect(
    await page
      .locator('.list-card')
      .first()
      .evaluate((element) => element.getBoundingClientRect().top),
  ).toBeGreaterThanOrEqual(top);
  await panel.getByRole('button', { name: 'Close suggested adds' }).click();
  await expect(panel).toHaveCount(0);
});
