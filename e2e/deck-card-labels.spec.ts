import { expect, test } from '@playwright/test';
import { setupDeckDisplay } from './utils/deckDisplay';
import { BACKEND } from './utils/mocks';

for (const kind of ['deck', 'collection'] as const) {
  test(`${kind} groups cards by role and theme and remembers the selection`, async ({
    page,
  }) => {
    const collection = kind === 'collection';
    const { cards } = await setupDeckDisplay(page, {
      kind,
      cardCount: collection ? 101 : 3,
    });
    const labels = {
      [cards[0].oracle_id]: {
        roles: ['Removal', 'Ramp'],
        themes: ['Artifacts', 'Tokens'],
      },
      [cards[1].oracle_id]: { roles: ['Removal'], themes: ['Artifacts'] },
    };
    await page.getByRole('button', { name: 'Reject all', exact: true }).click();
    await page.route(BACKEND + '/card-collections/labels', (route) => {
      const { oracleIds } = route.request().postDataJSON();
      return route.fulfill({
        json: Object.fromEntries(
          Object.entries(labels).filter(([id]) => oracleIds.includes(id)),
        ),
      });
    });
    const display = page.getByRole('button', { name: 'Display', exact: true });
    const group = page.getByRole('combobox', { name: 'Deck grouping' });
    const heading = (name: string) =>
      page
        .getByRole('button', { name, exact: true })
        .and(page.locator('[aria-expanded]'));
    await display.click();
    await group.click();
    await page.getByRole('option', { name: 'Roles', exact: true }).click();
    await expect(group).toContainText('Roles');
    await display.click();
    await expect(group).toBeHidden();
    await expect(
      heading(collection ? 'Removal (1)' : 'Removal (3)'),
    ).toBeVisible();
    await expect(
      heading(collection ? 'No role (99)' : 'No role (1)'),
    ).toBeVisible();
    if (collection) {
      await page
        .getByRole('navigation', { name: 'Collection pages top' })
        .getByRole('link', { name: 'Page 2' })
        .click();
      await expect(heading('Removal (2)')).toBeVisible();
    }
    await expect(heading('Ramp (2)')).toBeVisible();
    if (collection) {
      await page
        .getByRole('navigation', { name: 'Collection pages top' })
        .getByRole('link', { name: 'Page 1', exact: true })
        .click();
      await expect(heading('Removal (1)')).toBeVisible();
    }
    await display.click();
    await group.click();
    await page.getByRole('option', { name: 'Themes', exact: true }).click();
    await expect(group).toContainText('Themes');
    await display.click();
    await expect(
      heading(collection ? 'Artifacts (1)' : 'Artifacts (3)'),
    ).toBeVisible();
    await page.reload();
    await expect(
      heading(collection ? 'Artifacts (1)' : 'Artifacts (3)'),
    ).toBeVisible();
    await expect(
      heading(collection ? 'No theme (99)' : 'No theme (1)'),
    ).toBeVisible();
    if (!collection) await expect(heading('Tokens (2)')).toBeVisible();
  });
}

test('card metadata follows the displayed face and persists independently in both views', async ({
  page,
}) => {
  const { cards } = await setupDeckDisplay(page);
  const eye = page.getByRole('button', { name: 'Show / Hide' });
  const metadata = page.locator('dl[aria-label="Card metadata"]');
  await expect(metadata).toHaveCount(0);
  await eye.click();
  await page.getByRole('menuitem', { name: 'Show Card Metadata' }).click();
  const card = page.locator('.list-card').filter({
    has: page.getByRole('button', {
      name: `Options for ${cards[1].name}`,
      exact: true,
    }),
  });
  const details = card.locator('dl[aria-label="Card metadata"]');
  await expect(
    details.getByRole('link', { name: 'Sink into Stupor' }),
  ).toHaveAttribute('href', `/card/${cards[1].oracle_id}`);
  await expect(details.getByRole('link', { name: 'Test' })).toHaveAttribute(
    'href',
    '/sets/test',
  );
  await expect(details.locator('dt')).toHaveText([
    'Name',
    'Casting cost',
    'Type',
    'Set',
    'Price',
  ]);
  await expect(details.locator('dd')).toHaveText([
    'Sink into Stupor',
    '{1}{U}{U}',
    'Instant',
    'Test',
    /\$1\.00/,
  ]);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const [name, cost] = await details
      .locator('dd')
      .evaluateAll((fields) =>
        fields
          .slice(0, 2)
          .map((field) => field.getBoundingClientRect().toJSON()),
      );
    expect(cost.left).toBeGreaterThanOrEqual(name.right);
    expect(cost.top).toBeLessThan(name.bottom);
    const setLink = details.getByRole('link', { name: 'Test' });
    await setLink.evaluate((link) => link.scrollIntoView({ block: 'center' }));
    await page.mouse.move(0, 0);
    await expect
      .poll(() =>
        setLink.evaluate((link) => {
          const { left, bottom } = link.getBoundingClientRect();
          return link.contains(
            document.elementFromPoint(left + 0.5, bottom - 1),
          );
        }),
      )
      .toBe(true);
  }
  await card.getByRole('button', { name: /flip/i }).click();
  await expect(details.locator('dd')).toHaveText([
    'Soporific Springs',
    'Land',
    'Test',
    /\$1\.00/,
  ]);
  await page.reload();
  await expect(metadata.first()).toBeVisible();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page.getByRole('combobox', { name: 'Deck view' }).click();
  await page.getByRole('option', { name: 'Card Text', exact: true }).click();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  const island = page.getByRole('group', { name: /^Island, / }).first();
  await expect(
    page
      .getByRole('group', { name: /^Sink into Stupor, / })
      .getByRole('img', { name: 'Casting cost {1}{U}{U}' }),
  ).toHaveCount(1);
  await expect(
    island.getByRole('button', { name: 'Island', exact: true }),
  ).toBeVisible();
  await expect(island.locator('dl[aria-label="Card metadata"] dd')).toHaveText([
    'Basic Land — Island',
    'Test',
    /\$1\.00/,
  ]);
  await eye.click();
  await page.getByRole('menuitem', { name: 'Hide Card Metadata' }).click();
  await expect(metadata).toHaveCount(0);
  await page.reload();
  await expect(island).toBeVisible();
  await expect(metadata).toHaveCount(0);
});

test('deck highlights and optional labels work in grid and text views', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { cards } = await setupDeckDisplay(page);
  const [first, second] = cards;
  const labels = {
    [first.oracle_id]: {
      roles: ['Card draw'],
      themes: ['Artifacts'],
      sets: ['lea', 'tst'],
    },
    [second.oracle_id]: {
      roles: ['Removal'],
      themes: ['Control'],
      sets: ['tst'],
    },
  };
  await page.route(BACKEND + '/card-collections/labels', (route) =>
    route.fulfill({ json: labels }),
  );
  await page.route(BACKEND + '/card-collections', (route) =>
    route.fulfill({
      json: {
        sets: [{ slug: 'lea', name: 'Limited Edition Alpha' }],
        roles: [],
        themes: [],
      },
    }),
  );
  await page.route(BACKEND + '/library/tags', (route) =>
    route.fulfill({ json: { tags: [{ id: 't1', name: 'Wishlist' }] } }),
  );
  await page.route(BACKEND + '/library/tags/assignments', (route) =>
    route.fulfill({
      json: { assignments: [{ oracle_id: first.oracle_id, tag_id: 't1' }] },
    }),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  const eye = page.getByRole('button', { name: 'Show / Hide' });
  const firstCard = page.locator('.list-card').filter({
    has: page.getByRole('button', {
      name: `Options for ${first.name}`,
      exact: true,
    }),
  });
  await expect(firstCard.locator('dl')).toHaveCount(0);
  for (const [group, value, color] of [
    ['Roles', 'Card draw', 'primary'],
    ['Themes', 'Artifacts', 'success'],
    ['Tags', 'Wishlist', 'info'],
  ]) {
    await eye.click();
    await page
      .getByRole('menuitem', { name: 'Show ' + group, exact: true })
      .click();
    await expect(
      firstCard.locator('dl').getByText(value, { exact: true }),
    ).toBeVisible();
    await expect(
      firstCard.locator('dd > span').filter({ hasText: value }),
    ).toHaveClass(new RegExp('text-' + color));
  }
  await expect(firstCard.locator('dl[aria-label="Card labels"] dt')).toHaveText(
    [/^Tags/, 'Roles', 'Themes'],
  );
  const highlight = page.getByRole('button', {
    name: 'Highlight',
    exact: true,
  });
  for (const [group, query, option, expected] of [
    ['Roles', 'draw', 'Card draw', 'Card draw'],
    ['Sets', 'alpha', 'Limited Edition Alpha (LEA)', 'LEA'],
    ['Themes', 'art', 'Artifacts', 'Artifacts'],
    ['Tags', 'wish', 'Wishlist', 'Wishlist'],
  ]) {
    await highlight.click();
    await page.getByRole('combobox', { name: 'Highlight by' }).click();
    await page.getByRole('option', { name: group, exact: true }).click();
    await page
      .getByRole('combobox', {
        name: 'Highlight ' + group.slice(0, -1).toLowerCase(),
        exact: true,
      })
      .fill(query);
    await page.getByRole('option', { name: option, exact: true }).click();
    await highlight.click();
    await expect(page.locator('.list-card [aria-description]')).toHaveCount(1);
    await expect(firstCard.locator('[aria-description]')).toHaveAttribute(
      'aria-description',
      expected,
    );
  }
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  await page.getByRole('combobox', { name: 'Deck view' }).click();
  await page.getByRole('option', { name: 'Card Text', exact: true }).click();
  await page.getByRole('button', { name: 'Display', exact: true }).click();
  const row = page.locator('.card-text-row[aria-description="Wishlist"]');
  await expect(row.getByRole('link', { name: 'Artifacts' })).toHaveAttribute(
    'href',
    '/themes/artifacts',
  );
  await eye.click();
  await page.getByRole('menuitem', { name: 'Hide Roles' }).click();
  await expect(row.getByRole('link', { name: 'Card draw' })).toHaveCount(0);
  await page.reload();
  await expect(
    page.locator('.card-text-row dl').getByText('Wishlist'),
  ).toBeVisible();
  await expect(
    page.locator('.card-text-row dl').getByText('Card draw'),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
