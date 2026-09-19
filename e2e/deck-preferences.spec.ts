import { expect, test, type Page } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

const defaults = {
  deck_view: 'grid',
  deck_group_by: 'type',
  deck_sort_by: 'cmc',
  deck_sort_direction: 'asc',
};
const listId = '10000000-0000-4000-8000-000000000001';
async function navigate(page: Page, path: string) {
  await page.evaluate((href) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(href);
  }, path);
}
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
  await page.route(BACKEND + '/supabase/card-lists/mine/*', (route) =>
    route.fulfill({
      json: {
        decklist: {
          id: route.request().url().split('/').pop(),
          name: 'Collection',
          description: null,
          format: 'Any',
          avatar_card_name: null,
          commanders: [],
          color_ratios: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
          updated_at: null,
          created_at: '2026-01-01',
          visibility: 'private',
          user_id: FAKE_USER.id,
          username: 'Collector',
          like_count: 0,
          save_count: 0,
          comment_count: 0,
          view_count: 0,
        },
      },
    }),
  );
  await page.route(BACKEND + '/supabase/card-lists/view/*', (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  let saved: Record<string, unknown> = { ...defaults };
  let fail = false;
  const writes: Record<string, unknown>[] = [];
  await page.route(SUPABASE + '/rest/v1/preferences**', async (route) => {
    if (route.request().method() === 'POST') {
      const patch = route.request().postDataJSON();
      writes.push(patch);
      if (fail)
        return route.fulfill({ status: 500, json: { message: 'Save failed' } });
      saved = { ...saved, ...patch };
      return route.fulfill({ status: 201, body: '' });
    }
    expect(new URL(route.request().url()).searchParams.get('user_id')).toBe(
      'eq.' + FAKE_USER.id,
    );
    return route.fulfill({ json: saved });
  });
  await gotoHydrated(page, '/about');
  await navigate(page, '/lists/' + listId);
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toBeEnabled();
  return {
    writes,
    saved: () => saved,
    fail: () => {
      fail = true;
    },
  };
}
async function choose(page: Page, field: string, option: string) {
  await page.getByRole('combobox', { name: field, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
test('only account settings save defaults; deck changes stay local for the visit', async ({
  page,
}) => {
  const state = await setup(page);
  await choose(page, 'Deck view', 'Card Text');
  await choose(page, 'Deck grouping', 'None');
  await choose(page, 'Deck sorting', 'Name');
  await page.getByRole('button', { name: 'Ascending', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Text');
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toContainText('None');
  expect(state.writes).toHaveLength(0);
  expect(state.saved()).toEqual(defaults);

  await navigate(page, '/user/account');
  await expect(
    page.getByRole('heading', { name: 'Deck display preferences' }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Grid');
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toContainText('Card Type');
  await choose(page, 'Deck view', 'Card Text');
  await choose(page, 'Deck grouping', 'None');
  await choose(page, 'Deck sorting', 'Name');
  await page.getByRole('button', { name: 'Ascending', exact: true }).click();
  await expect.poll(state.saved).toMatchObject({
    deck_view: 'text',
    deck_group_by: null,
    deck_sort_by: 'name',
    deck_sort_direction: 'desc',
  });
  expect(state.writes).toHaveLength(4);
  expect(state.writes[1]).toEqual({
    user_id: FAKE_USER.id,
    deck_group_by: null,
  });
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Text');
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toContainText('None');

  await navigate(page, '/lists/' + listId);
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Text');
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Name');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await choose(page, 'Deck view', 'Card Grid');
  await choose(page, 'Deck sorting', 'None');
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Grid');
  expect(state.saved().deck_view).toBe('text');
  expect(state.writes).toHaveLength(4);
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Display', exact: true }),
  ).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 900 });
  await navigate(page, '/lists/10000000-0000-4000-8000-000000000002');
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Text');
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Name');
  await choose(page, 'Deck view', 'Card Grid');
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Text');
  expect(state.writes).toHaveLength(4);
});
test('failed account preference writes show an error and restore the saved choice', async ({
  page,
}) => {
  const state = await setup(page);
  await navigate(page, '/user/account');
  state.fail();
  await choose(page, 'Deck view', 'Card Text');
  await expect(
    page.getByText('Could not save display preferences', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Grid');
  expect(state.saved().deck_view).toBe('grid');
});
