import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';

for (const [path, endpoint] of [
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
  test(`reranking toggle updates and survives submission: ${endpoint}`, async ({
    page,
  }) => {
    const requests: { useRerank: boolean; query?: string }[] = [];
    await page.route(`${BACKEND}${endpoint}`, (route) => {
      requests.push(route.request().postDataJSON());
      return route.fulfill({
        json: { results: [], not_found: [], total_decks: 0 },
      });
    });
    await gotoHydrated(page, path);
    const toggle = page.getByRole('button', { name: 'Reranking', exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => requests.at(-1)?.useRerank).toBe(true);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => requests.at(-1)?.useRerank).toBe(false);
    await expect(page).toHaveURL(/useRerank=false/);
    await page.locator('form button[type="submit"]').first().click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/useRerank=false/);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    // A cached on-mode response can be reused without another request.
    await expect(page).toHaveURL(/useRerank=true/);
    expect(requests.every((request) => request.query === 'card draw')).toBe(
      true,
    );
  });
}
