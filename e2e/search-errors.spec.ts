import { expect, test } from '@playwright/test';

const paginatedEmpty = (key: string) => ({
  [key]: [],
  totalCount: 0,
  totalPages: 1,
  page: 1,
  pageSize: 50,
});

const searches = [
  {
    name: 'smart',
    path: '/search/paper/smart?query=ramp',
    endpoint: '/search/colbert',
    empty: [],
    message: 'No results found',
  },
  {
    name: 'commander',
    path: '/search/paper/commander?query=tokens',
    endpoint: '/search/colbert',
    empty: [],
    message: 'No results found',
  },
  {
    name: 'keyword',
    path: '/search/paper/keyword?query=flying',
    endpoint: '/search/keyword',
    empty: [],
    message: 'No results found',
  },
  {
    name: 'similarity',
    path: '/search/paper/similarity?card_name=Sol%20Ring',
    endpoint: '/search/similarity',
    empty: [],
    message: 'No Similar Cards Found Yet',
  },
  {
    name: 'deck recommender',
    path: '/search/paper/deckbuilder?commander=Atraxa%2C%20Praetors%27%20Voice',
    endpoint: '/als/recommend',
    empty: { results: [], not_found: [] },
    message: 'No Recommendations Available Yet',
  },
  {
    name: 'popular cards',
    path: '/popular-cards/paper',
    endpoint: '/deck-stats/top-cards',
    empty: { results: [] },
    message: 'No results found',
  },
  {
    name: 'popular commanders',
    path: '/popular-commanders/paper',
    endpoint: '/deck-stats/top-commanders',
    empty: { results: [] },
    message: 'No results found',
  },
  {
    name: 'popular by commander',
    path: '/popular-by-commander/paper?commander=Atraxa%2C%20Praetors%27%20Voice',
    endpoint: '/deck-stats/popular-by-commander',
    empty: { results: [] },
    message: 'No Commander Data Yet',
  },
  {
    name: 'articles',
    path: '/explore/articles?query=ramp',
    endpoint: '/articles/search',
    empty: paginatedEmpty('articles'),
    message: 'No articles matched "ramp"',
  },
  {
    name: 'decklists',
    path: '/explore/decklists?query=ramp',
    endpoint: '/supabase/card-lists/search',
    empty: paginatedEmpty('decklists'),
    message: 'No decklists matched "ramp"',
  },
  {
    name: 'users',
    path: '/explore/users?query=ramp',
    endpoint: '/user/search',
    empty: paginatedEmpty('users'),
    message: 'No users matched "ramp"',
  },
];

// Service failures must never be reported as a successful search with no
// matches. Intercept only the searched endpoint so the error and recovery are
// deterministic, without requiring a real backend outage.
for (const [index, search] of searches.entries()) {
  test(`${search.name}: failed search can retry the same request and recover`, async ({
    page,
  }) => {
    let recovering = false;
    let finishRetry!: () => void;
    const retryGate = new Promise<void>((resolve) => {
      finishRetry = resolve;
    });
    const requests: string[] = [];

    await page.route(
      (url) => url.pathname === search.endpoint,
      async (route) => {
        const request = route.request();
        requests.push(
          `${request.method()} ${request.url()} ${request.postData() ?? ''}`,
        );
        if (recovering) {
          await retryGate;
          await route.fulfill({ status: 200, json: search.empty });
        } else {
          await route.fulfill({
            status: index % 2 ? 503 : 500,
            json: { message: 'Test service outage' },
          });
        }
      },
    );

    await page.goto(search.path);
    const errorTitle = page.getByText('Search could not be completed', {
      exact: true,
    });
    const retry = page.getByRole('button', {
      name: 'Retry search',
      exact: true,
    });
    const emptyState = page.getByText(search.message, { exact: true });
    await expect(errorTitle).toBeVisible({ timeout: 30_000 });
    await expect(retry).toBeEnabled();
    await expect(emptyState).toHaveCount(0);

    const attemptsBeforeRetry = requests.length;
    const failedRequest = requests.at(-1);
    const originalUrl = page.url();
    recovering = true;
    try {
      await retry.click();
      await expect
        .poll(() => requests.length)
        .toBeGreaterThan(attemptsBeforeRetry);
      expect(requests.at(-1)).toBe(failedRequest);
      await expect(emptyState).toHaveCount(0);
    } finally {
      finishRetry();
    }

    await expect(emptyState).toBeVisible();
    await expect(errorTitle).toHaveCount(0);
    await expect(retry).toHaveCount(0);
    expect(page.url()).toBe(originalUrl);
  });
}
