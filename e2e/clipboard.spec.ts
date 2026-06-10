import { expect, test } from '@playwright/test';

import { BACKEND, gotoHydrated } from './utils/mocks';

const LIGHTNING_BOLT_ID = '4457ed35-7c10-48c8-9776-456485fdf070';

const CLIP_KEY = 'cm.clipboard.v1';
const SEARCH_TIMEOUT = 45_000;

const testCard = {
  id: LIGHTNING_BOLT_ID,
  name: 'Lightning Bolt',
  set: 'M11',
  imageUrl: 'https://cards.scryfall.io/large/front/e/3/e3285e6b.jpg',
  price: '0.50',
};

// A second card used in multi-card tests.
const card2 = {
  id: 'abc-def-clipboard-456',
  name: 'Counterspell',
  set: 'ICE',
  imageUrl: '',
  price: '2.00',
};

test.describe('Clipboard', () => {
  // ─── Existing: hydration from localStorage ──────────────────────────

  /**
   * The clipboard is fully local (no backend calls). We seed
   * localStorage directly and verify the UI hydrates from it.
   */
  test('hydrates count from localStorage and shows card in popover', async ({
    page,
  }) => {
    // Seed clipboard before the page loads so the composable picks it
    // up during its onMounted hydration pass.
    await page.addInitScript(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      {
        key: CLIP_KEY,
        data: {
          items: { [testCard.id]: testCard },
          order: [testCard.id],
        },
      },
    );

    await gotoHydrated(page, '/');

    // Clipboard button in navbar should show count "1".
    // ClipboardMenu renders a UButton with :label="clipboardLabel" where
    // clipboardLabel = count > 0 ? String(count) : '0'.
    // The navbar renders ClipboardMenu in both mobile (md:hidden) and desktop
    // (hidden md:flex) slots. Target the desktop nav so we always get the visible
    // button at the default 1280px Playwright viewport width.
    const clipboardBtn = page
      .locator('div.flex-row.hidden.md\\:flex button')
      .filter({ hasText: /^1$/ })
      .first();

    await expect(clipboardBtn).toBeVisible({ timeout: 10_000 });

    // Open the clipboard popover by clicking the button.
    await clipboardBtn.click();

    // Card name should appear in the popover list.
    await expect(page.getByText('Lightning Bolt')).toBeVisible({
      timeout: 5_000,
    });

    // Remove the card via the remove button next to it.
    await page
      .getByRole('button', { name: /remove/i })
      .or(page.locator('li button[aria-label="Remove"]'))
      .first()
      .click();

    // Popover now shows "Clipboard is empty."
    await expect(page.getByText('Clipboard is empty.')).toBeVisible({
      timeout: 5_000,
    });
  });

  // ─── Phase 5 ────────────────────────────────────────────────────────

  /**
   * Test 15: Add card via the overlay button on a search result.
   *
   * CardOverlayButtons renders an "Add Card" button (aria-label) with
   * opacity:0 by default; pointer-events:auto makes it interactable
   * without a hover gesture — force:true bypasses Playwright's
   * visibility check.
   */
  test('adding a card via search UI increments the clipboard count', async ({
    page,
  }) => {
    const searchCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/search/similarity`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );

    await gotoHydrated(
      page,
      `/search/all/similarity?card_name=${encodeURIComponent('Lightning Bolt')}`,
    );
    await searchCall;

    // Wait for at least one card image wrapper to appear in the grid.
    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: SEARCH_TIMEOUT,
      })
      .toBeGreaterThan(0);

    // Click the first "Add Card" overlay button.
    await page
      .getByRole('button', { name: 'Add Card' })
      .first()
      .click({ force: true });

    // Desktop clipboard badge increments from 0 → 1.
    await expect(
      page
        .locator('div.flex-row.hidden.md\\:flex button')
        .filter({ hasText: /^1$/ })
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  /**
   * Test 16: ClipboardMenu popover shows the card name and the
   * computed total price via the Buy button label.
   */
  test('clipboard menu shows card name and computed total price', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      {
        key: CLIP_KEY,
        data: {
          items: { [testCard.id]: testCard },
          order: [testCard.id],
        },
      },
    );

    await gotoHydrated(page, '/');

    const clipBtn = page
      .locator('div.flex-row.hidden.md\\:flex button')
      .filter({ hasText: /^1$/ })
      .first();
    await expect(clipBtn).toBeVisible({ timeout: 10_000 });
    await clipBtn.click();

    // Card name appears in the popover list.
    await expect(page.getByText('Lightning Bolt')).toBeVisible({
      timeout: 5_000,
    });

    // totalPrice = parseFloat('0.50') = 0.50 → button shows "Buy ($0.50)".
    await expect(
      page.getByRole('button', { name: /Buy \(\$0\.50\)/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  /**
   * Test 17: Cross-tab sync via the Storage API.
   *
   * localStorage.setItem() in one tab fires a `storage` event in all
   * other tabs on the same origin. useClipboard attaches a storage
   * listener in onMounted and updates reactive state accordingly.
   */
  test('cross-tab sync: adding a card in one tab updates the count in another', async ({
    page,
    context,
  }) => {
    await gotoHydrated(page, '/');

    // Confirm tab 1 starts with an empty clipboard.
    await expect(
      page
        .locator('div.flex-row.hidden.md\\:flex button')
        .filter({ hasText: /^0$/ })
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // Open a second tab in the same browser context (shared localStorage origin).
    const page2 = await context.newPage();
    await gotoHydrated(page2, '/');

    // page2 writes a card to localStorage — fires the Storage API event in page1.
    await page2.evaluate(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      {
        key: CLIP_KEY,
        data: {
          items: { [testCard.id]: testCard },
          order: [testCard.id],
        },
      },
    );

    // page1's storage listener receives the event and updates the count to 1.
    await expect(
      page
        .locator('div.flex-row.hidden.md\\:flex button')
        .filter({ hasText: /^1$/ })
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  /**
   * Test 18: Clipboard cap eviction.
   *
   * useClipboard.add() evicts the oldest card when at capacity (500)
   * rather than rejecting the new card. Count stays at 500.
   *
   * Note: there is no toast for hitting cap — the composable silently
   * evicts the oldest entry.
   */
  test('cap eviction: adding past 500 removes the oldest card', async ({
    page,
  }) => {
    // Seed exactly 500 fake cards to fill the clipboard to capacity.
    // IDs use the "fake-cap-N" pattern, which won't collide with real
    // Scryfall UUIDs returned by the similarity search.
    await page.addInitScript((key) => {
      const items: Record<
        string,
        {
          id: string;
          name: string;
          set: string;
          imageUrl: string;
          price: string;
        }
      > = {};
      const order: string[] = [];
      for (let i = 0; i < 500; i++) {
        const id = `fake-cap-${i}`;
        items[id] = {
          id,
          name: `Fake ${i}`,
          set: 'TST',
          imageUrl: '',
          price: '0',
        };
        order.push(id);
      }
      localStorage.setItem(key, JSON.stringify({ items, order }));
    }, CLIP_KEY);

    const searchCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/search/similarity`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );
    await gotoHydrated(
      page,
      `/search/all/similarity?card_name=${encodeURIComponent('Lightning Bolt')}`,
    );
    await searchCall;

    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: SEARCH_TIMEOUT,
      })
      .toBeGreaterThan(0);

    // Clipboard badge must show "500" from the seeded data.
    await expect(
      page
        .locator('div.flex-row.hidden.md\\:flex button')
        .filter({ hasText: /^500$/ })
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    // Adding a real card at capacity triggers eviction (not rejection).
    await page
      .getByRole('button', { name: 'Add Card' })
      .first()
      .click({ force: true });

    // Count stays at 500.
    await expect(
      page
        .locator('div.flex-row.hidden.md\\:flex button')
        .filter({ hasText: /^500$/ })
        .first(),
    ).toBeVisible({ timeout: 5_000 });

    // Verify via localStorage: oldest entry (fake-cap-0) was evicted.
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '{}'),
      CLIP_KEY,
    );
    expect(stored.order.length).toBe(500);
    expect(stored.order).not.toContain('fake-cap-0');
  });

  /**
   * Test 19: Remove a single card from a two-card clipboard, then
   * clear the remaining card via the Clear button (fires toast).
   */
  test('remove single card and clear-all empties the clipboard', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      {
        key: CLIP_KEY,
        data: {
          items: {
            [testCard.id]: testCard,
            [card2.id]: card2,
          },
          order: [testCard.id, card2.id],
        },
      },
    );

    await gotoHydrated(page, '/');

    const clipBtn = page
      .locator('div.flex-row.hidden.md\\:flex button')
      .filter({ hasText: /^2$/ })
      .first();
    await expect(clipBtn).toBeVisible({ timeout: 10_000 });
    await clipBtn.click();

    // Both cards visible in the popover list.
    await expect(page.getByText('Lightning Bolt')).toBeVisible();
    await expect(page.getByText('Counterspell')).toBeVisible();

    // Remove only Lightning Bolt via its row's Remove button.
    await page
      .locator('li')
      .filter({ hasText: 'Lightning Bolt' })
      .getByRole('button', { name: 'Remove' })
      .click();

    await expect(page.getByText('Lightning Bolt')).not.toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText('Counterspell')).toBeVisible();

    // Clear all remaining cards via the Clear button.
    await page.getByRole('button', { name: /^Clear$/ }).click();

    // Toast "Clipboard cleared" fires.
    await expect(page.getByText('Clipboard cleared')).toBeVisible({
      timeout: 5_000,
    });

    // Popover shows the empty state.
    await expect(page.getByText('Clipboard is empty.')).toBeVisible({
      timeout: 5_000,
    });
  });
});
