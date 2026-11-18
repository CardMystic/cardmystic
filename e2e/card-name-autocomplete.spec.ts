import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';

// Unit tests cover punctuation variants; this catches the dropdown filtering
// canonical suggestions a second time, premature validation, and keyboard/mouse submission.
test('mobile similarity autocomplete accepts a smart apostrophe and submits the canonical name', async ({
  page,
}) => {
  const cardName = "Teferi's Protection";
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(`${BACKEND}/**`, (route) => route.fulfill({ json: [] }));
  await page.route(`${BACKEND}/bulkdata/card-names.min.json`, (route) =>
    route.fulfill({ json: [cardName, 'Sol Ring'] }),
  );
  // Observe even errors that appear and disappear between Playwright assertions.
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      for (const record of records) {
        const element = record.target as HTMLElement;
        if (element.getAttribute('placeholder') !== 'Enter a card name...')
          continue;
        if (
          element.getAttribute('aria-invalid') === 'true' ||
          record.oldValue === 'true'
        ) {
          element.setAttribute('data-validation-flashed', 'true');
        }
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-invalid'],
      attributeOldValue: true,
    });
  });
  await gotoHydrated(page, '/search/all/similarity');
  const input = page.getByPlaceholder('Enter a card name...', { exact: true });
  await input.focus();
  await input.blur();
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  await input.fill('Teferi’');
  await expect(
    page.getByRole('option', { name: cardName, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('option', { name: 'Sol Ring', exact: true }),
  ).toHaveCount(0);
  await input.fill('nonexistent card');
  await expect(page.getByRole('option')).toHaveCount(0);
  await input.blur();
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
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
  await expect(input).not.toHaveAttribute('data-validation-flashed', 'true');
  await gotoHydrated(page, '/search/all/similarity');
  await input.fill('Sol');
  const clickedSearch = page.waitForRequest(
    (request) =>
      request.url() === `${BACKEND}/search/similarity` &&
      request.method() === 'POST',
  );
  await page.getByRole('option', { name: 'Sol Ring', exact: true }).click();
  expect((await clickedSearch).postDataJSON().card_name).toBe('Sol Ring');
  await expect(input).not.toHaveAttribute('data-validation-flashed', 'true');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');

  // A deliberate submit still validates an empty selection.
  await page.evaluate(() =>
    sessionStorage.removeItem('similarity_search_card_name'),
  );
  await gotoHydrated(page, '/search/all/similarity');
  await expect(input).toHaveValue('');
  await input.evaluate((element) =>
    (element.closest('form') as HTMLFormElement).requestSubmit(),
  );
  await expect(
    page.getByText('Select a card to search for.', { exact: true }),
  ).toBeVisible();
  await input.fill('Sol');
  await page.getByRole('option', { name: 'Sol Ring', exact: true }).click();
  await expect(
    page.getByText('Select a card to search for.', { exact: true }),
  ).toHaveCount(0);
});
