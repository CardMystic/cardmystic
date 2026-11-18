import { expect, test } from '@playwright/test';

import { gotoHydrated } from './utils/mocks';

const SEARCH_TIMEOUT = 45_000;

/**
 * Lightning Bolt — a stable non-commander card used throughout these tests.
 * Mana cost: {R}. Verified against the live backend at test-authoring time.
 */
const LIGHTNING_BOLT_ID = '4457ed35-7c10-48c8-9776-456485fdf070';

test.describe('Card detail page', () => {
  test('loads a real card with artwork, mana, legalities and related searches', async ({
    page,
  }) => {
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

    // ManaCost component converts {R} to a <span class="ms ms-r ms-cost">.
    // At least one mana cost icon must be present after SSR.
    await expect(page.locator('.ms-cost').first()).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });

    // Lightning Bolt costs {R} — verify the red mana symbol specifically.
    await expect(page.locator('.ms-r').first()).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });

    // Legalities heading is part of the SSR output.
    await expect(
      page.locator('h3.legalities-title').filter({ hasText: 'Legalities' }),
    ).toBeVisible({ timeout: SEARCH_TIMEOUT });

    // At least one legality chip badge must render.
    await expect(page.locator('.legality-chip').first()).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });

    // The related-cards section is wrapped in <ClientOnly> so it only renders
    // after hydration.  gotoHydrated already waits for hydration, so the
    // tab buttons should be present by the time we assert.
    const section = page.locator('.card-results');
    await expect(section).toBeVisible({ timeout: SEARCH_TIMEOUT });

    // Non-commander cards show "Similar Cards" and "Commanders" tabs.
    // Labels are full text at ≥lg viewport (Playwright default: 1280px).
    await expect(
      section.getByRole('button', {
        name: 'Similar To This Card',
        exact: true,
      }),
    ).toBeVisible({ timeout: SEARCH_TIMEOUT });
    await expect(
      section.getByRole('button', {
        name: 'Popular Commanders As 99',
        exact: true,
      }),
    ).toBeVisible({
      timeout: SEARCH_TIMEOUT,
    });
  });
});
