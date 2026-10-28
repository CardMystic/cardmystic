import { expect, test } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND } from './utils/mocks';

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
    (route) => {
      const body = route.request().postDataJSON();
      writes.push(body);
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
  await expect(page.getByPlaceholder(/Paste your decklist/)).toHaveCount(0);
  await expect.poll(() => searches.length).toBe(1);
  const add = page
    .getByRole('button', { name: 'Add to deck', exact: true })
    .first();
  await expect(add).toBeEnabled();
  await add.click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({
    listId: displayDeckId,
    cardNames: [added.name],
  });
  const rerun = page.getByRole('button', {
    name: 'Deck has changed: Rerun search',
    exact: true,
  });
  await expect(rerun).toBeEnabled();
  expect(searches).toHaveLength(1);
  await rerun.click();
  await expect.poll(() => searches.length).toBe(2);
  expect(searches[1].cards).toContain(added.name);
  await expect(rerun).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Paste Decklist', exact: true })
    .click();
  await expect(page.getByPlaceholder(/Paste your decklist/)).toBeVisible();
});

test('signed-in users default to selecting a saved deck', async ({ page }) => {
  const state = await setupDeckDisplay(page);
  await page.route(BACKEND + '/supabase/card-lists/mine/search**', (route) =>
    route.fulfill({ json: { decklists: [state.deck] } }),
  );
  await page.evaluate(() => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(
      '/search/all/deckbuilder',
    );
  });
  const selector = page.getByPlaceholder('Select a decklist...');
  await expect(selector).toBeVisible();
  await expect(page.getByPlaceholder(/Paste your decklist/)).toHaveCount(0);
  await selector.fill('My');
  await page
    .getByRole('option', { name: 'My display deck', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Recommend', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Paste Decklist', exact: true })
    .click();
  await expect(page.getByPlaceholder(/Paste your decklist/)).toHaveValue(
    /Island/,
  );
});
