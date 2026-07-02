import { expect, test, type Page } from '@playwright/test';

import { BACKEND, gotoHydrated, reliableFill } from './utils/mocks';

/**
 * Phase 8 E2E coverage — feedback, trending clickthrough, mobile
 * smoke, and 404 handling.
 *
 * Tests:
 *   33. Card feedback (dislike) — POST `/metrics/dislike` is mocked
 *       (we don't have a way to remove a dislike yet, so don't pollute
 *       prod metrics).
 *   34. Trending queries clickthrough — homepage `/cache/top` Try
 *       button → AI search.
 *   35. Mobile viewport — Pixel 5 subset of homepage + AI search to
 *       guard `useIsMobile` / Navbar regressions.
 *   36. 404 — `/card/<bad-id>` shows the "Card Not Found" UI.
 */

const SEARCH_TIMEOUT = 45_000;

const waitForSearchCall = (page: Page, endpoint: string) =>
  page.waitForResponse(
    (resp) => {
      const url = resp.url();
      return (
        url.startsWith(BACKEND) &&
        url.includes(endpoint) &&
        resp.request().method() === 'POST'
      );
    },
    { timeout: SEARCH_TIMEOUT },
  );

const resultsGrid = (page: Page) =>
  page
    .locator(
      'div.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.xl\\:grid-cols-6',
    )
    .first();

// ─── 33. Dislike feedback (mocked) ────────────────────────────────────

test.describe('Card feedback', () => {
  test('clicking "Mark As Poor Result" → confirm fires POST /metrics/dislike', async ({
    page,
  }) => {
    // Mock the dislike endpoint so we don't pollute backend metrics.
    let dislikePayload: unknown = null;
    let dislikeCalls = 0;
    await page.route(/\/metrics\/dislike$/, async (route) => {
      dislikeCalls += 1;
      try {
        dislikePayload = route.request().postDataJSON();
      } catch {
        dislikePayload = route.request().postData();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    });

    await gotoHydrated(page, '/search/all/smart');
    const input = page.getByPlaceholder('Describe the cards you want...');
    await reliableFill(input, 'best card draw spells');

    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await input.press('Enter');
    expect((await colbertCall).ok()).toBeTruthy();

    const grid = resultsGrid(page);
    await expect(grid).toBeVisible({ timeout: SEARCH_TIMEOUT });

    // Use the side preview rail's "Mark As Poor Result" button. It
    // appears once the user hovers a card; the rail is portaled into
    // a fixed-position aside, so the button is always visible without
    // hover-opacity tricks.
    const firstCard = grid.locator('.card-image-wrapper').first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.hover();
    const dislikeBtn = page
      .getByRole('button', { name: /^mark as poor result$/i })
      .first();
    await expect(dislikeBtn).toBeVisible({ timeout: 10_000 });
    await dislikeBtn.click();

    // Confirmation modal — accept. The modal is portaled to the body,
    // so query at the page scope. Two cards (Card.vue and
    // HoveredSearchResultPreview.vue) both define a confirm modal with
    // the same button text — but only one is open, so just click the
    // first visible match.
    const confirmBtn = page
      .getByRole('button', {
        name: /yes, this is a poor result/i,
      })
      .first();
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();

    await expect.poll(() => dislikeCalls, { timeout: 10_000 }).toBe(1);
    expect(dislikePayload).toMatchObject({
      query: expect.stringContaining('card draw'),
      cardName: expect.any(String),
    });

    // Button flips to the "Feedback Submitted" disabled state.
    await expect(
      page.getByRole('button', { name: /feedback submitted/i }).first(),
    ).toBeVisible();
  });
});

// ─── 34. Trending queries clickthrough ────────────────────────────────

test.describe('Trending queries', () => {
  test('clicking a Try button on the homepage runs an AI search', async ({
    page,
  }) => {
    await gotoHydrated(page, '/');

    // The TopQueries panel ("Top Searches This Week") and the
    // ExampleQueries panel both render a Try button. The TopQueries
    // ones have `.try-btn`; ExampleQueries does not. Use that to
    // disambiguate. The panel is wrapped in ClientOnly + LazyTopQueries,
    // so it lives below the fold and renders after hydration — scroll
    // it into view to ensure the lazy chunk loads.
    const tryBtn = page.locator('button.try-btn').first();
    await tryBtn.scrollIntoViewIfNeeded({ timeout: 20_000 });
    await expect(tryBtn).toBeVisible({ timeout: 15_000 });

    // Pull the query straight out of the rendered card so we can
    // assert it round-trips through the URL.
    const queryRow = tryBtn.locator(
      'xpath=ancestor::*[self::tr or self::li or self::div][1]',
    );
    const expectedQuery = (await queryRow.innerText()).split('\n')[0].trim();
    expect(expectedQuery.length).toBeGreaterThan(0);

    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await tryBtn.click();

    await expect
      .poll(() => page.url(), { timeout: 15_000 })
      .toContain('/search/all/smart');
    const url = new URL(page.url());
    expect(url.searchParams.get('isTryTopQuery')).toBe('true');
    expect(url.searchParams.get('query')).toBeTruthy();

    expect((await colbertCall).ok()).toBeTruthy();
    await expect(resultsGrid(page)).toBeVisible({ timeout: SEARCH_TIMEOUT });
  });

  test('clicking the ExampleQueries TRY button navigates to AI search', async ({
    page,
  }) => {
    await gotoHydrated(page, '/');

    // ExampleQueries is the "Try An Example Query" panel. Its TRY
    // button does NOT have the `.try-btn` class. Scope by the panel's
    // heading text. Regression guard: previously called
    // `router.push({ name: 'search' })` against a route name that
    // doesn't exist, throwing an unhandled rejection and silently
    // doing nothing on click.
    const panel = page
      .locator('div', { hasText: /try an example query/i })
      .first();
    const tryBtn = panel.getByRole('button', { name: /^try$/i }).first();
    await tryBtn.scrollIntoViewIfNeeded({ timeout: 20_000 });
    await expect(tryBtn).toBeVisible({ timeout: 15_000 });

    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await tryBtn.click();

    await expect
      .poll(() => page.url(), { timeout: 15_000 })
      .toContain('/search/all/smart');
    const url = new URL(page.url());
    expect(url.searchParams.get('query')).toBeTruthy();
    expect((await colbertCall).ok()).toBeTruthy();
  });
});

// ─── 35. Mobile viewport (Pixel 5) ────────────────────────────────────

test.describe('Mobile (Pixel 5)', () => {
  test.use({
    viewport: { width: 393, height: 851 },
    userAgent:
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
    deviceScaleFactor: 2.75,
    hasTouch: true,
    isMobile: true,
  });

  test('homepage hero + search input render on mobile', async ({ page }) => {
    await gotoHydrated(page, '/');
    // Hero search input is the same component on mobile + desktop.
    await expect(
      page.getByPlaceholder('Describe the cards you want...').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('AI search runs on mobile and renders the results grid', async ({
    page,
  }) => {
    await gotoHydrated(page, '/search/all/smart');
    const input = page.getByPlaceholder('Describe the cards you want...');
    await reliableFill(input, 'best card draw spells');

    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await input.press('Enter');
    expect((await colbertCall).ok()).toBeTruthy();

    await expect(resultsGrid(page)).toBeVisible({ timeout: SEARCH_TIMEOUT });
  });
});

// ─── 36. 404 / error pages ────────────────────────────────────────────

test.describe('Error pages', () => {
  test('/card/<nonexistent-id> shows the Card Not Found UI', async ({
    page,
  }) => {
    // Backend validates the ID format strictly: anything not a
    // 36-char UUID returns 400 (→ "Invalid Request"), not 404. Use a
    // valid-format UUID that doesn't exist so we hit the 404 branch.
    await gotoHydrated(page, '/card/00000000-0000-0000-0000-000000000000');

    await expect(
      page.getByRole('heading', { name: /card not found/i }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('link', { name: /back to search/i }),
    ).toBeVisible();
  });
});
