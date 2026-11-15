import { expect, test } from '@playwright/test';
import { setupDeckDisplay, displayDeckId } from './utils/deckDisplay';
import { BACKEND, gotoHydrated } from './utils/mocks';

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

for (const kind of ['deck', 'primer'] as const) {
  test(`${kind} recommendations link to the right pages`, async ({ page }) => {
    const { deck } = await setupDeckDisplay(page, { owner: false });
    await page.route(`${BACKEND}/supabase/card-lists/summaries?*`, (route) =>
      route.fulfill({ json: { decklists: [deck] } }),
    );
    const recommendations = [1, 2, 3].map((n) => ({
      ...deck,
      id: `related-deck-${n}`,
      name: `Related deck ${n}`,
    }));
    const requests: string[] = [];
    let release!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(
      `${BACKEND}/supabase/card-lists/related/**`,
      async (route) => {
        requests.push(route.request().url());
        await responseReady;
        return route.fulfill({
          json: {
            decklists: recommendations,
            primerPreviews: Object.fromEntries(
              recommendations.map((row) => [row.id, 'A guide to this deck.']),
            ),
          },
        });
      },
    );
    await page.route(
      `${BACKEND}/supabase/card-lists/primer/${displayDeckId}`,
      (route) =>
        route.fulfill({
          json: {
            text: '# Building this deck\n\nA guide to playing this deck.',
          },
        }),
    );
    const section = page.getByRole('region', { name: 'You May Also Like' });
    try {
      await page.reload();
      // Navigate client-side so the fixture-only primer summary is mocked.
      if (kind === 'primer')
        await page.getByRole('link', { name: 'Primer', exact: true }).click();
      // Recommendations start loading without a scroll interaction.
      await expect.poll(() => requests.length).toBeGreaterThan(0);
      await page.getByTestId('related-content').scrollIntoViewIfNeeded();
      await expect(
        section.getByRole('status', { name: 'Loading recommendations' }),
      ).toBeVisible();
      await expect(
        section.getByRole('status').locator(':scope > div'),
      ).toHaveCount(3);
      await expect(section).toHaveAttribute('aria-busy', 'true');
    } finally {
      release();
    }
    await expect(section.getByRole('status')).toHaveCount(0);
    await expect(section).toHaveAttribute('aria-busy', 'false');
    await expect(section.getByRole('heading', { level: 3 })).toHaveCount(3);
    for (const row of recommendations) {
      const link = section.getByRole('link', { name: row.name, exact: true });
      await expect(link).toHaveText(row.name);
      expect((await link.getAttribute('rel')) ?? '').not.toContain('nofollow');
      await expect(
        section.getByRole('link', { name: row.name, exact: true }),
      ).toHaveAttribute(
        'href',
        `/lists/${row.id}${kind === 'primer' ? '/primer' : ''}`,
      );
    }
    expect(
      requests.some((url) =>
        url.endsWith(`type=${kind === 'primer' ? 'primers' : 'decks'}`),
      ),
    ).toBe(true);
    if (kind === 'primer')
      await expect(section.getByText('A guide to this deck.')).toHaveCount(3);
  });
}

const article = (n: number) => ({
  id: `51000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  title: `Graveyard guide ${n}`,
  description: 'Reanimation and recursion.',
  content: '# Graveyard strategy\n\nUse recursion to recover your creatures.',
  image_url: null,
  is_published: true,
  published_at: '2026-01-01',
  created_at: '2026-01-01',
  updated_at: null,
  user_id: 'author',
  username: 'Writer',
  avatar_card_name: null,
  like_count: 0,
  comment_count: 0,
  view_count: 0,
});

test('article recommendations render on mobile and do not block reading on an empty or failed response', async ({
  page,
}) => {
  await setupDeckDisplay(page, { owner: false });
  await page.setViewportSize({ width: 390, height: 844 });
  const source = article(1);
  await page.route(`${BACKEND}/articles/view/${source.id}`, (route) =>
    route.fulfill({ json: { article: source } }),
  );
  await page.route(`${BACKEND}/articles/comments/${source.id}*`, (route) =>
    route.fulfill({ json: { comments: [], nextCursor: null } }),
  );
  await page.route(`${BACKEND}/articles/social/${source.id}`, (route) =>
    route.fulfill({ json: { liked: false } }),
  );
  let mode: 'success' | 'empty' | 'error' = 'success';
  let responses = 0;
  let release!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    `${BACKEND}/articles/related/${source.id}`,
    async (route) => {
      responses++;
      await responseReady;
      return route.fulfill({
        status: mode === 'error' ? 500 : 200,
        json: {
          articles:
            mode === 'success' ? [article(2), article(3), article(4)] : [],
        },
      });
    },
  );
  const section = page.getByRole('region', { name: 'You May Also Like' });
  try {
    await gotoHydrated(page, `/articles/${source.id}`);
    await expect.poll(() => responses).toBeGreaterThan(0);
    await page.getByTestId('related-content').scrollIntoViewIfNeeded();
    await expect(
      section.getByRole('status', { name: 'Loading recommendations' }),
    ).toBeVisible();
    await expect(
      section.getByRole('status').locator(':scope > div'),
    ).toHaveCount(3);
  } finally {
    release();
  }
  await expect(section.getByRole('status')).toHaveCount(0);
  await expect(section.getByRole('link')).toHaveCount(3);
  await expect(section.getByRole('link').first()).toHaveAttribute(
    'href',
    `/articles/${article(2).id}`,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  for (const next of ['empty', 'error'] as const) {
    mode = next;
    const before = responses;
    await page.reload();
    await page.getByTestId('related-content').scrollIntoViewIfNeeded();
    await expect.poll(() => responses).toBeGreaterThan(before);
    await expect(section).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: source.title }),
    ).toBeVisible();
  }
});
