import { test, expect, type Page } from '@playwright/test';
import { setupDeckDisplay } from './utils/deckDisplay';

test.use({ viewport: { width: 1440, height: 1000 } });

async function openPlaytest(page: Page, cardCount = 15) {
  const fixture = await setupDeckDisplay(page, { cardCount });
  const cookie = page.getByRole('button', { name: 'Reject all', exact: true });
  if (await cookie.isVisible()) await cookie.click();
  await page.getByRole('button', { name: 'Playtest', exact: true }).click();
  const board = page.getByRole('dialog', { name: 'Playtest', exact: true });
  await expect(
    board.getByRole('region', { name: 'Hand', exact: true }),
  ).toBeVisible();
  // Wait for the modal's opening transform before calculating drag coordinates.
  await board.evaluate(async (element) => {
    await Promise.all(
      element.getAnimations().map((animation) => animation.finished),
    );
  });
  return { ...fixture, board };
}

test('card clicks open actions, library actions are grouped, and practice never saves deck edits', async ({
  page,
}) => {
  const { board, writes } = await openPlaytest(page);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const hand = board.getByRole('region', { name: 'Hand', exact: true });
  await expect(hand.locator('.playtest-card')).toHaveCount(7);
  await expect(page.locator('.sticky-footer-wrap')).not.toBeVisible();
  await board.getByRole('button', { name: 'Draw', exact: true }).click();
  await expect(hand.locator('.playtest-card')).toHaveCount(8);
  // Every random opening hand in this fixture contains a nonland permanent.
  const play = hand
    .getByRole('button', { name: /^Options for (Tamiyo|Display Card)/ })
    .first();
  const name = (await play.getAttribute('aria-label'))!.replace(
    /^Options for /,
    '',
  );
  await play.click();
  const options = page.getByRole('dialog', { name, exact: true });
  await expect(options).toBeVisible();
  await expect(
    board.locator('[data-testid="playtest-battlefield"] .playtest-card'),
  ).toHaveCount(0);
  await options.getByRole('button', { name: 'Play card', exact: true }).click();
  await expect(
    board.getByRole('region', { name: 'Stack', exact: true }),
  ).toHaveCount(0);
  await expect(board.getByRole('combobox', { name: 'Turn phase' })).toHaveCount(
    0,
  );
  const field = board.getByRole('region', { name: 'Battlefield', exact: true });
  await field
    .getByRole('button', { name: `Options for ${name}`, exact: true })
    .click();
  await options.getByRole('button', { name: 'Tap', exact: true }).click();
  await options.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(field.locator('.playtest-card')).toHaveAttribute(
    'data-tapped',
    'true',
  );
  await board.getByRole('button', { name: 'Next turn', exact: true }).click();
  await expect(field.locator('.playtest-card')).toHaveAttribute(
    'data-tapped',
    'false',
  );
  await field
    .getByRole('button', { name: `Options for ${name}`, exact: true })
    .click();
  await options
    .getByRole('button', { name: 'Add counter', exact: true })
    .click();
  await expect(options.getByText('+1/+1: 1', { exact: true })).toBeVisible();
  await options.getByRole('button', { name: 'Graveyard', exact: true }).click();
  await expect(field.locator('.playtest-card')).toHaveCount(0);
  await board.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(field.locator('.playtest-card')).toHaveCount(1);
  await board.getByRole('button', { name: 'Add token', exact: true }).click();
  const tokens = page.getByRole('dialog', { name: 'Add tokens', exact: true });
  await tokens.getByRole('button', { name: 'Soldier', exact: true }).click();
  await tokens
    .getByRole('spinbutton', { name: 'Token quantity', exact: true })
    .fill('3');
  await tokens
    .getByRole('button', { name: 'Create tokens', exact: true })
    .click();
  await expect(field.locator('.playtest-card')).toHaveCount(4);
  await board
    .getByRole('button', { name: 'Library actions', exact: true })
    .click();
  // Menu typeahead must not trigger M (mulligan) behind the dropdown.
  await expect(
    page.getByRole('menuitem', { name: 'Mill 1', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('m');
  await page.keyboard.press('Escape');
  await expect(hand.locator('.playtest-card')).toHaveCount(8);
  await board
    .getByRole('button', { name: 'Library actions', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Search', exact: true }).click();
  const library = page.getByRole('dialog', { name: 'Library', exact: true });
  await library
    .getByRole('textbox', { name: 'Find card in zone' })
    .fill('Display');
  // Typing shortcut letters must not draw, mulligan, or create tokens.
  await expect(
    page.getByRole('dialog', { name: 'Add tokens', exact: true }),
  ).toHaveCount(0);
  await library.getByRole('button', { name: 'Shuffle and close' }).click();
  await board
    .getByRole('button', { name: 'Library actions', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Scry', exact: true }).click();
  const scry = page.getByRole('dialog', {
    name: 'Scry / surveil',
    exact: true,
  });
  await expect(
    scry.getByRole('textbox', { name: 'Find card in zone' }),
  ).toHaveCount(0);
  await scry
    .getByRole('spinbutton', { name: 'Cards to scry', exact: true })
    .fill('3');
  await scry
    .getByRole('spinbutton', { name: 'Cards to scry', exact: true })
    .press('Tab');
  await expect(scry.locator('.playtest-card')).toHaveCount(3);
  await scry
    .getByRole('button', { name: 'Bottom', exact: true })
    .first()
    .click();
  await expect(scry.locator('.playtest-card')).toHaveCount(2);
  await scry.getByRole('button', { name: 'Done', exact: true }).click();
  await board.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Playtest' }).click();
  await expect(field.locator('.playtest-card')).toHaveCount(4);
  await board
    .getByRole('button', { name: 'Playtest settings', exact: true })
    .click();
  await expect(
    page.getByRole('combobox', { name: 'Playtest card size' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await expect(field.locator('.playtest-card')).toHaveCount(0);
  await expect(hand.locator('.playtest-card')).toHaveCount(7);
  await expect(board.getByRole('button', { name: 'Keep hand' })).toHaveCount(0);
  await board.screenshot({ path: '/tmp/cardmystic-playtest-desktop.png' });
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('free placement and dragging into and out of piles moves only the top card', async ({
  page,
}) => {
  const { board, writes } = await openPlaytest(page, 3);
  const hand = board.getByRole('region', { name: 'Hand', exact: true });
  const field = board.getByTestId('playtest-battlefield');
  const grave = board.getByRole('region', { name: 'Graveyard', exact: true });
  const exile = board.getByRole('region', { name: 'Exile', exact: true });
  await expect(
    grave.getByRole('img', { name: 'Empty graveyard' }),
  ).toBeVisible();
  await expect(exile.getByRole('img', { name: 'Empty exile' })).toBeVisible();
  await expect(
    board.getByRole('img', { name: 'No land played this turn', exact: true }),
  ).toBeVisible();
  await hand
    .getByRole('button', { name: 'Options for Island', exact: true })
    .dragTo(field, { targetPosition: { x: 160, y: 110 } });
  const island = field.getByRole('button', {
    name: 'Options for Island',
    exact: true,
  });
  await expect(island).toBeVisible();
  await expect(
    board.getByRole('img', { name: 'Land played this turn', exact: true }),
  ).toBeVisible();
  const before = (await island.boundingBox())!;
  await island.dragTo(field, { targetPosition: { x: 430, y: 230 } });
  await expect
    .poll(async () => (await island.boundingBox())!.x)
    .toBeGreaterThan(before.x + 100);
  await expect(field.locator('.playtest-card')).toHaveAttribute(
    'data-tapped',
    'false',
  );
  await grave.scrollIntoViewIfNeeded();
  await island.dragTo(grave);
  await expect(grave.locator('.playtest-card')).toHaveCount(1);
  const other = hand.getByRole('button', { name: /^Options for Sink/ });
  const name = (await other.getAttribute('aria-label'))!.replace(
    /^Options for /,
    '',
  );
  await other.dragTo(grave);
  await expect(grave.locator('.playtest-card')).toHaveCount(1);
  await expect(
    grave.getByRole('button', { name: /^Browse Graveyard/ }),
  ).toContainText('2');
  await grave
    .getByRole('button', { name: `Options for ${name}`, exact: true })
    .dragTo(exile);
  await expect(
    grave.getByRole('button', { name: 'Options for Island', exact: true }),
  ).toBeVisible();
  await exile
    .getByRole('button', { name: `Options for ${name}`, exact: true })
    .dragTo(field, { targetPosition: { x: 250, y: 140 } });
  await expect(
    field.getByRole('button', { name: `Options for ${name}`, exact: true }),
  ).toBeVisible();
  await expect(exile.getByRole('img', { name: 'Empty exile' })).toBeVisible();
  await board.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(
    exile.getByRole('button', { name: `Options for ${name}`, exact: true }),
  ).toBeVisible();
  const zones = ['Hand', 'Library', 'Graveyard', 'Exile', 'Commander'];
  const tops = await Promise.all(
    zones.map(
      async (name) =>
        (await board.getByRole('region', { name, exact: true }).boundingBox())!
          .y,
    ),
  );
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(2);
  await board.getByRole('button', { name: 'Next turn', exact: true }).click();
  await expect(
    board.getByRole('img', { name: 'No land played this turn', exact: true }),
  ).toBeVisible();
  expect(writes).toEqual([]);
});

test.describe('mobile playtest', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test('fits the hand, swaps zone panels, and opens actions on tap or hold while preserving touch dragging', async ({
    page,
  }) => {
    const { board, writes } = await openPlaytest(page, 6);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const hand = board.getByRole('region', { name: 'Hand', exact: true });
    const zones = board.getByRole('navigation', { name: 'Playtest zones' });
    const field = board.getByTestId('playtest-battlefield');
    await expect(hand.locator('.playtest-card')).toHaveCount(7);
    await expect(
      board.getByRole('button', { name: 'Next hand cards', exact: true }),
    ).toBeHidden();
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await zones
        .getByRole('button', { name: 'Show Hand', exact: true })
        .click();
      for (const card of await hand.locator('.playtest-card').all())
        await expect(card).toBeInViewport({ ratio: 0.99 });
      expect(
        await hand.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
    }
    const card = hand.getByRole('button', {
      name: 'Options for Island',
      exact: true,
    });
    const options = page.getByRole('dialog', { name: 'Island', exact: true });
    await card.tap();
    await expect(options).toBeVisible();
    await expect(field.locator('.playtest-card')).toHaveCount(0);
    await options.getByRole('button', { name: 'Close', exact: true }).click();
    const cdp = await page.context().newCDPSession(page);
    const box = (await card.boundingBox())!;
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [point],
    });
    await page.waitForTimeout(550);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect(options).toBeVisible();
    await options.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(hand.locator('.playtest-card')).toHaveCount(7);
    async function drag(
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [from],
      });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }],
      });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [to],
      });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
    }
    const bounds = (await field.boundingBox())!;
    await drag(point, { x: bounds.x + 65, y: bounds.y + 70 });
    const island = field.getByRole('button', {
      name: 'Options for Island',
      exact: true,
    });
    await expect(island).toBeVisible();
    await expect(options).toHaveCount(0);
    await expect(
      board.getByRole('img', { name: 'Land played this turn', exact: true }),
    ).toBeVisible();
    const before = (await island.boundingBox())!;
    await drag(
      { x: before.x + 20, y: before.y + 25 },
      { x: bounds.x + bounds.width - 65, y: bounds.y + 100 },
    );
    await expect
      .poll(async () => (await island.boundingBox())!.x)
      .toBeGreaterThan(before.x + 50);
    await expect(field.locator('.playtest-card')).toHaveAttribute(
      'data-tapped',
      'false',
    );
    await board.screenshot({ path: '/tmp/cardmystic-playtest-mobile.png' });
    // Zone tabs remain drop targets, and selecting a zone replaces the hand.
    const source = (await island.boundingBox())!;
    const graveTab = zones.getByRole('button', {
      name: 'Show Graveyard',
      exact: true,
    });
    const target = (await graveTab.boundingBox())!;
    await drag(
      { x: source.x + 20, y: source.y + 25 },
      { x: target.x + target.width / 2, y: target.y + target.height / 2 },
    );
    await expect(field.locator('.playtest-card')).toHaveCount(0);
    await graveTab.click();
    await expect(hand).toHaveCount(0);
    const grave = board.getByRole('region', { name: 'Graveyard', exact: true });
    await expect(
      grave.getByRole('button', { name: 'Options for Island', exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole('dialog', { name: 'Graveyard', exact: true }),
    ).toHaveCount(0);
    await zones.getByRole('button', { name: 'Show Hand', exact: true }).click();
    await hand.locator('.card-face').first().click();
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: 'Graveyard', exact: true })
      .click();
    await graveTab.click();
    await expect(grave.locator('.playtest-card')).toHaveCount(2);
    for (const item of await grave.locator('.playtest-card').all())
      await expect(item).toBeInViewport({ ratio: 0.99 });
    await zones
      .getByRole('button', { name: 'Show Exile', exact: true })
      .click();
    await expect(
      board.getByRole('region', { name: 'Exile', exact: true }),
    ).toContainText('No cards in exile.');
    await zones
      .getByRole('button', { name: 'Show Commander', exact: true })
      .click();
    await expect(
      board.getByRole('region', { name: 'Commander', exact: true }),
    ).toContainText('No cards in commander.');
    await zones
      .getByRole('button', { name: 'Show Library', exact: true })
      .click();
    const library = board.getByRole('region', { name: 'Library', exact: true });
    await library
      .getByRole('button', { name: 'Library actions', exact: true })
      .click();
    await expect(
      page.getByRole('menuitem', { name: 'Scry', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    for (const viewport of [
      { width: 320, height: 720 },
      { width: 844, height: 390 },
    ]) {
      await page.setViewportSize(viewport);
      await zones
        .getByRole('button', { name: 'Show Hand', exact: true })
        .click();
      for (const item of await hand.locator('.playtest-card').all())
        await expect(item).toBeInViewport({ ratio: 0.99 });
      expect(
        await board.evaluate((el) => el.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  });
});
