import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';

const popular = [
  'card draw',
  'artifact removal',
  'mono white removal',
  'treasure generators',
  'treasure synergy',
];

test('popular searches power the homepage and keyboard/mouse autocomplete without per-keystroke requests', async ({
  page,
}) => {
  let loads = 0;
  await page.route(`${BACKEND}/cache/popular`, (route) => {
    loads++;
    return route.fulfill({ json: popular });
  });
  await gotoHydrated(page, '/');
  const input = page.getByRole('combobox', { name: 'Smart search' });
  await input.fill('treas');
  await expect(
    page.getByRole('option', { name: 'treasure generators', exact: true }),
  ).toBeVisible();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('treasure generators');
  await expect(
    page.getByRole('listbox', { name: 'Popular search suggestions' }),
  ).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
  await input.fill('mono white');
  await page.getByRole('option', { name: 'mono white removal' }).click();
  await expect(input).toHaveValue('mono white removal');
  await input.fill('artif');
  await input.press('Escape');
  await expect(
    page.getByRole('listbox', { name: 'Popular search suggestions' }),
  ).toBeHidden();
  await input.fill('my own unusual search');
  await expect(input).toHaveValue('my own unusual search');
  await expect(
    page.getByRole('listbox', { name: 'Popular search suggestions' }),
  ).toBeHidden();
  await page
    .getByRole('heading', { name: 'Popular Searches', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page
      .locator('.top-queries-content')
      .getByText('treasure synergy', { exact: true }),
  ).toBeVisible();
  expect(loads).toBe(1);
});

test('search remains usable when popular suggestions fail to load', async ({
  page,
}) => {
  await page.route(`${BACKEND}/cache/popular`, (route) =>
    route.fulfill({ status: 503, json: { message: 'Unavailable' } }),
  );
  await gotoHydrated(page, '/search/all/smart');
  const input = page.getByRole('combobox', { name: 'Smart search' });
  await input.fill('my own unusual search');
  await input.press('Enter');
  await expect(page).toHaveURL(
    /query=my(?:%20|\+)own(?:%20|\+)unusual(?:%20|\+)search/,
  );
});
