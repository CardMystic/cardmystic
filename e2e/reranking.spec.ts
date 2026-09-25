import { expect, test, type Page, type Response } from '@playwright/test';
import { BACKEND, gotoHydrated, reliableFill } from './utils/mocks';

test.describe.configure({ timeout: 120_000 });

const hydrationErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
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

  const toggle = page.getByRole('button', { name: 'Reranking', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveText('Reranking: On');
  await toggle.hover();
  const tooltip = page
    .getByText(/^Reranking adds a second relevance check/)
    .first();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('second relevance check');
  await expect(tooltip).toContainText('takes longer');
  await expect(tooltip).toContainText('faster results');

  const offResponsePromise = waitForRanking(page, false);
  await toggle.click();
  const offResponse = await offResponsePromise;
  expect(offResponse.request().postDataJSON()).toEqual({
    ...onPayload,
    useRerank: false,
  });
  const offNames = await cardNames(offResponse);
  await expectRenderedRanking(page, offNames);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveText('Reranking: Off');
  const offUrl = new URL(page.url());
  expect(offUrl.pathname).toBe('/search/paper/smart');
  expect(offUrl.searchParams.get('query')).toBe(query);
  expect(offUrl.searchParams.get('limit')).toBe('20');
  expect(JSON.parse(offUrl.searchParams.get('filters')!)).toEqual(filters);
  expect(offUrl.searchParams.get('useRerank')).toBe('false');

  await page.goBack();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expectRenderedRanking(page, onNames);
  await page.goForward();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expectRenderedRanking(page, offNames);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expectRenderedRanking(page, offNames);

  await toggle.click();
  await expect(page).toHaveURL(/useRerank=true/);
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expectRenderedRanking(page, onNames);
});

test('turning reranking off before searching carries through subsequent Smart Search submissions', async ({
  page,
}) => {
  await gotoHydrated(page, '/search/all/smart');
  const toggle = page.getByRole('button', { name: 'Reranking', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

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
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
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

  const toggle = page.getByRole('button', { name: 'Reranking', exact: true });
  const offResponsePromise = waitForRanking(page, false);
  await toggle.click();
  const offResponse = await offResponsePromise;
  expect(offResponse.request().postDataJSON()).toEqual({
    ...onPayload,
    useRerank: false,
  });
  await expectRenderedRanking(page, await cardNames(offResponse));
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
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
      await sort.click();
      await page
        .getByRole('option', { name: 'Smart Score', exact: true })
        .click();
      await expect(sort).toContainText('Smart Score');

      const toggle = page.getByRole('button', {
        name: 'Reranking',
        exact: true,
      });
      const onResponsePromise = waitForRanking(page, true);
      await toggle.click();
      const onNames = await cardNames(await onResponsePromise);
      expect(onNames).toHaveLength(100);
      await expect(sort).toContainText('Select sort option');
      await expectRenderedRanking(page, onNames);
      await expect(page.getByTitle('Clear sort', { exact: true })).toHaveCount(
        0,
      );
      const fetchedRequests = searchRequests;

      await sort.click();
      await page
        .getByRole('option', { name: 'Name (A-Z)', exact: true })
        .click();
      const byName = (names: string[]) =>
        [...names].sort((a, b) =>
          a.toLowerCase().localeCompare(b.toLowerCase()),
        );
      await expectRenderedRanking(page, byName(onNames));

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(sort).toContainText('Name (A-Z)');
      await expectRenderedRanking(page, byName(offNames));

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(sort).toContainText('Select sort option');
      await expectRenderedRanking(page, onNames);
      expect(searchRequests).toBe(fetchedRequests);
    },
  );
}
