import { expect, test, type Page } from '@playwright/test';
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
    const state = await setupDeckDisplay(page, { owner });
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
      name: 'Card options',
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
        page.getByRole('menuitem', { name: 'Add a copy', exact: true }),
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole('menuitem', { name: 'Add a copy', exact: true }),
      ).toHaveCount(0);
    }
    await page
      .getByRole('menuitem', { name: 'Add to Deck', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /Destination deck/ }).click();
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
  });
}

test('list-card clipboard controls preserve metadata after flipping and remove the card again', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { owner: false });
  const card = cardByName(page, state.cards[0].name);
  await card.getByRole('button', { name: 'Flip Card', exact: true }).click();
  await expect(card.getByRole('img')).toHaveAttribute('src', /back/);

  await card.getByRole('button', { name: 'Add Card', exact: true }).click();
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

  await added.click();
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
    height: document.documentElement.scrollHeight,
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
      height: document.documentElement.scrollHeight,
      sizes: cards.map((card) => {
        const box = card.getBoundingClientRect();
        return {
          width: box.width,
          height: box.height,
          top: box.top + window.scrollY,
        };
      }),
    }));
    expect(after.height).toBeCloseTo(before.height, 0);
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

test.describe('desktop overlay dismissal', () => {
  test.use({
    viewport: { width: 1280, height: 900 },
    isMobile: false,
    hasTouch: false,
  });

  test('outside dismissal hides overlays while keyboard dismissal keeps the trigger accessible', async ({
    page,
  }) => {
    await setupDeckDisplay(page);
    const card = page.locator('.list-card').first();
    const menu = card.locator('.menu-wrapper');
    const actions = card.locator('.card-action-overlay');
    const trigger = card.getByRole('button', {
      name: 'Card options',
      exact: true,
    });
    const outside = page.getByRole('heading', {
      name: 'My display deck',
      exact: true,
      includeHidden: true,
    });

    await card.hover();
    await trigger.click();
    await expect(
      page.getByRole('menuitem', { name: 'Add to Deck', exact: true }),
    ).toBeVisible();
    await outside.hover({ force: true });
    await expect(menu).toHaveCSS('opacity', '1');
    await outside.click({ force: true });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(menu).toHaveCSS('opacity', '0', { timeout: 3000 });
    await expect(actions).toHaveCSS('opacity', '0', { timeout: 3000 });

    await card.hover();
    await expect(menu).toHaveCSS('opacity', '1');
    await outside.hover();
    await expect(menu).toHaveCSS('opacity', '0');

    await page.keyboard.press('Tab');
    await trigger.focus();
    await expect(trigger).toBeFocused();
    await expect(menu).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('menuitem', { name: 'Add to Deck', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(menu).toHaveCSS('opacity', '1');
  });
});
