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
import { emptyGuestDeck, type GuestDeck } from '../utils/guestDeck';

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
  await page.route(
    BACKEND + '/bulkdata/card-name-to-oracle-id.min.json',
    (route) =>
      route.fulfill({
        json: Object.fromEntries(
          cards.map((card) => [card.name.toLowerCase(), card.oracle_id]),
        ),
      }),
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

test('guest builds one draft and reloads without account writes on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const writes: string[] = [];
  const draftRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('browser-draft'))
      draftRequests.push(request.url());
    if (
      request.url().includes('/supabase/card-lists/') &&
      request.method() === 'POST'
    )
      writes.push(request.url());
  });
  await gotoHydrated(page, '/build');
  await page
    .getByRole('heading', { name: 'My first deck', exact: true })
    .click();
  await page
    .getByTestId('deck-banner')
    .locator('input')
    .fill('My browser deck');
  await page.getByTestId('deck-banner').locator('input').press('Enter');
  await page.getByPlaceholder('Add a card to the deck...').fill('Display Card');
  await page.getByRole('option', { name: cards[3].name, exact: true }).click();
  await expect(page.getByText('1 cards', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: `Options for ${cards[3].name}`, exact: true })
    .click();
  await page.getByRole('button', { name: 'Add a copy', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByText('2 cards', { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'My browser deck', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('2 cards', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: `Options for ${cards[3].name}`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Browser draft', exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).decks.length,
      storageKey,
    ),
  ).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(writes).toEqual([]);
  expect(draftRequests).toEqual([]);
  await expect(
    page.getByRole('combobox', { name: 'List visibility', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole('note')).toContainText(
    'This deck is saved in your browser, We cannot control if it gets deleted. Sign in to save your deck.',
  );
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/user\/login\?redirect=\/build/);
  expect(
    await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).decks[0].cards[0].quantity,
      storageKey,
    ),
  ).toBe(2);
});

for (const failure of ['network', 'invalid cards', 'metadata'] as const) {
  test(`signed-in save preserves boards and retries the same deck after ${failure} failure`, async ({
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
              description: 'Keep this description',
              bracket: 3,
              avatarCardName: names[0],
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
        authKey:
          'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
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
        visibility: 'public',
        commanders: [cards[0].name],
      });
      return route.fulfill({ json: { id: deckId, name: 'Saved draft' } });
    });
    let attempts = 0;
    let metadataAttempts = 0;
    let avatarWrites = 0;
    await page.route(SUPABASE + '/rest/v1/card_lists**', (route) => {
      if (route.request().method() !== 'PATCH')
        return route.fulfill({ json: [] });
      const body = route.request().postDataJSON();
      if ('description' in body) {
        metadataAttempts++;
        expect(body).toMatchObject({
          description: 'Keep this description',
          bracket: 3,
        });
        if (failure === 'metadata' && metadataAttempts === 1)
          return route.fulfill({
            status: 503,
            json: { message: 'Metadata unavailable' },
          });
      }
      if ('avatar_card_name' in body) {
        avatarWrites++;
        expect(body.avatar_card_name).toBe(cards[0].name);
      }
      return route.fulfill({ json: [] });
    });
    await page.route(BACKEND + '/supabase/card-lists/bulk-edit', (route) => {
      attempts++;
      expect(route.request().postDataJSON()).toEqual({
        listId: deckId,
        entries: [
          {
            board: 'Mainboard',
            cards: [{ name: cards[0].name, num_copies: 1 }],
          },
          {
            board: 'Sideboard',
            cards: [{ name: cards[3].name, num_copies: 3 }],
          },
        ],
      });
      if (attempts === 1 && failure === 'network')
        return route.fulfill({
          status: 503,
          json: { message: 'Temporary failure' },
        });
      return route.fulfill({
        json: {
          addedCount: 4,
          removedCount: 0,
          invalidCardNames:
            attempts === 1 && failure === 'invalid cards'
              ? [cards[3].name]
              : [],
        },
      });
    });
    await gotoHydrated(page, '/build');
    await expect(
      page.getByRole('combobox', { name: 'Deck visibility', exact: true }),
    ).toContainText('Public');
    await page
      .getByRole('button', { name: 'Save deck to account', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Retry saving deck', exact: true }),
    ).toBeEnabled();
    expect(await readDraft(page)).toMatchObject({
      name: 'Saved draft',
      description: 'Keep this description',
      bracket: 3,
      avatarCardName: cards[0].name,
      pendingSave: { userId: FAKE_USER.id, listId: deckId },
    });
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
    expect(metadataAttempts).toBe(failure === 'metadata' ? 2 : 1);
    expect(avatarWrites).toBe(1);
    expect(
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).decks[0].cards,
        storageKey,
      ),
    ).toEqual([]);
  });
}

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
  await expect(page.getByText('1 cards', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: `Options for ${cards[3].name}`,
      exact: true,
    }),
  ).toBeVisible();
});

async function openDraftAction(page: Page, name: string) {
  await page
    .getByRole('button', { name: 'More deck actions', exact: true })
    .click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}
async function readDraft(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).decks[0],
    storageKey,
  );
}

async function seedDraft(page: Page, overrides: Partial<GuestDeck> = {}) {
  await page.addInitScript(
    ({ key, draft }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(
          key,
          JSON.stringify({ version: 2, activeIndex: 0, decks: [draft] }),
        );
    },
    {
      key: storageKey,
      draft: {
        ...emptyGuestDeck(),
        name: 'Regression deck',
        commanders: [cards[0].name],
        cards: [
          { name: cards[0].name, board: 'Mainboard', quantity: 1 },
          { name: 'Island', board: 'Mainboard', quantity: 5 },
          { name: cards[3].name, board: 'Sideboard', quantity: 2 },
          { name: cards[1].name, board: 'Considering', quantity: 3 },
        ],
        ...overrides,
      },
    },
  );
}

for (const failure of ['unknown card', 'lookup unavailable'] as const) {
  test(`bulk edit preserves every board after ${failure} and supports a corrected retry`, async ({
    page,
  }) => {
    await setup(page);
    await seedDraft(page);
    const writes: string[] = [];
    page.on('request', (request) => {
      if (
        request.url().includes('/supabase/card-lists/') ||
        request.url().includes('/rest/v1/card_list')
      )
        writes.push(request.url());
    });
    await gotoHydrated(page, '/build');
    await expect(
      page.getByRole('button', {
        name: `Options for ${cards[0].name}`,
        exact: true,
      }),
    ).toBeVisible();
    const before = await readDraft(page);
    const unresolved = 'Definitely not an MTG card';
    if (failure === 'lookup unavailable') {
      await page.route(BACKEND + '/cards/cards-by-names', (route) => {
        if (route.request().postDataJSON().cardNames.includes(unresolved))
          return route.fulfill({
            status: 503,
            json: { message: 'Lookup unavailable' },
          });
        return route.fallback();
      });
    }
    await openDraftAction(page, 'Bulk Edit');
    const bulk = page.getByRole('dialog');
    const main = bulk.getByPlaceholder(
      '4 Lightning Bolt\n2 Counterspell\nSol Ring',
    );
    await main.fill(`Mainboard\n7 Island\n1 ${unresolved}`);
    await bulk.getByRole('button', { name: 'Bulk Edit', exact: true }).click();
    await expect(
      page.getByText('Could not update deck', { exact: true }),
    ).toBeVisible();
    await expect(bulk).toBeVisible();
    expect(await readDraft(page)).toEqual(before);
    await expect(main).toHaveValue(new RegExp(unresolved));
    await main.fill('Mainboard (7)\n7 Island');
    await bulk.getByRole('tab', { name: 'Sideboard', exact: true }).click();
    await bulk
      .getByPlaceholder('2 Negate\n1 Pithing Needle')
      .fill(`Sideboard:\n4 ${cards[3].name}`);
    await bulk.getByRole('button', { name: 'Bulk Edit', exact: true }).click();
    await expect(bulk).toHaveCount(0);
    const expected = {
      ...before,
      cards: [
        { name: cards[0].name, board: 'Mainboard', quantity: 1 },
        { name: 'Island', board: 'Mainboard', quantity: 7 },
        { name: cards[3].name, board: 'Sideboard', quantity: 4 },
        { name: cards[1].name, board: 'Considering', quantity: 3 },
      ],
    };
    expect(await readDraft(page)).toEqual(expected);
    await page.reload();
    await expect(
      page.getByRole('heading', { name: before.name, exact: true }),
    ).toBeVisible();
    expect(await readDraft(page)).toEqual(expected);
    expect(writes).toEqual([]);
  });
}

test('cancelling bulk edit discards text changes and reopening restores the draft', async ({
  page,
}) => {
  await setup(page);
  await seedDraft(page);
  await gotoHydrated(page, '/build');
  await openDraftAction(page, 'Bulk Edit');
  const before = await readDraft(page);
  const bulk = page.getByRole('dialog');
  const main = bulk.getByPlaceholder(
    '4 Lightning Bolt\n2 Counterspell\nSol Ring',
  );
  await main.fill('99 Island');
  await bulk.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await readDraft(page)).toEqual(before);
  await openDraftAction(page, 'Bulk Edit');
  await expect(main).toHaveValue(/5 Island/);
  await expect(main).not.toHaveValue(/99 Island/);
  await main.fill('Mainboard');
  await bulk.getByRole('tab', { name: 'Sideboard', exact: true }).click();
  await bulk.getByPlaceholder('2 Negate\n1 Pithing Needle').fill('Sideboard');
  await bulk.getByRole('tab', { name: 'Considering', exact: true }).click();
  await bulk
    .getByPlaceholder('Ragavan, Nimble Pilferer\nForce of Will')
    .fill('Considering');
  await expect(
    bulk.getByRole('button', { name: 'Bulk Edit', exact: true }),
  ).toBeDisabled();
  expect(await readDraft(page)).toEqual(before);
});

test('storage quota failure leaves the edited draft available for export', async ({
  page,
}) => {
  await setup(page);
  await seedDraft(page);
  await gotoHydrated(page, '/build');
  await expect(
    page.getByRole('button', { name: 'Options for Island', exact: true }),
  ).toBeVisible();
  const before = await readDraft(page);
  await page.evaluate((key) => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key)
        throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, storageKey);
  await openDraftAction(page, 'Bulk Edit');
  const bulk = page.getByRole('dialog');
  await bulk
    .getByPlaceholder('4 Lightning Bolt\n2 Counterspell\nSol Ring')
    .fill('Mainboard\n9 Island');
  await bulk.getByRole('button', { name: 'Bulk Edit', exact: true }).click();
  await expect(bulk).toHaveCount(0);
  await expect(
    page.getByText(
      'This draft could not be saved in your browser. Export it before leaving this page.',
      { exact: true },
    ),
  ).toBeVisible();
  expect(await readDraft(page)).toEqual(before);
  await openDraftAction(page, 'Import / Export');
  const transfer = page.getByRole('dialog', {
    name: 'Import / Export',
    exact: true,
  });
  await transfer.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(transfer.getByLabel('Exported decklist')).toHaveValue(
    /9 Island/,
  );
  await expect(transfer.getByLabel('Exported decklist')).toHaveValue(
    /2 Display Card 004/,
  );
});

test('draft uses shared import, comparison, board controls and export without saved-list requests', async ({
  page,
}) => {
  await setup(page);
  const savedListRequests: string[] = [];
  page.on('request', (request) => {
    if (
      request.url().includes('browser-draft') ||
      request.url().includes('/rest/v1/card_list')
    )
      savedListRequests.push(request.url());
  });
  await gotoHydrated(page, '/build');
  await openDraftAction(page, 'Import / Export');
  const transfer = page.getByRole('dialog', {
    name: 'Import / Export',
    exact: true,
  });
  await transfer.getByRole('button', { name: 'Import', exact: true }).click();
  await transfer
    .getByLabel('Decklist to import')
    .fill(
      `Commander\n1 ${cards[0].name}\nMainboard\n5 Island\nSideboard\n2 ${cards[3].name}`,
    );
  await transfer
    .getByRole('button', { name: 'Preview import', exact: true })
    .click();
  await transfer
    .getByRole('button', { name: 'Add imported cards', exact: true })
    .click();
  await expect(transfer.getByRole('status')).toContainText('Imported');
  await expect
    .poll(async () => (await readDraft(page)).commanders)
    .toEqual([cards[0].name]);
  await transfer.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(transfer.getByLabel('Exported decklist')).toHaveValue(
    /5 Island/,
  );
  await expect(transfer.getByLabel('Exported decklist')).toHaveValue(
    /2 Display Card 004/,
  );
  await page.keyboard.press('Escape');

  await openDraftAction(page, 'Compare decks');
  const comparison = page.getByRole('dialog', {
    name: 'Compare decks',
    exact: true,
  });
  await comparison
    .getByLabel('Decklist or CardMystic URL')
    .fill(`5 Island\n3 ${cards[1].name}`);
  await comparison
    .getByRole('button', { name: 'Compare', exact: true })
    .click();
  await comparison
    .getByRole('button', { name: `Add ${cards[1].name}`, exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await readDraft(page)).cards.find(
          (card: { name: string; board: string }) =>
            card.name === cards[1].name && card.board === 'Mainboard',
        )?.quantity,
    )
    .toBe(3);
  await page.keyboard.press('Escape');

  await page
    .getByRole('button', { name: `Options for ${cards[1].name}`, exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Move to Considering', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (await readDraft(page)).cards.find(
          (card: { name: string; board: string }) =>
            card.name === cards[1].name,
        )?.board,
    )
    .toBe('Considering');

  await openDraftAction(page, 'Bulk Edit');
  const bulk = page.getByRole('dialog');
  await bulk
    .getByPlaceholder('4 Lightning Bolt\n2 Counterspell\nSol Ring')
    .fill('Mainboard\n7 Island');
  await bulk.getByRole('button', { name: 'Bulk Edit', exact: true }).click();
  await expect(bulk).toHaveCount(0);
  await expect
    .poll(async () => (await readDraft(page)).cards)
    .toEqual([
      { name: cards[0].name, board: 'Mainboard', quantity: 1 },
      { name: 'Island', board: 'Mainboard', quantity: 7 },
      { name: cards[3].name, board: 'Sideboard', quantity: 2 },
      { name: cards[1].name, board: 'Considering', quantity: 3 },
    ]);
  await page.reload();
  await expect(
    page.getByRole('button', {
      name: `Options for ${cards[0].name}`,
      exact: true,
    }),
  ).toBeVisible();
  expect(savedListRequests).toEqual([]);
});

test('draft uses shared stats, playtester, display and recommendation flow with explicit cards', async ({
  page,
}) => {
  await setup(page);
  await page.addInitScript(
    ({ key, names }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 2,
          activeIndex: 0,
          decks: [
            {
              version: 1,
              name: 'Browser tools deck',
              format: 'Commander',
              commanders: [names[0]],
              pendingSave: null,
              cards: [
                { name: names[0], quantity: 1, board: 'Mainboard' },
                { name: 'Island', quantity: 10, board: 'Mainboard' },
                { name: names[1], quantity: 2, board: 'Considering' },
              ],
            },
          ],
        }),
      );
    },
    { key: storageKey, names: [cards[0].name, cards[3].name] },
  );
  let statsRequests = 0;
  await page.route(BACKEND + '/cards/deck-analytics', (route) => {
    statsRequests++;
    const body = route.request().postDataJSON();
    expect(body).not.toHaveProperty('listId');
    expect(body.items).toContainEqual({
      oracle_id: cards[0].oracle_id,
      board: 'Mainboard',
      num_copies: 1,
      is_commander: true,
    });
    return route.fulfill({
      json: {
        librarySize: 10,
        lands: 10,
        modalLands: 0,
        commanders: 1,
        averageManaValue: null,
        types: [],
        roles: [],
        prices: { knownPriceCents: 1100, missingPrices: 0, topCards: [] },
      },
    });
  });
  await gotoHydrated(page, '/build');
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Deck view', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByTestId('deck-stats').locator('summary').click();
  await expect(
    page.getByText('Cards in library', { exact: true }),
  ).toBeVisible();
  expect(statsRequests).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Playtest', exact: true }).click();
  const playtest = page.getByRole('dialog', {
    name: 'Playtest Beta',
    exact: true,
  });
  await expect(
    playtest
      .getByRole('region', { name: 'Hand', exact: true })
      .locator('.playtest-card'),
  ).toHaveCount(7);
  await playtest.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Recommend', exact: true }).click();
  await expect(page).toHaveURL(/\/search\/all\/deckbuilder\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get('deckId')).toBeNull();
  expect(url.searchParams.get('deckSource')).toBe('paste');
  expect(url.searchParams.get('commander')).toBe(cards[0].name);
  expect(url.searchParams.get('decklist')).toContain('Island');
  expect(url.searchParams.get('decklist')).not.toContain(cards[3].name);
});
