import { expect, test, type Page, type Response } from '@playwright/test';
import {
  BACKEND,
  gotoHydrated,
  reliableFill,
  mockSignedInUser,
} from './utils/mocks';

test.describe.configure({ timeout: 120_000 });

const hydrationErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  await mockSignedInUser(page);
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({
      json: {
        enabled: true,
        authenticated: true,
        tier: 'enhanced',
        enhancedRemaining: null,
        enhancedTopUpRemaining: 0,
        resetsAt: null,
      },
    }),
  );
  // These tests cover browser ranking/sort state; provider and quota behavior
  // are exercised separately by backend and research integration tests.
  await page.route(`${BACKEND}/search/colbert`, (route) => {
    const enhanced = route.request().postDataJSON().useRerank;
    const results = Array.from({ length: 100 }, (_, i) => ({
      card_name: `Fixture Card ${String(i).padStart(3, '0')}`,
      rank: i + 1,
      ai_normalized_score: 1 - i / 100,
      ...(enhanced ? { ai_rerank_score: (i + 1) / 100 } : {}),
      card_data: {
        id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        oracle_id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        name: `Fixture Card ${String(i).padStart(3, '0')}`,
        layout: 'normal',
        type_line: 'Legendary Creature',
        mana_cost: '{1}',
        cmc: 1,
        colors: [],
        color_identity: [],
        keywords: [],
        legalities: {},
        prices: {},
        rarity: 'common',
        set: 'tst',
        games: ['paper'],
        oracle_text: 'Draw a card.',
        image_uris: { normal: 'https://cards.example.test/card.svg' },
      },
    }));
    return route.fulfill({ json: enhanced ? results.reverse() : results });
  });
  await page.route('https://cards.example.test/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"/>',
    }),
  );
  const errors: string[] = [];
  hydrationErrors.set(page, errors);
  page.on('console', (message) => {
    if (/hydration.*mismatch/i.test(message.text()))
      errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    if (/hydration.*mismatch/i.test(error.message)) errors.push(error.message);
  });
});

test.afterEach(async ({ page }) => {
  expect(hydrationErrors.get(page)).toEqual([]);
});

const waitForRanking = (page: Page, useRerank: boolean) =>
  page.waitForResponse(
    (response) =>
      response.url().startsWith(`${BACKEND}/search/colbert`) &&
      response.request().method() === 'POST' &&
      response.request().postDataJSON().useRerank === useRerank,
    { timeout: 60_000 },
  );

async function cardNames(response: Response) {
  expect(response.ok(), `Search returned HTTP ${response.status()}`).toBe(true);
  const cards = (await response.json()) as Array<{
    card_data: { name: string };
  }>;
  expect(Array.isArray(cards)).toBe(true);
  expect(cards.length).toBeGreaterThan(0);
  return cards.map((card) => card.card_data.name);
}

async function expectRenderedRanking(page: Page, expected: string[]) {
  const cards = page
    .locator('.results-layout .grid')
    .last()
    .locator(':scope > div');
  const firstCards = expected.slice(0, 10);
  await expect
    .poll(
      async () => {
        const count = Math.min(await cards.count(), firstCards.length);
        return Promise.all(
          Array.from({ length: count }, (_, index) =>
            cards.nth(index).locator('img[alt]').first().getAttribute('alt'),
          ),
        );
      },
      { timeout: 60_000 },
    )
    .toEqual(firstCards);
}

test('Smart Search toggles the active ranking and keeps URL state across history and reload', async ({
  page,
}) => {
  const query = 'best draw cards';
  const filters = { isPaper: true };
  const params = new URLSearchParams({
    query,
    limit: '20',
    filters: JSON.stringify(filters),
  });
  const initialResponse = waitForRanking(page, true);
  await gotoHydrated(page, `/search/paper/smart?${params}`);
  const onResponse = await initialResponse;
  const onNames = await cardNames(onResponse);
  const onPayload = onResponse.request().postDataJSON();
  expect(onPayload).toMatchObject({
    query,
    limit: 100,
    useRerank: true,
    filters,
  });
  await expectRenderedRanking(page, onNames);

  const toggle = page.getByRole('combobox', {
    name: 'Search mode',
    exact: true,
  });
  await expect(toggle).toContainText('Enhanced');
  await expect(
    page.getByText('Unlimited | Memberships', { exact: true }),
  ).toBeVisible();

  const offResponsePromise = waitForRanking(page, false);
  await toggleSearchMode(page);
  const offResponse = await offResponsePromise;
  expect(offResponse.request().postDataJSON()).toEqual({
    ...onPayload,
    useRerank: false,
  });
  const offNames = await cardNames(offResponse);
  await expectRenderedRanking(page, offNames);
  await expect(toggle).toContainText('Normal');
  const offUrl = new URL(page.url());
  expect(offUrl.pathname).toBe('/search/paper/smart');
  expect(offUrl.searchParams.get('query')).toBe(query);
  expect(offUrl.searchParams.get('limit')).toBe('20');
  expect(JSON.parse(offUrl.searchParams.get('filters')!)).toEqual(filters);
  expect(offUrl.searchParams.get('useRerank')).toBe('false');

  await page.goBack();
  await expect(toggle).toContainText('Enhanced');
  await expectRenderedRanking(page, onNames);
  await page.goForward();
  await expect(toggle).toContainText('Normal');
  await expectRenderedRanking(page, offNames);
  // Reload clears the client cache. Check each fresh response: uncached Jev
  // requests can legitimately return a different ranking for the same query.
  const reloadedOffResponsePromise = waitForRanking(page, false);
  await page.reload();
  const reloadedOffResponse = await reloadedOffResponsePromise;
  expect(reloadedOffResponse.request().postDataJSON()).toEqual({
    ...onPayload,
    useRerank: false,
  });
  await expect(toggle).toContainText('Normal');
  await expectRenderedRanking(page, await cardNames(reloadedOffResponse));

  const freshOnResponsePromise = waitForRanking(page, true);
  await toggleSearchMode(page);
  const freshOnResponse = await freshOnResponsePromise;
  expect(freshOnResponse.request().postDataJSON()).toEqual(onPayload);
  await expect(page).toHaveURL(/useRerank=true/);
  await expect(toggle).toContainText('Enhanced');
  await expectRenderedRanking(page, await cardNames(freshOnResponse));
});

test('turning reranking off before searching carries through subsequent Smart Search submissions', async ({
  page,
}) => {
  await gotoHydrated(page, '/search/all/smart');
  const toggle = page.getByRole('combobox', {
    name: 'Search mode',
    exact: true,
  });
  await expect(toggle).toContainText('Enhanced');
  await toggleSearchMode(page);
  await expect(toggle).toContainText('Normal');

  const input = page.getByPlaceholder('Describe the cards you want...');
  for (const query of [
    'best mono white exile removal spells',
    'best blue cantrips',
  ]) {
    await reliableFill(input, query);
    const responsePromise = waitForRanking(page, false);
    await input.press('Enter');
    const response = await responsePromise;
    expect(response.request().postDataJSON()).toMatchObject({
      query,
      useRerank: false,
    });
    expect(response.request().postDataJSON()).toHaveProperty('limit', 100);
    const names = await cardNames(response);
    expect(names).toHaveLength(100);
    await expectRenderedRanking(page, names);
    await expect(toggle).toContainText('Normal');
    expect(new URL(page.url()).searchParams.get('useRerank')).toBe('false');
  }
});

test('Commander Search keeps commander and platform filters while toggling reranking', async ({
  page,
}) => {
  const query = 'commanders that draw cards';
  const initialResponse = waitForRanking(page, true);
  await gotoHydrated(
    page,
    `/search/paper/commander?query=${encodeURIComponent(query)}&limit=10`,
  );
  const onResponse = await initialResponse;
  const onPayload = onResponse.request().postDataJSON();
  expect(onPayload).toMatchObject({
    query,
    limit: 100,
    useRerank: true,
    filters: { isCommander: true, isPaper: true },
  });
  await expectRenderedRanking(page, await cardNames(onResponse));

  const toggle = page.getByRole('combobox', {
    name: 'Search mode',
    exact: true,
  });
  const offResponsePromise = waitForRanking(page, false);
  await toggleSearchMode(page);
  const offResponse = await offResponsePromise;
  expect(offResponse.request().postDataJSON()).toEqual({
    ...onPayload,
    useRerank: false,
  });
  await expectRenderedRanking(page, await cardNames(offResponse));
  await expect(toggle).toContainText('Normal');
  const url = new URL(page.url());
  expect(url.pathname).toBe('/search/paper/commander');
  expect(url.searchParams.get('query')).toBe(query);
  expect(url.searchParams.get('limit')).toBe('10');
  expect(url.searchParams.get('useRerank')).toBe('false');
});

for (const mode of ['smart', 'commander'] as const) {
  test(
    mode +
      ': enabling reranking clears explicit sorts, including cached results',
    async ({ page }) => {
      const query =
        mode === 'smart' ? 'best draw cards' : 'commanders that draw cards';
      let searchRequests = 0;
      page.on('request', (request) => {
        if (
          request.url().startsWith(BACKEND + '/search/colbert') &&
          request.method() === 'POST'
        ) {
          searchRequests += 1;
        }
      });
      const initialResponse = waitForRanking(page, false);
      await gotoHydrated(
        page,
        '/search/paper/' +
          mode +
          '?query=' +
          encodeURIComponent(query) +
          '&limit=10&useRerank=false',
      );
      const offNames = await cardNames(await initialResponse);
      expect(offNames).toHaveLength(100);
      await expectRenderedRanking(page, offNames);

      const sort = page.getByRole('combobox').filter({
        hasText: /Select sort option|Smart Score|Name \(A-Z\)/,
      });
      await openDisplay(page);
      await sort.click();
      await page
        .getByRole('option', { name: 'Smart Score', exact: true })
        .click();
      await openDisplay(page);
      await expect(sort).toContainText('Smart Score');

      const toggle = page.getByRole('combobox', {
        name: 'Search mode',
        exact: true,
      });
      const onResponsePromise = waitForRanking(page, true);
      await toggleSearchMode(page);
      const onNames = await cardNames(await onResponsePromise);
      expect(onNames).toHaveLength(100);
      await openDisplay(page);
      await expect(sort).toContainText('Select sort option');
      await expectRenderedRanking(page, onNames);
      await expect(page.getByTitle('Clear sort', { exact: true })).toHaveCount(
        0,
      );
      const fetchedRequests = searchRequests;

      await openDisplay(page);
      await sort.click();
      await page
        .getByRole('option', { name: 'Name (A-Z)', exact: true })
        .click();
      const byName = (names: string[]) =>
        [...names].sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase()),
        );
      await expectRenderedRanking(page, byName(onNames));

      await toggleSearchMode(page);
      await expect(toggle).toContainText('Normal');
      await openDisplay(page);
      await expect(sort).toContainText('Name (A-Z)');
      await expectRenderedRanking(page, byName(offNames));

      await toggleSearchMode(page);
      await expect(toggle).toContainText('Enhanced');
      await openDisplay(page);
      await expect(sort).toContainText('Select sort option');
      await expectRenderedRanking(page, onNames);
      expect(searchRequests).toBe(fetchedRequests);
    },
  );
}

async function openDisplay(page: Page) {
  if (
    !(await page
      .getByRole('combobox', { name: 'Search sorting', exact: true })
      .isVisible())
  ) {
    await page.getByRole('button', { name: 'Display', exact: true }).click();
  }
}

async function toggleSearchMode(page: Page) {
  await page.keyboard.press('Escape');
  const select = page.getByRole('combobox', {
    name: 'Search mode',
    exact: true,
  });
  const next = (await select.textContent())?.includes('Enhanced')
    ? 'Normal'
    : 'Enhanced';
  await select.click();
  await page.getByRole('option', { name: next, exact: true }).click();
}
