import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';

// Unit tests cover punctuation variants; this catches the dropdown filtering
// canonical suggestions a second time and verifies keyboard submission.
test('mobile similarity autocomplete accepts a smart apostrophe and submits the canonical name', async ({
  page,
}) => {
  const cardName = "Teferi's Protection";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(`${BACKEND}/**`, (route) => route.fulfill({ json: [] }));
  await page.route(`${BACKEND}/bulkdata/card-names.min.json`, (route) =>
    route.fulfill({ json: [cardName, 'Sol Ring'] }),
  );
  await gotoHydrated(page, '/search/all/similarity');
  const input = page.getByPlaceholder('Enter a card name...', { exact: true });
  await input.fill('Teferi’');
  await expect(
    page.getByRole('option', { name: cardName, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Sol Ring', exact: true }),
  ).toHaveCount(0);
  await input.fill('nonexistent card');
  await expect(page.getByRole('option')).toHaveCount(0);
  await input.fill('Teferi’');
  await expect(
    page.getByRole('option', { name: cardName, exact: true }),
  ).toBeVisible();
  const submitted = page.waitForRequest(
    (request) =>
      request.url() === `${BACKEND}/search/similarity` &&
      request.method() === 'POST',
  );
  await input.press('ArrowDown');
  await input.press('Enter');
  expect((await submitted).postDataJSON().card_name).toBe(cardName);
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('card_name') === cardName,
  );
});
