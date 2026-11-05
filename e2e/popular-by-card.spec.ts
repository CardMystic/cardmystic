import { expect, test } from '@playwright/test';
import {
  BACKEND,
  backendPath,
  gotoHydrated,
  mockSignedInUser,
} from './utils/mocks';
const card = (name: string, id: string) => ({
  id,
  oracle_id: id,
  name,
  layout: 'normal',
  type_line: 'Legendary Creature',
  mana_cost: '{1}',
  cmc: 1,
  colors: [],
  color_identity: [],
  keywords: [],
  legalities: {},
  prices: {},
  rarity: 'rare',
  set: 'tst',
  games: ['paper'],
  oracle_text: 'Draw a card.',
  image_uris: { normal: 'https://cards.example.test/card.svg' },
});
const commander = card(
  'Example Commander',
  '00000000-0000-4000-8000-000000000001',
);
const selected = card('Sol Ring', '00000000-0000-4000-8000-000000000002');
test.beforeEach(async ({ page }) => {
  await mockSignedInUser(page);
  await page.route(`${BACKEND}/**`, (route) => {
    const path = backendPath(route.request().url());
    const values: Record<string, unknown> = {
      '/search-access': {
        enabled: true,
        authenticated: true,
        tier: 'enhanced',
        enhancedRemaining: null,
        enhancedTopUpRemaining: 0,
        resetsAt: null,
      },
      '/bulkdata/card-names.min.json': ['Sol Ring', 'Arcane Signet'],
      '/bulkdata/commanders.min.json': ['Example Commander'],
      '/bulkdata/card-name-to-oracle-id.min.json': {},
      '/cards/cards-by-names': [selected],
    };
    return route.fulfill({ json: values[path ?? ''] ?? [] });
  });
  await page.route('https://cards.example.test/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"/>',
    }),
  );
});
test('popular commanders by card has shareable searches and result cards', async ({
  page,
}) => {
  const requests: { card_name: string; query?: string; useRerank: boolean }[] =
    [];
  await page.route(
    `${BACKEND}/deck-stats/popular-commanders-for-card`,
    (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({
        json: {
          total_decks: 100,
          results: [
            {
              commanders: [commander.name],
              card_data: [commander],
              count: 50,
              popularity: 0.5,
            },
          ],
        },
      });
    },
  );
  await gotoHydrated(
    page,
    '/popular-by-card/all?card_name=Sol+Ring&query=artifacts&useRerank=false',
  );
  await expect(page).toHaveTitle(
    'Popular Commanders for Sol Ring | CardMystic',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(
    page.getByRole('img', { name: commander.name, exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Search mode', exact: true }),
  ).toContainText('Normal');
  expect(requests.at(-1)).toMatchObject({
    card_name: 'Sol Ring',
    query: 'artifacts',
    useRerank: false,
  });
  await page
    .getByRole('textbox', { name: 'Commander search query' })
    .fill('tokens');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/query=tokens/);
  await expect.poll(() => requests.at(-1)?.query).toBe('tokens');
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Commander search query' }),
  ).toHaveValue('tokens');
  await expect(
    page.getByRole('img', { name: commander.name, exact: true }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: '.cache/popular-commanders-for-card-mobile.png',
  });
});
test('search waits for readiness, retries, and explains a Pro ranking fallback', async ({
  page,
}) => {
  let searches = 0;
  let checks = 0;
  let ready = false;
  await page.route(`${BACKEND}/search/colbert`, (route) => {
    searches++;
    return searches === 1
      ? route.fulfill({
          status: 500,
          json: { message: 'Search is starting up. Please try again shortly.' },
        })
      : route.fulfill({
          headers: {
            'x-search-access': JSON.stringify({
              reason: 'enhancement_unavailable',
            }),
          },
          json: [{ card_name: commander.name, card_data: commander, rank: 1 }],
        });
  });
  await page.route(`${BACKEND}/search/status`, (route) => {
    checks++;
    return route.fulfill({
      json: { state: ready ? 'ready' : 'warming_up', retryAfterSeconds: 15 },
    });
  });
  await gotoHydrated(page, '/search/all/smart?query=artifacts');
  await expect(
    page.getByText('Search is starting up', { exact: true }),
  ).toBeVisible();
  await expect.poll(() => checks).toBeGreaterThan(0);
  expect(searches).toBe(1);
  ready = true;
  await expect.poll(() => searches, { timeout: 22_000 }).toBe(2);
  await expect(
    page.getByRole('img', { name: commander.name, exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText('Pro ranking is temporarily unavailable', { exact: true }),
  ).toBeVisible();
});
