import { expect, test } from '@playwright/test';

import { gotoHydrated } from './utils/mocks';

const LIGHTNING_BOLT_ID = '77c6fa74-5543-42ac-9ead-0e890b188e99';

const CLIP_KEY = 'cm.clipboard.v1';

const testCard = {
  id: LIGHTNING_BOLT_ID,
  name: 'Lightning Bolt',
  set: 'M11',
  imageUrl: 'https://cards.scryfall.io/large/front/e/3/e3285e6b.jpg',
  price: '0.50',
};

test.describe('Clipboard', () => {
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
});
