import { expect, test } from '@playwright/test';

import { BACKEND, gotoHydrated } from './utils/mocks';

const SEARCH_TIMEOUT = 45_000;

/**
 * A top commander with data in the popular-by-commander endpoint.
 * Chosen from /deck-stats/top-commanders response.
 */
const TEST_COMMANDER = 'Kaalia of the Vast';

// ─── Popular Cards ───────────────────────────────────────────────────

test.describe('Popular Cards', () => {
  test('slug page renders SEO content and runs its canned ranking query', async ({
    page,
  }) => {
    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().startsWith(`${BACKEND}/deck-stats/top-cards`) &&
        request.method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(page, '/popular-cards/all/card-draw');

    await expect(
      page.getByRole('heading', {
        name: 'Most Popular MTG Card Draw Spells',
      }),
    ).toBeVisible();

    const request = await requestPromise;
    expect(request.postDataJSON().query).toMatch(/card draw/i);
  });

  test('loads and renders the top-cards list', async ({ page }) => {
    const topCardsCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/deck-stats/top-cards`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(page, '/popular-cards/all');

    const response = await topCardsCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const results = Array.isArray(body?.results) ? body.results : [];
    expect(results.length).toBeGreaterThan(0);

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
      .toBeGreaterThan(2);
  });

  test('platform switch: toggling Arena filter navigates to /popular-cards/arena and re-fetches', async ({
    page,
  }) => {
    // Wait for the initial all-platform fetch.
    const initialCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/deck-stats/top-cards`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );
    await gotoHydrated(page, '/popular-cards/all');
    await initialCall;

    // Set up listener for the re-fetch that will fire after form submit.
    const arenaCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/deck-stats/top-cards`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    // Toggle the "Arena" quick-filter and submit the form.
    // QuickFilters renders a button labelled "Arena" that sets isArena: true,
    // and detectPlatformFromFilters then routes to /popular-cards/arena.
    await page.getByRole('button', { name: /^Arena$/ }).click();
    await page
      .locator('button[type="submit"]')
      .filter({ hasText: 'Search' })
      .click();

    // URL must change to the arena-specific route.
    await page.waitForURL('**/popular-cards/arena**', {
      timeout: SEARCH_TIMEOUT,
    });

    // The re-fetch must succeed and still return results.
    const arenaResponse = await arenaCall;
    expect(arenaResponse.ok()).toBeTruthy();

    const body = await arenaResponse.json();
    const results = Array.isArray(body?.results) ? body.results : [];
    expect(results.length).toBeGreaterThan(0);
  });
});

// ─── Popular Commanders ──────────────────────────────────────────────

test.describe('Popular Commanders', () => {
  test('slug page renders SEO content and runs its canned archetype query', async ({
    page,
  }) => {
    const requestPromise = page.waitForRequest(
      (request) =>
        request.url().startsWith(`${BACKEND}/deck-stats/top-commanders`) &&
        request.method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(page, '/popular-commanders/all/graveyard-recursion');

    await expect(
      page.getByRole('heading', {
        name: 'Most Popular Graveyard Recursion Commanders',
      }),
    ).toBeVisible();

    const request = await requestPromise;
    expect(request.postDataJSON().query).toMatch(/graveyard recursion/i);
  });

  test('loads and renders the top-commanders list', async ({ page }) => {
    const topCommandersCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/deck-stats/top-commanders`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(page, '/popular-commanders/all');

    const response = await topCommandersCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const results = Array.isArray(body?.results) ? body.results : [];
    expect(results.length).toBeGreaterThan(0);

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

// ─── Popular by Commander ────────────────────────────────────────────

test.describe('Popular by Commander', () => {
  test('slug page renders SEO content and fetches its canned commander', async ({
    page,
  }) => {
    const requestPromise = page.waitForRequest(
      (request) =>
        request
          .url()
          .startsWith(`${BACKEND}/deck-stats/popular-by-commander`) &&
        request.method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(
      page,
      '/popular-by-commander/all/most-played-cards-for-kaalia-of-the-vast',
    );

    await expect(
      page.getByRole('heading', {
        name: 'Most Played Cards for Kaalia of the Vast',
      }),
    ).toBeVisible();

    const request = await requestPromise;
    expect(request.postDataJSON()).toMatchObject({
      commanders: [TEST_COMMANDER],
    });
  });

  test('URL-driven commander query fetches and renders popular cards', async ({
    page,
  }) => {
    const popularCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/deck-stats/popular-by-commander`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(
      page,
      `/popular-by-commander/all?commander=${encodeURIComponent(TEST_COMMANDER)}`,
    );

    const response = await popularCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const results = Array.isArray(body)
      ? body
      : Array.isArray(body?.results)
        ? body.results
        : [];
    expect(results.length).toBeGreaterThan(0);

    // The page fetches and renders the commander's card via /cards/cards-by-names.
    // The Card component uses the card name as the img alt text.
    await expect(
      page.locator(`img[alt="${TEST_COMMANDER}"]`).first(),
    ).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });

    // Popular cards grid should populate.
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
