import { expect, test, type Request } from '@playwright/test';

import { BACKEND, gotoHydrated, reliableFill } from './utils/mocks';

/**
 * Phase 2 E2E coverage — read-only public flows.
 *
 * These tests drive the live frontend against the real backend
 * (`api.next.cardmystic.com` on `dev`, `api.cardmystic.com` on `main`)
 * and the real ColBERT / similarity / keyword / ALS model endpoints.
 *
 * No auth, no mutations: every request is a plain GET / POST that the
 * backend serves anonymously, so it's safe to run on every PR without
 * polluting user data.
 *
 * If the model server is cold the first ColBERT call can take >10s, so
 * the per-search waits use generous timeouts.
 */

const SEARCH_TIMEOUT = 45_000;

/**
 * Wait for a specific backend search call to fire and return its body.
 * Filters out unrelated traffic (bulkdata, recaptcha, metrics, etc.).
 */
const waitForSearchCall = (
  page: import('@playwright/test').Page,
  endpoint: string,
) =>
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

/** Locator for the rendered search-result card grid. */
const resultsGrid = (page: import('@playwright/test').Page) =>
  page
    .locator(
      'div.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.xl\\:grid-cols-6',
    )
    .first();

/** Count rendered card images inside the results grid. */
const expectResultsRendered = async (page: import('@playwright/test').Page) => {
  const grid = resultsGrid(page);
  await expect(grid).toBeVisible({ timeout: SEARCH_TIMEOUT });
  // At least a couple of cards should hydrate. We don't assert an exact
  // count because the backend's result size varies per query.
  await expect
    .poll(async () => grid.locator('img[alt]').count(), {
      timeout: SEARCH_TIMEOUT,
    })
    .toBeGreaterThan(2);
};

// ─── 1. Homepage smoke ────────────────────────────────────────────────

test.describe('Homepage', () => {
  test('hero renders and example + trending queries fetch from backend', async ({
    page,
  }) => {
    const examplePromise = page.waitForResponse(
      (r) => r.url() === `${BACKEND}/search/example`,
      { timeout: SEARCH_TIMEOUT },
    );
    const topPromise = page.waitForResponse(
      (r) => r.url().startsWith(`${BACKEND}/cache/top`),
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(page, '/');

    // Hero
    await expect(page.getByAltText('Wizard')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /CardMystic Is An A\.I\. Search Engine For MTG/i,
      }),
    ).toBeVisible();

    // Both calls should succeed against the live backend.
    const [exampleResp, topResp] = await Promise.all([
      examplePromise,
      topPromise,
    ]);
    expect(exampleResp.ok()).toBeTruthy();
    expect(topResp.ok()).toBeTruthy();

    // The lazy-mounted sections render once data resolves.
    await expect(page.getByText('Try An Example Query:')).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });
    await expect(page.getByText('Top Searches This Week')).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });
  });
});

// ─── 2. AI search ─────────────────────────────────────────────────────

test.describe('AI search', () => {
  test('typing a query hits /search/colbert and renders cards', async ({
    page,
  }) => {
    await gotoHydrated(page, '/search/all/ai');

    const input = page.getByPlaceholder('Describe the cards you want...');
    await expect(input).toBeVisible();

    await reliableFill(input, 'best card draw spells');

    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await input.press('Enter');

    const response = await colbertCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    // Backend returns { results: [...] }. We don't pin the field name
    // hard — different deploys have wrapped this differently in the
    // past — so we just look for an array of cards somewhere in the
    // payload.
    const cards = Array.isArray(body)
      ? body
      : Array.isArray(body?.results)
        ? body.results
        : Array.isArray(body?.cards)
          ? body.cards
          : [];
    expect(cards.length).toBeGreaterThan(0);
    expect(cards[0]).toHaveProperty('card_data');

    // URL persists the query so the page is shareable.
    await expect.poll(() => page.url()).toContain('query=');

    await expectResultsRendered(page);
  });
});

// ─── 3. Similarity search ─────────────────────────────────────────────

test.describe('Similarity search', () => {
  test('navigating to a card_name URL returns similar cards', async ({
    page,
  }) => {
    // The similarity input is a UInputMenu autocomplete that's painful
    // to drive reliably from Playwright (typeahead, debounced fetch,
    // option-select). Real users mostly arrive via SEO links or the
    // "Find similar" action on a card, both of which are URL-driven —
    // so we exercise that exact path: navigate with `?card_name=` and
    // assert the page fires the similarity backend call.
    const similarityCall = waitForSearchCall(page, '/search/similarity');

    await gotoHydrated(
      page,
      '/search/all/similarity?card_name=Lightning%20Bolt',
    );

    await expect(page.getByPlaceholder('Enter a card name...')).toBeVisible();

    const response = await similarityCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const cards = Array.isArray(body)
      ? body
      : Array.isArray(body?.results)
        ? body.results
        : [];
    expect(cards.length).toBeGreaterThan(0);

    await expectResultsRendered(page);
  });
});

// ─── 4. Keyword search ────────────────────────────────────────────────

test.describe('Keyword search', () => {
  test('searching by keyword returns cards', async ({ page }) => {
    await gotoHydrated(page, '/search/all/keyword');

    const input = page.getByPlaceholder('Search cards by keywords…');
    await expect(input).toBeVisible();

    await reliableFill(input, 'flying');

    const keywordCall = waitForSearchCall(page, '/search/keyword');
    await input.press('Enter');

    const response = await keywordCall;
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    const cards = Array.isArray(body)
      ? body
      : Array.isArray(body?.results)
        ? body.results
        : [];
    expect(cards.length).toBeGreaterThan(0);

    await expect.poll(() => page.url()).toContain('query=');
    await expectResultsRendered(page);
  });
});

// ─── 5. Commander search — isCommander forced ─────────────────────────

test.describe('Commander search', () => {
  test('payload forces isCommander: true', async ({ page }) => {
    await gotoHydrated(page, '/search/all/commander');

    const input = page.getByPlaceholder('Describe the commander you want...');
    await expect(input).toBeVisible();

    await reliableFill(input, 'graveyard recursion');

    // We need the underlying request, not just the response, to inspect
    // the payload.
    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().startsWith(`${BACKEND}/search/colbert`) &&
        req.method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );
    await input.press('Enter');

    const request = await requestPromise;
    const payload = request.postDataJSON() as {
      filters?: { isCommander?: boolean };
    };
    expect(payload.filters?.isCommander).toBe(true);

    const response = await request.response();
    expect(response?.ok()).toBeTruthy();

    await expectResultsRendered(page);
  });
});

// ─── 6. Platform routing ──────────────────────────────────────────────

test.describe('Platform routing', () => {
  type PlatformCase = {
    platform: 'arena' | 'mtgo' | 'modern' | 'paper';
    /** Predicate run against the outbound POST body. */
    expectFilters: (filters: Record<string, unknown>) => void;
  };

  const cases: PlatformCase[] = [
    {
      platform: 'arena',
      expectFilters: (f) => expect(f.isArena).toBe(true),
    },
    {
      platform: 'mtgo',
      expectFilters: (f) => expect(f.isMTGO).toBe(true),
    },
    {
      platform: 'paper',
      expectFilters: (f) => expect(f.isPaper).toBe(true),
    },
    {
      platform: 'modern',
      expectFilters: (f) => {
        const formats = f.selectedCardFormats as
          | Array<{ format: string; status: string }>
          | undefined;
        expect(formats).toBeDefined();
        expect(
          formats?.some(
            (entry) => entry.format === 'Modern' && entry.status === 'Legal',
          ),
        ).toBe(true);
      },
    },
  ];

  for (const { platform, expectFilters } of cases) {
    test(`/search/${platform}/ai forwards the ${platform} platform filter`, async ({
      page,
    }) => {
      // Drive the page directly via URL param. Submitting the form
      // would push its own `?filters=` (which only carries the form
      // state, not the route's platform filter), so the cleanest way
      // to verify per-platform filtering is to enter the page already
      // pointed at a query — exactly the path SEO traffic takes.
      const requestPromise = page.waitForRequest(
        (req: Request) =>
          req.url().startsWith(`${BACKEND}/search/colbert`) &&
          req.method() === 'POST',
        { timeout: SEARCH_TIMEOUT },
      );

      await gotoHydrated(
        page,
        `/search/${platform}/ai?query=${encodeURIComponent('card draw')}`,
      );

      const request = await requestPromise;
      const payload = request.postDataJSON() as {
        filters?: Record<string, unknown>;
      };
      expect(payload.filters).toBeDefined();
      expectFilters(payload.filters!);
    });
  }
});

// ─── 7. SEO slug pages ────────────────────────────────────────────────

test.describe('SEO slug pages', () => {
  test('AI slug renders SEO heading + description and runs the canned query', async ({
    page,
  }) => {
    const colbertCall = waitForSearchCall(page, '/search/colbert');

    await gotoHydrated(page, '/search/all/ai/best-card-draw');

    await expect(
      page.getByRole('heading', { name: /Best MTG Card Draw Spells/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Find the best card draw spells in Magic/i),
    ).toBeVisible();

    const response = await colbertCall;
    expect(response.ok()).toBeTruthy();

    await expectResultsRendered(page);
  });

  test('similarity slug renders SEO heading + similarity results', async ({
    page,
  }) => {
    const similarityCall = waitForSearchCall(page, '/search/similarity');

    await gotoHydrated(page, '/search/all/similarity/lightning-bolt');

    await expect(
      page.getByRole('heading', { name: /Lightning Bolt/i }).first(),
    ).toBeVisible();

    const response = await similarityCall;
    expect(response.ok()).toBeTruthy();

    await expectResultsRendered(page);
  });

  test('keyword slug renders SEO heading + keyword results', async ({
    page,
  }) => {
    const keywordCall = waitForSearchCall(page, '/search/keyword');

    await gotoHydrated(page, '/search/all/keyword/ward');

    // Title casing varies per slug; we only assert the keyword appears.
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('h1').first()).toContainText(/ward/i);

    const response = await keywordCall;
    expect(response.ok()).toBeTruthy();

    await expectResultsRendered(page);
  });
});
