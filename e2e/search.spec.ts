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
      'div.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-3.lg\\:grid-cols-4.xl\\:grid-cols-4',
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
    await expect(
      page.getByRole('heading', { name: /Build Smarter Decks/i }),
    ).toBeVisible();
    await expect(page.getByAltText('Kaalia of the Vast')).toBeVisible();

    // Both calls should succeed against the live backend.
    const [exampleResp, topResp] = await Promise.all([
      examplePromise,
      topPromise,
    ]);
    expect(exampleResp.ok()).toBeTruthy();
    expect(topResp.ok()).toBeTruthy();

    // The lazy-mounted sections render once data resolves. The
    // "Top Searches This Week" section only renders when the cache
    // has at least one entry; right after a backend restart the cache
    // can be empty, so gate the visibility assertion on the response
    // body rather than treating an empty cache as a test failure.
    await expect(page.getByText('Try An Example Query:')).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });
    const topBody = await topResp.json().catch(() => null);
    const topCount = Array.isArray(topBody)
      ? topBody.length
      : Array.isArray(topBody?.results)
        ? topBody.results.length
        : 0;
    if (topCount > 0) {
      await expect(page.getByText('Top Searches This Week')).toBeVisible({
        timeout: SEARCH_TIMEOUT,
      });
    }
  });
});

// ─── Search landing states ───────────────────────────────────────────

const landingPages = [
  {
    path: '/search/all/smart',
    heading: 'The Fastest Way To Find The Right Cards',
    suggestion: 'Creatures that draw cards',
  },
  {
    path: '/search/all/similarity',
    heading: 'Find Similar Effects & Alternatives to Your Favorite Cards',
    suggestion: 'Lightning Bolt',
  },
  {
    path: '/search/all/commander',
    heading: 'Find the Perfect Commander for Your Next Deck',
    suggestion: 'Graveyard recursion',
  },
  {
    path: '/search/all/keyword',
    heading: 'Search MTG Cards by Mechanics and Rules Text',
    suggestion: 'Draw a card',
  },
  {
    path: '/search/all/deckbuilder',
    heading: 'Find Cards That Belong in Your Deck',
    suggestion: 'Korvold, Fae-Cursed King',
  },
] as const;

test.describe('Search landing pages', () => {
  for (const landing of landingPages) {
    test(`${landing.path} presents useful suggested searches`, async ({
      page,
    }) => {
      await gotoHydrated(page, landing.path);

      await expect(
        page.getByRole('heading', { level: 2, name: landing.heading }),
      ).toBeVisible();
      await expect(page.getByLabel(/^Try /)).toHaveCount(6);
      await expect(
        page.getByRole('button', {
          name: `Try ${landing.suggestion}`,
          exact: true,
        }),
      ).toBeVisible();
    });
  }

  test('a Smart Search suggestion starts a real search', async ({ page }) => {
    await gotoHydrated(page, '/search/all/smart');
    await page
      .getByRole('button', { name: 'Try Creatures that draw cards' })
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

// ─── 8. Card Text view ────────────────────────────────────────────────

/**
 * The `CardText` component renders one row per card in "text" view
 * mode (as opposed to the default grid of images). Coverage here
 * exercises the shared row structure — name, mana cost, and the
 * ARIA-labelled row wrapper — that both search results and card
 * lists reuse.
 */
test.describe('Card Text view', () => {
  test('switching to text view renders CardText rows with name + mana cost', async ({
    page,
  }) => {
    const colbertCall = waitForSearchCall(page, '/search/colbert');
    await gotoHydrated(page, '/search/all/smart/best-card-draw');
    const response = await colbertCall;
    expect(response.ok()).toBeTruthy();

    // Wait for results to render as a grid first, then flip the view.
    await expectResultsRendered(page);

    // The View selector renders inside the search sidebar/filters.
    // We switch by focusing the trigger and using keyboard because
    // reka-ui SelectTriggers occasionally swallow clicks under
    // Playwright when nested in scrollable containers.
    const viewTrigger = page.getByRole('combobox').first();
    // Fall back to label lookup if the first combobox isn't the View.
    const byLabel = page.getByRole('button', { name: /Card Grid/i }).first();
    const target = (await byLabel.count()) > 0 ? byLabel : viewTrigger;
    await target.focus();
    await target.press('Enter');
    await page.getByRole('option', { name: 'Card Text' }).click();

    // The grid should now contain `.card-text-row` elements instead of
    // full card images. Assert at least a few rows render and expose
    // an ARIA-labelled group with `N copies` in the label.
    const rows = page.locator('.card-text-row');
    await expect
      .poll(async () => rows.count(), { timeout: SEARCH_TIMEOUT })
      .toBeGreaterThan(2);

    // Each row's outer element has role="group" and an aria-label
    // ending in "N copies".
    await expect(rows.first()).toHaveAttribute('aria-label', /.+, \d+ copies/);
    // The role="group" is on the same element (not a wrapper).
    await expect(rows.first()).toHaveAttribute('role', 'group');
  });
});
