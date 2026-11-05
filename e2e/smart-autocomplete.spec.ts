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
  await page.route(`${BACKEND}/search/colbert`, (route) =>
    route.fulfill({ json: [] }),
  );
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
  await expect(page).toHaveURL(/query=treasure(?:%20|\+)generators/);
  // The URL changes before Nuxt replaces the homepage form. Wait for the
  // destination page so the next fill cannot land in the outgoing input.
  await expect(
    page.getByRole('heading', {
      name: 'MTG Smart Search',
      level: 1,
      exact: true,
    }),
  ).toBeVisible();
  await expect(input).toHaveValue('treasure generators');
  await input.focus();
  await input.fill('mono white');
  await page.getByRole('option', { name: 'mono white removal' }).click();
  await expect(input).toHaveValue('mono white removal');
  await expect(page).toHaveURL(/query=mono(?:%20|\+)white(?:%20|\+)removal/);
  await input.focus();
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
