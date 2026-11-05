import { test, expect } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, SUPABASE } from './utils/mocks';
import type { DeckBusinessCardDetails } from '../utils/deckBusinessCard';

test('free owners create, edit, reload and remove a business card without changing the deck', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  Object.assign(state.deck, { bracket: 3 });
  await page.reload();
  let saved: (DeckBusinessCardDetails & { list_id: string }) | null = null;
  const changes: string[] = [];
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/business-card`,
    async (route) => {
      const method = route.request().method();
      if (method === 'PUT') {
        const input = route.request().postDataJSON();
        expect(input.list_id).toBeUndefined();
        saved = { ...input, list_id: displayDeckId };
        changes.push(method);
      } else if (method === 'DELETE') {
        saved = null;
        changes.push(method);
      }
      await route.fulfill({ json: { card: saved } });
    },
  );
  await page
    .getByRole('button', { name: 'Create deck business card', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog
    .getByRole('textbox', { name: 'Business card playstyle' })
    .fill('Blink and tokens');
  await dialog.getByRole('button', { name: 'Add tag', exact: true }).click();
  await dialog
    .getByRole('textbox', { name: 'Business card summary' })
    .fill('My favorite value deck.');
  await dialog
    .getByRole('textbox', { name: 'Business card win plan' })
    .fill('Build a board, then win through combat.');

  await dialog
    .getByRole('button', { name: 'Business card core cards' })
    .click();
  await page
    .getByRole('option', { name: state.cards[0].name, exact: true })
    .click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('option')).toHaveCount(0);
  await dialog
    .getByRole('button', { name: 'Opening hand card', exact: true })
    .click();
  await page
    .getByRole('option', { name: state.cards[2].name, exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    dialog.getByRole('heading', { name: 'Deck business card', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText('My favorite value deck.', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText('Bracket 3', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/This deck is private/)).toBeVisible();
  await expect(
    dialog.getByRole('img', { name: 'QR code linking to this deck' }),
  ).toHaveAttribute('src', /^data:image\/svg\+xml/);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Download QR code' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(
    `cardmystic-deck-${displayDeckId}-qr.svg`,
  );
  await dialog
    .getByRole('button', { name: 'Edit business card', exact: true })
    .click();
  await dialog
    .getByRole('textbox', { name: 'Business card summary' })
    .fill('Updated summary.');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.reload();
  await page
    .getByRole('button', { name: 'View deck business card', exact: true })
    .click();
  await expect(
    dialog.getByText('Updated summary.', { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Remove business card', exact: true })
    .click();
  expect(changes).toEqual(['PUT', 'PUT']);
  await dialog
    .getByRole('button', { name: 'Confirm remove business card', exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole('button', {
      name: 'Create deck business card',
      exact: true,
    }),
  ).toBeVisible();
  expect(changes).toEqual(['PUT', 'PUT', 'DELETE']);
  expect(state.writes).toHaveLength(0);
});

test('visitors see a saved public business card on mobile, with no editing controls and a printable QR', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await setupDeckDisplay(page, { owner: false });
  expect(
    await page
      .getByRole('button', { name: 'View deck business card', exact: true })
      .count(),
  ).toBe(0);
  Object.assign(state.deck, { bracket: 3 });
  const card = {
    list_id: displayDeckId,
    playstyles: ['Spells', 'Tokens'],
    opening_hand: [state.cards[2].oracle_id],
    combos: [
      {
        name: 'Test combo',
        description: 'Use these together.',
        oracle_ids: state.cards.slice(0, 2).map((card) => card.oracle_id),
      },
    ],
    summary: 'A deck for long games.',
    win_plan: 'Build a board and finish with a big attack.',

    hero_oracle_id: state.cards[0].oracle_id,
    core_oracle_ids: state.cards.map((value) => value.oracle_id),
  };
  await page.route(
    BACKEND + `/library/lists/${displayDeckId}/business-card`,
    (route) => route.fulfill({ json: { card } }),
  );
  await page.reload();
  const trigger = page.getByRole('button', {
    name: 'View deck business card',
    exact: true,
  });
  await expect(trigger).toBeVisible();
  await expect
    .poll(() =>
      trigger
        .locator('.iconify')
        .evaluate((element) => getComputedStyle(element).maskImage),
    )
    .not.toBe('none');
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: ShareData) => {
        document.body.dataset.sharedUrl = data.url;
      },
    });
  });
  await dialog.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-shared-url',
    `https://cardmystic.com/lists/${displayDeckId}?businessCard=1`,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.body.dataset.copiedUrl = text;
        },
      },
    });
  });
  await dialog.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(dialog.getByRole('status')).toHaveText(
    'Business card link copied.',
  );
  await expect(page.locator('body')).toHaveAttribute(
    'data-copied-url',
    `https://cardmystic.com/lists/${displayDeckId}?businessCard=1`,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Download QR code' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(
    `cardmystic-deck-${displayDeckId}-qr.svg`,
  );
  await page.goto(`/lists/${displayDeckId}?businessCard=1`);
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.business-core-grid figcaption')).toHaveCount(0);
  await expect(
    dialog.getByRole('heading', { name: 'Public display deck', exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', {
      name: /Edit business card|Remove business card/,
    }),
  ).toHaveCount(0);
  await expect(
    dialog.getByRole('img', { name: 'QR code linking to this deck' }),
  ).toBeVisible();
  await expect(
    dialog.getByRole('link', { name: /cardmystic.com\/lists/ }),
  ).toHaveAttribute('href', `https://cardmystic.com/lists/${displayDeckId}`);
  const preview = dialog.getByRole('article', { name: 'Deck business card' });
  expect(
    await preview.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  const stats = preview.getByRole('region', {
    name: 'Business card deck stats',
  });
  await stats.scrollIntoViewIfNeeded();
  await expect(
    stats.getByRole('figure', { name: 'Mana curve', exact: true }),
  ).toBeVisible();
  await expect(
    stats.getByRole('figure', { name: 'Color identity', exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole('heading', { name: 'Example opening hand', exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByRole('heading', { name: 'Test combo', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: '/tmp/cardmystic-business-card-stats-mobile.png',
  });
  await preview.screenshot({
    path: '/tmp/cardmystic-business-card-mobile.png',
  });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await preview.screenshot({
    path: '/tmp/cardmystic-business-card-desktop.png',
  });
  await dialog
    .getByRole('img', { name: 'QR code linking to this deck' })
    .screenshot({ path: '/tmp/cardmystic-business-card-qr.png' });
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.businessCardPrinted = 'yes';
    };
  });
  await dialog
    .getByRole('button', { name: 'Print / Save PDF', exact: true })
    .click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-business-card-printed',
    'yes',
  );
  await page.emulateMedia({ media: 'print' });
  await expect(preview).toBeVisible();
  await expect(page.getByRole('navigation').first()).not.toBeVisible();
  await expect(
    dialog.getByRole('button', { name: 'Download QR code' }),
  ).not.toBeVisible();
  await page.pdf({
    path: '/tmp/cardmystic-business-card.pdf',
    format: 'A4',
    printBackground: true,
  });
});

test('owners can set, change and clear an unset bracket from the banner', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page);
  const banner = page.getByTestId('deck-banner');
  const writes: (number | null)[] = [];
  let fail = true;
  await page.route(SUPABASE + '/rest/v1/card_lists?*', (route) => {
    if (route.request().method() !== 'PATCH')
      return route.fulfill({ json: [] });
    expect(new URL(route.request().url()).searchParams.get('id')).toBe(
      `eq.${displayDeckId}`,
    );
    if (fail)
      return route.fulfill({ status: 500, json: { message: 'Try again' } });
    const bracket = route.request().postDataJSON().bracket;
    writes.push(bracket);
    Object.assign(state.deck, { bracket });
    return route.fulfill({ status: 204 });
  });
  await banner
    .getByRole('button', { name: 'Edit bracket: unknown', exact: true })
    .click();
  await banner.getByRole('combobox', { name: 'Deck bracket' }).click();
  await page
    .getByRole('option', { name: 'Bracket 3: Upgraded', exact: true })
    .click();
  await expect(
    page.getByText('Could not update bracket', { exact: true }),
  ).toBeVisible();
  expect(writes).toEqual([]);
  fail = false;
  await banner.getByRole('combobox', { name: 'Deck bracket' }).click();
  await page
    .getByRole('option', { name: 'Bracket 3: Upgraded', exact: true })
    .click();
  await expect(
    banner.getByRole('button', { name: 'Edit bracket 3', exact: true }),
  ).toBeVisible();
  await page.reload();
  await banner
    .getByRole('button', { name: 'Edit bracket 3', exact: true })
    .click();
  await banner.getByRole('combobox', { name: 'Deck bracket' }).click();
  await page
    .getByRole('option', { name: 'Bracket 5: cEDH', exact: true })
    .click();
  await banner
    .getByRole('button', { name: 'Edit bracket 5', exact: true })
    .click();
  await banner.getByRole('combobox', { name: 'Deck bracket' }).click();
  await page.getByRole('option', { name: 'Unknown', exact: true }).click();
  await expect(
    banner.getByRole('button', { name: 'Edit bracket: unknown', exact: true }),
  ).toBeVisible();
  expect(writes).toEqual([3, 5, null]);
});

test('visitors see bracket descriptions without an edit control', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { owner: false });
  Object.assign(state.deck, { bracket: 1 });
  await page.reload();
  const banner = page.getByTestId('deck-banner');
  const badge = banner.getByRole('img', { name: 'Bracket 1', exact: true });
  await expect(badge).toBeVisible();
  await badge.hover();
  await expect(
    page.getByText(/^Bracket 1: Exhibition\./).first(),
  ).toBeVisible();
  await expect(
    banner.getByRole('button', { name: /^Edit bracket/ }),
  ).toHaveCount(0);
});
