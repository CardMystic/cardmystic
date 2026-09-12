import { expect, test } from '@playwright/test';
import { BACKEND, gotoHydrated, reliableFill } from './utils/mocks';

test.describe.configure({ timeout: 120_000 });

test.beforeEach(async ({ page }) => {
  page.on('console', (message) => {
    if (/hydration.*mismatch/i.test(message.text()))
      throw new Error(message.text());
  });
});

for (const query of ['board wipes in an x spell deck', 'board wipes x spell']) {
  test('Smart Search returns cards for ' + query, async ({ page }) => {
    await gotoHydrated(
      page,
      '/search/all/smart?query=' + encodeURIComponent(query),
    );
    await expect(page.locator('.results-layout img[alt]').first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByText('No results found', { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText('Search could not be completed')).toHaveCount(
      0,
    );
  });
}

test('a rejected search shows an error, supports retry, and recovers on a new search', async ({
  page,
}) => {
  // An unsupported limit produces a real HTTP 400.
  await gotoHydrated(page, '/search/all/smart?query=board%20wipes&limit=201');
  await expect(page.getByText('Search could not be completed')).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText('No results found', { exact: true })).toHaveCount(
    0,
  );
  const retryResponse = page.waitForResponse(
    (response) =>
      response.url().startsWith(BACKEND + '/search/colbert') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Retry search', exact: true }).click();
  expect((await retryResponse).status()).toBe(400);
  await expect(
    page.getByRole('button', { name: 'Retry search', exact: true }),
  ).toBeEnabled({ timeout: 60_000 });
  const input = page.getByPlaceholder('Describe the cards you want...');
  await reliableFill(input, 'board wipes in an x spell deck');
  await input.press('Enter');
  await expect(page.locator('.results-layout img[alt]').first()).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText('Search could not be completed')).toHaveCount(0);
});

test('no eligible cards still shows the empty state', async ({ page }) => {
  const params = new URLSearchParams({
    query: 'board wipes',
    filters: JSON.stringify({
      selectedCMC: '999',
      selectedCMCOption: 'Equal To',
    }),
  });
  await gotoHydrated(page, '/search/all/smart?' + params);
  await expect(page.getByText('No results found', { exact: true })).toBeVisible(
    { timeout: 60_000 },
  );
  await expect(page.getByText('Search could not be completed')).toHaveCount(0);
});
