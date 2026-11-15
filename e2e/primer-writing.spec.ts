import { test, expect } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, SUPABASE } from './utils/mocks';

test('writers insert deck charts, save them, and readers see the current deck stats', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { cardCount: 4 });
  state.items[0].is_commander = true;
  state.items[3].board = 'Sideboard';
  let text = '# Deck charts\n\n';
  await page.route(
    BACKEND + `/supabase/card-lists/primer/${displayDeckId}`,
    (route) => route.fulfill({ json: { text } }),
  );
  await page.route(BACKEND + '/supabase/card-lists/primer', (route) => {
    text = route.request().postDataJSON().text;
    return route.fulfill({ json: { text } });
  });
  await page.reload();
  await page.getByRole('link', { name: 'Primer', exact: true }).click();
  for (const name of ['Mana curve', 'Color pie chart', 'Deck stats']) {
    await page
      .getByRole('button', { name: 'Deck content', exact: true })
      .click();
    await page.getByRole('menuitem', { name, exact: true }).click();
  }
  await page
    .getByRole('button', { name: 'Split Preview', exact: true })
    .click();
  const charts = page.locator('[data-primer-deck]');
  await expect(charts).toHaveCount(3);
  await expect(
    page.getByRole('figure', { name: 'Mana curve', exact: true }),
  ).toHaveCount(2);
  await expect(
    page.getByRole('figure', { name: 'Color identity', exact: true }),
  ).toHaveCount(2);
  await expect(page.locator('[data-primer-deck="deck-stats"]')).toContainText(
    '2 cards in the library · 1 lands · 1 nonlands',
  );
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect.poll(() => text).toContain('@[deck](mana-curve)');
  await expect.poll(() => text).toContain('@[deck](color-chart)');
  await expect.poll(() => text).toContain('@[deck](deck-stats)');
  await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
  await page.getByRole('button', { name: 'View Preview', exact: true }).click();
  await expect(
    page.getByRole('figure', { name: 'Mana curve', exact: true }),
  ).toHaveCount(2);

  // Read-only primers use the public deck path, not owner-only database rows.
  await page.route(
    BACKEND + `/supabase/card-lists/mine/${displayDeckId}`,
    (route) => route.fulfill({ status: 404, json: {} }),
  );
  await page.route(
    BACKEND + `/supabase/card-lists/view/${displayDeckId}`,
    (route) =>
      route.fulfill({
        json: {
          decklist: { ...state.deck, visibility: 'public' },
          items: state.items,
          owner: {
            id: state.deck.user_id,
            username: state.deck.username,
            avatar_card_name: null,
            is_featured: false,
          },
        },
      }),
  );
  await page.route(SUPABASE + '/rest/v1/card_list_items**', (route) =>
    route.fulfill({ status: 403, json: { message: 'Not the owner' } }),
  );
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Deck content', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('figure', { name: 'Mana curve', exact: true }),
  ).toHaveCount(2);
  await expect(page.locator('[data-primer-deck="deck-stats"]')).toContainText(
    '2 cards in the library',
  );
});

test('primer keeps its banner, places cards in a row, and saves a printing for one occurrence', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { cardCount: 4 });
  Object.assign(state.deck, {
    visibility: 'public',
    like_count: 7,
    save_count: 3,
    comment_count: 5,
    view_count: 123,
  });
  const card = state.cards[3];
  const printingId = '44000000-0000-4000-8000-000000000001';
  let catalogGate = Promise.resolve();
  let text = `((${card.name})) ((${card.name}))`;
  await page.route(
    BACKEND + `/supabase/card-lists/primer/${displayDeckId}`,
    (route) => route.fulfill({ json: { text } }),
  );
  await page.route(BACKEND + '/supabase/card-lists/primer', (route) => {
    text = route.request().postDataJSON().text;
    return route.fulfill({ json: { text } });
  });
  await page.route(BACKEND + '/cards/cards-by-names', (route) =>
    route.fulfill({ json: [card] }),
  );
  await page.route(SUPABASE + '/rest/v1/card_printings**', async (route) => {
    await catalogGate;
    return route.fulfill({
      json: [
        {
          id: printingId,
          oracle_id: card.oracle_id,
          set_code: 'test',
          collector_number: '123',
          lang: 'en',
          released_at: '2026-01-01',
          finish_mask: 3,
          image_paths: ['front/a/b/selected-art.jpg'],
          flavor_name: null,
          tcgplayer_id: null,
          usd_cents: 250,
          foil_cents: 950,
          etched_cents: null,
          card_printing_sets: { name: 'Alternate Test Set' },
        },
      ],
    });
  });
  await page.reload();
  await page.getByRole('link', { name: 'Primer', exact: true }).click();
  const banner = page.getByTestId('deck-banner');
  await expect(
    banner.getByRole('link', { name: 'Back to Decklist' }),
  ).toBeVisible();
  await expect(
    banner.getByRole('link', { name: 'Back to Decklist' }),
  ).toHaveAttribute('href', `/lists/${displayDeckId}`);
  await expect(
    banner.getByRole('link', { name: 'Display Tester' }),
  ).toBeVisible();
  await expect(banner.getByTestId('decklist-like-button')).toHaveText('7');
  await expect(banner.getByTestId('decklist-save-button')).toHaveText('3');
  await expect(banner.getByText('5 comments')).toBeVisible();
  await expect(banner.getByText('123 views')).toBeVisible();
  await page.setViewportSize({ width: 2400, height: 1000 });
  const editingBanner = await banner.boundingBox();
  const breadcrumb = await page
    .getByRole('navigation', { name: 'Breadcrumb', exact: true })
    .boundingBox();
  expect(Math.abs(breadcrumb!.x - editingBanner!.x)).toBeLessThan(2);
  expect(breadcrumb!.y + breadcrumb!.height).toBeLessThanOrEqual(
    editingBanner!.y,
  );
  await page.getByRole('button', { name: 'View Preview', exact: true }).click();
  const previewBanner = await banner.boundingBox();
  expect(editingBanner!.width).toBe(previewBanner!.width);
  expect(editingBanner!.x).toBe(previewBanner!.x);
  const images = page.locator('.primer-preview .card-inline-img');
  await expect(images).toHaveCount(2);
  const boxes = await images.evaluateAll((nodes) =>
    nodes.map((node) => ({
      top: node.getBoundingClientRect().top,
      left: node.getBoundingClientRect().left,
    })),
  );
  expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThan(2);
  expect(boxes[1].left).toBeGreaterThan(boxes[0].left);
  const centering = await page.locator('.card-embed-row').evaluate((row) => {
    const bounds = row.getBoundingClientRect();
    const first = row.firstElementChild!.getBoundingClientRect();
    const last = row.lastElementChild!.getBoundingClientRect();
    return Math.abs(
      (first.left + last.right) / 2 - (bounds.left + bounds.right) / 2,
    );
  });
  expect(centering).toBeLessThan(2);
  await expect(page.locator('.card-inline-actions')).toHaveCount(0);
  await images.first().click();
  const actions = page.getByRole('dialog', { name: card.name, exact: true });
  await expect(
    actions.getByRole('link', { name: 'Find Similar Cards' }),
  ).toBeVisible();
  await expect(actions.getByRole('button', { name: 'Add Card' })).toBeVisible();
  await actions.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/lists/${displayDeckId}/primer$`));
  await page
    .getByRole('button', {
      name: `Select printing for ${card.name}`,
      exact: true,
    })
    .first()
    .click();
  const picker = page.getByRole('dialog', {
    name: `Choose printing: ${card.name}`,
  });
  await picker
    .getByRole('button', { name: 'Alternate Test Set #123', exact: true })
    .click();
  await picker.getByRole('combobox', { name: 'Printing finish' }).click();
  await page.getByRole('option', { name: 'Foil', exact: true }).click();
  await expect(
    picker.locator('.card-finish[data-card-finish="foil"]'),
  ).toHaveCount(1);
  await picker
    .getByRole('button', { name: 'Use printing', exact: true })
    .click();
  await expect(picker).not.toBeVisible();
  await expect(images.first()).toHaveAttribute('src', /selected-art\.jpg$/);
  await expect(images.nth(1)).not.toHaveAttribute('src', /selected-art\.jpg$/);
  const surfaces = page.locator('.card-inline-img-link');
  await expect(surfaces.first()).toHaveAttribute('data-card-finish', 'foil');
  expect(
    await surfaces
      .first()
      .evaluate((node) => getComputedStyle(node, '::after').pointerEvents),
  ).toBe('none');
  expect(
    await surfaces
      .nth(1)
      .evaluate((node) => getComputedStyle(node, '::after').content),
  ).toBe('none');
  await page.screenshot({ path: test.info().outputPath('foil-preview.png') });
  await images.first().click();
  await expect(
    actions.locator('.card-finish[data-card-finish="foil"]'),
  ).toHaveCount(1);
  await actions.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Back to Edit', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect
    .poll(() => text)
    .toBe(
      `((${card.name}|printing=${printingId}|finish=foil)) ((${card.name}))`,
    );
  let releaseCatalog!: () => void;
  catalogGate = new Promise<void>((resolve) => {
    releaseCatalog = resolve;
  });
  await page.reload();
  await page.getByRole('button', { name: 'View Preview', exact: true }).click();
  await expect(
    surfaces.first().locator('.card-inline-placeholder'),
  ).toBeVisible();
  await expect(surfaces.first().locator('img')).toHaveCount(0);
  await expect(surfaces.nth(1).locator('img')).toBeVisible();
  releaseCatalog();
  await expect(images.first()).toHaveAttribute('src', /selected-art\.jpg$/);
  await expect(images.nth(1)).not.toHaveAttribute('src', /selected-art\.jpg$/);
  await expect(surfaces.first()).toHaveAttribute('data-card-finish', 'foil');
});

test('primer link previews use summaries and stop loading when a linked page is unavailable', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { owner: false });
  const missingId = '44000000-0000-4000-8000-000000000099';
  const text = `https://cardmystic.com/lists/${displayDeckId}/primer\n\nhttps://cardmystic.com/lists/${missingId}/primer`;
  await page.route(
    BACKEND + `/supabase/card-lists/primer/${displayDeckId}`,
    (route) => route.fulfill({ json: { text } }),
  );
  const requests: string[] = [];
  await page.route(BACKEND + '/supabase/card-lists/summaries?**', (route) => {
    requests.push(route.request().url());
    return route.fulfill({ json: { decklists: [state.deck] } });
  });
  await page.goto(`/lists/${displayDeckId}/primer`);
  const resolved = page.locator(
    `.link-embed[href="/lists/${displayDeckId}/primer"]`,
  );
  await expect(resolved).toContainText(state.deck.name);
  await expect(resolved.locator('.link-embed-eyebrow')).toHaveText('Primer');
  await expect(
    page.locator(`.link-embed[href="/lists/${missingId}/primer"]`),
  ).toHaveText('Open linked page');
  await expect(page.locator('.link-embed-loading')).toHaveCount(0);
  // The banner also loads its own summary. Both embedded links share one batch.
  expect(
    requests.filter((url) =>
      new URL(url).searchParams.get('ids')?.includes(missingId),
    ),
  ).toHaveLength(1);
});
