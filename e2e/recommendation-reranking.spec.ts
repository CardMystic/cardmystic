import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';

for (const [path, endpoint] of [
  ['/search/all/similarity?card_name=Sol+Ring', '/search/similarity'],
  [
    '/search/all/deckbuilder?commander=Kaalia+of+the+Vast&description=card+draw',
    '/als/recommend',
  ],
  ['/popular-cards/all?query=card+draw', '/deck-stats/top-cards'],
  ['/popular-commanders/all?query=card+draw', '/deck-stats/top-commanders'],
  [
    '/popular-by-commander/all?commander=Kaalia+of+the+Vast&query=card+draw',
    '/deck-stats/popular-by-commander',
  ],
]) {
  test(`search mode updates and survives submission: ${endpoint}`, async ({
    page,
  }) => {
    const requests: {
      useRerank: boolean;
      query?: string;
      card_name?: string;
    }[] = [];
    await page.route(`${BACKEND}/search-access`, (route) =>
      route.fulfill({
        json: {
          enabled: true,
          authenticated: false,
          tier: 'normal',
          enhancedRemaining: 10,
          enhancedTopUpRemaining: 0,
          resetsAt: '2026-10-15T00:00:00Z',
        },
      }),
    );
    await page.route(`${BACKEND}${endpoint}`, (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({
        json:
          endpoint === '/search/similarity'
            ? []
            : { results: [], not_found: [], total_decks: 0 },
      });
    });
    await gotoHydrated(page, path);
    const toggle = page.getByRole('combobox', {
      name: 'Search mode',
      exact: true,
    });
    await expect(toggle).toContainText('Enhanced');
    await expect.poll(() => requests.at(-1)?.useRerank).toBe(true);
    await toggle.click();
    await page.getByRole('option', { name: 'Normal', exact: true }).click();
    await expect(toggle).toContainText('Normal');
    await expect.poll(() => requests.at(-1)?.useRerank).toBe(false);
    await expect(page).toHaveURL(/useRerank=false/);
    await page.locator('form button[type="submit"]').first().click();
    await expect(toggle).toContainText('Normal');
    await expect(page).toHaveURL(/useRerank=false/);
    await toggle.click();
    await page.getByRole('option', { name: 'Enhanced', exact: true }).click();
    await expect(toggle).toContainText('Enhanced');
    // A cached on-mode response can be reused without another request.
    await expect(page).toHaveURL(/useRerank=true/);
    expect(
      requests.every((request) =>
        endpoint === '/search/similarity'
          ? request.card_name === 'Sol Ring'
          : request.query === 'card draw',
      ),
    ).toBe(true);
  });
}
