import { expect, test } from '@playwright/test';
import { setupDeckDisplay, createDisplayCards } from './utils/deckDisplay';
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
  const alternatives = createDisplayCards(10).slice(3);
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
  const panel = page.getByRole('dialog', {
    name: 'Replace Gamechangers',
    exact: true,
  });
  const row = page.getByRole('region', {
    name: `Replacements for ${state.cards[0].name}`,
    exact: true,
  });
  await expect(row.getByRole('img')).toHaveCount(4);
  await expect(panel).toBeVisible();
  for (const image of await row.getByRole('img').all()) {
    expect((await image.boundingBox())!.width).toBeLessThanOrEqual(160);
  }
  expect(
    await row
      .getByRole('img')
      .evaluateAll((images) =>
        images.map((image) => image.getAttribute('alt')),
      ),
  ).toEqual([
    state.cards[0].name,
    ...alternatives.slice(1, 4).map((card) => card.name),
  ]);
  await expect(
    panel.getByText('No Replacements In These Colors', { exact: true }),
  ).toBeVisible();
  await expect(row.locator('.game-changer-source')).toHaveCSS(
    'border-top-width',
    '2px',
  );
  await row.getByRole('button', { name: 'See more results' }).click();
  await expect(row.getByRole('img')).toHaveCount(7);
  await row.getByRole('button', { name: 'Show fewer results' }).click();
  await expect(row.getByRole('img')).toHaveCount(4);
  await panel.screenshot({ path: '/tmp/cardmystic-game-changers-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(row.getByRole('img')).toHaveCount(4);
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
  await expect(row.getByRole('img')).toHaveCount(4);
  expect(calls).toBe(2);
  expect(state.writes).toHaveLength(0);
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
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
  const panel = page.getByRole('dialog', {
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
