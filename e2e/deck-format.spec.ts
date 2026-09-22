import { expect, test, type Page } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

const listId = '10000000-0000-4000-8000-000000000009';
const title = 'Full Artwork Deck';

async function setup(page: Page) {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: {} }));
  await page.route(SUPABASE + '/rest/v1/**', (route) =>
    route.fulfill({ json: [] }),
  );
  await mockSupabaseAuth(page);
  await page.route(SUPABASE + '/rest/v1/profiles**', (route) =>
    route.fulfill({
      json: { id: FAKE_USER.id, username: 'Collector', avatar_card_name: null },
    }),
  );
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    {
      key: 'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
      session: {
        access_token: fakeJwt(),
        refresh_token: 'fake',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: FAKE_USER,
      },
    },
  );
  const decklist = {
    id: listId,
    name: title,
    description: 'All of the artwork remains visible.',
    format: 'Commander',
    avatar_card_name: null,
    commanders: [],
    color_ratios: { W: 0, U: 1, B: 0, R: 0, G: 0, C: 0 },
    updated_at: null,
    created_at: '2026-01-01',
    visibility: 'private',
    user_id: FAKE_USER.id,
    username: 'Collector',
    like_count: 0,
    save_count: 0,
    comment_count: 0,
    view_count: 0,
  };
  await page.route(BACKEND + '/supabase/card-lists/mine/*', (route) =>
    route.fulfill({ json: { decklist } }),
  );
  await page.route(BACKEND + '/supabase/card-lists/view/*', (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  const formats: unknown[] = [];
  await page.route(BACKEND + '/supabase/card-lists/update-format', (route) => {
    const body = route.request().postDataJSON();
    formats.push(body);
    decklist.format = body.format;
    return route.fulfill({
      json: { format: body.format, commandersCleared: false },
    });
  });
  await gotoHydrated(page, '/about');
  await page.evaluate((path) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(path);
  }, '/lists/' + listId);
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  return { formats };
}

test('owner can select and save Any as the deck format', async ({ page }) => {
  const state = await setup(page);
  await page
    .getByRole('button', { name: 'Edit list format', exact: true })
    .click();
  const format = page.getByRole('combobox', {
    name: 'List format',
    exact: true,
  });
  await format.click();
  await page.getByRole('option', { name: 'Any', exact: true }).click();
  await page.getByRole('heading', { name: title, exact: true }).click();
  await expect.poll(() => state.formats).toEqual([{ listId, format: 'Any' }]);
  await expect(
    page.getByText('Format updated!', { exact: true }),
  ).toBeVisible();
});
