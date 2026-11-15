import { createHmac } from 'node:crypto';
import {
  expect,
  test,
  type Page,
  type APIRequestContext,
} from '@playwright/test';
import {
  setupDeckDisplay,
  createDisplayCards,
  displayDeckId,
} from './utils/deckDisplay';
import { BACKEND, SUPABASE, FAKE_USER, gotoHydrated } from './utils/mocks';
import { emptyGuestDeck } from '../utils/guestDeck';

// Opt in against a disposable database with real migrations and RLS, never hosted Supabase.
const api = process.env.PRINTINGS_TEST_API;
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});
test.skip(
  !api,
  'Requires the isolated local printing database API; see backend database/tests/README-printings.md.',
);
function token(role: string) {
  const data = [
    { alg: 'HS256', typ: 'JWT' },
    { role, sub: FAKE_USER.id, exp: Math.floor(Date.now() / 1000) + 3600 },
  ]
    .map((value) => Buffer.from(JSON.stringify(value)).toString('base64url'))
    .join('.');
  return (
    data +
    '.' +
    createHmac(
      'sha256',
      process.env.PRINTINGS_TEST_JWT_SECRET ??
        'local-printings-test-only-secret-at-least-32-characters',
    )
      .update(data)
      .digest('base64url')
  );
}
const cards = createDisplayCards(4);
const card = cards[3];
const printingId = '44000000-0000-4000-8000-000000000001';
const printing = {
  id: printingId,
  oracle_id: card.oracle_id,
  set_code: 'testnew',
  collector_number: '123',
  lang: 'en',
  released_at: '2026-01-01',
  finish_mask: 3,
  image_paths: ['front/a/b/selected-art.jpg'],
  flavor_name: 'Alternate Card Name',
  tcgplayer_id: null,
  usd_cents: 250,
  foil_cents: 950,
  etched_cents: null,
};
async function db(
  request: APIRequestContext,
  path: string,
  method = 'GET',
  data?: unknown,
  role = 'service_role',
) {
  const response = await request.fetch(`${api}/${path}`, {
    method,
    data,
    headers: {
      Authorization: `Bearer ${token(role)}`,
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response;
}
async function seed(request: APIRequestContext) {
  await db(request, 'rpc/sync_card_printings', 'POST', {
    p_sets: [{ code: 'testnew', name: 'New Test Set' }],
    p_rows: [printing],
  });
  await db(request, `card_list_items?list_id=eq.${displayDeckId}`, 'DELETE');
  await db(request, 'card_lists', 'POST', {
    id: displayDeckId,
    user_id: FAKE_USER.id,
    name: 'Display deck',
    visibility: 'public',
    format: 'Any',
  });
  await db(
    request,
    'card_list_items',
    'POST',
    cards.map((card) => ({
      list_id: displayDeckId,
      oracle_id: card.oracle_id,
      card_id: card.id,
      board: 'Mainboard',
      num_copies: 1,
    })),
  );
}
async function connect(page: Page, role = 'authenticated') {
  const requests: string[] = [];
  for (const route of [
    'card_printings**',
    'card_list_items**',
    'rpc/set_deck_printings',
  ]) {
    await page.route(`${SUPABASE}/rest/v1/${route}`, async (route) => {
      const source = route.request();
      const path =
        new URL(source.url()).pathname.replace('/rest/v1/', '') +
        new URL(source.url()).search;
      requests.push(path);
      const response = await page.request.fetch(`${api}/${path}`, {
        method: source.method(),
        data: source.postData() ?? undefined,
        headers: {
          Authorization: `Bearer ${token(role)}`,
          'Content-Type': 'application/json',
        },
      });
      await route.fulfill({
        status: response.status(),
        body: await response.body(),
        contentType: 'application/json',
      });
    });
  }
  return requests;
}
async function choose(page: Page) {
  await page
    .getByRole('button', { name: `Options for ${card.name}`, exact: true })
    .click();
  const actions = page.getByRole('dialog', { name: card.name, exact: true });
  const tags = await actions
    .getByRole('region', { name: 'My tags' })
    .boundingBox();
  const selector = actions.getByRole('button', {
    name: 'Change printing',
    exact: true,
  });
  const bounds = await selector.boundingBox();
  if (tags && bounds)
    expect(tags.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
  await selector.click();
  const picker = page.getByRole('dialog', {
    name: `Choose printing: ${card.name}`,
    exact: true,
  });
  await expect(actions).toBeHidden();
  await picker
    .getByRole('button', { name: 'New Test Set #123', exact: true })
    .click();
  await picker
    .getByRole('combobox', { name: 'Printing finish', exact: true })
    .click();
  await page.getByRole('option', { name: 'Foil', exact: true }).click();
  await picker
    .getByRole('button', { name: 'Use printing', exact: true })
    .click();
}

test('saved deck selection persists through the real database API, reload, and default reset', async ({
  page,
  request,
}) => {
  await seed(request);
  await setupDeckDisplay(page, { cardCount: 4 });
  const requests = await connect(page);
  await choose(page);
  await page.screenshot({
    path: '.cache/printing-picker-desktop.png',
    fullPage: false,
  });
  await expect(
    page.getByRole('dialog', { name: card.name, exact: true }),
  ).toContainText('New Test Set #123 Foil');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  let saved = await (
    await db(
      request,
      `card_list_items?oracle_id=eq.${card.oracle_id}&list_id=eq.${displayDeckId}`,
    )
  ).json();
  expect(saved[0]).toMatchObject({ printing_id: printingId, finish: 'foil' });
  await page.reload();
  await expect(
    page.locator(`img[src*="selected-art.jpg"]`).first(),
  ).toBeVisible();
  expect(
    requests.filter(
      (url) => url.startsWith('card_printings?') && url.includes('id=in.'),
    ),
  ).toHaveLength(1);
  await page
    .getByRole('button', { name: `Options for ${card.name}`, exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Change printing', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Use default printing', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: card.name, exact: true }),
  ).toContainText('Test #4');
  saved = await (
    await db(
      request,
      `card_list_items?oracle_id=eq.${card.oracle_id}&list_id=eq.${displayDeckId}`,
    )
  ).json();
  expect(saved[0]).toMatchObject({ printing_id: null, finish: null });
});

test('failed save stays open for retry and does not alter the saved selection', async ({
  page,
  request,
}) => {
  await seed(request);
  await setupDeckDisplay(page, { cardCount: 4 });
  await connect(page);
  await page.route(
    `${SUPABASE}/rest/v1/rpc/set_deck_printings`,
    (route) => route.fulfill({ status: 503, json: { message: 'offline' } }),
    { times: 1 },
  );
  await choose(page);
  await expect(page.getByRole('alert')).toContainText(
    'Could not save this printing',
  );
  expect(
    (
      await (
        await db(
          request,
          `card_list_items?oracle_id=eq.${card.oracle_id}&list_id=eq.${displayDeckId}`,
        )
      ).json()
    )[0].printing_id,
  ).toBeNull();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Use printing', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: card.name, exact: true }),
  ).toContainText('New Test Set #123 Foil');
  await expect(page.getByRole('dialog')).toHaveCount(1);
});

test('mobile browser draft retains printing and finish after reload without account writes', async ({
  page,
  request,
}) => {
  await seed(request);
  await page.setViewportSize({ width: 390, height: 844 });
  await setupDeckDisplay(page, { cardCount: 4 });
  const requests = await connect(page, 'anon');
  await page.route(`${BACKEND}/cards/cards-by-names`, (route) =>
    route.fulfill({ json: cards }),
  );
  const draft = emptyGuestDeck();
  draft.cards = [{ name: card.name, quantity: 1, board: 'Mainboard' }];
  await page.evaluate(
    (draft) =>
      localStorage.setItem(
        'cardmystic-guest-decks-v2',
        JSON.stringify({ version: 2, activeIndex: 0, decks: [draft] }),
      ),
    draft,
  );
  await gotoHydrated(page, '/build');
  await choose(page);
  await page.screenshot({
    path: '.cache/printing-picker-mobile.png',
    fullPage: false,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('dialog', { name: card.name, exact: true }),
  ).toContainText('New Test Set #123 Foil');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.reload();
  await expect(
    page.locator('img[src*="selected-art.jpg"]').first(),
  ).toBeVisible();
  const saved = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('cardmystic-guest-decks-v2')!).decks[0]
        .cards[0],
  );
  expect(saved).toMatchObject({ printingId, finish: 'foil' });
  expect(requests.filter((url) => url.startsWith('rpc/'))).toHaveLength(0);
});

test('public readers see the saved printing without an edit action', async ({
  page,
  request,
}) => {
  await seed(request);
  await db(
    request,
    'rpc/set_deck_printings',
    'POST',
    {
      p_list: displayDeckId,
      p_items: [
        {
          oracle_id: card.oracle_id,
          board: 'Mainboard',
          printing_id: printingId,
          finish: 'foil',
        },
      ],
    },
    'authenticated',
  );
  const fixture = await setupDeckDisplay(page, { owner: false, cardCount: 4 });
  await connect(page, 'anon');
  await page.route(
    `${BACKEND}/supabase/card-lists/view/${displayDeckId}`,
    async (route) => {
      const items = await (
        await db(
          request,
          `card_list_items?list_id=eq.${displayDeckId}`,
          'GET',
          undefined,
          'anon',
        )
      ).json();
      await route.fulfill({
        json: {
          decklist: fixture.deck,
          items,
          owner: {
            id: FAKE_USER.id,
            username: 'Display Tester',
            avatar_card_name: null,
            is_featured: false,
          },
        },
      });
    },
  );
  await page.reload();
  await expect(
    page.locator('img[src*="selected-art.jpg"]').first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: `Options for ${card.name}`, exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('New Test Set #123');
  await expect(
    page.getByRole('button', { name: 'Change printing', exact: true }),
  ).toHaveCount(0);
});

test('saving a browser draft to an account persists its printing before clearing local storage', async ({
  page,
  request,
}) => {
  await seed(request);
  await setupDeckDisplay(page, { cardCount: 4 });
  await connect(page);
  await page.route(`${BACKEND}/cards/cards-by-names`, (route) =>
    route.fulfill({ json: cards }),
  );
  await page.route(`${BACKEND}/supabase/card-lists/create`, (route) =>
    route.fulfill({ json: { id: displayDeckId } }),
  );
  await page.route(`${BACKEND}/supabase/card-lists/bulk-edit`, (route) =>
    route.fulfill({
      json: { addedCount: 1, removedCount: 0, invalidCardNames: [] },
    }),
  );
  const draft = emptyGuestDeck();
  draft.cards = [
    {
      name: card.name,
      quantity: 1,
      board: 'Mainboard',
      printingId,
      finish: 'foil',
    },
  ];
  await page.evaluate(
    (draft) =>
      localStorage.setItem(
        'cardmystic-guest-decks-v2',
        JSON.stringify({ version: 2, activeIndex: 0, decks: [draft] }),
      ),
    draft,
  );
  await gotoHydrated(page, '/build');
  await expect(
    page.locator('img[src*="selected-art.jpg"]').first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Save deck to account', exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/lists/${displayDeckId}`));
  await expect(
    page.locator('img[src*="selected-art.jpg"]').first(),
  ).toBeVisible();
  expect(
    (
      await (
        await db(
          request,
          `card_list_items?oracle_id=eq.${card.oracle_id}&list_id=eq.${displayDeckId}`,
        )
      ).json()
    )[0],
  ).toMatchObject({ printing_id: printingId, finish: 'foil' });
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('cardmystic-guest-decks-v2')!).decks[0]
          .cards,
    ),
  ).toEqual([]);
});

test('printing picker loads further pages and filters by set name', async ({
  page,
  request,
}) => {
  await seed(request);
  await db(request, 'rpc/sync_card_printings', 'POST', {
    p_sets: [{ code: 'testpages', name: 'Older Test Set' }],
    p_rows: Array.from({ length: 48 }, (_, index) => ({
      ...printing,
      id: `45000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      set_code: 'testpages',
      released_at: '2025-01-01',
      collector_number: String(100 + index),
    })),
  });
  try {
    await setupDeckDisplay(page, { cardCount: 4 });
    await connect(page);
    await page
      .getByRole('button', { name: `Options for ${card.name}`, exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Change printing', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'Load more printings', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Older Test Set #147', exact: true }),
    ).toBeAttached();
    await expect(
      page.getByRole('button', { name: 'Load more printings' }),
    ).toHaveCount(0);
    await page.getByPlaceholder('Filter by set name').fill('New Test');
    await expect(
      page.getByRole('button', { name: /^New Test Set #/ }),
    ).toHaveCount(1);
    await expect(
      page.getByRole('button', { name: 'New Test Set #123', exact: true }),
    ).toBeVisible();
  } finally {
    await db(request, 'card_printings?set_code=eq.testpages', 'DELETE');
  }
});
