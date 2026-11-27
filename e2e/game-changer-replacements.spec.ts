import { expect, test } from '@playwright/test';
import {
  setupDeckDisplay,
  createDisplayCards,
  displayDeckId,
} from './utils/deckDisplay';
import { BACKEND } from './utils/mocks';
import { openDeckAction } from './utils/deckActions';

test('free players get ranked in-color replacements, expand rows, and reuse results', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { owner: false });
  Object.assign(state.cards[0], { game_changer: true });
  Object.assign(state.cards[1], { game_changer: true });
  state.items[0].is_commander = true;
  state.cards[2].color_identity = ['R'];
  const alternatives = createDisplayCards(14)
    .slice(3)
    .map((card) => ({
      ...card,
      game_changer: false,
    }));
  alternatives[0].color_identity = ['R'];
  alternatives[2].color_identity = [];
  let calls = 0;
  await page.route(BACKEND + '/search/game-changer-replacements', (route) => {
    calls++;
    const seed = route.request().postDataJSON().card_name;
    const cards =
      seed === state.cards[0].name
        ? [
            state.cards[0],
            {
              ...alternatives[1],
              oracle_id: '43000000-0000-4000-8000-000000000099',
              name: 'Another game changer',
              game_changer: true,
            },
            alternatives[0],
            state.cards[1],
            state.cards[2],
            ...alternatives.slice(1),
          ]
        : [state.cards[1], alternatives[0]];
    return route.fulfill({
      json: cards.map((card_data) => ({
        card_data,
        card_name: card_data.name,
      })),
    });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  expect(calls).toBe(0);
  await openDeckAction(page, 'Replace Gamechangers');
  const panel = page.getByRole('region', {
    name: 'Replace Gamechangers',
    exact: true,
  });
  const row = page.getByRole('region', {
    name: `Replacements for ${state.cards[0].name}`,
    exact: true,
  });
  await expect(row.getByRole('img')).toHaveCount(7);
  await expect(panel).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(
    await row
      .getByRole('img')
      .evaluateAll((images) =>
        images.map((image) => image.getAttribute('alt')),
      ),
  ).toEqual([
    state.cards[0].name,
    ...alternatives.slice(1, 7).map((card) => card.name),
  ]);
  await expect(
    panel.getByText('No Replacements In These Colors', { exact: true }),
  ).toBeVisible();
  await expect(row.locator('.game-changer-source > span')).toHaveCSS(
    'border-top-width',
    '3px',
  );
  await row.getByRole('button', { name: 'See more results' }).click();
  await expect(row.getByRole('img')).toHaveCount(11);
  await expect(
    row.getByRole('img', { name: 'Another game changer' }),
  ).toHaveCount(0);
  await row.getByRole('button', { name: 'Show fewer results' }).click();
  await expect(row.getByRole('img')).toHaveCount(7);
  await panel.screenshot({ path: '/tmp/cardmystic-game-changers-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(row.getByRole('img')).toHaveCount(7);
  const grid = row.locator('.replacement-cards');
  expect(await grid.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await grid.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  expect(await grid.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await row.getByRole('button', { name: 'See more results' }).click();
  await expect(row.getByRole('img')).toHaveCount(11);
  expect(
    await grid.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  expect(
    await grid.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
    ),
  ).toBe(2);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  expect(
    await grid.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await panel.screenshot({ path: '/tmp/cardmystic-game-changers-mobile.png' });
  await panel
    .getByRole('button', { name: 'Close game changer replacements' })
    .click();
  await expect(panel).toHaveCount(0);
  await openDeckAction(page, 'Replace Gamechangers');
  await expect(row.getByRole('img')).toHaveCount(7);
  expect(calls).toBe(2);
  expect(state.writes).toHaveLength(0);
  await expect(panel.getByRole('button', { name: /^Replace / })).toHaveCount(0);
  const close = panel.getByRole('button', {
    name: 'Close game changer replacements',
  });
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(panel).not.toBeVisible();
});

// This is a new two-step write flow: browser coverage must catch lost cards and
// duplicate additions when one request succeeds and the next fails.
test('owners replace mainboard copies and retry a failed cut without adding twice', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { extraCards: 1 });
  const source = state.cards[1];
  const replacement = state.catalog[3];
  Object.assign(state.cards[0], { game_changer: true });
  Object.assign(source, { game_changer: true });
  Object.assign(replacement, { game_changer: false });
  state.items[0].is_commander = true;
  state.items[1].num_copies = 3;
  state.items.push({
    ...state.items[1],
    id: 'sideboard-copy',
    board: 'Sideboard',
    num_copies: 2,
  });
  await page.route(BACKEND + '/search/game-changer-replacements', (route) =>
    route.fulfill({
      json: [{ card_name: replacement.name, card_data: replacement }],
    }),
  );
  let adds = 0,
    cuts = 0;
  await page.route(
    BACKEND + '/supabase/card-lists/add-cards-by-name',
    (route) => {
      adds++;
      expect(route.request().postDataJSON()).toEqual({
        listId: displayDeckId,
        board: 'Mainboard',
        cardNames: [`3 ${replacement.name}`],
      });
      if (adds === 1)
        return route.fulfill({
          status: 400,
          json: { message: 'Could not add card' },
        });
      state.items.push({
        ...state.items[1],
        id: replacement.oracle_id,
        oracle_id: replacement.oracle_id,
      });
      return route.fulfill({
        json: { addedCount: 1, updatedCount: 0, invalidCardNames: [] },
      });
    },
  );
  await page.route(BACKEND + '/supabase/card-lists/remove-cards', (route) => {
    cuts++;
    expect(route.request().postDataJSON()).toEqual({
      listId: displayDeckId,
      board: 'Mainboard',
      oracleIds: [source.oracle_id],
    });
    if (cuts === 1)
      return route.fulfill({
        status: 400,
        json: { message: 'Could not remove card' },
      });
    state.items.splice(
      state.items.findIndex(
        (item) =>
          item.oracle_id === source.oracle_id && item.board === 'Mainboard',
      ),
      1,
    );
    return route.fulfill({ json: { removedCount: 1 } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await openDeckAction(page, 'Replace Gamechangers');
  const panel = page.getByRole('region', {
    name: 'Replace Gamechangers',
    exact: true,
  });
  await expect(
    panel.getByRole('button', {
      name: `Replace ${state.cards[0].name} with ${replacement.name}`,
      exact: true,
    }),
  ).toBeDisabled();
  const replace = panel.getByRole('button', {
    name: `Replace ${source.name} with ${replacement.name}`,
    exact: true,
  });
  await replace.focus();
  await page.keyboard.press('Enter');
  await expect(panel.getByRole('alert')).toContainText('was not cut');
  expect(cuts).toBe(0);
  await replace.click();
  await expect(panel.getByRole('alert')).toContainText('was added');
  expect(adds).toBe(2);
  expect(
    state.items.find(
      (item) =>
        item.oracle_id === source.oracle_id && item.board === 'Mainboard',
    )?.num_copies,
  ).toBe(3);
  await panel
    .getByRole('button', { name: 'Retry removal', exact: true })
    .click();
  await expect(page.getByText('Card Removed', { exact: true })).toBeVisible();
  expect(adds).toBe(2);
  expect(cuts).toBe(2);
  expect(
    state.items.find((item) => item.oracle_id === replacement.oracle_id)
      ?.num_copies,
  ).toBe(3);
  expect(
    state.items.find(
      (item) =>
        item.oracle_id === source.oracle_id && item.board === 'Sideboard',
    )?.num_copies,
  ).toBe(2);
  expect(
    state.items.some(
      (item) =>
        item.oracle_id === source.oracle_id && item.board === 'Mainboard',
    ),
  ).toBe(false);
});

test('failed replacements show a retry rather than an empty match message', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  Object.assign(state.cards[0], { game_changer: true });
  let fail = true;
  await page.route(BACKEND + '/search/game-changer-replacements', (route) =>
    route.fulfill(
      fail
        ? { status: 503, json: { message: 'Model unavailable' } }
        : { status: 204 },
    ),
  );
  await page.reload();
  await openDeckAction(page, 'Replace Gamechangers');
  const panel = page.getByRole('region', {
    name: 'Replace Gamechangers',
    exact: true,
  });
  await expect(panel.getByRole('alert')).toContainText(
    'Could not load replacements.',
  );
  await expect(
    panel.getByText('No Replacements In These Colors', { exact: true }),
  ).toHaveCount(0);
  fail = false;
  await panel.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(
    panel.getByText('No Replacements In These Colors', { exact: true }),
  ).toBeVisible();
});

test('replacement images and row counts match suggested adds at every breakpoint', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { extraCards: 12 });
  Object.assign(state.cards[0], { game_changer: true });
  const results = state.catalog.slice(3).map((card) => ({
    card_name: card.name,
    card_data: { ...card, game_changer: false },
  }));
  await page.route(BACKEND + '/search/game-changer-replacements', (route) =>
    route.fulfill({ json: results }),
  );
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/suggestions`,
    (route) => route.fulfill({ json: { results } }),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await openDeckAction(page, 'Replace Gamechangers');
  await openDeckAction(page, 'Suggest Adds');
  const replacements = page.getByRole('region', {
    name: 'Replacements for ' + state.cards[0].name,
    exact: true,
  });
  const adds = page.getByRole('region', {
    name: 'Suggested Adds',
    exact: true,
  });
  const replacementImages = replacements.locator('.replacement-cards img');
  const addImages = adds.locator('.deck-suggestion-grid img');
  async function sameSize() {
    await page.mouse.move(0, 0);
    // Allow the existing hover and responsive layout transitions to settle.
    await expect
      .poll(async () => {
        const expected = (await addImages.first().boundingBox())!;
        const differences = [];
        for (const image of [
          replacementImages.nth(1),
          replacements.locator('.game-changer-source img'),
        ]) {
          const actual = (await image.boundingBox())!;
          differences.push(
            Math.abs(actual.width - expected.width),
            Math.abs(actual.height - expected.height),
          );
        }
        return Math.max(...differences);
      })
      .toBeLessThan(1);
  }
  for (const [width, count] of [
    [1024, 4],
    [1800, 7],
    [390, 7],
  ]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(replacementImages).toHaveCount(count);
    await expect(addImages).toHaveCount(count);
    await sameSize();
    const more = await replacements
      .getByRole('button', { name: 'See more results', exact: true })
      .boundingBox();
    const action = await replacements
      .getByRole('button', { name: /^Replace / })
      .first()
      .boundingBox();
    expect(Math.abs(more!.y - action!.y)).toBeLessThan(1);
    if (width === 1800) {
      await page
        .getByRole('region', { name: 'Replace Gamechangers', exact: true })
        .screenshot({ path: '.cache/suggestion-actions-desktop.png' });
    }
  }
  await replacements
    .getByRole('button', { name: 'See more results', exact: true })
    .click();
  await adds.getByRole('button', { name: 'Show more', exact: true }).click();
  await expect(replacementImages).toHaveCount(13);
  await expect(addImages).toHaveCount(12);
  await sameSize();
  for (const grid of [
    replacements.locator('.replacement-cards'),
    adds.locator('.deck-suggestion-grid'),
  ]) {
    expect(
      await grid.evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length,
      ),
    ).toBe(2);
    expect(
      await grid.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
  }
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const replace = replacements
    .getByRole('button', { name: /^Replace / })
    .first();
  await replace.scrollIntoViewIfNeeded();
  await expect(replace).toHaveText('Replace');
  expect(
    await replace.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  const bounds = (await replace.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page
    .getByRole('region', { name: 'Replace Gamechangers', exact: true })
    .screenshot({ path: '.cache/suggestion-actions-mobile-large.png' });
});
