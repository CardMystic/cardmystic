import { BACKEND_USER_AUTH_HEADER } from '../utils/backendRequestHeaders';
import { openDeckAction } from './utils/deckActions';
import { test, expect } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';

test('free users see locked deck tools and suggestions without fetching recommendations', async ({
  page,
}) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('/suggestions')) requests++;
  });
  const state = await setupDeckDisplay(page);
  await page.route(BACKEND + '/library/lists/*/suggestions', (route) => {
    requests++;
    return route.fulfill({ json: { results: [] } });
  });
  await expect(
    page.getByRole('link', { name: 'Subscribe for suggestions' }),
  ).toBeVisible();
  expect(state.writes).toHaveLength(0);
  await openDeckAction(page, 'Compare decks');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Search Within Deck', exact: true })
    .click();
  await expect(page).toHaveURL(/\/memberships/);
  expect(requests).toBe(0);
});

test('Pro searches filter cards on the collection page, keyword works, and clear restores the saved list', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true, kind: 'collection' });
  const modes: string[] = [];
  let empty = false;
  let finishSmart = () => {};
  const smartResponse = new Promise<void>((resolve) => {
    finishSmart = resolve;
  });
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/search`,
    async (route) => {
      modes.push(route.request().postDataJSON().mode);
      if (route.request().postDataJSON().mode === 'smart') await smartResponse;
      return route.fulfill({
        json: {
          oracleIds: empty
            ? []
            : [state.cards[0].oracle_id, state.cards[1].oracle_id],
          scores:
            route.request().postDataJSON().mode === 'smart'
              ? {
                  [state.cards[0].oracle_id]: 0.5,
                  [state.cards[1].oracle_id]: 0.92,
                }
              : {},
        },
      });
    },
  );
  await page
    .getByRole('button', { name: 'Search Within Collection', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Search within list', exact: true })
    .fill('removal');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await expect.poll(() => modes).toEqual(['smart']);
  await page.getByRole('combobox', { name: 'Search within list type' }).click();
  await page
    .getByRole('option', { name: 'Keyword search', exact: true })
    .click();
  finishSmart();
  await expect(page.locator('.list-card')).toHaveCount(2);
  await expect(
    page.locator('.list-card').first().getByRole('img'),
  ).toHaveAttribute('alt', state.cards[1].name);
  await expect(page.locator('.list-card').getByText('92%')).toBeVisible();
  await expect(
    page
      .locator('.list-card')
      .first()
      .getByRole('progressbar', { name: 'Smart search match' }),
  ).toHaveAttribute('value', '92');
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Smart Search %');
  await page.keyboard.press('Escape');
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await expect.poll(() => modes).toEqual(['smart', 'keyword']);
  empty = true;
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Search', exact: true })
    .click();
  await expect(
    page.getByText('No matching cards. Try another search or show all cards.'),
  ).toBeVisible();
  await expect(page.locator('.list-card')).toHaveCount(0);
  await expect(
    page.getByText('This list is empty!', { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Show all cards', exact: true })
    .click();
  await expect(page.locator('.list-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Close deck search' }).click();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
  ).toContainText('Name');
  await page
    .getByRole('combobox', { name: 'Deck sorting', exact: true })
    .click();
  await expect(
    page.getByRole('option', { name: 'Smart Search %', exact: true }),
  ).toHaveCount(0);
  expect(state.writes).toHaveLength(0);
});

test('suggestion queue advances without searching again and refills only when exhausted', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true, extraCards: 11 });
  await page.route(BACKEND + '/library/lists/*/budget', (route) =>
    route.fulfill({ json: { targetBudget: 1 } }),
  );
  let requests = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/suggestions`,
    (route) => {
      if (route.request().postDataJSON().newestSet)
        return route.fulfill({ json: { results: [] } });
      requests++;
      return route.fulfill({
        json: {
          results:
            requests === 1
              ? state.catalog
                  .slice(3)
                  .map((card) => ({ card_name: card.name, card_data: card }))
              : [],
        },
      });
    },
  );
  const section = page.getByRole('region', { name: 'Suggested cards' });
  await section.scrollIntoViewIfNeeded();
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(11);
  await section
    .getByRole('button', {
      name: `Options for ${state.catalog[3].name}`,
      exact: true,
    })
    .click();
  const modal = page.getByRole('dialog', {
    name: state.catalog[3].name,
    exact: true,
  });
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole('link', { name: 'View Card Details', exact: true }),
  ).toHaveAttribute('href', `/card/${state.catalog[3].oracle_id}`);
  await expect(
    modal.getByRole('button', { name: 'Add to Clipboard', exact: true }),
  ).toBeVisible();
  expect(state.writes).toHaveLength(0);
  expect(requests).toBe(1);
  await expect(page).toHaveURL(new RegExp(`/lists/${displayDeckId}$`));
  await modal.getByRole('button', { name: 'Add to Deck', exact: true }).click();
  await expect(modal).toBeHidden();
  await expect(
    page.getByText('Card added to deck', { exact: true }),
  ).toBeVisible();
  await expect(
    section.getByRole('button', {
      name: `Options for ${state.catalog[13].name}`,
      exact: true,
    }),
  ).toBeVisible();
  expect(requests).toBe(1);
  for (const card of state.catalog.slice(4)) {
    const suggestion = section.getByRole('button', {
      name: `Options for ${card.name}`,
      exact: true,
    });
    await suggestion.click();
    const cardModal = page.getByRole('dialog', {
      name: card.name,
      exact: true,
    });
    await cardModal
      .getByRole('button', { name: 'Add to Deck', exact: true })
      .click();
    await expect(cardModal).toBeHidden();
    await expect(suggestion).toHaveCount(0);
  }
  await expect.poll(() => requests).toBe(2);
  expect(state.writes).toHaveLength(11);
  await expect(
    section.getByText(
      'No more suggestions at this price. Try a higher card budget.',
    ),
  ).toBeVisible();
});

test('card modal saves a personal tag and tag grouping updates immediately', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const tags: { id: string; name: string }[] = [];
  const assignments: { oracle_id: string; tag_id: string }[] = [];
  await page.route(BACKEND + '/library/tags', (route) => {
    if (route.request().method() === 'POST') {
      const tag = {
        id: '71000000-0000-4000-8000-000000000001',
        name: route.request().postDataJSON().name,
      };
      tags.push(tag);
      return route.fulfill({ json: tag });
    }
    return route.fulfill({ json: { tags } });
  });
  await page.route(BACKEND + '/library/tags/assignments', (route) =>
    route.fulfill({ json: { assignments } }),
  );
  await page.route(BACKEND + '/library/tags/*/cards/*', (route) => {
    expect(route.request().headers()['content-type']).toBeUndefined();
    if (route.request().method() === 'DELETE') assignments.splice(0);
    else
      assignments.push({
        oracle_id: state.cards[0].oracle_id,
        tag_id: tags[0].id,
      });
    return route.fulfill({ json: { saved: true } });
  });
  await page
    .getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('combobox', { name: 'Add or create a tag', exact: true })
    .fill('Removal');
  await page
    .getByRole('option', { name: 'Create “Removal”', exact: true })
    .click();
  await expect(
    dialog.getByRole('button', {
      name: 'Remove Removal from this card',
      exact: true,
    }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Remove Removal from this card', exact: true })
    .click();
  await expect(
    dialog.getByRole('button', {
      name: 'Remove Removal from this card',
      exact: true,
    }),
  ).toHaveCount(0);
  await dialog
    .getByRole('combobox', { name: 'Add or create a tag', exact: true })
    .fill('Rem');
  await page.getByRole('option', { name: /Removal/ }).click();
  await expect(
    dialog.getByRole('button', {
      name: 'Remove Removal from this card',
      exact: true,
    }),
  ).toBeVisible();
  expect(tags).toHaveLength(1);
  await expect(
    dialog.getByRole('combobox', { name: 'Add or create a tag', exact: true }),
  ).toBeEnabled();
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Deck grouping', exact: true })
    .click();
  await page.getByRole('option', { name: 'My Tags', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: /Removal \(2\)/ }).first(),
  ).toBeVisible();
  expect(assignments).toEqual([
    { oracle_id: state.cards[0].oracle_id, tag_id: tags[0].id },
  ]);
  await page.route(BACKEND + '/library/tags/' + tags[0].id, (route) => {
    expect(route.request().headers()['content-type']).toBeUndefined();
    tags.splice(0);
    assignments.splice(0);
    return route.fulfill({ json: { deleted: true } });
  });
  await page
    .getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    })
    .click();
  await dialog
    .getByRole('combobox', { name: 'Add or create a tag', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Delete Removal everywhere', exact: true })
    .click();
  const warning = page.getByRole('dialog', { name: 'Delete tag everywhere?' });
  await expect(warning).toContainText(
    'every card in all your decks and collections',
  );
  expect(tags).toHaveLength(1);
  await warning.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(tags).toHaveLength(1);
  await dialog
    .getByRole('combobox', { name: 'Add or create a tag', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Delete Removal everywhere', exact: true })
    .click();
  await warning
    .getByRole('button', { name: 'Delete tag', exact: true })
    .click();
  await expect(warning).toBeHidden();
  await expect(
    dialog.getByRole('button', {
      name: 'Remove Removal from this card',
      exact: true,
    }),
  ).toHaveCount(0);
  expect(tags).toHaveLength(0);
  expect(assignments).toHaveLength(0);
});

test('my lists support folder management, typed deletion, sorting, list view and collection creation', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  let folder = {
    id: '72000000-0000-4000-8000-000000000001',
    name: 'Favorites',
    count: 1,
    deckCount: 1,
    collectionCount: 0,
  };
  let deleted = false;
  const sorts: string[] = [];
  const creates: unknown[] = [];
  await page.route(BACKEND + '/library/folders', (route) =>
    route.fulfill({ json: { folders: deleted ? [] : [folder] } }),
  );
  await page.route(BACKEND + '/library/folders/*', (route) => {
    if (route.request().method() === 'DELETE') {
      expect(route.request().postDataJSON().confirmation).toBe('Renamed');
      deleted = true;
    } else folder = { ...folder, name: route.request().postDataJSON().name };
    return route.fulfill({ json: {} });
  });
  await page.route(BACKEND + '/supabase/card-lists?*', (route) => {
    const url = new URL(route.request().url());
    sorts.push(url.searchParams.get('sort') ?? '');
    const visible =
      !deleted &&
      url.searchParams.get('kind') !== 'collection' &&
      url.searchParams.get('folder') === folder.id;
    return route.fulfill({
      json: {
        decklists: visible ? [{ ...state.deck, folder_id: folder.id }] : [],
        totalCount: visible ? 1 : 0,
        totalPages: 1,
        page: 1,
        pageSize: 50,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });
  await page.route(BACKEND + '/supabase/card-lists/create', (route) => {
    creates.push(route.request().postDataJSON());
    return route.fulfill({
      json: { id: '73000000-0000-4000-8000-000000000001', name: 'Owned cards' },
    });
  });
  await page.evaluate(() => {
    const el = document.getElementById('__nuxt') as HTMLElement & {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<void> };
          };
        };
      };
    };
    return el.__vue_app__.config.globalProperties.$router.push('/lists');
  });
  await expect(
    page.getByRole('heading', { name: 'Decks & Collections', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page.getByRole('combobox', { name: 'Decklists view' }).click();
  await page.getByRole('option', { name: 'List', exact: true }).click();
  await page.getByRole('combobox', { name: 'Decklists sorting' }).click();
  await page.getByRole('option', { name: 'Name', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => sorts.includes('name')).toBe(true);
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  const tile = page.getByTestId(`folder-${folder.id}`);
  await expect(tile).toContainText('1 deck');
  await expect(
    page.getByRole('link', { name: state.deck.name, exact: true }),
  ).toHaveCount(0);
  await tile.getByRole('link', { name: 'Favorites', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`folder=${folder.id}`));
  await expect(
    page.getByRole('link', { name: state.deck.name, exact: true }),
  ).toBeVisible();
  await expect(tile).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Settings for folder Favorites', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Folder name', exact: true })
    .fill('Renamed');
  await page.getByRole('button', { name: 'Save folder', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Renamed', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Settings for folder Renamed', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Delete folder', exact: true })
    .click();
  const confirm = page.getByRole('button', {
    name: 'Delete folder and contents',
    exact: true,
  });
  await expect(confirm).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Confirm folder name' })
    .fill('Wrong');
  await expect(confirm).toBeDisabled();
  await page
    .getByRole('textbox', { name: 'Confirm folder name' })
    .fill('Renamed');
  await confirm.click();
  await expect.poll(() => deleted).toBe(true);
  await expect(page).toHaveURL(/\/lists$/);
  await page.getByRole('button', { name: 'Collections', exact: true }).click();
  await page
    .getByRole('button', { name: 'New Collection', exact: true })
    .click();
  await page
    .getByPlaceholder('Enter list name', { exact: true })
    .fill('Owned cards');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect.poll(() => creates.length).toBe(1);
  expect(creates[0]).toMatchObject({
    name: 'Owned cards',
    kind: 'collection',
    format: 'Any',
    visibility: 'private',
  });
});

test('collections paginate on mobile and Display fields stay aligned', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const state = await setupDeckDisplay(page, {
    pro: true,
    kind: 'collection',
    cardCount: 101,
  });
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await expect(page.locator('.list-card')).toHaveCount(100);
  await page
    .getByRole('navigation', { name: 'Collection pages top' })
    .getByRole('button', { name: 'Page 2', exact: true })
    .click();
  await expect(page.locator('.list-card')).toHaveCount(1);
  await expect(page.locator('.list-card').getByRole('img')).toHaveAttribute(
    'alt',
    state.cards[0].name,
  );
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  const view = page.getByRole('combobox', { name: 'Deck view', exact: true });
  const group = page.getByRole('combobox', {
    name: 'Deck grouping',
    exact: true,
  });
  const sort = page.getByRole('combobox', {
    name: 'Deck sorting',
    exact: true,
  });
  await expect(view).toBeVisible();
  const bounds = await Promise.all([
    view.boundingBox(),
    group.boundingBox(),
    sort.boundingBox(),
  ]);
  for (const bound of bounds) {
    expect(bound).not.toBeNull();
    expect(Math.abs(bound!.x - bounds[0]!.x)).toBeLessThan(1);
    expect(Math.abs(bound!.width - bounds[0]!.width)).toBeLessThan(1);
    expect(bound!.x + bound!.width).toBeLessThanOrEqual(390);
  }
  await page
    .locator('[data-reka-popper-content-wrapper]')
    .evaluateAll(async (elements) => {
      await Promise.all(
        elements.flatMap((element) =>
          element
            .getAnimations({ subtree: true })
            .map((animation) => animation.finished.catch(() => {})),
        ),
      );
    });
  await page.screenshot({ path: '/tmp/cardmystic-pro-mobile-display.png' });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});

test('Show more reveals queued cards without another recommendation request', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true, extraCards: 15 });
  let requests = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/suggestions`,
    (route) => {
      if (route.request().postDataJSON().newestSet)
        return route.fulfill({ json: { results: [] } });
      requests++;
      return route.fulfill({
        json: {
          results: state.catalog
            .slice(3)
            .map((card) => ({ card_name: card.name, card_data: card })),
        },
      });
    },
  );
  const section = page.getByRole('region', {
    name: 'Suggested cards',
    exact: true,
  });
  await section.scrollIntoViewIfNeeded();
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(11);
  await page.setViewportSize({ width: 1800, height: 1000 });
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(15);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(3);
  await section.getByRole('button', { name: 'Show more', exact: true }).click();
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(15);
  await section.getByRole('button', { name: 'Show less', exact: true }).click();
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(3);
  await section.getByRole('button', { name: 'Show more', exact: true }).click();
  await expect(
    section.getByRole('button', { name: /^Options for / }),
  ).toHaveCount(15);
  expect(requests).toBe(1);
});

test('free deck tools export CSV, preview an import, draw a hand and restore a version', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  let restored: unknown = null;
  let imported: unknown = null;
  await page.route(
    BACKEND + '/supabase/card-lists/add-cards-by-name',
    (route) => {
      imported = route.request().postDataJSON();
      return route.fulfill({
        json: { addedCount: 1, updatedCount: 0, invalidCardNames: [] },
      });
    },
  );
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/history?**`,
    (route) =>
      route.fulfill({
        json: {
          head: 2,
          page: 1,
          pageSize: 20,
          totalCount: 2,
          totalPages: 1,
          revisions: [
            {
              id: 2,
              createdAt: '2026-11-01T12:00:00Z',
              action: 'Added cards',
              kind: 'add',
              added: 25,
              removed: 0,
              changeCount: 25,
              changes: Array.from({ length: 20 }, (_, i) => ({
                oracleId: `20000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
                name: `Added card ${i + 1}`,
                board: 'Mainboard',
                delta: 1,
              })),
              details: [],
              comparisonAvailable: true,
              name: 'Test',
              count: 27,
            },
            {
              id: 1,
              createdAt: '2026-11-01T11:00:00Z',
              action: 'Before first recorded edit',
              kind: 'baseline',
              added: 0,
              removed: 0,
              changeCount: 0,
              changes: [],
              details: [],
              comparisonAvailable: false,
              name: 'Test',
              count: 2,
            },
          ],
        },
      }),
  );
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/history/restore`,
    (route) => {
      restored = route.request().postDataJSON();
      return route.fulfill({ json: { revision: 3 } });
    },
  );
  await openDeckAction(page, 'Import / Export');
  await page.getByRole('combobox', { name: 'Export format' }).click();
  await page.getByRole('option', { name: 'CSV', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'Exported decklist' }),
  ).toHaveValue(/Name,Quantity,Board,Commander/);
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Decklist to import' })
    .fill('2 Island');
  await page.getByRole('button', { name: 'Preview import' }).click();
  await expect(page.getByText('2 Island — Mainboard')).toBeVisible();
  expect(state.writes).toHaveLength(0);
  await page
    .getByRole('button', { name: 'Add imported cards', exact: true })
    .click();
  await expect
    .poll(() => imported)
    .toEqual({
      listId: displayDeckId,
      board: 'Mainboard',
      cardNames: ['2 Island'],
    });
  await expect(
    page.getByText('Imported 1 card entries. Existing cards were kept.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Playtest', exact: true }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'Playtest', exact: true })
      .getByRole('region', { name: 'Hand', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await openDeckAction(page, 'History');
  await page.getByText('25 card changes', { exact: true }).click();
  await expect(
    page.getByText('…and 5 more card changes.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /^Added card / })).toHaveCount(
    20,
  );
  await page.getByRole('button', { name: 'Restore', exact: true }).click();
  await page
    .getByRole('button', { name: 'Confirm restore', exact: true })
    .click();
  await expect.poll(() => restored).toEqual({ revision: 1, expectedHead: 2 });
  await expect(
    page.getByText('Deck restored. Your previous version is still in history.'),
  ).toBeVisible();
});

test('Pro budget and ownership controls use the selected budget and collection', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true });
  const budgets: unknown[] = [];
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/suggestions`,
    (route) => {
      budgets.push(route.request().postDataJSON());
      return route.fulfill({ json: { results: [] } });
    },
  );
  await page.route(BACKEND + '/supabase/card-lists?**', (route) =>
    route.fulfill({
      json: {
        decklists: [
          {
            id: displayDeckId,
            ...state.deck,
            name: 'My collection',
            kind: 'collection',
            format: 'Any',
            commanders: [],
            card_count: 1,
            visibility: 'private',
            created_at: '2026-01-01',
            updated_at: '2026-01-01',
          },
        ],
        totalCount: 1,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    }),
  );
  await page.route(
    BACKEND + `/library/collections/${displayDeckId}/ownership`,
    (route) =>
      route.fulfill({
        json: { quantities: { [state.cards[0].oracle_id]: 2 } },
      }),
  );
  const suggestions = page.getByRole('region', {
    name: 'Suggested cards',
    exact: true,
  });
  await suggestions.scrollIntoViewIfNeeded();
  await expect(
    suggestions.getByText('Target card budget (USD)', { exact: true }),
  ).toBeVisible();
  await suggestions.getByRole('spinbutton').fill('25');
  await suggestions.getByRole('button', { name: 'Apply budget' }).click();
  await expect
    .poll(() => budgets)
    .toContainEqual({ targetBudget: 25, newestSet: false });
  const alerts = page.getByRole('region', {
    name: 'New Cards for Deck',
    exact: true,
  });
  await expect(alerts.getByRole('spinbutton')).toHaveValue('25');
  await page.reload();
  await suggestions.scrollIntoViewIfNeeded();
  await expect(suggestions.getByRole('spinbutton')).toHaveValue('25');
  await expect(alerts.getByRole('spinbutton')).toHaveValue('25');
  await alerts.getByRole('spinbutton').fill('');
  await alerts.getByRole('button', { name: 'Apply budget' }).click();
  await expect(suggestions.getByRole('spinbutton')).toHaveValue('');
  await page.reload();
  await suggestions.scrollIntoViewIfNeeded();
  await expect(suggestions.getByRole('spinbutton')).toHaveValue('');
  await page.getByRole('button', { name: 'Highlight', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Highlight by', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'Owned in a collection', exact: true })
    .click();
  await page.getByRole('combobox', { name: 'Ownership collection' }).click();
  await page
    .getByRole('option', { name: 'My collection', exact: true })
    .click();
  await expect(
    page.locator('.list-card [aria-description="Not owned"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('.list-card [aria-description^="Owned"]'),
  ).toHaveCount(1);
});

test('search card modal automatically fetches deck matches for Pro and adds directly', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true });
  let requests = 0;
  const offsets: number[] = [];
  await page.route(BACKEND + '/search/colbert', (route) =>
    route.fulfill({
      json: state.cards.map((card, index) => ({
        card_name: card.name,
        card_data: card,
        rank: index + 1,
        ai_normalized_score: 0.9,
      })),
    }),
  );
  await page.route(BACKEND + '/library/cards/deck-fit', (route) => {
    requests++;
    const { offset } = route.request().postDataJSON();
    offsets.push(offset);
    return route.fulfill({
      json: {
        results:
          offset === 0
            ? [{ id: displayDeckId, name: 'My deck' }]
            : [
                {
                  id: '41000000-0000-4000-8000-000000000099',
                  name: 'Another matching deck',
                },
              ],
        nextOffset: offset === 0 ? 25 : null,
        supported: true,
      },
    });
  });
  await gotoHydrated(page, '/search/all/smart?query=draw+cards');
  expect(requests).toBe(0);
  await page
    .getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: 'Suggested decks Pro' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Add to My deck', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Add to My deck', exact: true }),
  ).toHaveText('Added');
  expect(requests).toBe(1);
  expect(state.writes).toHaveLength(1);
  await page
    .getByRole('button', { name: 'Check more decks', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: 'Another matching deck', exact: true }),
  ).toBeVisible();
  expect(offsets).toEqual([0, 25]);
});

test('decks move into folders by dragging and move back through settings on mobile', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const folderId = '72000000-0000-4000-8000-000000000002';
  let deck = { ...state.deck, folder_id: null as string | null };
  let rejectMove = true;
  let deleted = false;
  const moves: Array<string | null> = [];
  await page.route(BACKEND + '/library/folders', (route) =>
    route.fulfill({
      json: {
        folders: [
          {
            id: folderId,
            name: 'Commander decks',
            count: deck.folder_id && !deleted ? 1 : 0,
            deckCount: deck.folder_id && !deleted ? 1 : 0,
            collectionCount: 0,
          },
        ],
      },
    }),
  );
  await page.route(BACKEND + '/supabase/card-lists?*', (route) => {
    const requested = new URL(route.request().url()).searchParams.get('folder');
    const visible =
      !deleted &&
      (deck.folder_id ? requested === deck.folder_id : requested === 'unfiled');
    return route.fulfill({
      json: {
        decklists: visible ? [deck] : [],
        totalCount: visible ? 1 : 0,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    });
  });
  await page.route(BACKEND + `/library/lists/${deck.id}/folder`, (route) => {
    if (rejectMove)
      return route.fulfill({
        status: 503,
        json: { message: 'Move unavailable. Try again.' },
      });
    deck.folder_id = route.request().postDataJSON().folderId;
    moves.push(deck.folder_id);
    return route.fulfill({ json: {} });
  });
  await page.route(SUPABASE + '/rest/v1/card_lists?*', (route) => {
    if (route.request().method() === 'DELETE') deleted = true;
    else if (route.request().method() === 'PATCH')
      deck = { ...deck, ...route.request().postDataJSON() };
    return route.fulfill({ json: [] });
  });
  await page.route(BACKEND + '/supabase/card-lists/update-format', (route) => {
    deck.format = route.request().postDataJSON().format;
    return route.fulfill({
      json: { format: deck.format, commandersCleared: false },
    });
  });
  await page.route(
    BACKEND + '/supabase/card-lists/update-visibility',
    (route) => {
      deck.visibility = route.request().postDataJSON().visibility;
      return route.fulfill({ json: { visibility: deck.visibility } });
    },
  );
  await gotoHydrated(page, '/lists');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const tile = page.getByTestId(`library-list-${deck.id}`);
  const folder = page.getByTestId(`folder-${folderId}`);
  await expect(tile).toBeVisible();
  const deckBox = await tile.boundingBox();
  const folderBox = await folder.boundingBox();
  expect(deckBox!.height).toBeLessThan(deckBox!.width);
  expect(folderBox!.height).toBeCloseTo(deckBox!.height, 0);
  await expect(page.getByRole('combobox', { name: /Folder for/ })).toHaveCount(
    0,
  );
  await page.screenshot({ path: test.info().outputPath('folder-grid.png') });
  await tile.dragTo(folder);
  await expect(
    page.getByText('Move unavailable. Try again.', { exact: true }),
  ).toBeVisible();
  await expect(tile).toBeVisible();
  await expect(folder).toContainText('0 decks');
  rejectMove = false;
  await tile.dragTo(folder);
  await expect.poll(() => moves).toEqual([folderId]);
  await expect(tile).toHaveCount(0);
  await expect(folder).toContainText('1 deck');
  await folder
    .getByRole('link', { name: 'Commander decks', exact: true })
    .click();
  await expect(tile).toBeVisible();
  await page.goBack();
  await expect(tile).toHaveCount(0);
  await page.goForward();
  await expect(tile).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: `Settings for ${deck.name}`, exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(
    dialog.getByRole('textbox', { name: 'Name', exact: true }),
  ).toBeVisible();
  await expect(dialog).toHaveCSS('opacity', '1');
  await page.screenshot({
    path: test.info().outputPath('deck-settings-mobile.png'),
  });
  await dialog
    .getByRole('textbox', { name: 'Name', exact: true })
    .fill('Updated deck');
  await dialog
    .getByRole('textbox', { name: 'Description', exact: true })
    .fill('My organized deck');
  await dialog.getByRole('combobox', { name: 'Format', exact: true }).click();
  await page.getByRole('option', { name: 'Modern', exact: true }).click();
  await dialog
    .getByRole('combobox', { name: 'Visibility', exact: true })
    .click();
  await page.getByRole('option', { name: 'Public', exact: true }).click();
  await dialog
    .getByRole('button', { name: 'Save changes', exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  expect(deck).toMatchObject({
    name: 'Updated deck',
    description: 'My organized deck',
    format: 'Modern',
    visibility: 'public',
  });
  await page
    .getByRole('button', { name: 'Settings for Updated deck', exact: true })
    .click();
  await dialog
    .getByRole('combobox', { name: 'Move to a folder', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'Not in a folder', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Move', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(tile).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Folder navigation' })
    .getByRole('link', { name: 'Decks & Collections', exact: true })
    .click();
  await expect(tile).toBeVisible();
  expect(moves).toEqual([folderId, null]);
  const mobileDeckBox = await tile.boundingBox();
  const mobileFolderBox = await folder.boundingBox();
  expect(mobileDeckBox!.height).toBeLessThan(mobileDeckBox!.width);
  expect(mobileFolderBox!.height).toBeCloseTo(mobileDeckBox!.height, 0);
  await page
    .getByRole('button', { name: 'Settings for Updated deck', exact: true })
    .click();
  await dialog
    .getByRole('button', { name: 'Delete deck', exact: true })
    .click();
  expect(deleted).toBe(false);
  await dialog
    .getByRole('button', { name: 'Delete deck', exact: true })
    .click();
  await expect(tile).toHaveCount(0);
  expect(deleted).toBe(true);
  await expect(folder).toContainText('0 decks');
});

test('deck toolbar stays compact and free accounts can highlight colors and collection ownership', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  state.deck.visibility = 'public';
  let analyticsRequests = 0;
  let ownershipRequests = 0;
  await page.route(BACKEND + '/library/**', (route) => {
    if (route.request().url().endsWith('/analytics')) analyticsRequests++;
    return route.fallback();
  });
  await page.route(BACKEND + '/supabase/card-lists?**', (route) =>
    route.fulfill({
      json: {
        decklists: [
          {
            ...state.deck,
            id: displayDeckId,
            name: 'My collection',
            kind: 'collection',
          },
        ],
        totalCount: 1,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    }),
  );
  await page.route(
    BACKEND + `/library/collections/${displayDeckId}/ownership`,
    (route) => {
      ownershipRequests++;
      return route.fulfill({
        json: { quantities: { [state.cards[0].oracle_id]: 2 } },
      });
    },
  );
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const toolbar = page.getByRole('navigation', { name: 'Deck actions' });
  for (const name of ['Primer', 'Recommend', 'Playtest', 'More deck actions'])
    await expect(
      toolbar.getByRole(name === 'Primer' ? 'link' : 'button', {
        name,
        exact: true,
      }),
    ).toBeVisible();
  await expect(toolbar.getByRole('button', { name: /^Copy$/ })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Deck analytics · Pro' }),
  ).toHaveCount(0);
  await expect(
    page.getByTestId('deck-banner').getByTestId('decklist-like-button'),
  ).toBeVisible();
  const stats = page.getByTestId('deck-stats');
  expect(
    await stats.evaluate((element) => {
      const card = document.querySelector('.list-card');
      return (
        !!card &&
        !!(
          card.compareDocumentPosition(element) &
          Node.DOCUMENT_POSITION_FOLLOWING
        )
      );
    }),
  ).toBe(true);
  await expect(stats).not.toHaveAttribute('open', '');
  const originalCardHeight = (await page
    .locator('.list-card')
    .first()
    .boundingBox())!.height;
  await page.getByRole('button', { name: 'Highlight', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Highlight by', exact: true })
    .click();
  await page.getByRole('option', { name: 'Color', exact: true }).click();
  await expect(page.locator('.list-card [aria-description]')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Highlight color', exact: true })
    .click();
  await page.getByRole('option', { name: 'Blue', exact: true }).click();
  await page.getByRole('button', { name: 'Highlight', exact: true }).click();
  await expect(
    page.locator('.list-card [aria-description="Blue"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('.list-card').filter({ hasText: /^Blue/ }),
  ).toHaveCount(0);
  expect(
    (await page.locator('.list-card').first().boundingBox())!.height,
  ).toBeCloseTo(originalCardHeight, 1);
  await page.getByRole('button', { name: 'Highlight', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Highlight by', exact: true })
    .click();
  await page.getByRole('option', { name: 'Mana value', exact: true }).click();
  await expect(page.locator('.list-card [aria-description]')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Highlight mana value', exact: true })
    .click();
  await page.getByRole('option', { name: '3', exact: true }).click();
  await page.getByRole('button', { name: 'Highlight', exact: true }).click();
  await expect(
    page.locator('.list-card [aria-description="Mana value 3"]'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page.getByRole('combobox', { name: 'Deck view', exact: true }).click();
  await page.getByRole('option', { name: 'Card Text', exact: true }).click();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await expect(
    page.locator('.card-text-row[aria-description="Mana value 3"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.card-text-row').filter({ hasText: /^Mana value 3/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('dialog', { name: 'Display', exact: true }),
  ).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: test.info().outputPath('deck-toolbar-desktop.png'),
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: test.info().outputPath('deck-toolbar-mobile.png'),
  });
  await page.getByRole('button', { name: 'Highlight', exact: true }).click();
  await page
    .getByRole('button', { name: 'Clear highlights', exact: true })
    .click();
  await expect(page.locator('.card-text-row[aria-description]')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Highlight by', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'Owned in a collection', exact: true })
    .click();
  await page.getByRole('combobox', { name: 'Ownership collection' }).click();
  await page
    .getByRole('option', { name: 'My collection', exact: true })
    .click();
  await expect(
    page.locator('.card-text-row[aria-description^="Owned"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.card-text-row[aria-description="Not owned"]'),
  ).toHaveCount(2);
  await expect(page).toHaveURL(new RegExp(`/lists/${displayDeckId}$`));
  expect(ownershipRequests).toBe(1);
  expect(analyticsRequests).toBe(0);
});

test('subfolders show only their own decks and keep the parent trail', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const root = {
    id: '75000000-0000-4000-8000-000000000001',
    name: 'Commander',
    parentId: null as string | null,
    count: 1,
    deckCount: 0,
    collectionCount: 0,
    folderCount: 1,
  };
  let child: typeof root | null = null;
  await page.route(BACKEND + '/library/folders', (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        name: 'Blink',
        parentId: root.id,
      });
      child = {
        ...root,
        id: '75000000-0000-4000-8000-000000000002',
        name: 'Blink',
        parentId: root.id,
        deckCount: 1,
        folderCount: 0,
      };
      return route.fulfill({ json: child });
    }
    return route.fulfill({ json: { folders: child ? [root, child] : [root] } });
  });
  await page.route(BACKEND + '/supabase/card-lists?*', (route) => {
    const visible =
      !!child &&
      new URL(route.request().url()).searchParams.get('folder') === child.id;
    return route.fulfill({
      json: {
        decklists: visible ? [state.deck] : [],
        totalCount: visible ? 1 : 0,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    });
  });
  await page.goto('/lists');
  await page
    .getByTestId(`folder-${root.id}`)
    .getByRole('link', { name: 'Commander', exact: true })
    .click();
  await page.getByRole('button', { name: 'New folder', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Folder name', exact: true })
    .fill('Blink');
  await page.getByRole('button', { name: 'Save folder', exact: true }).click();
  await page
    .getByTestId('folder-75000000-0000-4000-8000-000000000002')
    .getByRole('link', { name: 'Blink', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: state.deck.name, exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Commander', exact: true }).click();
  await expect(
    page.getByRole('link', { name: state.deck.name, exact: true }),
  ).toHaveCount(0);
});
test('suggested cuts appear inline and remove cards without rerunning suggestions', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { pro: true });
  let requests = 0;
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/cuts`,
    (route) => {
      requests++;
      return route.fulfill({
        json: {
          results: [
            { card_name: state.cards[1].name, card_data: state.cards[1] },
          ],
        },
      });
    },
  );
  let removed = false;
  await page.route(SUPABASE + '/rest/v1/card_list_items**', (route) => {
    if (route.request().method() === 'DELETE') {
      const id = new URL(route.request().url()).searchParams
        .get('oracle_id')
        ?.replace(/^eq\./, '');
      expect(id).toBe(state.cards[1].oracle_id);
      state.items.splice(
        state.items.findIndex((item) => item.oracle_id === id),
        1,
      );
      removed = true;
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: state.items });
  });
  await openDeckAction(page, 'Suggest cuts · Pro');
  const section = page.getByRole('region', {
    name: 'Suggested cuts',
    exact: true,
  });
  await expect(section).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await section
    .getByRole('button', {
      name: `Options for ${state.cards[1].name}`,
      exact: true,
    })
    .click();
  const modal = page.getByRole('dialog', {
    name: state.cards[1].name,
    exact: true,
  });
  await expect(modal).toBeVisible();
  expect(removed).toBe(false);
  await modal
    .getByRole('button', { name: 'Remove from Deck', exact: true })
    .click();
  await expect(modal).toBeHidden();
  await expect.poll(() => removed).toBe(true);
  await expect(page.locator('.list-card')).toHaveCount(2);
  expect(requests).toBe(1);
});

test('multi-tagger saves several cards together and keeps selection out of card actions', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const tagId = '72000000-0000-4000-8000-000000000099';
  await page.route(BACKEND + '/library/tags', (route) =>
    route.fulfill({ json: { tags: [{ id: tagId, name: 'Removal' }] } }),
  );
  await page.route(BACKEND + '/library/tags/assignments', (route) =>
    route.fulfill({
      json: {
        assignments: [{ oracle_id: state.cards[0].oracle_id, tag_id: tagId }],
      },
    }),
  );
  const saves: { oracleIds: string[]; method: string }[] = [];
  await page.route(BACKEND + `/library/tags/${tagId}/cards`, (route) => {
    saves.push({
      ...route.request().postDataJSON(),
      method: route.request().method(),
    });
    return route.fulfill({ json: { saved: 2 } });
  });
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page.getByRole('button', { name: 'Multi-tagger', exact: true }).click();
  await page.getByRole('button', { name: 'Tag to apply' }).click();
  await page.getByRole('option', { name: 'Removal', exact: true }).click();
  const first = page.getByRole('checkbox', {
    name: `Tag ${state.cards[0].name}`,
    exact: true,
  });
  await expect(first).toBeChecked();
  await first.uncheck();
  await page
    .getByRole('checkbox', { name: `Tag ${state.cards[1].name}`, exact: true })
    .check();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save tags', exact: true }).click();
  await expect(page.getByText('Tags updated', { exact: true })).toBeVisible();
  expect(saves).toEqual([
    { oracleIds: [state.cards[1].oracle_id], method: 'PUT' },
    { oracleIds: [state.cards[0].oracle_id], method: 'DELETE' },
  ]);
  await expect(page.getByRole('checkbox', { name: /^Tag / })).toHaveCount(0);
});

test('collections have their own history and empty decks do not load analysis or suggestions', async ({
  page,
}) => {
  await setupDeckDisplay(page, { kind: 'collection' });
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/history?**`,
    (route) =>
      route.fulfill({
        json: { revisions: [], head: null, totalCount: 0, page: 1 },
      }),
  );
  await openDeckAction(page, 'History');
  await expect(
    page.getByRole('region', { name: 'Collection history' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Back to collection' }),
  ).toBeVisible();
  let requests = 0;
  page.on('request', (request) => {
    if (/\/(suggestions|analytics|budget)$/.test(request.url())) requests++;
  });
  await setupDeckDisplay(page, { pro: true, cardCount: 0 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.getByTestId('deck-stats')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Suggested cards', exact: true }),
  ).toHaveCount(0);
  expect(requests).toBe(0);
});

test('deck settings duplicate the saved deck, show failures and open the named copy', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const original = JSON.stringify({ deck: state.deck, items: state.items });
  const copyId = '41000000-0000-4000-8000-000000000099';
  const copyName = `${state.deck.name} (copy)`;
  let fail = true;
  let requests = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    BACKEND + `/supabase/card-lists/${displayDeckId}/duplicate`,
    async (route) => {
      expect(route.request().method()).toBe('POST');
      expect(route.request().headers()[BACKEND_USER_AUTH_HEADER]).toMatch(
        /^Bearer /,
      );
      requests++;
      if (fail)
        return route.fulfill({
          status: 503,
          json: { message: 'Could not duplicate the deck. Please try again.' },
        });
      await gate;
      return route.fulfill({
        status: 201,
        json: { id: copyId, name: copyName },
      });
    },
  );
  await page.route(BACKEND + `/supabase/card-lists/mine/${copyId}`, (route) =>
    route.fulfill({
      json: { decklist: { ...state.deck, id: copyId, name: copyName } },
    }),
  );
  await page.route(SUPABASE + '/rest/v1/card_list_items**', (route) => {
    const isCopy =
      new URL(route.request().url()).searchParams.get('list_id') ===
      `eq.${copyId}`;
    return route.fulfill({
      json: isCopy
        ? state.items.map((item) => ({ ...item, list_id: copyId }))
        : state.items,
    });
  });
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await openDeckAction(page, 'Settings');
  const settings = page.getByRole('dialog', {
    name: 'Deck settings',
    exact: true,
  });
  const duplicate = settings.getByRole('button', {
    name: 'Duplicate Deck',
    exact: true,
  });
  const name = settings.getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Unsaved name');
  await expect(duplicate).toBeDisabled();
  await name.fill(state.deck.name!);
  await duplicate.click();
  await expect(settings.getByRole('alert')).toHaveText(
    'Could not duplicate the deck. Please try again.',
  );
  await expect(page).toHaveURL(new RegExp(`/lists/${displayDeckId}$`));
  expect(requests).toBe(1);
  fail = false;
  await duplicate.click();
  await expect.poll(() => requests).toBe(2);
  await expect(duplicate).toBeDisabled();
  release();
  await expect(page).toHaveURL(new RegExp(`/lists/${copyId}$`));
  await expect(
    page.getByRole('heading', { name: copyName, exact: true }),
  ).toBeVisible();
  await expect(page.locator('.list-card')).toHaveCount(state.items.length);
  await expect(
    page.getByText('Deck duplicated', { exact: true }),
  ).toBeVisible();
  expect(JSON.stringify({ deck: state.deck, items: state.items })).toBe(
    original,
  );
  expect(state.writes).toEqual([]);
});

test('library defaults to decks and collections with shared pagination and separate filters', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const folderId = '77000000-0000-4000-8000-000000000001';
  const entries = Array.from({ length: 54 }, (_, index) => ({
    ...state.deck,
    id: `78000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    name: `${index % 2 ? 'Collection' : 'Deck'} ${String(index + 1).padStart(2, '0')}`,
    kind: index % 2 ? 'collection' : 'deck',
    folder_id: index >= 52 ? folderId : null,
  }));
  const requests: { kind: string; page: number; folder: string }[] = [];
  await page.route(BACKEND + '/library/folders', (route) =>
    route.fulfill({
      json: {
        folders: [
          {
            id: folderId,
            name: 'Stored lists',
            count: 2,
            deckCount: 1,
            collectionCount: 1,
          },
        ],
      },
    }),
  );
  await page.route(BACKEND + '/supabase/card-lists?*', (route) => {
    const params = new URL(route.request().url()).searchParams;
    const kind = params.get('kind') ?? 'deck';
    const pageNumber = Number(params.get('page') ?? 1);
    const folder = params.get('folder') ?? '';
    requests.push({ kind, page: pageNumber, folder });
    const matching = entries.filter(
      (entry) =>
        (kind === 'all' || kind === entry.kind) &&
        (folder === 'unfiled' ? !entry.folder_id : entry.folder_id === folder),
    );
    return route.fulfill({
      json: {
        decklists: matching.slice((pageNumber - 1) * 50, pageNumber * 50),
        totalCount: matching.length,
        totalPages: Math.ceil(matching.length / 50),
        page: pageNumber,
        pageSize: 50,
      },
    });
  });
  await gotoHydrated(page, '/lists');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const all = page.getByRole('button', {
    name: 'Decks & Collections',
    exact: true,
  });
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId(`library-list-${entries[0].id}`)).toBeVisible();
  const collection = page.getByTestId(`library-list-${entries[1].id}`);
  await expect(collection).toBeVisible();
  await expect(
    collection.getByText('Collection', { exact: true }),
  ).toBeVisible();
  await expect(collection.getByRole('img', { name: /Bracket/ })).toHaveCount(0);
  await expect(page.getByTestId(`library-list-${entries[52].id}`)).toHaveCount(
    0,
  );
  await expect(
    page.getByText('52 decks & collections', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'New Deck', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'New Collection', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Create Collection');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page.getByRole('combobox', { name: 'Decklists view' }).click();
  await page.getByRole('option', { name: 'List', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(
    collection.getByRole('cell', { name: 'Collection', exact: true }),
  ).toBeVisible();
  await expect(collection.getByRole('img', { name: /Bracket/ })).toHaveCount(0);
  await page
    .getByRole('navigation', { name: 'Library pages top' })
    .getByRole('button', { name: 'Page 2', exact: true })
    .click();
  await expect(page.locator('[data-testid^="library-list-"]')).toHaveCount(2);
  await expect(
    page.getByTestId(`library-list-${entries[51].id}`),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Library pages bottom' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Decks', exact: true }).click();
  await expect(page).toHaveURL(/view=mine/);
  await expect(page.locator('[data-testid^="library-list-"]')).toHaveCount(26);
  await expect(collection).toHaveCount(0);
  await page.getByRole('button', { name: 'Collections', exact: true }).click();
  await expect(page).toHaveURL(/view=collections/);
  await expect(page.locator('[data-testid^="library-list-"]')).toHaveCount(26);
  await expect(collection).toBeVisible();
  await expect(page.getByTestId(`library-list-${entries[0].id}`)).toHaveCount(
    0,
  );
  await all.click();
  await expect(page).toHaveURL(/\/lists$/);
  await page
    .getByTestId(`folder-${folderId}`)
    .getByRole('link', { name: 'Stored lists', exact: true })
    .click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByTestId(`library-list-${entries[52].id}`),
  ).toBeVisible();
  await expect(
    page.getByTestId(`library-list-${entries[53].id}`),
  ).toBeVisible();
  expect(requests).toEqual(
    expect.arrayContaining([
      { kind: 'all', page: 1, folder: 'unfiled' },
      { kind: 'all', page: 2, folder: 'unfiled' },
      { kind: 'deck', page: 1, folder: 'unfiled' },
      { kind: 'collection', page: 1, folder: 'unfiled' },
      { kind: 'all', page: 1, folder: folderId },
    ]),
  );
});
