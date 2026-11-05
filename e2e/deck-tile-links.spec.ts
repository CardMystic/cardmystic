import { expect, test } from '@playwright/test';
import {
  BACKEND,
  backendPath,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  gotoHydrated,
  mockSupabaseAuth,
} from './utils/mocks';

const deck = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Linked commander deck',
  description: 'A deck whose whole tile opens its own page.',
  format: 'Commander',
  bracket: 3,
  avatar_card_name: "Atraxa, Praetors' Voice",
  commanders: [],
  color_ratios: { W: 0.5, U: 0, B: 0, R: 0, G: 0.5, C: 0 },
  updated_at: null,
  created_at: '2026-01-01',
  visibility: 'public',
  user_id: FAKE_USER.id,
  username: 'deck-author',
  like_count: 0,
  save_count: 0,
  comment_count: 0,
  view_count: 0,
};
const deckPath = `/lists/${deck.id}`;
const authorPath = `/user/${deck.user_id}`;

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/(?:api|cards)\.scryfall\.(?:com|io)\//, (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#557777"/></svg>',
    }),
  );
  await page.route(BACKEND + '/**', (route) => {
    const path = backendPath(route.request().url());
    if (path === null) return route.fallback();
    const responses: Record<string, unknown> = {
      '/supabase/card-lists/featured': { decklists: [deck] },
      '/supabase/card-lists': {
        decklists: [deck],
        totalCount: 1,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
      '/bulkdata/card-name-to-oracle-id.min.json': {},
    };
    return route.fulfill({ json: responses[path] ?? [] });
  });
  await page.route(SUPABASE + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(
    /https:\/\/(?:www\.googletagmanager\.com|pagead2\.googlesyndication\.com|fundingchoicesmessages\.google\.com)\//,
    (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' }),
  );
});

test('deck names are crawlable links with whole-tile navigation', async ({
  page,
}) => {
  // Expire the server-rendered discovery cache before loading the fixture.
  await page.clock.setFixedTime(new Date(Date.now() + 10 * 60 * 1000));
  await gotoHydrated(page, '/explore/decklists');
  const link = page.getByRole('link', { name: deck.name, exact: true });
  await expect(link).toHaveAttribute('href', deckPath);
  await expect(link.locator('a, button')).toHaveCount(0);
  const tile = page.locator('.deck-link').filter({ has: link });
  await expect(tile.getByText('Selesnya', { exact: true })).toBeVisible();
  await expect(tile.locator('img')).toHaveAttribute('loading', 'lazy');
  await expect(tile.locator('img')).toHaveAttribute('draggable', 'false');
  await page.screenshot({ path: '.cache/platform-deck-tile-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({ path: '.cache/platform-deck-tile-mobile.png' });

  // Middle-click opens a separate tab without requiring an opener relationship.
  // Click the description's coordinates, outside the title text. Its stretched
  // anchor must handle the click with the same destination as the named link.
  const description = page.getByText(deck.description, { exact: true });
  const box = await description.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(page).toHaveURL(new RegExp(deckPath + '$'));
});

test('author links and color tooltips stay independently accessible', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(Date.now() + 10 * 60 * 1000));
  await gotoHydrated(page, '/explore/decklists');
  const author = page.getByRole('link', { name: deck.username, exact: true });
  await expect(author).toHaveAttribute('href', authorPath);

  const white = page.getByRole('group', { name: 'White 50%', exact: true });
  await white.hover();
  await expect(white.getByRole('tooltip')).toBeVisible();
  await page.mouse.move(0, 0);
  await white.focus();
  await expect(white.getByRole('tooltip')).toBeVisible();
  await expect(page).toHaveURL(/\/explore\/decklists$/);

  await author.focus();
  await author.press('Enter');
  await expect(page).toHaveURL(new RegExp(authorPath + '$'));
});

test('list rows show color symbols and open the deck while settings stay separate', async ({
  page,
}) => {
  await mockSupabaseAuth(page);
  await page.route(SUPABASE + '/rest/v1/profiles**', (route) =>
    route.fulfill({
      json: {
        id: FAKE_USER.id,
        username: deck.username,
        avatar_card_name: null,
      },
    }),
  );
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    {
      key: 'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
      session: {
        access_token: fakeJwt(),
        refresh_token: 'fake-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: FAKE_USER,
      },
    },
  );
  const sorts: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/supabase/card-lists'))
      sorts.push(
        `${url.searchParams.get('sort')}:${url.searchParams.get('direction')}`,
      );
  });
  const secondDeck = {
    ...deck,
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Another deck with a much longer title to check column alignment',
    bracket: null,
  };
  await page.route(BACKEND + '/supabase/card-lists?*', (route) =>
    route.fulfill({
      json: {
        decklists: [deck, secondDeck],
        totalCount: 2,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    }),
  );
  const deletes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'DELETE') deletes.push(request.url());
  });
  await gotoHydrated(page, '/lists');
  const gridTile = page.getByTestId(`library-list-${deck.id}`);
  const gridBadge = gridTile.getByRole('img', {
    name: 'Bracket 3',
    exact: true,
  });
  await expect(gridBadge).toBeVisible();
  await gridTile.hover();
  const badgeBox = await gridBadge.boundingBox();
  const settingsBox = await gridTile
    .getByRole('button', { name: `Settings for ${deck.name}` })
    .boundingBox();
  expect(settingsBox!.y).toBeGreaterThan(badgeBox!.y + badgeBox!.height);
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page.getByRole('combobox', { name: 'Decklists view' }).click();
  await page.getByRole('option', { name: 'List', exact: true }).click();
  await page.keyboard.press('Escape');
  const row = page.getByTestId(`library-list-${deck.id}`);
  const table = page.getByRole('table', { name: 'Decks & Collections' });
  await expect(table.getByRole('columnheader')).toHaveCount(6);
  const otherRow = page.getByTestId(`library-list-${secondDeck.id}`);
  for (let index = 0; index < 6; index++) {
    const first = await row.getByRole('cell').nth(index).boundingBox();
    const second = await otherRow.getByRole('cell').nth(index).boundingBox();
    expect(first!.x).toBeCloseTo(second!.x, 0);
  }
  for (const [label, key] of [
    ['Name', 'name'],
    ['Colors', 'colors'],
    ['Format', 'format'],
    ['Bracket', 'bracket'],
  ] as const) {
    await table
      .getByRole('button', {
        name: `Sort by ${label.toLowerCase()}`,
        exact: true,
      })
      .click();
    await expect(
      table.getByRole('columnheader', {
        name: `Sort by ${label.toLowerCase()}`,
        exact: true,
      }),
    ).toHaveAttribute('aria-sort', 'ascending');
    await expect.poll(() => sorts.includes(`${key}:asc`)).toBe(true);
  }
  await table
    .getByRole('button', { name: 'Sort by bracket', exact: true })
    .click();
  await expect.poll(() => sorts.includes('bracket:desc')).toBe(true);
  const bracket = row.getByRole('img', { name: 'Bracket 3', exact: true });
  await bracket.hover();
  await expect(page.getByText(/^Bracket 3: Upgraded\./).first()).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(page.getByText(/^Bracket 3: Upgraded\./).first()).toBeHidden();
  await page.screenshot({ path: '/tmp/cardmystic-bracket-table-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(table).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: '/tmp/cardmystic-bracket-table-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(
    row.getByRole('img', { name: 'Deck colors: White, Green', exact: true }),
  ).toBeVisible();
  const link = page.getByRole('link', { name: deck.name, exact: true });
  await expect(link).toHaveAttribute('href', deckPath);
  const remove = page.getByRole('button', {
    name: `Settings for ${deck.name}`,
    exact: true,
  });
  await remove.focus();
  await expect(remove).toHaveCSS('opacity', '1');
  await remove.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Deck settings');
  await dialog
    .getByRole('button', { name: 'Delete deck', exact: true })
    .click();
  await expect(dialog).toContainText('This cannot be undone.');
  await expect(page).toHaveURL(/\/lists$/);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toContainText('Deck settings');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(deletes).toEqual([]);

  // The format is outside the title but remains part of the deck link's target.
  const format = await row
    .getByText('Commander', { exact: true })
    .boundingBox();
  expect(format).not.toBeNull();
  await page.mouse.click(
    format!.x + format!.width / 2,
    format!.y + format!.height / 2,
  );
  await expect(page).toHaveURL(new RegExp(deckPath + '$'));
});
