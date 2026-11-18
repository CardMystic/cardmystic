import { expect, test, type Request, type Response } from '@playwright/test';

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

async function expectSuccessfulSearch(response: Response | null) {
  expect(response, 'Search request did not receive a response').not.toBeNull();
  if (!response) return;
  expect(
    response.ok(),
    response.ok()
      ? undefined
      : `Search returned HTTP ${response.status()}: ${(await response.text()).slice(0, 500)}`,
  ).toBe(true);
}

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
  page.getByTestId('search-results-grid').first();

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

// ─── Search landing states ───────────────────────────────────────────

test.describe('Search landing pages', () => {
  test('a Smart Search suggestion starts a real search', async ({ page }) => {
    await gotoHydrated(page, '/search/all/smart');
    await page
      .getByRole('link', { name: 'Try Creatures that draw cards' })
      .click();

    await expect(page).toHaveURL(
      /query=creatures(?:\+|%20)that(?:\+|%20)draw/i,
    );
    await expect(
      page.getByRole('heading', {
        level: 2,
        name: 'The Fastest Way To Find The Right Cards',
      }),
    ).toBeHidden();
  });
});

// ─── 2. AI search ─────────────────────────────────────────────────────

test.describe('AI search', () => {
  test('typing a query hits /search/colbert and renders cards', async ({
    page,
  }) => {
    await gotoHydrated(page, '/search/all/smart');

    const input = page.getByPlaceholder('Describe the cards you want...');
    await expect(input).toBeVisible();

    await reliableFill(input, 'best card draw spells');

    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await input.press('Enter');

    const response = await colbertCall;
    await expectSuccessfulSearch(response);

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
    await expectSuccessfulSearch(response);

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
      platform: 'modern',
      expectFilters: (f) => {
        const formats = f.selectedCardFormats as
          Array<{ format: string; status: string }> | undefined;
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
    test(`/search/${platform}/smart forwards the ${platform} platform filter`, async ({
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
        `/search/${platform}/smart?query=${encodeURIComponent('card draw')}`,
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

    await gotoHydrated(page, '/search/all/smart/best-card-draw');

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
});
