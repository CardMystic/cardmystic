import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';
import { createDisplayCards } from './utils/deckDisplay';

for (const width of [390, 1440]) {
  test(`search display, filter drawer, and loading layout work at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (
        message.type() === 'error' &&
        /(?:Reference|Type|Range)Error/.test(message.text())
      )
        errors.push(message.text());
    });
    const cards = createDisplayCards(48);
    const requests: { filters?: { selectedRarities?: string[] } }[] = [];
    let releaseSearch!: () => void;
    const searchReady = new Promise<void>((resolve) => {
      releaseSearch = resolve;
    });
    await page.addInitScript(() =>
      localStorage.setItem(
        'cm.cookie-consent.v1',
        JSON.stringify({
          analytics: false,
          advertising: false,
          updatedAt: Date.now(),
        }),
      ),
    );
    await page.route('https://cards.scryfall.io/**', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="488" height="680"><rect width="488" height="680" fill="#204e68"/></svg>',
      }),
    );
    await page.route(`${BACKEND}/**`, (route) => route.fulfill({ json: [] }));
    await page.route(`${BACKEND}/search-access`, (route) =>
      route.fulfill({
        json: {
          enabled: true,
          authenticated: false,
          tier: 'normal',
          enhancedRemaining: 0,
          enhancedTopUpRemaining: 0,
          resetsAt: null,
        },
      }),
    );
    await page.route(`${BACKEND}/search/colbert`, async (route) => {
      requests.push(route.request().postDataJSON());
      await searchReady;
      await route.fulfill({
        json: cards.map((card) => ({
          card_data: card,
          card_name: card.name,
          ai_normalized_score: 0.8,
        })),
      });
    });
    try {
      await gotoHydrated(page, '/search/all/smart?query=draw+cards');
      const skeleton = page.getByTestId('card-skeleton').first();
      await expect(skeleton).toBeVisible();
      const before = (await skeleton.boundingBox())!;
      releaseSearch();
      const card = page.locator('.card-root').first();
      await expect(card).toBeVisible();
      const after = (await card.boundingBox())!;
      for (const dimension of ['x', 'y', 'width', 'height'] as const) {
        expect(
          Math.abs(before[dimension] - after[dimension]),
          `Card ${dimension} changes after loading`,
        ).toBeLessThanOrEqual(3);
      }
      const toolbar = page.getByTestId('results-toolbar');
      const display = toolbar.getByRole('button', {
        name: 'Display',
        exact: true,
      });
      const pagination = toolbar.getByRole('navigation', {
        name: 'Search results pagination',
      });
      await expect(pagination).toBeVisible();
      const left = (await pagination.boundingBox())!;
      const right = (await display.boundingBox())!;
      expect(left.x + left.width).toBeLessThan(right.x);
      expect(
        Math.abs(left.y + left.height / 2 - right.y - right.height / 2),
      ).toBeLessThan(2);
      const price = (await card
        .getByRole('link', { name: 'Buy on TCGPlayer' })
        .boundingBox())!;
      const score = (await card.locator('progress').first().boundingBox())!;
      expect(score.y).toBeGreaterThanOrEqual(price.y);
      expect(score.y + score.height).toBeLessThanOrEqual(
        price.y + price.height,
      );
      await expect(
        card.getByRole('button', { name: 'Find Similar Cards' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('button', { name: 'Arena', exact: true }),
      ).toHaveCount(0);
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width);
      await page.screenshot({ path: `.cache/search-display-${width}.png` });
      if (width >= 1280) {
        await page.locator('.card-root').nth(1).hover();
        await expect(page.locator('.preview-rail .preview-title')).toHaveText(
          cards[1].name,
        );
      }
      await display.click();
      await page.getByRole('combobox', { name: 'View', exact: true }).click();
      await page
        .getByRole('option', { name: 'Card Text', exact: true })
        .click();
      await page.keyboard.press('Escape');
      await expect(page.locator('.card-text-row')).toHaveCount(40);
      const rowTop = (await page
        .locator('.card-text-row')
        .first()
        .boundingBox())!.y;
      await page.getByRole('button', { name: 'Filters', exact: true }).click();
      const drawer = page.getByRole('dialog', { name: 'Search filters' });
      await expect(drawer).toBeVisible();
      expect(
        (await page.locator('.card-text-row').first().boundingBox())!.y,
      ).toBe(rowTop);
      await drawer
        .getByRole('button', { name: 'Rarities', exact: true })
        .click();
      await drawer.getByRole('checkbox', { name: 'Rare', exact: true }).check();
      await page.screenshot({ path: `.cache/search-filters-${width}.png` });
      await drawer.getByRole('button', { name: 'Done', exact: true }).click();
      expect(requests).toHaveLength(1);
      await page
        .getByRole('button', { name: 'Filters (1 selected)', exact: true })
        .click();
      await drawer
        .getByRole('button', { name: 'Rarities', exact: true })
        .click();
      await expect(
        drawer.getByRole('checkbox', { name: 'Rare', exact: true }),
      ).toBeChecked();
      await drawer.getByRole('button', { name: 'Search', exact: true }).click();
      await expect(drawer).not.toBeVisible();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[1].filters).toMatchObject({ selectedRarities: ['Rare'] });
      expect(errors).toEqual([]);
    } finally {
      releaseSearch();
    }
  });
}
