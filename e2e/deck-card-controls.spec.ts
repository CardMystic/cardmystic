import { expect, test, type Page } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';
import {
  destinationDeckId,
  displayDeckId,
  setupDeckDisplay,
} from './utils/deckDisplay';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

function cardByName(page: Page, name: string) {
  return page
    .locator('.card-root')
    .filter({ has: page.getByRole('img', { name, exact: true }) });
}

for (const owner of [true, false]) {
  test(`${owner ? 'owned' : 'public'} deck card menu adds the selected card to another deck`, async ({
    page,
  }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (/hydration.*mismatch|hydration completed but/i.test(message.text()))
        hydrationErrors.push(message.text());
    });
    const state = await setupDeckDisplay(page, { owner });
    const deckSearches: string[] = [];
    if (owner) {
      const recentDecks = [
        { ...state.deck, id: destinationDeckId, name: 'Destination deck' },
        {
          ...state.deck,
          id: '41000000-0000-4000-8000-000000000003',
          name: 'Other recent deck',
        },
      ];
      await page.route(
        BACKEND + '/supabase/card-lists/mine/search**',
        (route) => {
          const query =
            new URL(route.request().url()).searchParams.get('query') ?? '';
          deckSearches.push(query);
          return route.fulfill({
            json: {
              decklists: recentDecks.filter((deck) =>
                deck.name.toLowerCase().includes(query.toLowerCase()),
              ),
            },
          });
        },
      );
    }
    if (owner) {
      await page.route(BACKEND + '/card-collections/labels', (route) =>
        route.fulfill({
          json: {
            [state.cards[0].oracle_id]: {
              roles: ['Burn', 'Card draw', 'Counter placement', 'Removal'],
              themes: [
                '+1/+1 counters',
                'Commander matters',
                'Artifacts',
                'Tokens',
              ],
            },
          },
        }),
      );
      await gotoHydrated(page, '/lists/' + displayDeckId);
    }
    const card = cardByName(page, state.cards[0].name);
    if (owner) {
      const image = card.getByRole('img', {
        name: state.cards[0].name,
        exact: true,
      });
      await card
        .getByRole('button', { name: 'Flip Card', exact: true })
        .click();
      await expect(image).toHaveAttribute('src', /\/back\//);
    }
    const trigger = card.getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    });
    await trigger.scrollIntoViewIfNeeded();
    const hitArea = (await trigger.boundingBox())!;
    expect(hitArea.width).toBeGreaterThanOrEqual(44);
    expect(hitArea.height).toBeGreaterThanOrEqual(44);
    // Tap near the edge to protect against accidentally opening the card page.
    await trigger.tap({ position: { x: 2, y: hitArea.height / 2 } });
    await expect(page).toHaveURL(new RegExp('/lists/' + displayDeckId + '$'));
    if (owner) {
      await expect(
        page.getByRole('button', { name: 'Set Copies', exact: true }),
      ).toBeVisible();
      const modal = page.getByRole('dialog');
      await expect(modal).toHaveCSS('translate', 'none');
      await expect.poll(async () => (await modal.boundingBox())?.x).toBe(0);
      const box = (await modal.boundingBox())!;
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(box.width).toBe(390);
      expect(box.height).toBe(844);
      const order = await modal
        .locator(
          '[aria-label="Card actions"] button, [aria-label="Card actions"] a',
        )
        .evaluateAll((elements) =>
          elements
            .slice(0, 5)
            .map(
              (element) =>
                element.getAttribute('aria-label') ||
                element.textContent?.trim(),
            ),
        );
      expect(order).toEqual([
        "Go To Card's Page",
        'Set Printing',
        'Move',
        'Set Copies',
        'Remove From List',
      ]);
      const editButtons = modal.locator(
        '[data-card-action-group="list"] button',
      );
      const editBoxes = await editButtons.evaluateAll((buttons) =>
        buttons.map((button) => ({
          x: button.getBoundingClientRect().x,
          y: button.getBoundingClientRect().y,
          width: button.getBoundingClientRect().width,
          height: button.getBoundingClientRect().height,
        })),
      );
      expect(editBoxes).toHaveLength(4);
      await expect(modal.locator('[data-card-action-group="list"]')).toHaveCSS(
        'border-top-width',
        '0px',
      );
      await expect(modal.getByText('Mainboard', { exact: true })).toHaveCount(
        0,
      );
      expect(editBoxes[0].x).toBeLessThan(editBoxes[1].x);
      expect(editBoxes[0].y).toBeCloseTo(editBoxes[1].y, 0);
      expect(editBoxes[2].x).toBe(editBoxes[0].x);
      expect(editBoxes[3].x).toBe(editBoxes[1].x);
      expect(editBoxes[2].y).toBeCloseTo(editBoxes[3].y, 0);
      expect(editBoxes[2].y).toBeGreaterThanOrEqual(
        editBoxes[0].y + editBoxes[0].height,
      );
      expect(new Set(editBoxes.map((box) => box.width)).size).toBe(1);
      expect(editBoxes.every((box) => box.height >= 44)).toBe(true);
      await expect(
        modal.getByRole('button', { name: 'Remove From List', exact: true }),
      ).toHaveText('Remove');
      const roles = modal.getByRole('region', { name: 'Roles', exact: true });
      const titleBox = (await roles.getByRole('heading').boundingBox())!;
      const chipBox = (await roles
        .getByRole('listitem')
        .first()
        .boundingBox())!;
      expect(
        Math.abs(
          titleBox.y + titleBox.height / 2 - chipBox.y - chipBox.height / 2,
        ),
      ).toBeLessThan(2);
      await page.screenshot({ path: 'test-results/mobile-deck-card-menu.png' });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      await modal
        .getByRole('button', { name: 'Show more roles', exact: true })
        .click();
      await expect(
        modal.getByRole('link', { name: 'Counter placement', exact: true }),
      ).toBeVisible();
      expect(
        await modal.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      for (const button of await editButtons.all()) {
        expect(
          await button.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ).toBe(true);
      }
      for (const chip of await modal
        .locator(
          'section[aria-label="Roles"] li, section[aria-label="Themes"] li',
        )
        .all()) {
        expect(
          await chip.evaluate(
            (element) => element.scrollWidth <= element.clientWidth,
          ),
        ).toBe(true);
      }
      await page.screenshot({
        path: 'test-results/mobile-deck-tags-large-text.png',
      });
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '';
      });
      const printingButton = modal.getByRole('button', {
        name: 'Set Printing',
        exact: true,
      });
      await printingButton.focus();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('dialog', {
          name: 'Choose printing: ' + state.cards[0].name,
          exact: true,
        }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).toBeVisible();
    } else {
      await expect(
        page.getByRole('button', { name: 'Set Copies', exact: true }),
      ).toHaveCount(0);
    }
    await page
      .getByRole('button', { name: 'Add to Another Deck', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    if (owner) {
      const search = dialog.getByRole('combobox');
      const otherRecent = dialog.getByRole('button', {
        name: /Other recent deck/,
      });
      await expect(otherRecent).toBeVisible();
      await search.fill('No matching decks');
      await expect.poll(() => deckSearches).toContain('No matching decks');
      await expect(dialog.getByRole('option')).toHaveCount(0);
      await expect(otherRecent).toBeVisible();
      await otherRecent.click();
      await expect(search).toHaveValue('Other recent deck');
      await expect(
        dialog.getByRole('button', { name: /Destination deck/ }),
      ).toBeVisible();
    }
    await dialog.getByRole('button', { name: /Destination deck/ }).click();
    if (owner) {
      await expect(dialog.getByRole('combobox')).toHaveValue(
        'Destination deck',
      );
      await expect(
        dialog.getByRole('button', { name: /Other recent deck/ }),
      ).toBeVisible();
      let releaseAdd!: () => void;
      const addGate = new Promise<void>((resolve) => {
        releaseAdd = resolve;
      });
      let failed = false;
      await page.route(
        BACKEND + '/supabase/card-lists/add-cards-by-oracle-id',
        async (route) => {
          if (failed) return route.fallback();
          await addGate;
          failed = true;
          await route.fulfill({
            status: 500,
            json: { message: 'Could not save card. Try again.' },
          });
        },
      );
      await dialog
        .getByRole('button', { name: 'Add to Deck', exact: true })
        .click();
      try {
        await expect(dialog).toBeHidden();
        await expect(page.locator('.card-edit-toast')).toHaveText('Card Added');
        await expect(page.getByText(/already in this deck/)).toBeHidden();
        expect(state.writes).toHaveLength(0);
      } finally {
        releaseAdd();
      }
      await expect(
        page.getByText('Could not add card', { exact: true }),
      ).toBeVisible();
      await expect(dialog).toBeHidden();
      await trigger.click();
      await page
        .getByRole('button', { name: 'Add to Another Deck', exact: true })
        .click();
      await dialog.getByRole('button', { name: /Destination deck/ }).click();
    }
    await dialog
      .getByRole('button', { name: 'Add to Deck', exact: true })
      .click();

    await expect
      .poll(() => state.writes)
      .toEqual([
        {
          listId: destinationDeckId,
          oracleIds: [state.cards[0].oracle_id],
        },
      ]);
    await expect(dialog).not.toBeVisible();
    await expect(card.getByText('x2', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp('/lists/' + displayDeckId + '$'));
    expect(hydrationErrors).toEqual([]);
  });
}

test('list-card clipboard controls preserve metadata after flipping and remove the card again', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { owner: false });
  const card = cardByName(page, state.cards[0].name);
  await card.getByRole('button', { name: 'Flip Card', exact: true }).click();
  await expect(card.getByRole('img')).toHaveAttribute('src', /back/);

  await card
    .getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add Card', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  const added = card.getByRole('button', { name: 'Card Added', exact: true });
  await expect(added).toHaveAttribute('title', 'Added to clipboard');
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('cm.clipboard.v1')!),
  );
  expect(saved.order).toEqual([state.cards[0].id]);
  expect(saved.items[state.cards[0].id]).toMatchObject({
    id: state.cards[0].id,
    oracleId: state.cards[0].oracle_id,
    name: state.cards[0].name,
    set: state.cards[0].set,
    price: state.cards[0].prices.usd,
    imageUrl: expect.stringContaining('/front/'),
  });

  await card
    .getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Card Added', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  await expect(
    card.getByRole('button', { name: 'Add Card', exact: true }),
  ).toHaveAttribute('title', 'Add to clipboard');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('cm.clipboard.v1')!),
    ),
  ).toMatchObject({
    items: {},
    order: [],
  });
});

test('slow card images keep the card grid stable while scrolling on mobile', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, {
    cardCount: 80,
    holdImages: true,
  });
  const gridCards = page.locator('.list-card');
  const firstImage = gridCards.first().getByRole('img');
  await expect(firstImage).toHaveJSProperty('naturalWidth', 0);
  const before = await gridCards.evaluateAll((cards) => ({
    sizes: cards.map((card) => {
      const box = card.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        top: box.top + window.scrollY,
      };
    }),
  }));
  expect(before.sizes[0].height).toBeGreaterThan(100);

  try {
    state.releaseImages();
    await expect(firstImage).toHaveJSProperty('naturalWidth', 488);
    await gridCards.last().scrollIntoViewIfNeeded();
    await expect(gridCards.last().getByRole('img')).toHaveJSProperty(
      'naturalWidth',
      488,
    );
    const after = await gridCards.evaluateAll((cards) => ({
      sizes: cards.map((card) => {
        const box = card.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          top: box.top + window.scrollY,
        };
      }),
    }));
    // Related-content placeholders below the deck may collapse on an empty
    // response. Only the card grid should stay fixed while its images load.
    for (let index = 0; index < before.sizes.length; index++) {
      expect(after.sizes[index].width).toBeCloseTo(
        before.sizes[index].width,
        0,
      );
      expect(after.sizes[index].height).toBeCloseTo(
        before.sizes[index].height,
        0,
      );
      expect(after.sizes[index].top).toBeCloseTo(before.sizes[index].top, 0);
    }
  } finally {
    state.releaseImages();
  }
});

test.describe('desktop card modal', () => {
  test.use({
    viewport: { width: 1280, height: 900 },
    isMobile: false,
    hasTouch: false,
  });
  test('a commander duplicate on the sideboard has normal actions and a cross-board legality warning', async ({
    page,
  }) => {
    const state = await setupDeckDisplay(page);
    state.deck.format = 'Commander';
    state.items[0].num_copies = 1;
    state.items[0].is_commander = true;
    state.items.push({
      ...state.items[0],
      id: 'sideboard-commander',
      board: 'Sideboard',
      is_commander: false,
    });
    // Basic lands remain exempt even when their copies span both boards.
    state.items.push({
      ...state.items[2],
      id: 'sideboard-land',
      board: 'Sideboard',
    });
    await gotoHydrated(page, '/lists/' + displayDeckId);
    await page.locator('#board-sideboard').click();
    const name = state.cards[0].name;
    const cards = cardByName(page, name);
    await expect(cards).toHaveCount(2);
    for (const card of await cards.all()) {
      await expect(card.locator('.legality-overlay')).toContainText(
        'Only 1 copy allowed',
      );
    }
    await expect(
      cardByName(page, 'Island').locator('.legality-overlay'),
    ).toHaveCount(0);
    const preview = page.locator('.preview-rail');
    await cards
      .last()
      .getByRole('button', { name: `Options for ${name}`, exact: true })
      .hover();
    await expect(preview.getByText('Sideboard', { exact: true })).toBeVisible();
    await expect(
      preview.getByRole('button', { name: 'Remove Commander', exact: true }),
    ).toHaveCount(0);
    await expect(
      preview.getByRole('button', { name: 'Set Copies', exact: true }),
    ).toBeVisible();
    await expect(
      preview.getByRole('button', { name: 'Remove From List', exact: true }),
    ).toBeVisible();
    await cards
      .last()
      .getByRole('button', { name: `Options for ${name}`, exact: true })
      .click();
    const modal = page.getByRole('dialog');
    await expect(
      modal.getByRole('button', { name: 'Set Copies', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('button', { name: 'Remove From List', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('button', { name: /Remove.*Commander/ }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await cards
      .first()
      .getByRole('button', { name: `Options for ${name}`, exact: true })
      .click();
    await expect(
      modal.getByRole('button', { name: 'Remove Commander', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('button', { name: 'Move', exact: true }),
    ).toHaveCount(0);
    await expect(
      modal.getByRole('button', { name: 'Set Copies', exact: true }),
    ).toHaveCount(0);
    await expect(
      modal.getByRole('button', { name: 'Remove From List', exact: true }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Display', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'Deck view', exact: true })
      .click();
    await page.getByRole('option', { name: 'Card Text', exact: true }).click();
    await page.keyboard.press('Escape');
    const rows = page.locator('.card-text-row').filter({
      has: page.getByRole('button', {
        name: name.split(' // ')[0],
        exact: true,
      }),
    });
    await expect(rows).toHaveCount(2);
    await expect(
      rows.locator('[aria-label="Only 1 copy allowed in commander"]'),
    ).toHaveCount(2);
    await rows.last().locator('button.card-name').click();
    await expect(
      modal.getByRole('button', { name: 'Set Copies', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('button', { name: 'Remove From List', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('button', { name: /Remove.*Commander/ }),
    ).toHaveCount(0);
  });

  test('click and keyboard open the modal; Escape restores focus', async ({
    page,
  }) => {
    const state = await setupDeckDisplay(page, { cardCount: 24 });
    const footer = page.locator('.sticky-footer-wrap');
    await expect(footer).toBeVisible();
    const trigger = page.getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    });
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    // The modal overlay must cover the bar without relying on aria-hidden
    // to visually hide it (select menus apply that attribute too).
    await expect
      .poll(() =>
        footer.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const shell = element.querySelector<HTMLElement>(
            '.sticky-footer-shell',
          )!;
          const pointerEvents = shell.style.pointerEvents;
          // Hit-test the actual stacking order, not the background interaction lock.
          shell.style.pointerEvents = 'auto';
          try {
            const target = document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2,
            );
            return !!target && !element.contains(target);
          } finally {
            shell.style.pointerEvents = pointerEvents;
          }
        }),
      )
      .toBe(true);
    await expect(
      page.getByRole('link', { name: "Go To Card's Page", exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await page.getByRole('button', { name: 'Display', exact: true }).click();
    await page
      .getByRole('combobox', { name: 'Deck view', exact: true })
      .click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(footer).toBeVisible();
    await page.getByRole('option', { name: 'Card Text', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('.card-text-row')).toHaveCount(
      state.cards.length,
    );
    await page
      .locator('.card-text-row')
      .first()
      .locator('button.card-name')
      .click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('button', { name: 'Add Card', exact: true }),
    ).toBeVisible();
  });
});

test.describe('compact desktop preview controls', () => {
  test.use({
    viewport: { width: 1440, height: 1000 },
    isMobile: false,
    hasTouch: false,
  });
  test('image controls and grouped list actions keep their original behavior', async ({
    page,
  }) => {
    const state = await setupDeckDisplay(page);
    await page.route(
      BACKEND + '/supabase/card-lists/update-num-copies',
      (route) => {
        const body = route.request().postDataJSON();
        state.items[0].num_copies = body.numCopies;
        return route.fulfill({
          json: { cardName: body.cardName, numCopies: body.numCopies },
        });
      },
    );
    const card = cardByName(page, state.cards[0].name);
    await card.hover();
    const preview = page.locator('.preview-rail');
    await expect(
      preview.getByRole('heading', { name: state.cards[0].name }),
    ).toBeVisible();
    const image = preview.getByRole('img', {
      name: state.cards[0].name,
      exact: true,
    });
    for (const name of ['Add Card', 'Flip Card']) {
      const bounds = (await preview
        .getByRole('button', { name, exact: true })
        .boundingBox())!;
      const imageBounds = (await image.boundingBox())!;
      expect(bounds.x).toBeGreaterThan(imageBounds.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(
        imageBounds.x + imageBounds.width,
      );
      expect(bounds.y).toBeGreaterThan(imageBounds.y);
      expect(bounds.y + bounds.height).toBeLessThan(
        imageBounds.y + imageBounds.height,
      );
    }
    await preview
      .getByRole('button', { name: 'Flip Card', exact: true })
      .click();
    await expect(image).toHaveAttribute('src', /\/back\//);
    const previewTrigger = preview.getByRole('button', {
      name: `Options for ${state.cards[0].name}`,
      exact: true,
    });
    const deckUrl = page.url();
    await image.click();
    const previewModal = page.getByRole('dialog', {
      name: state.cards[0].name,
      exact: true,
    });
    await expect(previewModal).toBeVisible();
    await expect(
      previewModal.getByRole('button', { name: 'Set Copies', exact: true }),
    ).toBeVisible();
    expect(page.url()).toBe(deckUrl);
    await previewModal
      .getByRole('button', { name: 'Set Copies', exact: true })
      .click();
    const modalUpdate = page.waitForRequest(
      (request) =>
        request.url() === `${BACKEND}/supabase/card-lists/update-num-copies` &&
        request.method() === 'PUT',
    );
    await page
      .getByRole('menuitem', { name: 'Add a copy', exact: true })
      .click();
    expect((await modalUpdate).postDataJSON()).toMatchObject({ numCopies: 3 });
    await expect(previewModal).toBeHidden();
    await expect(previewTrigger).toBeFocused();
    await preview
      .getByRole('button', { name: 'Add Card', exact: true })
      .click();
    await expect(
      preview.getByRole('button', { name: 'Card Added', exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/lists/${displayDeckId}$`));
    await expect(
      preview.getByRole('button', { name: 'Add to Another Deck', exact: true }),
    ).toBeVisible();
    const remove = preview.getByRole('button', {
      name: 'Remove From List',
      exact: true,
    });
    await expect(remove).toHaveText('Remove');
    const copies = preview.getByRole('button', {
      name: 'Set Copies',
      exact: true,
    });
    const copyBounds = (await copies.boundingBox())!;
    const removeBounds = (await remove.boundingBox())!;
    const printingBounds = (await preview
      .getByRole('button', { name: 'Set Printing', exact: true })
      .boundingBox())!;
    const moveBounds = (await preview
      .getByRole('button', { name: 'Move', exact: true })
      .boundingBox())!;
    const otherBounds = (await preview
      .getByRole('button', { name: 'Add to Another Deck', exact: true })
      .boundingBox())!;
    expect(printingBounds.x + printingBounds.width).toBeLessThan(moveBounds.x);
    expect(printingBounds.y).toBeCloseTo(moveBounds.y, 0);
    expect(copyBounds.x + copyBounds.width).toBeLessThan(removeBounds.x);
    expect(copyBounds.y).toBeCloseTo(removeBounds.y, 0);
    expect(copyBounds.x).toBeCloseTo(printingBounds.x, 0);
    expect(removeBounds.x).toBeCloseTo(moveBounds.x, 0);
    expect(copyBounds.y).toBeGreaterThanOrEqual(
      printingBounds.y + printingBounds.height,
    );
    expect(moveBounds.width).toBeCloseTo(printingBounds.width, 0);
    expect(copyBounds.width).toBeCloseTo(removeBounds.width, 0);
    expect(moveBounds.x + moveBounds.width).toBeCloseTo(
      otherBounds.x + otherBounds.width,
      0,
    );
    for (const name of [
      'Set Printing',
      'Move',
      'Set Copies',
      'Remove From List',
      'Add to Another Deck',
    ]) {
      const action = preview.getByRole('button', { name, exact: true });
      await expect(action).toHaveCSS('justify-content', 'flex-start');
      await expect(action).toHaveCSS('text-align', 'left');
    }
    await copies.click();
    await expect
      .poll(async () => (await page.getByRole('menu').boundingBox())!.width)
      .toBeGreaterThanOrEqual(copyBounds.width);

    const update = page.waitForRequest(
      (request) =>
        request.url() === `${BACKEND}/supabase/card-lists/update-num-copies` &&
        request.method() === 'PUT',
    );
    await page
      .getByRole('menuitem', { name: 'Add a copy', exact: true })
      .click();
    expect((await update).postDataJSON()).toMatchObject({ numCopies: 4 });
    await previewTrigger.click();
    await expect(previewModal).toBeVisible();
    await previewModal
      .getByRole('button', { name: 'Set Copies', exact: true })
      .click();
    await page
      .getByRole('menuitem', { name: 'Set Copies', exact: true })
      .click();
    const copiesDialog = page.getByRole('dialog', {
      name: 'Set Copies',
      exact: true,
    });
    await expect(previewModal).toBeHidden();
    await expect(copiesDialog.getByRole('spinbutton')).toBeFocused();
    expect(page.url()).toBe(deckUrl);
    await page.keyboard.press('Escape');
    await expect(copiesDialog).toBeHidden();
    await preview.getByRole('button', { name: 'Move', exact: true }).click();
    const move = page.waitForRequest(
      (request) =>
        request.url() === `${BACKEND}/supabase/card-lists/change-board` &&
        request.method() === 'PUT',
    );
    await page
      .getByRole('menuitem', { name: 'Move to Sideboard', exact: true })
      .click();
    expect((await move).postDataJSON()).toMatchObject({ board: 'Sideboard' });
  });
});
