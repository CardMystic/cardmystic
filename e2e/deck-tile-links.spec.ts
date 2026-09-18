import { expect, test } from '@playwright/test';
import {
  BACKEND,
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
  avatar_card_name: null,
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
  // Server-rendered discovery data must refresh through these browser fixtures.
  await page.clock.setFixedTime(new Date(Date.now() + 10 * 60 * 1000));
  await page.route(BACKEND + '/**', (route) => {
    const path = new URL(route.request().url()).pathname;
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
  await gotoHydrated(page, '/explore/decklists');
  const link = page.getByRole('link', { name: deck.name, exact: true });
  await expect(link).toHaveAttribute('href', deckPath);
  await expect(link.locator('a, button')).toHaveCount(0);

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

test('delete stays separate from deck navigation and keyboard users can open the deck', async ({
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
  const deletes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'DELETE') deletes.push(request.url());
  });
  await gotoHydrated(page, '/lists');
  const link = page.getByRole('link', { name: deck.name, exact: true });
  await expect(link).toHaveAttribute('href', deckPath);
  const remove = page.getByRole('button', { name: 'Delete list', exact: true });
  await remove.focus();
  await expect(remove).toHaveCSS('opacity', '1');
  await remove.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Are you sure you want to delete');
  await expect(page).toHaveURL(/\/lists$/);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(deletes).toEqual([]);

  await link.focus();
  await link.press('Enter');
  await expect(page).toHaveURL(new RegExp(deckPath + '$'));
});
