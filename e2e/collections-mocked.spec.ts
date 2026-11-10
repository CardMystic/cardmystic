import { expect, test } from '@playwright/test';
import { setupDeckDisplay } from './utils/deckDisplay';
import { BACKEND } from './utils/mocks';

test('Game Changers is the first role and has Commander SEO and structured data', async ({
  page,
}) => {
  const state = await setupDeckDisplay(page, { owner: false });
  const gameChangers = {
    slug: 'game-changers',
    name: 'Game Changers',
    cardCount: 3,
    imageUrl: null,
    imageCardName: null,
    releasedAt: null,
  };
  await page.route(BACKEND + '/card-collections', (route) =>
    route.fulfill({
      json: {
        dataReleaseId: 'game-changer-release',
        sets: [],
        themes: [],
        roles: [
          gameChangers,
          { ...gameChangers, slug: 'ramp', name: 'Ramp', cardCount: 1000 },
        ],
      },
    }),
  );
  await page.route(
    BACKEND + '/card-collections/roles/game-changers**',
    (route) =>
      route.fulfill({
        json: {
          dataReleaseId: 'game-changer-release',
          offset: 0,
          total: 3,
          results: state.cards.map((card) => ({
            card_name: card.name,
            card_data: { ...card, game_changer: true },
          })),
        },
      }),
  );
  await page.reload();
  await page.evaluate(() => {
    const root = document.querySelector('#__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<void> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push('/roles');
  });
  await expect(page.getByTestId('collection-tile').first()).toContainText(
    'Game Changers',
  );
  await page.getByTestId('collection-tile').first().click();
  await expect(page).toHaveURL(/\/roles\/game-changers$/);
  await expect(page).toHaveTitle(
    'MTG Commander Game Changers List | CardMystic',
  );
  await expect(page.locator('h1')).toHaveText(
    'MTG Commander Game Changers List',
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /current Magic: The Gathering Commander Game Changers list/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://cardmystic.com/roles/game-changers',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'MTG Commander Game Changers List | CardMystic',
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    'MTG Commander Game Changers List | CardMystic',
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow',
  );
  const structured = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(structured.map((value) => JSON.parse(value))).toContainEqual(
    expect.objectContaining({
      '@type': 'CollectionPage',
      url: 'https://cardmystic.com/roles/game-changers',
      breadcrumb: expect.objectContaining({ '@type': 'BreadcrumbList' }),
    }),
  );
});

test('collections match the navigation, responsive directory layout, and SEO metadata', async ({
  page,
}) => {
  const catalog = {
    dataReleaseId: 'test-release',
    sets: Array.from({ length: 45 }, (_, index) => ({
      slug: `set-${index}`,
      name: `Test Set ${index}`,
      cardCount: 3,
      releasedAt: '2026-10-01',
      imageUrl: null,
    })),
    themes: [
      { slug: 'artifacts', name: 'Artifacts', cardCount: 3, imageUrl: null },
    ],
    roles: [{ slug: 'ramp', name: 'Ramp', cardCount: 3, imageUrl: null }],
  };
  const state = await setupDeckDisplay(page, { owner: false });
  await page.route(BACKEND + '/card-collections', (route) =>
    route.fulfill({ json: catalog }),
  );
  await page.reload();
  await expect(page.locator('.list-card')).toHaveCount(3);
  await page.route(BACKEND + '/card-collections/**', (route) =>
    route.fulfill({
      json: {
        dataReleaseId: 'test-release',
        offset: 0,
        total: 3,
        results: state.cards.map((card) => ({
          card_name: card.name,
          card_data: card,
        })),
      },
    }),
  );
  await page.evaluate(() => {
    const root = document.querySelector('#__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<void> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push('/sets');
  });
  await expect(
    page.getByRole('heading', { name: 'MTG Sets', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('collection-tile')).toHaveCount(40);
  await expect(page).toHaveTitle('MTG Sets | CardMystic');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://cardmystic.com/sets',
  );
  await page
    .getByRole('searchbox', { name: 'Filter sets' })
    .fill('Test Set 44');
  await expect(page.getByTestId('collection-tile')).toHaveCount(1);
  await page.getByTestId('collection-tile').click();
  await expect(page).toHaveURL(/\/sets\/set-44$/);
  await expect(page.locator('h1')).toContainText('Test Set 44');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://cardmystic.com/sets/set-44',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('button', { name: 'Themes', exact: true }).click();
  await page.getByRole('link', { name: 'All themes', exact: true }).click();
  await expect(page).toHaveURL(/\/themes$/);
  await expect(page.getByTestId('collection-tile')).toHaveCount(1);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  for (const [kind, name] of [
    ['themes', 'Artifacts'],
    ['roles', 'Ramp'],
  ]) {
    if (kind === 'roles')
      await page
        .getByRole('link', { name: 'Go To Roles', exact: true })
        .click();
    await page.getByTestId('collection-tile').click();
    const crumbs = page.getByRole('navigation', {
      name: 'Breadcrumb',
      exact: true,
    });
    await expect(crumbs).toContainText(name);
    await expect(page.locator('h1')).toContainText(name);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://cardmystic.com/${kind}/${name.toLowerCase()}`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `https://cardmystic.com/${kind}/${name.toLowerCase()}`,
    );
    await crumbs
      .getByRole('link', {
        name: `All ${kind === 'themes' ? 'Themes' : 'Roles'}`,
      })
      .click();
    await expect(page).toHaveURL(new RegExp(`/${kind}$`));
  }
});
