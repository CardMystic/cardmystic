import { expect, test, type Page } from '@playwright/test';
import { setupDeckDisplay } from './utils/deckDisplay';

function groupTrigger(page: Page, name: string) {
  return page
    .getByRole('button', { name, exact: true })
    .and(page.locator('[aria-expanded]'));
}

async function choose(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

test('adding a card preserves mobile display choices and collapsed groups', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const state = await setupDeckDisplay(page, {
    groupBy: 'type',
    extraCards: 1,
    holdAddedCardData: true,
  });
  const addedCard = state.catalog.at(-1)!;
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await choose(page, 'Deck view', 'Card Text');
  await choose(page, 'Deck grouping', 'Color');
  await choose(page, 'Deck sorting', 'Price');
  await page.getByRole('button', { name: 'Ascending', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Collapse All', exact: true }).click();
  await expect(groupTrigger(page, 'Blue (3)')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect(groupTrigger(page, 'Lands (1)')).toHaveAttribute(
    'aria-expanded',
    'false',
  );

  const input = page.locator(
    'input[placeholder="Add a card to the deck..."]:visible',
  );
  await input.fill(addedCard.name);
  await page.getByRole('option', { name: addedCard.name, exact: true }).click();
  try {
    await expect.poll(() => state.writes.length).toBe(1);
    await expect(groupTrigger(page, 'Blue (3)')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    state.releaseAddedCardData();
    await expect(groupTrigger(page, 'Blue (4)')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(groupTrigger(page, 'Lands (1)')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await page.getByRole('button', { name: 'Display', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Deck view', exact: true }),
    ).toContainText('Card Text');
    await expect(
      page.getByRole('combobox', { name: 'Deck grouping', exact: true }),
    ).toContainText('Color');
    await expect(
      page.getByRole('combobox', { name: 'Deck sorting', exact: true }),
    ).toContainText('Price');
    await expect(
      page.getByRole('button', { name: 'Descending', exact: true }),
    ).toBeVisible();
  } finally {
    state.releaseAddedCardData();
  }
});
