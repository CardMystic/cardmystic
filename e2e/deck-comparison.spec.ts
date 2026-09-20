import { createRequire } from 'node:module';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

const require = createRequire(import.meta.url);
async function expectPlus(icon: Locator, collection = 'heroicons') {
  const body = require('@iconify-json/' + collection + '/icons.json').icons.plus
    .body as string;
  const path = body.match(/d="([^"]+)"/)![1];
  await expect(icon).toBeVisible();
  await expect
    .poll(() =>
      icon.evaluate((element) =>
        decodeURIComponent(getComputedStyle(element).maskImage),
      ),
    )
    .toContain(path);
}

const listId = '10000000-0000-4000-8000-000000000001';
const otherId = '10000000-0000-4000-8000-000000000002';
const cardNames = [
  'Sol Ring',
  'Island',
  'Lightning Bolt',
  'Counterspell',
  'Forest',
];
const ids = cardNames.map((_, i) => '20000000-0000-4000-8000-00000000000' + i);
function imageUris(id: string, face = 'front') {
  const uri = (size: string) =>
    `https://cards.scryfall.io/${size}/${face}/2/0/${id}.jpg`;
  return {
    small: uri('small'),
    normal: uri('normal'),
    large: uri('large'),
    png: uri('png'),
    art_crop: uri('art_crop'),
    border_crop: uri('border_crop'),
  };
}
const cards = cardNames.map((name, i) => ({
  id: ids[i],
  oracle_id: ids[i],
  name,
  object: 'card',
  layout: i === 4 ? 'transform' : 'normal',
  lang: 'en',
  mana_cost: i === 0 ? '{1}' : '',
  cmc: i === 0 ? 1 : 0,
  type_line: [
    'Artifact',
    'Basic Land — Island',
    'Instant',
    'Instant',
    'Basic Land — Forest',
  ][i],
  colors: [],
  color_identity: [],
  keywords: [],
  legalities: { commander: 'legal' },
  oracle_text: '',
  rarity: 'common',
  set: 'test',
  set_name: 'Test',
  collector_number: String(i),
  prices: { usd: '1.00', usd_foil: null, eur: null, tix: null },
  image_uris: i === 4 ? undefined : imageUris(ids[i]),
  card_faces:
    i === 4
      ? [
          {
            object: 'card_face',
            name: 'Forest',
            type_line: 'Basic Land — Forest',
            image_uris: imageUris(ids[i]),
          },
          {
            object: 'card_face',
            name: 'Forest Back',
            type_line: 'Land',
            image_uris: imageUris(ids[i], 'back'),
          },
        ]
      : undefined,
  games: ['paper'],
  finishes: ['nonfoil'],
  released_at: '2024-01-01',
  scryfall_uri: 'https://scryfall.com',
}));
const deck = {
  id: listId,
  name: 'Comparison test deck',
  description: '',
  format: 'Any',
  commanders: [],
  avatar_card_name: null,
  user_id: FAKE_USER.id,
  username: 'Tester',
  color_ratios: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 1 },
  visibility: 'private',
  created_at: '2026-01-01',
  updated_at: null,
  like_count: 0,
  save_count: 0,
  view_count: 0,
  comment_count: 0,
};
type Item = {
  id: string;
  oracle_id: string;
  num_copies: number;
  board: string;
  is_commander: boolean;
};
function item(index: number, quantity: number, board = 'Mainboard'): Item {
  return {
    id: ids[index] + board,
    oracle_id: ids[index],
    num_copies: quantity,
    board,
    is_commander: false,
  };
}
async function setup(page: Page, failCatalog = false) {
  let items = [item(0, 1), item(1, 2), item(2, 1), item(0, 4, 'Sideboard')];
  let failNextAdd = false;
  let writeGate: Promise<void> | null = null;
  const writes: string[] = [];
  await page.route('https://cards.scryfall.io/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="488" height="680"><rect width="488" height="680" fill="green"/></svg>',
    }),
  );
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: {} }));
  await page.route(SUPABASE + '/rest/v1/**', (route) =>
    route.fulfill({ json: [] }),
  );
  await mockSupabaseAuth(page);
  await page.route(SUPABASE + '/rest/v1/profiles**', (route) =>
    route.fulfill({ json: { id: FAKE_USER.id, username: 'Tester' } }),
  );
  await page.route(SUPABASE + '/rest/v1/preferences**', (route) =>
    route.fulfill({
      json: {
        deck_view: 'text',
        deck_group_by: 'type',
        deck_sort_by: 'name',
        deck_sort_direction: 'asc',
      },
    }),
  );
  await page.addInitScript(
    ({ key, user, token }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          access_token: token,
          refresh_token: 'fake',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user,
        }),
      );
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            (window as unknown as { copied: string }).copied = text;
          },
        },
      });
    },
    {
      key: 'sb-' + new URL(SUPABASE).hostname.split('.')[0] + '-auth-token',
      user: FAKE_USER,
      token: fakeJwt(),
    },
  );
  await page.route(BACKEND + '/bulkdata/card-names.min.json', (route) =>
    route.fulfill({ json: cardNames }),
  );
  await page.route(
    BACKEND + '/bulkdata/card-name-to-oracle-id.min.json',
    (route) =>
      failCatalog
        ? route.fulfill({
            status: 503,
            json: { message: 'Catalog unavailable' },
          })
        : route.fulfill({
            json: Object.fromEntries(
              cardNames.map((name, i) => [name.toLowerCase(), ids[i]]),
            ),
          }),
  );
  await page.route(BACKEND + '/bulkdata/commanders.min.json', (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(BACKEND + '/supabase/card-lists/mine/' + listId, (route) =>
    route.fulfill({ json: { decklist: deck } }),
  );
  await page.route(BACKEND + '/supabase/card-lists/view/**', (route) =>
    route.fulfill({ status: 404, json: {} }),
  );
  await page.route(BACKEND + '/supabase/card-lists/view/' + otherId, (route) =>
    route.fulfill({
      json: {
        decklist: {
          ...deck,
          id: otherId,
          name: 'Public reference',
          visibility: 'public',
        },
        items: [item(0, 3), item(3, 2), item(4, 1)],
        owner: {
          id: FAKE_USER.id,
          username: 'Tester',
          avatar_card_name: null,
          is_featured: false,
        },
      },
    }),
  );
  await page.route(SUPABASE + '/rest/v1/card_list_items**', async (route) => {
    const url = new URL(route.request().url());
    const board = url.searchParams.get('board')?.replace('eq.', '');
    const oracleId = url.searchParams.get('oracle_id')?.replace('eq.', '');
    if (route.request().method() === 'DELETE') {
      const gate = writeGate;
      writeGate = null;
      await gate;
      writes.push('remove');
      const removed = items.filter(
        (row) => row.oracle_id === oracleId && (!board || row.board === board),
      );
      items = items.filter((row) => !removed.includes(row));
      return route.fulfill({ json: removed });
    }
    return route.fulfill({ json: items });
  });
  await page.route(BACKEND + '/cards/cards-by-oracle-ids', (route) => {
    const requested: string[] = route.request().postDataJSON().oracleIds;
    return route.fulfill({
      json: cards.filter((card) => requested.includes(card.oracle_id)),
    });
  });
  await page.route(
    BACKEND + '/supabase/card-lists/add-cards-by-name',
    async (route) => {
      const gate = writeGate;
      writeGate = null;
      await gate;
      if (failNextAdd) {
        failNextAdd = false;
        return route.fulfill({
          status: 500,
          json: { message: 'Test add failed' },
        });
      }
      writes.push('add');
      const body = route.request().postDataJSON();
      for (const line of body.cardNames as string[]) {
        const match = line.match(/^(\d+) (.+)$/)!;
        const index = cardNames.indexOf(match[2]);
        expect(index).toBeGreaterThanOrEqual(0);
        items.push(item(index, Number(match[1]), body.board));
      }
      return route.fulfill({
        json: {
          addedCount: body.cardNames.length,
          updatedCount: 0,
          invalidCardNames: [],
        },
      });
    },
  );
  await page.route(
    BACKEND + '/supabase/card-lists/update-num-copies',
    (route) => {
      writes.push('count');
      const body = route.request().postDataJSON();
      const index = cardNames.indexOf(body.cardName);
      const row = items.find(
        (row) => row.oracle_id === ids[index] && row.board === body.fromBoard,
      )!;
      row.num_copies = body.numCopies;
      return route.fulfill({
        json: { cardName: body.cardName, numCopies: body.numCopies },
      });
    },
  );
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
    page.getByRole('button', { name: 'Compare decks', exact: true }),
  ).toBeEnabled();
  return {
    holdNextWrite: () => {
      let release!: () => void;
      writeGate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return release;
    },
    items: () => items,
    recoverCatalog: () => {
      failCatalog = false;
    },
    writes,
    failAdd: () => {
      failNextAdd = true;
    },
  };
}

test('comparison actions update the diff and preserve collapsed groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  const state = await setup(page);
  await expectPlus(
    page
      .locator('input[placeholder="Add a card to the deck..."]:visible')
      .locator('..')
      .locator('[class~="i-heroicons:plus"]'),
  );
  const artifacts = page.getByRole('button', { name: /^Artifacts \(/ }).first();
  const lands = page.getByRole('button', { name: /^Lands \(/ }).first();
  await artifacts.click();
  await lands.click();
  await expect(artifacts).toHaveAttribute('aria-expanded', 'false');
  await page
    .getByRole('button', { name: 'Compare decks', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Compare decks',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Decklist or CardMystic URL' })
    .fill('3 Sol Ring\n2 Counterspell\n1 Forest');
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  const missing = dialog.getByRole('region', {
    name: 'Missing from your deck',
  });
  const extra = dialog.getByRole('region', { name: 'Only in your deck' });
  const differences = dialog.getByRole('list', { name: 'Card differences' });
  const rows = differences.getByRole('listitem');
  const missingRows = differences.locator('li[data-kind="missing"]');
  const extraRows = differences.locator('li[data-kind="extra"]');
  const countRows = differences.locator('li[data-kind="count"]');
  await expect(rows).toHaveCount(5);
  await expectPlus(
    differences
      .getByRole('button', { name: 'Add Counterspell', exact: true })
      .locator('[class~="i-lucide:plus"]'),
    'lucide',
  );
  const alphabeticalIds = [ids[3], ids[4], ids[1], ids[2], ids[0]];
  await expect
    .poll(() =>
      differences
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    )
    .toEqual(alphabeticalIds.map((id) => '/card/' + id));
  await expect(missingRows.first().locator(':scope > div')).toHaveClass(
    /bg-green/,
  );
  await expect(extraRows.first().locator(':scope > div')).toHaveClass(/bg-red/);
  await expect(countRows.first().locator(':scope > div')).toHaveClass(
    /bg-yellow/,
  );
  const left = await extraRows.first().locator(':scope > div').boundingBox();
  const right = await missingRows.first().locator(':scope > div').boundingBox();
  const middle = await countRows.first().locator(':scope > div').boundingBox();
  expect(left).not.toBeNull();
  expect(right).not.toBeNull();
  expect(middle).not.toBeNull();
  expect(left!.x).toBeLessThan(middle!.x);
  expect(middle!.x).toBeLessThan(right!.x);
  for (const name of cardNames) {
    const thumbnail = differences.getByRole('img', { name, exact: true });
    await thumbnail.scrollIntoViewIfNeeded();
    await expect(thumbnail).toHaveAttribute(
      'src',
      /^https:\/\/cards\.scryfall\.io\/small\/front\//,
    );
    await expect
      .poll(() =>
        thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  const forestThumbnail = differences.getByRole('img', {
    name: 'Forest',
    exact: true,
  });
  await expect(forestThumbnail).toHaveAttribute('src', imageUris(ids[4]).small);
  await expect
    .poll(() =>
      differences.evaluate((list) => list.scrollHeight > list.clientHeight),
    )
    .toBe(true);
  await differences.getByRole('link').last().scrollIntoViewIfNeeded();
  await expect
    .poll(() => differences.evaluate((list) => list.scrollTop))
    .toBeGreaterThan(0);
  await expect(
    differences.getByRole('img', { name: 'Sol Ring', exact: true }),
  ).toBeInViewport();
  await differences.getByRole('link', { name: 'Forest', exact: true }).hover();
  const previewPanel = dialog.getByRole('complementary', {
    name: 'Card preview',
  });
  const preview = previewPanel.getByRole('img', {
    name: 'Forest preview',
    exact: true,
  });
  await expect(previewPanel).toBeVisible();
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('src', imageUris(ids[4]).normal);
  await expect
    .poll(() =>
      preview.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  const previewBounds = await preview.boundingBox();
  const thumbnailBounds = await forestThumbnail.boundingBox();
  expect(previewBounds!.width).toBeGreaterThan(thumbnailBounds!.width * 3);
  await page.mouse.move(0, 0);
  await expect(preview).toBeVisible();
  const panelBeforeScroll = await previewPanel.boundingBox();
  const listBounds = await differences.boundingBox();
  expect(panelBeforeScroll!.x + panelBeforeScroll!.width).toBeLessThanOrEqual(
    listBounds!.x,
  );
  await differences.evaluate((list) => {
    list.scrollTop = list.scrollHeight;
  });
  await expect
    .poll(() => differences.evaluate((list) => list.scrollTop))
    .toBeGreaterThan(0);
  await expect(preview).toBeVisible();
  const panelAfterScroll = await previewPanel.boundingBox();
  expect(panelAfterScroll!.x).toBeCloseTo(panelBeforeScroll!.x, 0);
  expect(panelAfterScroll!.y).toBeCloseTo(panelBeforeScroll!.y, 0);
  await differences
    .getByRole('link', { name: 'Sol Ring', exact: true })
    .hover();
  const updatedPreview = previewPanel.getByRole('img', {
    name: 'Sol Ring preview',
    exact: true,
  });
  await expect(updatedPreview).toBeVisible();
  await expect(updatedPreview).toHaveAttribute('src', imageUris(ids[0]).normal);
  await expect(preview).toHaveCount(0);
  await page.mouse.move(0, 0);
  await expect(updatedPreview).toBeVisible();
  await missing
    .getByRole('button', { name: 'Copy missing from your deck' })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { copied: string }).copied),
    )
    .toBe('Counterspell\nForest');
  await extra.getByRole('button', { name: 'Copy only in your deck' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { copied: string }).copied),
    )
    .toBe('Island\nLightning Bolt');
  await differences
    .getByRole('button', { name: 'Match count for Sol Ring' })
    .click();
  await expect(countRows).toHaveCount(0);
  // Hold the response to prove the diff updates before the server replies.
  state.failAdd();
  const releaseAdd = state.holdNextWrite();
  try {
    await differences
      .getByRole('button', { name: 'Add Counterspell', exact: true })
      .click();
    await expect(missingRows).toHaveCount(1);
    await expect(
      page.getByText('Adding Counterspell…', { exact: true }),
    ).toBeVisible();
    expect(state.items().some((row) => row.oracle_id === ids[3])).toBe(false);
  } finally {
    releaseAdd();
  }
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(
    page.getByText('Review deck changes', { exact: true }),
  ).toBeVisible();
  await expect(
    differences.getByRole('button', { name: 'Add Counterspell', exact: true }),
  ).toBeEnabled();
  await differences
    .getByRole('button', { name: 'Add Counterspell', exact: true })
    .click();
  await expect(missingRows).toHaveCount(1);
  await missing.getByRole('button', { name: 'Add All', exact: true }).click();
  await expect(missingRows).toHaveCount(0);
  await expect(page.getByText('Added Forest', { exact: true })).toBeVisible();
  const releaseRemove = state.holdNextWrite();
  try {
    await differences
      .getByRole('button', { name: 'Remove Lightning Bolt', exact: true })
      .click();
    await expect(extraRows).toHaveCount(1);
    await expect(
      page.getByText('Removing Lightning Bolt…', { exact: true }),
    ).toBeVisible();
    expect(state.items().some((row) => row.oracle_id === ids[2])).toBe(true);
  } finally {
    releaseRemove();
  }
  await expect(
    page.getByText('Removed Lightning Bolt', { exact: true }),
  ).toBeVisible();
  await extra.getByRole('button', { name: 'Remove All', exact: true }).click();
  await expect(dialog.getByText('The cards and counts match.')).toBeVisible();
  expect(
    state.items().find((row) => row.board === 'Sideboard')?.num_copies,
  ).toBe(4);
  expect(
    state
      .items()
      .find((row) => row.oracle_id === ids[0] && row.board === 'Mainboard')
      ?.num_copies,
  ).toBe(3);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(artifacts).toHaveAttribute('aria-expanded', 'false');
  await expect(lands).toHaveAttribute('aria-expanded', 'false');
});

test('public URLs, validation, and board isolation work on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setup(page);
  await page
    .getByRole('button', { name: 'Compare decks', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Compare decks',
    exact: true,
  });
  const input = dialog.getByRole('textbox', {
    name: 'Decklist or CardMystic URL',
  });
  await input.fill('https://cardmystic.com/lists/' + otherId);
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(dialog.getByText(/Public reference/)).toBeVisible();
  await dialog
    .getByRole('list', { name: 'Card differences' })
    .getByRole('link', { name: 'Forest', exact: true })
    .focus();
  await expect(dialog.locator('aside[aria-label="Card preview"]')).toBeHidden();
  await expect(dialog.locator('img[alt$=" preview"]:visible')).toHaveCount(0);
  await input.fill('Sol Ring\nUnknown Card');
  await expect(
    dialog.getByRole('button', { name: 'Remove All', exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Unrecognized');
  await input.fill('https://example.com/lists/' + otherId);
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('CardMystic');
  expect(state.writes).toHaveLength(0);
  await dialog.getByRole('combobox', { name: 'Comparison board' }).click();
  await page.getByRole('option', { name: 'Sideboard', exact: true }).click();
  await input.fill('99 Island\nSideboard\n2 Sol Ring\n1 Forest');
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  await dialog
    .getByRole('button', { name: 'Match count for Sol Ring' })
    .click();
  await dialog.getByRole('button', { name: 'Add Forest', exact: true }).click();
  await expect(dialog.getByText('The cards and counts match.')).toBeVisible();
  expect(
    state
      .items()
      .find((row) => row.oracle_id === ids[0] && row.board === 'Mainboard')
      ?.num_copies,
  ).toBe(1);
  expect(
    state
      .items()
      .find((row) => row.oracle_id === ids[0] && row.board === 'Sideboard')
      ?.num_copies,
  ).toBe(2);
});

for (const width of [1280, 390]) {
  test(
    'add-card catalog failure stops spinning and can retry at width ' + width,
    async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const state = await setup(page, true);
      const input = page.locator(
        'input[placeholder="Add a card to the deck..."]:visible',
      );
      await expect(input).toBeDisabled();
      await expectPlus(
        input.locator('..').locator('[class~="i-heroicons:plus"]'),
      );
      await expect(page.getByRole('alert')).toContainText(
        'Could not load the card catalog.',
        { timeout: 15000 },
      );
      await expect(input.locator('..').locator('.animate-spin')).toHaveCount(0);
      state.recoverCatalog();
      await page.getByRole('button', { name: 'Retry card catalog' }).click();
      await expect(input).toBeEnabled();
      await expectPlus(
        input.locator('..').locator('[class~="i-heroicons:plus"]'),
      );
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(input.locator('..').locator('.animate-spin')).toHaveCount(0);
      await input.fill('Fore');
      await expect(
        page.getByRole('option', { name: 'Forest', exact: true }),
      ).toBeVisible();
    },
  );
}

test('comparison skips unknown names and filters all card categories', async ({
  page,
}) => {
  await setup(page);
  await page
    .getByRole('button', { name: 'Compare decks', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Compare decks',
    exact: true,
  });
  const input = dialog.getByRole('textbox', {
    name: 'Decklist or CardMystic URL',
  });
  await input.fill('1 Sol Ring\n1 Island\n2 Counterspell\nUnknown Card');
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Unrecognized cards (skipped): Unknown Card',
  );
  const list = dialog.getByRole('list', { name: 'Card differences' });
  await expect(list.getByRole('listitem')).toHaveCount(3);
  const show = dialog.getByRole('combobox', { name: 'Show cards' });
  await expect(show).toContainText('Differences (3)');
  await expect(list.getByRole('listitem')).toHaveCount(3);
  await expect(list.locator('li[data-kind="both"]')).toHaveCount(0);
  const filterBounds = await show.boundingBox();
  const columnBounds = await show.locator('../..').boundingBox();
  const headingBounds = await dialog
    .getByRole('heading', { name: 'Only in your deck (1)', exact: true })
    .boundingBox();
  const labelBounds = await show
    .locator('..')
    .locator('span')
    .first()
    .boundingBox();
  expect(filterBounds!.width + labelBounds!.width).toBeGreaterThan(
    columnBounds!.width * 0.9,
  );
  expect(
    Math.abs(
      filterBounds!.y +
        filterBounds!.height / 2 -
        (labelBounds!.y + labelBounds!.height / 2),
    ),
  ).toBeLessThan(2);
  expect(filterBounds!.y + filterBounds!.height).toBeLessThan(headingBounds!.y);
  for (const [label, kind] of [
    ['Only in Your Deck (1)', 'extra'],
    ['Different Copy Counts (1)', 'count'],
    ['Missing in Your Deck (1)', 'missing'],
    ['In Both Decks (1)', 'both'],
  ]) {
    await show.click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByRole('listitem')).toHaveAttribute('data-kind', kind);
  }
  await expect(
    list.getByRole('link', { name: 'Sol Ring', exact: true }),
  ).toBeVisible();
  await expect(list.getByRole('button')).toHaveCount(0);
  await expect(list.getByRole('listitem').locator(':scope > div')).toHaveClass(
    /bg-neutral/,
  );
  await show.click();
  await page.getByRole('option', { name: 'All (4)', exact: true }).click();
  await expect(list.getByRole('listitem')).toHaveCount(4);
  await input.fill('Unknown Card');
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(
    dialog.getByText('No recognized cards found for Mainboard.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(list).toHaveCount(0);
});

test('comparison accepts another action while saving without resizing', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1400 });
  const state = await setup(page);
  await page
    .getByRole('button', { name: 'Compare decks', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Compare decks',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: 'Decklist or CardMystic URL' })
    .fill('3 Sol Ring\n2 Counterspell\n1 Forest');
  await dialog.getByRole('button', { name: 'Compare', exact: true }).click();
  const list = dialog.getByRole('list', { name: 'Card differences' });
  await expect(list.getByRole('listitem')).toHaveCount(5);
  const deckCount = dialog.getByText(/Cards In Your Deck:/);
  await expect(deckCount).toHaveText('Cards In Your Deck: 8');
  await list.getByRole('link', { name: 'Counterspell', exact: true }).hover();
  const before = await dialog.boundingBox();
  const listBefore = await list.boundingBox();
  const release = state.holdNextWrite();
  try {
    await list
      .getByRole('button', { name: 'Add Counterspell', exact: true })
      .click();
    await expect(
      list.getByRole('button', { name: 'Add Counterspell', exact: true }),
    ).toHaveCount(0);
    await expect(
      list.getByRole('button', { name: 'Remove Lightning Bolt', exact: true }),
    ).toBeEnabled();
    await list
      .getByRole('button', { name: 'Remove Lightning Bolt', exact: true })
      .click();
    await expect(
      list.getByRole('link', { name: 'Lightning Bolt', exact: true }),
    ).toHaveCount(0);
    await expect(deckCount).toHaveText('Cards In Your Deck: 9');
    expect(state.items().some((row) => row.oracle_id === ids[3])).toBe(false);
    expect(state.items().some((row) => row.oracle_id === ids[2])).toBe(true);
    const during = await dialog.boundingBox();
    expect(during!.height).toBeCloseTo(before!.height, 0);
    expect(during!.width).toBeCloseTo(before!.width, 0);
    expect((await list.boundingBox())!.height).toBeCloseTo(
      listBefore!.height,
      0,
    );
  } finally {
    release();
  }
  await expect(
    page.getByText('Removed Lightning Bolt', { exact: true }),
  ).toBeVisible();
  await expect(deckCount).toHaveText('Cards In Your Deck: 9');
  expect(state.items().some((row) => row.oracle_id === ids[3])).toBe(true);
  expect(state.items().some((row) => row.oracle_id === ids[2])).toBe(false);
  expect((await dialog.boundingBox())!.height).toBeCloseTo(before!.height, 0);
});
