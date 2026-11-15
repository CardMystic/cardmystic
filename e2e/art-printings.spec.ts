import { expect, test, type Page } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, SUPABASE, gotoHydrated } from './utils/mocks';

const printingId = '44000000-0000-4000-8000-000000000001';
const selectedUrl = `https://api.scryfall.com/cards/${printingId}?format=image&version=art_crop`;

test('a saved deck printing never requests the default image while its metadata loads', async ({
  page,
}) => {
  const { items, cards } = await setupDeckDisplay(page, {
    owner: false,
    cardCount: 4,
  });
  const card = cards[3];
  Object.assign(items[3], { printing_id: printingId, finish: 'foil' });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested = false;
  await page.route(`${SUPABASE}/rest/v1/card_printings**`, async (route) => {
    requested = true;
    await gate;
    await route.fulfill({
      json: [
        {
          id: printingId,
          oracle_id: card.oracle_id,
          set_code: 'test',
          collector_number: '123',
          lang: 'en',
          released_at: '2026-01-01',
          finish_mask: 3,
          image_paths: ['front/a/b/selected-art.jpg'],
          usd_cents: 100,
          foil_cents: 200,
          etched_cents: null,
          tcgplayer_id: null,
          flavor_name: null,
        },
      ],
    });
  });
  const defaultRequests: string[] = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'image' && request.url().includes(card.id))
      defaultRequests.push(request.url());
  });
  try {
    await page.reload();
    await expect.poll(() => requested).toBe(true);
    const button = page.getByRole('button', {
      name: `Options for ${card.name}`,
      exact: true,
    });
    await expect(button.locator('.image-placeholder')).toBeVisible();
    await expect(button.locator('img')).toHaveCount(0);
    release();
    await expect(button.locator('img')).toHaveAttribute(
      'src',
      'https://cards.scryfall.io/normal/front/a/b/selected-art.jpg',
    );
    expect(defaultRequests).toEqual([]);
  } finally {
    release();
  }
});

async function setupArt(page: Page) {
  const state = await setupDeckDisplay(page, { cardCount: 4 });
  const card = state.cards[3];
  await page.route(`${BACKEND}/cards/cards-by-names`, (route) =>
    route.fulfill({ json: [card] }),
  );
  await page.route(`${SUPABASE}/rest/v1/card_printings**`, (route) =>
    route.fulfill({
      json: [
        {
          id: printingId,
          oracle_id: card.oracle_id,
          set_code: 'test',
          collector_number: '123',
          lang: 'en',
          released_at: '2026-01-01',
          finish_mask: 3,
          image_paths: ['front/a/b/selected-art.jpg'],
          flavor_name: null,
          tcgplayer_id: null,
          usd_cents: 100,
          foil_cents: 200,
          etched_cents: null,
          card_printing_sets: { name: 'Alternate Test Set' },
        },
      ],
    }),
  );
  await page.route('https://api.scryfall.com/cards/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#204e68"/></svg>',
    }),
  );
  return { ...state, card };
}

test('banner printing saves, reloads, and can return to default art', async ({
  page,
}) => {
  const { deck, card } = await setupArt(page);
  Object.assign(deck, {
    avatar_card_name: card.name,
    avatar_printing_id: null,
  });
  await page.route(`${SUPABASE}/rest/v1/card_lists**`, async (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    Object.assign(deck, route.request().postDataJSON());
    return route.fulfill({ json: [deck] });
  });
  await gotoHydrated(page, `/lists/${displayDeckId}`);
  await page
    .getByRole('button', { name: 'Deck settings', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select printing', exact: true })
    .click();
  await page.getByRole('option', { name: /Alternate Test Set #123/ }).click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect
    .poll(
      () =>
        (deck as unknown as { avatar_printing_id: string | null })
          .avatar_printing_id,
    )
    .toBe(printingId);
  await page.reload();
  await expect(
    page.getByTestId('deck-banner').locator('img').first(),
  ).toHaveAttribute('src', selectedUrl);
  await page
    .getByRole('button', { name: 'Deck settings', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select printing', exact: true })
    .click();
  await page
    .getByRole('option', { name: 'Default printing', exact: true })
    .click();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect
    .poll(
      () =>
        (deck as unknown as { avatar_printing_id: string | null })
          .avatar_printing_id,
    )
    .toBeNull();
});

test('profile printing persists and changing the card clears the old printing', async ({
  page,
}) => {
  const { card } = await setupArt(page);
  const profile = {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'Tester',
    avatar_card_name: card.name,
    avatar_printing_id: null as string | null,
  };
  await page.route(`${SUPABASE}/rest/v1/profiles**`, (route) => {
    if (route.request().method() === 'PATCH')
      Object.assign(profile, route.request().postDataJSON());
    return route.fulfill({ json: profile });
  });
  await gotoHydrated(page, '/user/account');
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await page.getByRole('button', { name: 'Change profile image' }).click();
  await page
    .getByRole('button', { name: 'Select printing', exact: true })
    .click();
  await page.getByRole('option', { name: /Alternate Test Set #123/ }).click();
  await expect.poll(() => profile.avatar_printing_id).toBe(printingId);
  await page.reload();
  await expect(
    page
      .getByRole('region', { name: 'Account info', exact: true })
      .locator('img')
      .first(),
  ).toHaveAttribute('src', selectedUrl);
  await page.getByRole('button', { name: 'Change profile image' }).click();
  await page
    .getByPlaceholder('Search for a card...', { exact: true })
    .fill('Island');
  const other = page
    .getByRole('option')
    .filter({ hasNotText: card.name })
    .first();
  await other.click();
  await expect.poll(() => profile.avatar_printing_id).toBeNull();
});
