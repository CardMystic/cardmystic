import { expect, test } from '@playwright/test';
import { setupDeckDisplay } from './utils/deckDisplay';
import { BACKEND } from './utils/mocks';

for (const width of [1440, 390]) {
  test(`breadcrumbs return to the same search and filters at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const state = await setupDeckDisplay(page, { owner: false });
    const card = state.cards[2];
    await page.route(BACKEND + '/search/keyword', (route) =>
      route.fulfill({
        json: [{ card_name: card.name, card_data: card }],
      }),
    );
    await page.route(BACKEND + '/cards/with-llm/' + card.oracle_id, (route) =>
      route.fulfill({
        json: { card, llm: null },
      }),
    );
    const search =
      '/search/paper/keyword?query=island&filters=%7B%22isPaper%22%3Atrue%7D';
    await page.evaluate((path) => {
      const root = document.getElementById('__nuxt') as unknown as {
        __vue_app__: {
          config: {
            globalProperties: {
              $router: { push: (path: string) => Promise<unknown> };
            };
          };
        };
      };
      return root.__vue_app__.config.globalProperties.$router.push(path);
    }, search);
    await page
      .getByRole('button', { name: 'Options for Island', exact: true })
      .click();
    await page
      .getByRole('link', { name: 'View Card Details', exact: true })
      .click();
    const crumbs = page.getByRole('navigation', {
      name: 'Browsing history',
      exact: true,
    });
    await expect(crumbs).toContainText('Island');
    const origin = crumbs.getByRole('link', {
      name: 'Keyword Search: island',
      exact: true,
    });
    await expect(origin).toHaveAttribute('href', /\/search\/paper\/keyword\?/);
    const returnUrl = new URL((await origin.getAttribute('href'))!, page.url());
    expect(returnUrl.searchParams.toString()).toBe(
      new URL(search, page.url()).searchParams.toString(),
    );
    await origin.click();
    await expect(page).toHaveURL(
      (url) =>
        url.pathname === '/search/paper/keyword' &&
        url.searchParams.toString() === returnUrl.searchParams.toString(),
    );
    await expect(page.locator('.card-root')).toHaveCount(1);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/card/${card.oracle_id}$`));
    await expect(origin).toHaveAttribute(
      'href',
      returnUrl.pathname + returnUrl.search,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}
