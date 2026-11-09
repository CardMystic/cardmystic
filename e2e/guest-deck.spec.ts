import { expect, test, type Page } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  gotoHydrated,
  mockSupabaseAuth,
} from './utils/mocks';
import { createDisplayCards } from './utils/deckDisplay';

const cards = createDisplayCards(4);
const storageKey = 'cardmystic-guest-decks-v2';
const deckId = '41000000-0000-4000-8000-000000000009';

async function setup(page: Page) {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(SUPABASE + '/rest/v1/**', (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(BACKEND + '/bulkdata/card-names.min.json', (route) =>
    route.fulfill({ json: cards.map((card) => card.name) }),
  );
  await page.route(BACKEND + '/bulkdata/commanders.min.json', (route) =>
    route.fulfill({ json: [cards[0].name] }),
  );
  await page.route(BACKEND + '/bulkdata/partner-commanders.min.json', (route) =>
    route.fulfill({
      json: {
        partner: [],
        chooseABackground: [],
        background: [],
        doctorsCompanion: [],
        timeLordDoctor: [],
      },
    }),
  );
  await page.route(BACKEND + '/cards/cards-by-names', (route) =>
    route.fulfill({
      json: cards.filter((card) =>
        route.request().postDataJSON().cardNames.includes(card.name),
      ),
    }),
  );
  await page.route(BACKEND + '/cards/cards-by-oracle-ids', (route) =>
    route.fulfill({
      json: cards.filter((card) =>
        route.request().postDataJSON().oracleIds.includes(card.oracle_id),
      ),
    }),
  );
  await page.route('https://cards.scryfall.io/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="488" height="680"><rect width="488" height="680" fill="#204e68"/></svg>',
    }),
  );
}

test('guest switches between three drafts and reloads without account writes on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const writes: string[] = [];
  page.on('request', (request) => {
    if (
      request.url().includes('/supabase/card-lists/') &&
      request.method() === 'POST'
    )
      writes.push(request.url());
  });
  await gotoHydrated(page, '/build');
  await page.getByLabel('Deck name', { exact: true }).fill('My browser deck');
  await page.getByPlaceholder('Search card names...').fill('Display Card');
  await page.getByRole('option', { name: cards[3].name, exact: true }).click();
  await expect(
    page.getByText('1 card in browser draft', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: `Options for ${cards[3].name}`, exact: true })
    .click();
  await page.getByRole('button', { name: 'Add a copy', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByText('2 cards in browser draft', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Deck name', { exact: true })).toHaveValue(
    'My browser deck',
  );
  await expect(
    page.getByText('2 cards in browser draft', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: `Options for ${cards[3].name}`,
      exact: true,
    }),
  ).toBeVisible();
  const picker = page.getByRole('combobox', {
    name: 'Browser draft',
    exact: true,
  });
  await picker.click();
  await expect(page.getByRole('option')).toHaveCount(3);
  await page
    .getByRole('option', { name: '2. My second deck', exact: true })
    .click();
  await expect(
    page.getByText('0 cards in browser draft', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Deck name', { exact: true }).fill('Second draft');
  await page.getByPlaceholder('Search card names...').fill('Island');
  await page.getByRole('option', { name: 'Island', exact: true }).click();
  await picker.click();
  await page
    .getByRole('option', { name: '3. My third deck', exact: true })
    .click();
  await expect(
    page.getByText('0 cards in browser draft', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Deck name', { exact: true }).fill('Third draft');
  await page.reload();
  await expect(page.getByLabel('Deck name', { exact: true })).toHaveValue(
    'Third draft',
  );
  await picker.click();
  await page
    .getByRole('option', { name: '2. Second draft', exact: true })
    .click();
  await expect(
    page.getByText('1 card in browser draft', { exact: true }),
  ).toBeVisible();
  await picker.click();
  await page
    .getByRole('option', { name: '1. My browser deck', exact: true })
    .click();
  await expect(
    page.getByText('2 cards in browser draft', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(writes).toEqual([]);
  await page
    .getByRole('button', { name: 'Sign in to save deck', exact: true })
    .click();
  await expect(page).toHaveURL(/\/user\/login\?redirect=\/build/);
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).decks[0].cards[0].quantity,
      storageKey,
    ),
  ).toBe(2);
});

test('signed-in save preserves boards and retries the same deck after a failed write', async ({
  page,
}) => {
  await setup(page);
  await mockSupabaseAuth(page);
  await page.route(SUPABASE + '/rest/v1/profiles**', (route) =>
    route.fulfill({
      json: {
        id: FAKE_USER.id,
        username: 'Draft tester',
        avatar_card_name: null,
      },
    }),
  );
  await page.addInitScript(
    ({ token, user, key, names, authKey }) => {
      localStorage.setItem(
        authKey,
        JSON.stringify({
          access_token: token,
          refresh_token: 'fake-refresh',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        }),
      );
      if (!localStorage.getItem(key))
        localStorage.setItem(
          key,
          JSON.stringify({
            version: 1,
            name: 'Saved draft',
            format: 'Commander',
            commanders: [names[0]],
            cards: [
              { name: names[0], quantity: 1, board: 'Mainboard' },
              { name: names[1], quantity: 3, board: 'Sideboard' },
            ],
            pendingSave: null,
          }),
        );
    },
    {
      authKey: 'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
      token: fakeJwt(),
      user: FAKE_USER,
      key: 'cardmystic-guest-deck-v1',
      names: [cards[0].name, cards[3].name],
    },
  );
  // Use the actual auth storage key configured by useSupabase.
  let creates = 0;
  await page.route(BACKEND + '/supabase/card-lists/create', (route) => {
    creates++;
    expect(route.request().postDataJSON()).toMatchObject({
      name: 'Saved draft',
      visibility: 'private',
      commanders: [cards[0].name],
    });
    return route.fulfill({ json: { id: deckId, name: 'Saved draft' } });
  });
  let attempts = 0;
  await page.route(BACKEND + '/supabase/card-lists/bulk-edit', (route) => {
    attempts++;
    expect(route.request().postDataJSON()).toEqual({
      listId: deckId,
      entries: [
        { board: 'Mainboard', cards: [{ name: cards[0].name, num_copies: 1 }] },
        { board: 'Sideboard', cards: [{ name: cards[3].name, num_copies: 3 }] },
      ],
    });
    return attempts === 1
      ? route.fulfill({ status: 503, json: { message: 'Temporary failure' } })
      : route.fulfill({
          json: { addedCount: 4, removedCount: 0, invalidCardNames: [] },
        });
  });
  await gotoHydrated(page, '/build');
  const picker = page.getByRole('combobox', {
    name: 'Browser draft',
    exact: true,
  });
  await picker.click();
  await page
    .getByRole('option', { name: '2. My second deck', exact: true })
    .click();
  await page.getByLabel('Deck name', { exact: true }).fill('Keep this draft');
  await page.getByPlaceholder('Search card names...').fill('Island');
  await page.getByRole('option', { name: 'Island', exact: true }).click();
  await picker.click();
  await page
    .getByRole('option', { name: '1. Saved draft', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Save deck to account', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Retry saving deck', exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).decks[0].cards.length,
      storageKey,
    ),
  ).toBe(2);
  await page.reload();
  await page
    .getByRole('button', { name: 'Retry saving deck', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/lists/${deckId}$`));
  expect(creates).toBe(1);
  expect(attempts).toBe(2);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).decks[0].cards,
      storageKey,
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).decks[1],
      storageKey,
    ),
  ).toMatchObject({
    name: 'Keep this draft',
    cards: [{ name: 'Island', quantity: 1, board: 'Mainboard' }],
  });
});

test('a guest adds a search result to the same browser draft', async ({
  page,
}) => {
  await setup(page);
  await page.route(BACKEND + '/search/keyword', (route) =>
    route.fulfill({
      json: [{ card_name: cards[3].name, card_data: cards[3] }],
    }),
  );
  await gotoHydrated(page, '/search/all/keyword?query=wizard');
  await page
    .getByRole('button', { name: `Options for ${cards[3].name}`, exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add to Deck', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add to browser draft', exact: true })
    .click();
  await expect(
    page.getByText('Added to browser draft', { exact: true }),
  ).toBeVisible();
  await gotoHydrated(page, '/build');
  await expect(
    page.getByText('1 card in browser draft', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: `Options for ${cards[3].name}`,
      exact: true,
    }),
  ).toBeVisible();
});
