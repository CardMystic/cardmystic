import { expect, test } from '@playwright/test';

import { BACKEND, gotoHydrated } from './utils/mocks';

const SEARCH_TIMEOUT = 45_000;

/**
 * A top commander with data in the deck recommender endpoint.
 * Chosen from /deck-stats/top-commanders response.
 */
const TEST_COMMANDER = 'Kaalia of the Vast';

test.describe('Deck Recommender', () => {
  test('URL-driven commander request hits /als/recommend and renders cards', async ({
    page,
  }) => {
    // The deckbuilder page fires the ALS query when `?commander=` is
    // present, even before the user types anything — this is the path
    // that SEO links and "Recommend for commander" CTAs use.
    const alsCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/als/recommend`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(
      page,
      `/search/all/deckbuilder?commander=${encodeURIComponent(TEST_COMMANDER)}`,
    );

    const response = await alsCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const results = Array.isArray(body)
      ? body
      : Array.isArray(body?.results)
        ? body.results
        : [];
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('card_data');

    // Recommended cards grid should populate.
    const grid = page
      .locator(
        'div.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.xl\\:grid-cols-6',
      )
      .first();
    await expect(grid).toBeVisible({ timeout: SEARCH_TIMEOUT });
    await expect
      .poll(async () => grid.locator('img[alt]').count(), {
        timeout: SEARCH_TIMEOUT,
      })
      .toBeGreaterThan(0);
  });
});
