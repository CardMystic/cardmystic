import { expect, test } from '@playwright/test';
import { createDisplayCards } from './utils/deckDisplay';
import { BACKEND, gotoHydrated } from './utils/mocks';

test('Game Changers is the first role and has Commander SEO and structured data', async ({
  page,
}) => {
  const cards = createDisplayCards();
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
          results: cards.map((card) => ({
            card_name: card.name,
            card_data: { ...card, game_changer: true },
          })),
        },
      }),
  );
  await gotoHydrated(page, '/roles/proliferate');
  await page
    .getByRole('link', { name: 'Go To All Roles', exact: true })
    .click();
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
  const schema = page.locator('script[type="application/ld+json"]');
  await expect
    .poll(async () =>
      (await schema.allTextContents())
        .filter(Boolean)
        .map((value) => JSON.parse(value)),
    )
    .toContainEqual(
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
  const cards = createDisplayCards();
  await page.route(BACKEND + '/card-collections', (route) =>
    route.fulfill({ json: catalog }),
  );
  await gotoHydrated(page, '/sets/lea');
  await page.route(BACKEND + '/card-collections/**', (route) =>
    route.fulfill({
      json: {
        dataReleaseId: 'test-release',
        offset: 0,
        total: 3,
        results: cards.map((card) => ({
          card_name: card.name,
          card_data: card,
        })),
      },
    }),
  );
  await page.getByRole('link', { name: 'Go To All Sets', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'MTG Sets', exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId('collection-tile')).toHaveCount(40);
  await expect(page).toHaveTitle('MTG Sets | CardMystic');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://cardmystic.com/sets',
  );
  const setPicker = page.getByRole('combobox', { name: 'Filter sets' });
  await setPicker.fill('set-44');
  await expect(page.getByTestId('collection-tile')).toHaveCount(1);
  await expect(page.getByRole('option')).toHaveText(['Test Set 44 (SET-44)']);
  await setPicker.press('ArrowDown');
  await setPicker.press('Enter');
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
  const opener = page.getByRole('button', { name: 'Open navigation menu' });
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  await opener.focus();
  await opener.press('Enter');
  const menu = page.getByRole('dialog', { name: 'Navigation', exact: true });
  await expect(menu).toBeVisible();
  await expect
    .poll(async () => Math.round((await menu.boundingBox())!.width))
    .toBe(390);
  expect(await menu.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await menu
    .getByRole('button', { name: 'Close navigation menu' })
    .press('Enter');
  await expect(opener).toBeFocused();
  await page.addStyleTag({ content: 'html { font-size: 100% !important; }' });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.getByRole('button', { name: 'Themes', exact: true }).click();
  await page.getByRole('link', { name: 'All themes', exact: true }).click();
  await expect(page).toHaveURL(/\/themes$/);
  await expect(menu).toBeHidden();
  await expect(opener).toBeFocused();
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
    await page
      .getByRole('combobox', { name: `Filter ${kind}` })
      .fill(name.slice(0, 3));
    await page.getByRole('option', { name, exact: true }).click();
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
  for (const width of [390, 1680]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 390)
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const navigation =
      width === 390 ? page.getByRole('dialog') : page.getByRole('banner');
    await navigation.getByRole('button', { name: 'Sets', exact: true }).click();
    const picker = page.getByRole('combobox', { name: 'Find sets' });
    await picker.fill(width === 390 ? 'set-42' : 'set-43');
    await page.getByRole('option').click();
    await expect(page).toHaveURL(
      new RegExp(`/sets/set-${width === 390 ? '42' : '43'}$`),
    );
    await expect(picker).toBeHidden();
  }
});
