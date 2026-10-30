import { expect, test, type Page } from '@playwright/test';
import { BACKEND, gotoHydrated } from './utils/mocks';
import { createDisplayCards } from './utils/deckDisplay';

const cards = createDisplayCards(4);
const commander = cards[0];
const partner = { ...cards[3], name: 'Kraum, Ludevic’s Opus' };
const query = 'draw cards';

async function setupSearch(page: Page, paired = false) {
  const feedback: { query: string; cardName: string }[] = [];
  await page.addInitScript(() => {
    localStorage.setItem(
      'cm.cookie-consent.v1',
      JSON.stringify({
        analytics: false,
        advertising: false,
        updatedAt: Date.now(),
      }),
    );
  });
  await page.route('https://cards.scryfall.io/**', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="488" height="680"><rect width="488" height="680" fill="#204e68"/></svg>',
    }),
  );
  await page.route(`${BACKEND}/**`, (route) => route.fulfill({ json: [] }));
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({
      json: {
        enabled: true,
        authenticated: false,
        tier: 'normal',
        enhancedRemaining: 0,
        enhancedTopUpRemaining: 0,
        resetsAt: null,
      },
    }),
  );
  await page.route(`${BACKEND}/bulkdata/commanders.min.json`, (route) =>
    route.fulfill({ json: [commander.name, partner.name] }),
  );
  await page.route(`${BACKEND}/search/colbert`, (route) =>
    route.fulfill({
      json: [
        {
          card_name: paired
            ? `${commander.name} + ${partner.name}`
            : commander.name,
          card_data: commander,
          ai_normalized_score: 0.8,
          ...(paired ? { partner_card_data: partner } : {}),
        },
      ],
    }),
  );
  await page.route(`${BACKEND}/search/similarity`, (route) =>
    route.fulfill({
      json: [
        { card_name: partner.name, card_data: partner },
        { card_name: commander.name, card_data: commander },
      ],
    }),
  );
  await page.route(`${BACKEND}/metrics/dislike`, (route) => {
    feedback.push(route.request().postDataJSON());
    return route.fulfill({ json: {} });
  });
  await gotoHydrated(page, '/search/all/smart?query=draw+cards');
  return feedback;
}

test('search card modal exposes card actions and confirms feedback before submitting once', async ({
  page,
}) => {
  const feedback = await setupSearch(page);
  const card = page.locator('.card-root').filter({
    has: page.getByRole('button', {
      name: `Options for ${commander.name}`,
      exact: true,
    }),
  });
  const open = () =>
    card
      .getByRole('button', {
        name: `Options for ${commander.name}`,
        exact: true,
      })
      .click();
  const modal = page.getByRole('dialog', { name: commander.name, exact: true });
  await open();
  await expect(
    modal.getByRole('link', { name: 'View Card Details' }),
  ).toHaveAttribute('href', `/card/${commander.oracle_id}`);
  for (const name of [
    'Add to Deck',
    'Find Similar Cards',
    'Popular Cards for this Commander',
    'Get Deck Recommendations',
    'Mark As Poor Result',
  ]) {
    await expect(
      modal.getByRole('button', { name, exact: true }),
    ).toBeEnabled();
  }
  await expect(
    modal.getByRole('link', { name: /Buy on TCGPlayer/ }),
  ).toHaveAttribute('href', /^https:\/\/partner\.tcgplayer\.com\//);
  await modal
    .getByRole('button', { name: 'Add to Clipboard', exact: true })
    .click();
  await expect(modal).toBeHidden();
  await expect(
    card.getByRole('button', { name: 'Card Added', exact: true }),
  ).toBeVisible();
  await open();
  await expect(
    modal.getByRole('button', { name: 'Remove from Clipboard', exact: true }),
  ).toBeVisible();
  await modal
    .getByRole('button', { name: 'Show Back Face', exact: true })
    .click();
  await expect(card.getByRole('img')).toHaveAttribute('src', /\/back\//);

  await open();
  await modal
    .getByRole('button', { name: 'Mark As Poor Result', exact: true })
    .click();
  const confirmation = page.getByRole('dialog', {
    name: 'Confirm Poor Result?',
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  expect(feedback).toEqual([]);
  await confirmation
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(confirmation).toBeHidden();
  expect(feedback).toEqual([]);
  await open();
  await modal
    .getByRole('button', { name: 'Mark As Poor Result', exact: true })
    .click();
  await confirmation
    .getByRole('button', { name: 'Yes, This is a Poor Result', exact: true })
    .click();
  await expect
    .poll(() => feedback)
    .toEqual([{ query, cardName: commander.name }]);
  await open();
  await expect(
    modal.getByRole('button', { name: 'Feedback Submitted', exact: true }),
  ).toBeDisabled();
});

test('mobile partner actions use the clicked card and similarity reference hides result-only actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const feedback = await setupSearch(page, true);
  // The partner is behind the primary card; tap its exposed top edge.
  await page
    .getByRole('button', { name: `View ${partner.name}`, exact: true })
    .click({ position: { x: 15, y: 15 } });
  const modal = page.getByRole('dialog', { name: partner.name, exact: true });
  await expect(
    modal.getByRole('link', { name: 'View Card Details' }),
  ).toHaveAttribute('href', `/card/${partner.oracle_id}`);
  await modal
    .getByRole('button', { name: 'Mark As Poor Result', exact: true })
    .click();
  await page
    .getByRole('dialog', { name: 'Confirm Poor Result?', exact: true })
    .getByRole('button', { name: 'Yes, This is a Poor Result', exact: true })
    .click();
  await expect
    .poll(() => feedback)
    .toEqual([{ query, cardName: partner.name }]);
  await page
    .getByRole('button', { name: `View ${partner.name}`, exact: true })
    .click({ position: { x: 15, y: 15 } });
  await modal
    .getByRole('button', { name: 'Find Similar Cards', exact: true })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === '/search/all/similarity' &&
      url.searchParams.get('card_name') === partner.name,
  );
  await page
    .getByRole('button', { name: `Options for ${partner.name}`, exact: true })
    .click();
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole('button', { name: 'Mark As Poor Result', exact: true }),
  ).toHaveCount(0);
  await expect(
    modal.getByRole('button', { name: 'Find Similar Cards', exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
});
