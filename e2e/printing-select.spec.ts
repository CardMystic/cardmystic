import { expect, test, type Page } from '@playwright/test';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';
import {
  createDisplayCards,
  displayImageUris,
  setupDeckDisplay,
} from './utils/deckDisplay';
import { emptyGuestDeck } from '../utils/guestDeck';

const cards = createDisplayCards(4);
const card = {
  ...cards[3],
  oracle_text: 'Draw a card.',
  artist: 'Original Artist',
};
const printing = {
  id: '44000000-0000-4000-8000-000000000001',
  oracle_id: card.oracle_id,
  set_code: 'new',
  collector_number: '123',
  lang: 'en',
  released_at: '2026-01-01',
  finish_mask: 3,
  image_paths: ['front/4/4/selected-art.jpg'],
  flavor_name: null,
  tcgplayer_id: 123,
  usd_cents: 250,
  foil_cents: 950,
  etched_cents: null,
  card_printing_sets: { name: 'New Test Set' },
};
const original = {
  ...printing,
  id: card.id,
  set_code: 'test',
  collector_number: '4',
  card_printing_sets: { name: 'Test' },
};
async function navigate(page: Page, path: string) {
  await page.evaluate((target) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(target);
  }, path);
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'cm.cookie-consent.v1',
      JSON.stringify({
        analytics: false,
        advertising: false,
        updatedAt: Date.now(),
      }),
    ),
  );
});
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

for (const account of ['guest', 'signed in'] as const) {
  test(`search loads the saved art first for a ${account} user and can edit it in the card modal`, async ({
    page,
  }) => {
    if (account === 'guest')
      await page.setViewportSize({ width: 390, height: 650 });
    if (account === 'signed in') await setupDeckDisplay(page, { cardCount: 4 });
    else
      await page.addInitScript(
        ({ name, printingId }) => {
          localStorage.setItem(
            'cardmystic-guest-deck-printing:' + name.toLowerCase(),
            JSON.stringify({ printingId, finish: 'foil' }),
          );
        },
        { name: card.name, printingId: printing.id },
      );
    await page.route(BACKEND + '/search/colbert', (route) =>
      route.fulfill({
        json: [card, cards[2]].map((data) => ({
          card_name: data.name,
          card_data: data,
          ai_normalized_score: 0.8,
        })),
      }),
    );
    let saved = true;
    let indexReads = 0;
    await page.route(
      SUPABASE + '/rest/v1/user_default_printings**',
      (route) => {
        if (route.request().method() === 'DELETE') saved = false;
        if (!new URL(route.request().url()).searchParams.has('oracle_id'))
          indexReads++;
        return route.fulfill({
          json: saved
            ? [
                {
                  oracle_id: card.oracle_id,
                  printing_id: printing.id,
                  finish: 'foil',
                },
              ]
            : [],
        });
      },
    );
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    let batchReads = 0;
    const canonicalRequests: string[] = [];
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      if (/hydration.*mismatch/i.test(msg.text()))
        hydrationErrors.push(msg.text());
    });
    page.on('request', (req) => {
      if (
        req.url().includes('cards.scryfall.io/') &&
        req.url().includes(card.id)
      )
        canonicalRequests.push(req.url());
    });
    await page.route(SUPABASE + '/rest/v1/card_printings**', async (route) => {
      if (new URL(route.request().url()).searchParams.has('id')) {
        batchReads++;
        await ready;
      }
      return route.fulfill({ json: [printing] });
    });
    try {
      await gotoHydrated(page, '/search/all/smart?query=draw+cards');
      await expect.poll(() => batchReads).toBe(1);
      const grid = page.getByTestId('search-results-grid');
      await expect(
        grid.getByRole('button', { name: 'Options for Island' }),
      ).toBeVisible();
      expect(canonicalRequests).toEqual([]);
      release();
      const tile = grid.getByRole('button', {
        name: 'Options for ' + card.name,
        exact: true,
      });
      await expect(tile.locator('img')).toHaveAttribute(
        'src',
        /selected-art\.jpg/,
      );
      await expect(tile).toHaveAttribute('data-card-finish', 'foil');
      expect(canonicalRequests).toEqual([]);
      expect(indexReads).toBe(account === 'guest' ? 0 : 1);
      await page.reload();
      await expect(tile.locator('img')).toHaveAttribute(
        'src',
        /selected-art\.jpg/,
      );
      expect(canonicalRequests).toEqual([]);
      await tile.click();
      const modal = page.getByRole('dialog', { name: card.name, exact: true });
      const edit = modal.getByRole('button', {
        name: 'Set Default Printing',
        exact: true,
      });
      await edit.click({ trial: true });
      const bounds = (await edit.boundingBox())!;
      const image = (await modal
        .getByRole('img', { name: card.name, exact: true })
        .boundingBox())!;
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(image.y);
      if (account === 'guest') expect(image.width).toBeGreaterThan(192);
      await edit.focus();
      await page.keyboard.press('Enter');
      const picker = page.getByRole('dialog', {
        name: 'Choose printing: ' + card.name,
        exact: true,
      });
      await picker
        .getByRole('button', { name: 'Clear default printing' })
        .click();
      await expect(picker).toBeHidden();
      await expect(modal).toBeVisible();
      await expect(edit).toBeFocused();
      await modal.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(tile.locator('img')).toHaveAttribute(
        'src',
        new RegExp(card.id),
      );
      expect(batchReads).toBe(2);
      expect(hydrationErrors).toEqual([]);
    } finally {
      release();
    }
  });
}

test('card details uses paginated catalog thumbnails and fetches only the selected full printing', async ({
  page,
}) => {
  await setupDeckDisplay(page, { cardCount: 4 });
  await page.route(`${BACKEND}/cards/with-llm/${card.oracle_id}`, (route) =>
    route.fulfill({ json: { card, llm: null } }),
  );
  let catalogCalls = 0;
  let saved: { printing_id: string; finish: string } | null = null;
  await page.route(`${SUPABASE}/rest/v1/user_default_printings**`, (route) => {
    const method = route.request().method();
    if (method === 'POST') {
      const row = route.request().postDataJSON();
      expect(row.oracle_id).toBe(card.oracle_id);
      expect(row.user_id).toBeTruthy();
      saved = { printing_id: row.printing_id, finish: row.finish };
    } else if (method === 'DELETE') saved = null;
    return route.fulfill({ json: method === 'GET' && saved ? [saved] : [] });
  });
  let filtered = false;
  await page.route(`${SUPABASE}/rest/v1/card_printings**`, (route) => {
    catalogCalls++;
    const url = new URL(route.request().url());
    filtered ||= !!url.searchParams.get('card_printing_sets.name');
    const rows = Array.from({ length: 48 }, (_, i) => ({
      ...printing,
      id: `44000000-0000-4000-8000-${String(i + 2).padStart(12, '0')}`,
      collector_number: String(i + 200),
    }));
    return route.fulfill({
      json: url.searchParams.has('card_printing_sets.name')
        ? [original]
        : url.searchParams.get('offset') === '48'
          ? [printing, original]
          : rows,
    });
  });
  const detailRequests: string[] = [];
  let fail = true;
  await page.route('https://api.scryfall.com/**', (route) => {
    detailRequests.push(route.request().url());
    return fail
      ? route.fulfill({ status: 400, json: { error: 'test failure' } })
      : route.fulfill({
          json: {
            ...card,
            id: printing.id,
            set: 'new',
            set_name: 'New Test Set',
            collector_number: '123',
            artist: 'Selected Artist',
            image_uris: displayImageUris('selected-art'),
            prices: {
              usd: '2.50',
              usd_foil: '9.50',
              eur: '2.22',
              eur_foil: null,
              tix: null,
            },
          },
        });
  });
  await navigate(page, `/card/${card.oracle_id}`);
  const selector = page.getByRole('button', {
    name: 'Choose Default Printing',
    exact: true,
  });
  await expect(selector).toBeVisible();
  const backdrop = page.locator('.card-page-background');
  await expect(backdrop).toHaveAttribute('src', card.image_uris!.art_crop);
  await expect(
    page.getByRole('navigation', { name: 'Browsing history' }),
  ).toHaveCount(1);
  await expect(page.locator('.card-results')).toBeVisible();
  expect(catalogCalls).toBe(0);
  expect(detailRequests).toHaveLength(0);
  const cardImage = page.locator('.card-detail-art .card-image');
  await expect(cardImage).toHaveJSProperty('complete', true);
  const originalImageBounds = await cardImage.boundingBox();
  await selector.click();
  await page.getByRole('button', { name: 'Load more printings' }).click();
  const picker = page.getByRole('dialog', {
    name: `Choose printing: ${card.name}`,
    exact: true,
  });
  await expect(picker).toHaveAccessibleDescription(
    'Set the default printing to use whenever this card gets added to a deck.',
  );
  const option = picker.getByRole('button', {
    name: 'New Test Set #123',
    exact: true,
  });
  await expect(option.locator('img')).toHaveAttribute(
    'src',
    'https://cards.scryfall.io/small/front/4/4/selected-art.jpg',
  );
  await expect(option.locator('img')).toHaveJSProperty('naturalWidth', 488);
  await page.screenshot({
    path: '.cache/shared-printing-details.png',
    animations: 'disabled',
  });
  await option.click();
  await picker
    .getByRole('button', { name: 'Set Default Printing', exact: true })
    .click();
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'Could not load this printing.' }),
  ).toBeVisible();
  await expect(picker).toBeVisible();
  await expect(page.locator('.set-name')).toHaveText('Test');
  await expect(page.getByAltText('Card image').first()).toHaveAttribute(
    'src',
    card.image_uris!.normal,
  );
  fail = false;
  await picker
    .getByRole('button', { name: 'Set Default Printing', exact: true })
    .click();
  await expect(picker).toBeHidden();
  await expect(page.locator('.artist-name')).toHaveText('Selected Artist');
  await expect(cardImage).toHaveAttribute(
    'src',
    displayImageUris('selected-art').normal,
  );
  await expect(cardImage).toHaveJSProperty('complete', true);
  const selectedImageBounds = await cardImage.boundingBox();
  expect(selectedImageBounds!.width).toBeCloseTo(originalImageBounds!.width, 0);
  expect(selectedImageBounds!.height).toBeCloseTo(
    originalImageBounds!.height,
    0,
  );
  await expect(page.locator('.set-name')).toHaveText('New Test Set');
  await expect(
    page.getByRole('link', { name: 'New Test Set', exact: true }),
  ).toHaveAttribute('href', '/sets/new');
  await expect(backdrop).toHaveAttribute(
    'src',
    displayImageUris('selected-art').art_crop,
  );
  await page.screenshot({
    path: '.cache/card-detail-background-desktop.png',
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(selector).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '.cache/card-detail-background-mobile.png',
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.locator('.price-item').filter({ hasText: 'EUR' }).first(),
  ).toContainText('2.22');
  await selector.click();
  await page.getByPlaceholder('Filter by set name').fill('Test');
  await expect.poll(() => filtered).toBe(true);
  await picker.getByRole('button', { name: 'Test #4', exact: true }).click();
  await picker
    .getByRole('button', { name: 'Set Default Printing', exact: true })
    .click();
  await expect(picker).toBeHidden();
  await expect(page.locator('.set-name')).toHaveText('Test');
  await selector.click();
  await expect(option).toBeVisible();
  await option.click();
  await picker
    .getByRole('button', { name: 'Set Default Printing', exact: true })
    .click();
  await expect(picker).toBeHidden();
  await expect(page.locator('.set-name')).toHaveText('New Test Set');
  expect(detailRequests).toEqual(
    Array(2).fill(`https://api.scryfall.com/cards/${printing.id}`),
  );
  expect(saved).toEqual({ printing_id: printing.id, finish: 'nonfoil' });
  await gotoHydrated(page, '/about');
  let releaseDetail!: () => void;
  const detailReady = new Promise<void>((resolve) => {
    releaseDetail = resolve;
  });
  await page.route(
    `https://api.scryfall.com/cards/${printing.id}`,
    async (route) => {
      await detailReady;
      await route.fallback();
    },
  );
  const detailRequest = page.waitForRequest(
    `https://api.scryfall.com/cards/${printing.id}`,
  );
  try {
    await navigate(page, `/card/${card.oracle_id}`);
    await detailRequest;
    await expect(cardImage).not.toHaveAttribute('src');
    await expect(backdrop).toHaveCount(0);
  } finally {
    releaseDetail();
  }
  await expect(page.locator('.set-name')).toHaveText('New Test Set');
  await expect(cardImage).toHaveAttribute('src', /selected-art/);
  await selector.click();
  await picker.getByRole('button', { name: 'Clear default printing' }).click();
  await expect(picker).toBeHidden();
  expect(saved).toBeNull();
  await expect(page.locator('.set-name')).toHaveText('Test');
});

test('a guest printing choice is used when adding the card to a browser draft', async ({
  page,
}) => {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: {} }));
  await page.route(BACKEND + '/cards/with-llm/*', (route) =>
    route.fulfill({ json: { card, llm: null } }),
  );
  await page.route(BACKEND + '/cards/cards-by-oracle-ids', (route) =>
    route.fulfill({ json: [card] }),
  );
  await page.route(SUPABASE + '/rest/v1/card_printings**', (route) =>
    route.fulfill({ json: [original] }),
  );
  await gotoHydrated(page, '/about');
  await navigate(page, `/card/${card.oracle_id}`);
  await page.getByRole('button', { name: 'Choose Default Printing' }).click();
  const picker = page.getByRole('dialog', {
    name: `Choose printing: ${card.name}`,
  });
  await expect(picker).toHaveAccessibleDescription(
    'Set the default printing to use whenever this card gets added to a deck.',
  );
  await picker.getByRole('button', { name: 'Test #4' }).click();
  await picker.getByRole('combobox', { name: 'Printing finish' }).click();
  await page.getByRole('option', { name: 'Foil', exact: true }).click();
  await picker
    .getByRole('button', { name: 'Set Default Printing', exact: true })
    .click();
  await expect(picker).toBeHidden();
  await gotoHydrated(page, '/about');
  await navigate(page, `/card/${card.oracle_id}`);
  await page
    .getByRole('button', { name: `Options for ${card.name}`, exact: true })
    .first()
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add to Deck', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Add to browser draft', exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(
            localStorage.getItem('cardmystic-guest-decks-v2') || 'null',
          )?.decks[0].cards[0],
      ),
    )
    .toMatchObject({ name: card.name, printingId: card.id, finish: 'foil' });
});

test('mobile draft returns to the card modal after closing the picker or saving a finish', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setupDeckDisplay(page, { cardCount: 4 });
  await page.route(`${BACKEND}/cards/cards-by-names`, (route) =>
    route.fulfill({ json: cards }),
  );
  let catalogCalls = 0;
  await page.route(`${SUPABASE}/rest/v1/card_printings**`, (route) => {
    catalogCalls++;
    return route.fulfill({ json: [printing] });
  });
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
  await page
    .getByRole('button', { name: `Options for ${card.name}`, exact: true })
    .click();
  const actions = page.getByRole('dialog', { name: card.name, exact: true });
  const selector = actions.getByRole('button', {
    name: 'Set Printing',
    exact: true,
  });
  expect(catalogCalls).toBe(0);
  await expect(actions.getByText('Mainboard', { exact: true })).toHaveCount(0);
  await selector.focus();
  await selector.press('Enter');
  const picker = page.getByRole('dialog', {
    name: `Choose printing: ${card.name}`,
    exact: true,
  });
  await expect(actions).toBeHidden();
  await expect(picker).toBeVisible();
  await expect.poll(() => catalogCalls).toBe(1);
  await picker.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(actions).toBeVisible();
  await selector.click();
  const option = picker.getByRole('button', {
    name: 'New Test Set #123',
    exact: true,
  });
  await expect(option.locator('img')).toHaveAttribute('width', '146');
  await option.click();
  await picker
    .getByRole('combobox', { name: 'Printing finish', exact: true })
    .click();
  await page.getByRole('option', { name: 'Foil', exact: true }).click();
  await page.screenshot({
    path: '.cache/shared-printing-mobile.png',
    animations: 'disabled',
  });
  await picker
    .getByRole('button', { name: 'Use printing', exact: true })
    .click();
  await expect(picker).toBeHidden();
  await expect(actions).toBeVisible();
  await expect(actions).toContainText('New Test Set #123 Foil');
  await expect(page.locator('.card-edit-toast')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(
    page.getByRole('dialog').locator('.card-finish[data-card-finish="foil"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.list-card .card-finish[data-card-finish="foil"]'),
  ).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('cardmystic-guest-decks-v2')!).decks[0]
          .cards[0],
    ),
  ).toMatchObject({ printingId: printing.id, finish: 'foil' });
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  const surface = page.locator(
    '.list-card .card-finish[data-card-finish="foil"]',
  );
  await surface.hover();
  await expect
    .poll(() => surface.evaluate((node) => getComputedStyle(node).scale))
    .toBe('1.03');
  expect(
    await surface
      .locator('img')
      .evaluate((node) => getComputedStyle(node).transform),
  ).toBe('none');
  expect(
    await surface.evaluate(
      (node) => getComputedStyle(node, '::after').animationName,
    ),
  ).toBe('card-foil-sheen');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
