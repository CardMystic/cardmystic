import { expect, test, type Page } from '@playwright/test';
import { setupDeckDisplay } from './utils/deckDisplay';
import { BACKEND, SUPABASE } from './utils/mocks';

function groupTrigger(page: Page, name: string) {
  return page
    .getByRole('button', { name, exact: true })
    .and(page.locator('[aria-expanded]'));
}

async function choose(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('adding a card preserves mobile display choices and collapsed groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const state = await setupDeckDisplay(page, {
    groupBy: 'type',
    extraCards: 1,
    holdAddedCardData: true,
  });
  const addedCard = state.catalog.at(-1)!;
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await choose(page, 'Card size', 'Small');
  await expect(page.locator('html')).toHaveAttribute('data-card-size', 'small');
  await expect(page.locator('.card-grid').first()).toHaveCSS(
    'grid-template-columns',
    /^(\S+\s+){2}\S+$/,
  );
  await choose(page, 'Card size', 'Large');
  await expect(page.locator('.card-grid').first()).toHaveCSS(
    'grid-template-columns',
    /^\S+$/,
  );
  await choose(page, 'Card size', 'Medium');
  await choose(page, 'Deck view', 'Card Text');
  await choose(page, 'Deck grouping', 'Color');
  await choose(page, 'Deck sorting', 'Price');
  await page.getByRole('button', { name: 'Ascending', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Collapse All', exact: true }).click();
  await expect(groupTrigger(page, 'Blue (3)')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(groupTrigger(page, 'Lands (1)')).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  const input = page.locator(
    'input[placeholder="Add a card to the deck..."]:visible',
  );
  await input.fill(addedCard.name);
  await page.getByRole('option', { name: addedCard.name, exact: true }).click();
  try {
    await expect.poll(() => state.writes.length).toBe(1);
    await expect(groupTrigger(page, 'Blue (3)')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    state.releaseAddedCardData();
    await expect(groupTrigger(page, 'Blue (4)')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(groupTrigger(page, 'Lands (1)')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.getByRole('button', { name: 'Display', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Deck view', exact: true }),
    ).toContainText('Card Text');
    await expect(
      page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
    ).toContainText('Color');
    await expect(
      page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
    ).toContainText('Price');
    await expect(
      page.getByRole('button', { name: 'Descending', exact: true }),
    ).toBeVisible();
    await choose(page, 'Deck view', 'Card Grid');
    await choose(page, 'Card size', 'Small');
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute(
      'data-card-size',
      'small',
    );
    await expect(page.locator('.card-grid').first()).toHaveCSS(
      'grid-template-columns',
      /^(\S+\s+){2}\S+$/,
    );
    await page.setViewportSize({ width: 1600, height: 1000 });
    await expect(page.locator('.card-grid').first()).toHaveCSS(
      'grid-template-columns',
      /^(\S+\s+){7}\S+$/,
    );
  } finally {
    state.releaseAddedCardData();
  }
});

test('deck edits appear before the server replies and failed saves restore the card list', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setupDeckDisplay(page, { cardCount: 12, extraCards: 1 });
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const added = state.catalog.at(-1)!;
  let releaseAdd!: () => void;
  const addGate = new Promise<void>((resolve) => {
    releaseAdd = resolve;
  });
  await page.route(
    BACKEND + '/supabase/card-lists/add-cards-by-oracle-id',
    async (route) => {
      await addGate;
      await route.fulfill({
        status: 500,
        json: { message: 'Save failed. Please retry.' },
      });
    },
  );
  const input = page.locator(
    'input[placeholder="Add a card to the deck..."]:visible',
  );
  await input.fill(added.name);
  await page.getByRole('option', { name: added.name, exact: true }).click();
  const newCard = page
    .locator('.list-card')
    .filter({ has: page.getByRole('img', { name: added.name, exact: true }) });
  try {
    const notice = page.locator('.card-edit-toast');
    await expect(notice).toHaveText('Card Added');
    await expect(notice).toHaveCSS('background-color', 'rgb(48, 32, 77)');
    const box = (await notice.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(95);
    expect(box.width).toBeLessThanOrEqual(150);
    expect(box.height).toBeLessThanOrEqual(40);
    expect(Math.abs(box.x + box.width / 2 - 195)).toBeLessThan(1);
    await expect
      .poll(async () => {
        const toastBox = (await notice.boundingBox())!;
        const footerBox = (await page
          .locator('.sticky-footer-shell')
          .boundingBox())!;
        return Math.round(footerBox.y - toastBox.y - toastBox.height);
      })
      .toBe(8);
    await page.screenshot({
      path: 'test-results/mobile-card-added-notification.png',
    });
    await expect(newCard).toBeVisible();
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue('');
  } finally {
    releaseAdd();
  }
  await expect(newCard).toHaveCount(0);
  await expect(
    page.getByText('Error adding card', { exact: true }),
  ).toBeVisible();

  const existing = state.cards[1];
  let releaseRemove!: () => void;
  const removeGate = new Promise<void>((resolve) => {
    releaseRemove = resolve;
  });
  await page.route(SUPABASE + '/rest/v1/card_list_items**', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    await removeGate;
    await route.fulfill({
      status: 500,
      json: { message: 'Could not remove card' },
    });
  });
  const card = page.locator('.list-card').filter({
    has: page.getByRole('img', { name: existing.name, exact: true }),
  });
  await card
    .getByRole('button', { name: 'Options for ' + existing.name, exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Remove From List', exact: true })
    .click();
  try {
    await expect(page.locator('.card-edit-toast')).toHaveText('Card Removed');
    await expect(card).toHaveCount(0);
  } finally {
    releaseRemove();
  }
  await expect(card).toBeVisible();

  // Exercise board moves in the same delayed-save/recovery flow.
  for (const [destination, fails] of [
    ['Considering', false],
    ['Sideboard', true],
  ] as const) {
    let releaseMove!: () => void;
    const moveGate = new Promise<void>((resolve) => {
      releaseMove = resolve;
    });
    await page.route(
      BACKEND + '/supabase/card-lists/change-board',
      async (route) => {
        await moveGate;
        if (fails) {
          await route.fulfill({
            status: 500,
            json: { message: 'Could not move card' },
          });
        } else {
          state.items.find(
            (item) => item.oracle_id === existing.oracle_id,
          )!.board = destination;
          await route.fulfill({
            json: { cardName: existing.name, board: destination },
          });
        }
      },
    );
    await card
      .getByRole('button', {
        name: 'Options for ' + existing.name,
        exact: true,
      })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Move', exact: true })
      .click();
    await page
      .getByRole('menuitem', { name: 'Move to ' + destination, exact: true })
      .click();
    try {
      await expect(page.locator('.card-edit-toast')).toHaveText(
        'Card Moved to ' + destination,
      );
      await page.locator('#board-' + destination.toLowerCase()).click();
      await card
        .getByRole('button', {
          name: 'Options for ' + existing.name,
          exact: true,
        })
        .click();
      await expect(page.getByRole('dialog')).toContainText(
        destination + ' card options',
      );
      await page.keyboard.press('Escape');
    } finally {
      releaseMove();
    }
    if (fails) {
      await expect(
        page.getByText('Error changing board', { exact: true }),
      ).toBeVisible();
      await card
        .getByRole('button', {
          name: 'Options for ' + existing.name,
          exact: true,
        })
        .click();
      await expect(page.getByRole('dialog')).toContainText(
        'Considering card options',
      );
      await page.keyboard.press('Escape');
    } else {
      await expect
        .poll(
          () =>
            state.items.find((item) => item.oracle_id === existing.oracle_id)
              ?.board,
        )
        .toBe(destination);
    }
  }
});
