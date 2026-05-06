import { expect, test } from '@playwright/test';

import { gotoHydrated } from './utils/mocks';

const SEARCH_TIMEOUT = 45_000;

/**
 * A stable Lightning Bolt card ID used across tests that need a known card.
 * Verified against the live backend at test-authoring time.
 */
const LIGHTNING_BOLT_ID = '77c6fa74-5543-42ac-9ead-0e890b188e99';

test.describe('Card detail page', () => {
  test('renders card image and name via SSR', async ({ page }) => {
    await gotoHydrated(page, `/card/${LIGHTNING_BOLT_ID}`);

    // Card image has a fixed alt attribute on the detail page.
    await expect(page.getByAltText('Card image').first()).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });

    // Card title renders in the info panel.
    await expect(page.locator('.card-title-text').first()).toHaveText(
      /Lightning Bolt/i,
      { timeout: SEARCH_TIMEOUT },
    );
  });
});
