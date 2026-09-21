import { expect, test, type Page } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

const listId = '10000000-0000-4000-8000-000000000001';
const otherListId = '10000000-0000-4000-8000-000000000002';
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
  await gotoHydrated(page, '/about');
  await navigate(page, '/lists/' + listId);
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toBeEnabled();
}
async function choose(page: Page, field: string, option: string) {
  await page.getByRole('combobox', { name: field, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}
test('saved deck display choices migrate and persist independently across reloads and deck navigation', async ({
  page,
}) => {
  await page.addInitScript((deckId) => {
    const key = 'cm.deck-preferences.v1:' + deckId;
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(
        key,
        JSON.stringify({
          deck_view: 'simple',
          deck_group_by: 'color',
          deck_sort_by: 'price',
          deck_sort_direction: 'asc',
        }),
      );
    }
  }, listId);
  await setup(page);
  // Retiring the old view must preserve that deck's other saved choices.
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Grid');
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toContainText('Color');
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Price');
  await choose(page, 'Deck view', 'Card Text');
  await choose(page, 'Deck grouping', 'None');
  await choose(page, 'Deck sorting', 'Name');
  await page.getByRole('button', { name: 'Ascending', exact: true }).click();

  async function expectDeckAChoices() {
    await expect(
      page.getByRole('combobox', { name: 'Deck view', exact: true }),
    ).toContainText('Card Text');
    await expect(
      page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
    ).toContainText('None');
    await expect(
      page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
    ).toContainText('Name');
    await expect(
      page.getByRole('button', { name: 'Descending', exact: true }),
    ).toBeVisible();
  }

  await page.reload();
  await expectDeckAChoices();

  async function expectDeckBDefaults() {
    await expect(
      page.getByRole('combobox', { name: 'Deck view', exact: true }),
    ).toContainText('Card Grid');
    await expect(
      page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
    ).toContainText('Card Type');
    await expect(
      page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
    ).toContainText('Mana Value');
    await expect(
      page.getByRole('button', { name: 'Ascending', exact: true }),
    ).toBeVisible();
  }

  async function savedDeckBPreferences() {
    const saved = await page.evaluate(
      (deckId) => localStorage.getItem('cm.deck-preferences.v1:' + deckId),
      otherListId,
    );
    return saved ? JSON.parse(saved) : null;
  }

  await navigate(page, '/lists/' + otherListId);
  await expectDeckBDefaults();
  await expect.poll(savedDeckBPreferences).toBeNull();
  await choose(page, 'Deck sorting', 'Price');
  await expect
    .poll(savedDeckBPreferences)
    .toMatchObject({ deck_sort_by: 'price' });

  await navigate(page, '/lists/' + listId);
  await expectDeckAChoices();
  await navigate(page, '/lists/' + otherListId);
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Grid');
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Price');
  await choose(page, 'Deck grouping', 'Color');
  await choose(page, 'Deck sorting', 'Mana Value');
  await expect.poll(savedDeckBPreferences).toMatchObject({
    deck_group_by: 'color',
    deck_sort_by: 'cmc',
  });
  await choose(page, 'Deck grouping', 'Card Type');
  await expect.poll(savedDeckBPreferences).toBeNull();

  await page.reload();
  await expectDeckBDefaults();
  await expect.poll(savedDeckBPreferences).toBeNull();
  await navigate(page, '/lists/' + listId);
  await expectDeckAChoices();

  await navigate(page, '/user/account');
  await expect(
    page.getByRole('heading', { name: 'Deck display preferences' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toHaveCount(0);
});

test('invalid saved settings use defaults and blocked storage still allows changes for the visit', async ({
  page,
}) => {
  await page.addInitScript((deckId) => {
    localStorage.setItem('cm.deck-preferences.v1:' + deckId, '{invalid json');
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('cm.deck-preferences.v1:')) {
        throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      return setItem.call(this, key, value);
    };
  }, listId);
  await setup(page);
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Grid');
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toContainText('Card Type');
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Mana Value');

  await choose(page, 'Deck view', 'Card Text');
  await expect(
    page.getByText(
      'Display settings could not be saved in this browser. Changes will apply to this visit.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toContainText('Card Text');
  await choose(page, 'Deck grouping', 'None');
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toContainText('None');
});
