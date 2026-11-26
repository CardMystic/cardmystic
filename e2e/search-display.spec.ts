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
        (message.type() === 'error' &&
          /(?:Reference|Type|Range)Error/.test(message.text())) ||
        /hydration.*(?:mismatch|error)/i.test(message.text())
      )
        errors.push(message.text());
    });
    const cards = createDisplayCards(width >= 1280 ? 200 : 48);
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
      const footer = page.getByRole('navigation', {
        name: 'Search results actions',
        exact: true,
      });
      const footerDisplay = footer.getByRole('button', {
        name: 'Display results',
        exact: true,
      });
      const jump = footer.getByRole('button', {
        name: 'Jump to group',
        exact: true,
      });
      const backToTop = footer.getByRole('button', {
        name: 'Back to top',
        exact: true,
      });
      await expect(footer).toBeVisible();
      await expect(footerDisplay).toHaveText('Display');
      await expect(jump).toHaveCount(0);
      const report = footer.getByRole('link', {
        name: 'Report an issue with these results',
        exact: true,
      });
      const reportUrl = new URL((await report.getAttribute('href'))!);
      expect(reportUrl.origin + reportUrl.pathname).toBe(
        'https://github.com/CardMystic/cardmystic/issues/new',
      );
      expect(reportUrl.searchParams.get('template')).toBe(
        'search_results_feedback.yml',
      );
      expect(reportUrl.searchParams.get('query-or-card')).toBe('draw cards');
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
        const previewTrigger = page
          .locator('.preview-rail')
          .getByRole('button', {
            name: `Options for ${cards[1].name}`,
            exact: true,
          });
        const searchUrl = page.url();
        await previewTrigger.focus();
        await page.keyboard.press('Enter');
        const modal = page.getByRole('dialog', {
          name: cards[1].name,
          exact: true,
        });
        await expect(modal).toBeVisible();
        await expect(
          modal.getByRole('link', { name: "Go To Card's Page", exact: true }),
        ).toHaveAttribute('href', `/card/${cards[1].oracle_id}`);
        expect(page.url()).toBe(searchUrl);
        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        await expect(previewTrigger).toBeFocused();
      }
      // The persistent bar must reach the same display controls as the toolbar.
      await footerDisplay.click();
      const size = page.getByRole('combobox', {
        name: 'Card size',
        exact: true,
      });
      await size.click();
      await page.getByRole('option', { name: 'Small', exact: true }).click();
      await expect
        .poll(() =>
          page
            .locator('.card-grid')
            .first()
            .evaluate(
              (element) =>
                getComputedStyle(element).gridTemplateColumns.split(' ').length,
            ),
        )
        .toBe(width < 640 ? 3 : 8);
      expect(
        await size.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(16);
      await size.click();
      await page.getByRole('option', { name: 'Medium', exact: true }).click();
      await page.getByRole('combobox', { name: 'View', exact: true }).click();
      await page
        .getByRole('option', { name: 'Card Text', exact: true })
        .click();
      await page.keyboard.press('Escape');
      await expect(page.locator('.card-text-row')).toHaveCount(40);
      await expect(page.locator('.card-text-row').first()).toHaveAttribute(
        'aria-label',
        /.+, \d+ copies/,
      );
      const rowTop = (await page
        .locator('.card-text-row')
        .first()
        .boundingBox())!.y;
      const footerFilters = footer.getByRole('button', {
        name: 'Filter results',
        exact: true,
      });
      await footerFilters.focus();
      await page.keyboard.press('Enter');
      const drawer = page.getByRole('dialog', { name: 'Search filters' });
      await expect(drawer).toBeVisible();
      expect(
        (await page.locator('.card-text-row').first().boundingBox())!.y,
      ).toBe(rowTop);
      await drawer.getByRole('checkbox', { name: 'Is A Commander' }).check();
      if (width < 640) {
        await drawer
          .getByRole('button', { name: 'Colors', exact: true })
          .click();
        const identity = drawer.getByRole('radio', {
          name: 'Color Identity',
          exact: true,
        });
        await expect(identity).toBeChecked();
        await expect(
          drawer.getByRole('combobox', { name: 'Color matching rule' }),
        ).toContainText('Contains at Most');
        await identity.focus();
        await page.keyboard.down('ArrowDown');
        await expect(
          drawer.getByRole('radio', { name: 'Casting Colors', exact: true }),
        ).toBeChecked();
        await page.keyboard.up('ArrowDown');
        await drawer
          .getByRole('checkbox', { name: 'Blue', exact: true })
          .check();
      }

      await drawer
        .getByRole('button', { name: 'Rarities', exact: true })
        .click();
      await drawer.getByRole('checkbox', { name: 'Rare', exact: true }).check();
      await drawer.getByRole('button', { name: 'Price', exact: true }).click();
      const priceCap = drawer.getByRole('spinbutton', {
        name: 'Max price (USD)',
      });
      await priceCap.fill('2.50');
      await priceCap.blur();
      await page.screenshot({ path: `.cache/search-filters-${width}.png` });
      await drawer.getByRole('button', { name: 'Done', exact: true }).click();
      expect(requests).toHaveLength(1);
      await expect(
        footer.getByRole('button', { name: /^Filter results/ }),
      ).toBeFocused();
      await page
        .getByRole('button', {
          name: `Filters (${width < 640 ? 4 : 3} selected)`,
          exact: true,
        })
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
      expect(requests[1].filters).toMatchObject({
        selectedRarities: ['Rare'],
        isCommander: true,
        maxPriceUsd: 2.5,
      });
      if (width < 640) {
        expect(requests[1].filters).toMatchObject({
          selectedColors: ['Blue'],
          selectedColorField: 'Casting Colors',
          selectedColorFilterOption: 'Contains At Most',
        });
      }

      await footerDisplay.click();
      await page.getByRole('combobox', { name: 'View', exact: true }).click();
      await page
        .getByRole('option', { name: 'Card Grid', exact: true })
        .click();
      await page.getByRole('combobox', { name: 'Search grouping' }).click();
      await page
        .getByRole('option', { name: 'Card Type', exact: true })
        .click();
      await expect(page.getByRole('listbox')).toBeHidden();
      await expect(
        page.getByRole('combobox', { name: 'Search grouping' }),
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('combobox', { name: 'Search grouping' }),
      ).toBeHidden();
      await expect(jump).toBeVisible();
      const controls = footer.locator('button, a[href]');
      const centers = await controls.evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return box.y + box.height / 2;
        }),
      );
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(2);
      expect(
        await footer
          .locator('.sticky-footer-actions')
          .evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).toBe(true);

      if (width >= 1280) {
        const groups = page.getByTestId('search-results-grid');
        const topResults = groups.first();
        await expect(topResults).toHaveAttribute('id', 'group-top-results');
        await expect(topResults.locator('.card-root')).toHaveCount(7);
        // The closing Display popover can keep the result region inert briefly.
        await expect
          .poll(() =>
            topResults
              .getByRole('button', { name: /^Options for / })
              .evaluateAll((buttons) =>
                buttons.map((button) => button.getAttribute('aria-label')),
              ),
          )
          .toEqual(cards.slice(0, 7).map((card) => `Options for ${card.name}`));
        // A 200-card result list should not mount every interactive card at once.
        await expect
          .poll(() => page.locator('[data-deferred]').count())
          .toBeGreaterThan(100);
        const lastCreature = groups.nth(1).locator(':scope > div').last();
        await expect(lastCreature).toHaveAttribute('data-deferred', '');
        await lastCreature.scrollIntoViewIfNeeded();
        await expect(lastCreature.locator('.card-root')).toBeVisible();
        const options = lastCreature.getByRole('button', {
          name: `Options for ${cards.at(-1)!.name}`,
          exact: true,
        });
        await options.focus();
        await page.keyboard.press('Enter');
        const cardModal = page.getByRole('dialog');
        await expect(cardModal).toBeVisible();
        await expect
          .poll(() =>
            cardModal.evaluate((element) =>
              element.contains(document.activeElement),
            ),
          )
          .toBe(true);
        await page.keyboard.press('Escape');
        await expect(cardModal).toBeHidden();
        await expect(options).toBeFocused();
      }
      if (width < 640) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        await expect
          .poll(() =>
            footer.evaluate((element) => {
              const bar = element.closest('.sticky-footer-wrap')!;
              const expected =
                window.innerHeight - bar.getBoundingClientRect().top;
              const actual = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue(
                  '--persistent-footer-height',
                ),
              );
              return Math.abs(expected - actual);
            }),
          )
          .toBeLessThan(1);
        await footerDisplay.click();
        const viewSelect = page.getByRole('combobox', {
          name: 'View',
          exact: true,
        });
        await expect(viewSelect).toBeVisible();
        for (const select of await page.getByRole('combobox').all()) {
          const bounds = await select.boundingBox();
          if (bounds) {
            expect(bounds.x).toBeGreaterThanOrEqual(0);
            expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
          }
        }
        await footerDisplay.click();
        await expect(viewSelect).toBeHidden();
        await page
          .getByRole('button', {
            name: 'Filter results (4 selected)',
            exact: true,
          })
          .click();
        await drawer
          .getByRole('button', { name: 'Colors', exact: true })
          .click();
        const casting = drawer.getByRole('radio', {
          name: 'Casting Colors',
          exact: true,
        });
        await expect(casting).toBeChecked();
        const rule = drawer.getByRole('combobox', {
          name: 'Color matching rule',
        });
        expect(
          await rule.evaluate((element) =>
            parseFloat(getComputedStyle(element).fontSize),
          ),
        ).toBeGreaterThanOrEqual(32);
        const bounds = (await rule.boundingBox())!;
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
        await page.keyboard.press('Escape');
        await expect(drawer).toBeHidden();
      }
      await page.evaluate(() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'instant',
        }),
      );
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.scrollHeight -
              window.innerHeight -
              window.scrollY,
          ),
        )
        .toBeLessThanOrEqual(2);
      await expect(footer).toBeVisible();
      await expect(footer.locator('a, button').last()).toHaveAccessibleName(
        'Back to top',
      );
      expect(
        await footer.evaluate(
          (element) => element.scrollWidth <= element.clientWidth,
        ),
      ).toBe(true);
      const arrowBounds = (await backToTop.boundingBox())!;
      const contactBounds = (await page
        .getByRole('link', { name: 'thecardmystic@gmail.com', exact: true })
        .boundingBox())!;
      expect(contactBounds.y + contactBounds.height).toBeLessThan(
        (await footer.boundingBox())!.y,
      );
      for (const control of await footer
        .locator('a:visible, button:visible')
        .all()) {
        await control.focus();
        await expect(control).toBeFocused();
        const bounds = (await control.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(
          arrowBounds.x + arrowBounds.width + 1,
        );
        expect(
          Math.abs(
            bounds.y +
              bounds.height / 2 -
              arrowBounds.y -
              arrowBounds.height / 2,
          ),
        ).toBeLessThan(2);
      }
      if (width < 640) await backToTop.click();
      else {
        await backToTop.focus();
        await page.keyboard.press('Enter');
      }
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(footer).toBeVisible();
      if (width >= 1280) {
        await page.reload();
        await expect(page.locator('.card-root').first()).toBeVisible();
        await expect(footerDisplay).toBeVisible();
        await expect(backToTop).toBeVisible();
      }
      expect(errors).toEqual([]);
    } finally {
      releaseSearch();
    }
  });
}
