import { expect, test, type Locator } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, waitForHydration } from './utils/mocks';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'cm.cookie-consent.v1',
      JSON.stringify({
        analytics: false,
        advertising: false,
        updatedAt: Date.now(),
      }),
    );
  });
});

test('saved deck recommendations add cards without searching until rerun', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { extraCards: 1 });
  const added = state.catalog.at(-1)!;
  const searches: { cards: string[] }[] = [];
  const writes: { listId: string; cardNames: string[] }[] = [];
  let releaseSave!: () => void;
  const saveGate = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  await page.route(BACKEND + '/als/recommend', (route) => {
    searches.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        results: [{ card_data: added, card_name: added.name, score: 1 }],
        not_found: [],
      },
    });
  });
  await page.route(
    BACKEND + '/supabase/card-lists/add-cards-by-name',
    async (route) => {
      const body = route.request().postDataJSON();
      writes.push(body);
      if (writes.length === 1) {
        await saveGate;
        return route.fulfill({ status: 500, json: { message: 'Save failed' } });
      }
      state.items.push({
        id: added.oracle_id,
        list_id: displayDeckId,
        oracle_id: added.oracle_id,
        num_copies: 1,
        board: 'Mainboard',
        is_commander: false,
      });
      return route.fulfill({
        json: { addedCount: 1, updatedCount: 0, invalidCardNames: [] },
      });
    },
  );
  await page.getByRole('button', { name: 'Recommend', exact: true }).click();
  await expect(page).toHaveURL(/deckId=/);
  await expect(page.getByPlaceholder('Select a decklist...')).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Select a decklist', exact: true }),
  ).toHaveValue(state.deck.name);
  await expect(page.getByPlaceholder(/Paste your decklist/)).toHaveCount(0);
  await expect.poll(() => searches.length).toBe(1);
  await page
    .getByRole('button', { name: `Options for ${added.name}`, exact: true })
    .click();
  const cardOptions = page.getByRole('dialog', {
    name: added.name,
    exact: true,
  });
  await expect(
    cardOptions.getByRole('button', {
      name: 'Add to Another Deck',
      exact: true,
    }),
  ).toBeVisible();
  const add = cardOptions.getByRole('button', {
    name: 'Add to deck',
    exact: true,
  });
  await expect(add).toBeEnabled();
  await add.click();
  const result = page.getByRole('button', {
    name: `Options for ${added.name}`,
    exact: true,
  });
  try {
    await expect(cardOptions).toBeHidden();
    await expect.poll(() => writes.length).toBe(1);
    await expect(result).toHaveCount(0);
  } finally {
    releaseSave();
  }
  await expect(
    page.getByText('Could not add card to deck', { exact: true }),
  ).toBeVisible();
  await expect(result).toBeVisible();
  await result.click();
  await add.click();
  await expect.poll(() => writes.length).toBe(2);
  await expect(result).toHaveCount(0);
  expect(writes[0]).toMatchObject({
    listId: displayDeckId,
    cardNames: [added.name],
  });
  const rerun = page.getByRole('button', {
    name: 'Deck has changed: Rerun search',
    exact: true,
  });
  await expect(rerun).toBeEnabled();
  await expect(
    page.getByText('All recommendations added', { exact: true }),
  ).toBeVisible();
  await expect(rerun).toHaveCSS('position', 'fixed');
  await page.setViewportSize({ width: 390, height: 900 });
  await page.screenshot({ path: 'test-results/mobile-recommender-rerun.png' });
  expect(searches).toHaveLength(1);
  await rerun.click();
  await expect.poll(() => searches.length).toBe(2);
  expect(searches[1].cards).toContain(added.name);
  await expect(rerun).toHaveCount(0);
  await page.getByRole('button', { name: 'Manual Entry', exact: true }).click();
  await expect(page.getByPlaceholder(/Paste your decklist/)).toBeVisible();
});

test('signed-in users default to selecting a saved deck', async ({ page }) => {
  const state = await setupDeckDisplay(page);
  await page.route(BACKEND + '/supabase/card-lists/mine/search**', (route) =>
    route.fulfill({ json: { decklists: [state.deck] } }),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      /hydrat/i.test(message.text()) &&
      ['warning', 'error'].includes(message.type())
    )
      errors.push(message.text());
  });
  const selector = page.getByRole('combobox', {
    name: 'Select a decklist',
    exact: true,
  });
  const paste = page.getByRole('button', { name: 'Manual Entry' });
  const select = page.getByRole('button', {
    name: 'Select a Decklist',
    exact: true,
  });
  const commander = page.getByRole('combobox', {
    name: 'Select a commander (optional)',
    exact: true,
  });
  async function expectBeside(field: Locator, button: Locator) {
    const input = (await field.boundingBox())!;
    const action = (await button.boundingBox())!;
    expect(action.x).toBeGreaterThanOrEqual(input.x + input.width);
    expect(action.y + action.height / 2).toBeCloseTo(
      input.y + input.height / 2,
      0,
    );
  }
  const textarea = page.getByPlaceholder(/Paste your decklist/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const response =
      width === 1440
        ? await page.goto('/search/all/deckbuilder')
        : await page.reload();
    expect(response?.ok()).toBe(true);
    expect(await response!.text()).toContain('Paste your decklist here');
    await waitForHydration(page);
    expect(errors).toEqual([]);
    await expect(selector).toBeVisible();
    await expect(selector).toHaveCSS('font-size', '16px');
    await expectBeside(selector, paste);
    await paste.focus();
    await page.keyboard.press('Enter');
    await expect(commander).toBeVisible();
    await expectBeside(commander, select);
    const description = (await page
      .getByPlaceholder(/Describe the cards/)
      .boundingBox())!;
    const commanderBox = (await commander.boundingBox())!;
    const decklist = (await textarea.boundingBox())!;
    expect(commanderBox.y - description.y - description.height).toBeCloseTo(
      8,
      0,
    );
    expect(decklist.y - commanderBox.y - commanderBox.height).toBeCloseTo(8, 0);
    await expect(select).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(selector).toBeVisible();
  }
  await expect(page.getByPlaceholder(/Paste your decklist/)).toHaveCount(0);
  await selector.click();
  await expect(selector).toHaveValue('');
  await expect(
    page.getByRole('option', { name: 'My display deck', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('option', { name: 'My display deck', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Recommend', exact: true }),
  ).toBeEnabled();
  await paste.focus();
  await page.keyboard.press('Enter');
  await expect(textarea).toHaveValue(/Island/);
  await expect(select).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(selector).toBeVisible();
  expect(errors).toEqual([]);

  // A selected deck from the URL must never be displayed as a raw UUID
  // while the name is still loading, on either a direct load or reload.
  await page.route(BACKEND + '/als/recommend', (route) =>
    route.fulfill({ json: { results: [], not_found: [] } }),
  );
  let deckGate: Promise<void>;
  await page.route(
    BACKEND + '/supabase/card-lists/mine/' + displayDeckId,
    async (route) => {
      await deckGate;
      await route.fulfill({ json: { decklist: state.deck } });
    },
  );
  await page.route(
    BACKEND + '/supabase/card-lists/mine/search**',
    async (route) => {
      await deckGate;
      await route.fulfill({ json: { decklists: [state.deck] } });
    },
  );
  for (const reload of [false, true]) {
    let releaseDeck!: () => void;
    deckGate = new Promise<void>((resolve) => {
      releaseDeck = resolve;
    });
    try {
      const response = reload
        ? await page.reload()
        : await page.goto(
            `/search/all/deckbuilder?deckId=${displayDeckId}&decklist=Island&useRerank=false`,
          );
      expect(response?.ok()).toBe(true);
      expect(await response!.text()).toContain('Loading selected deck');
      await waitForHydration(page);
      await expect(
        page.getByRole('status', {
          name: 'Loading selected deck',
          exact: true,
        }),
      ).toBeVisible();
      await expect(selector).toHaveCount(0);
    } finally {
      releaseDeck();
    }
    await expect(selector).toHaveValue(state.deck.name);
    await expect(
      page.getByRole('status', { name: 'Loading selected deck', exact: true }),
    ).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
