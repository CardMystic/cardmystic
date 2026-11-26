import { expect, test, type Page } from '@playwright/test';
import { BACKEND, FAKE_USER, SUPABASE, gotoHydrated } from './utils/mocks';
import { createDisplayCards, setupDeckDisplay } from './utils/deckDisplay';

const cards = createDisplayCards(4);
const endpoints = {
  Recommender: '/als/recommend',
  Popular: '/deck-stats/popular-by-commander',
  Similar: '/search/similarity',
  Commanders: '/deck-stats/popular-commanders-for-card',
};
const tabLabels: Record<string, string> = {
  Recommender: 'Deck Recommendations',
  Popular: 'Popular Cards As Commander',
  Similar: 'Similar To This Card',
  'Similar Cards': 'Similar To This Card',
  Commanders: 'Popular Commanders As 99',
};
type Request = {
  cards?: string[];
  card_name?: string;
  commanders?: string[];
  limit?: number;
  query?: string;
  useRerank?: boolean;
  filters?: { isArena?: boolean };
};
async function setup(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      'cm.cookie-consent.v1',
      JSON.stringify({
        analytics: false,
        advertising: false,
        updatedAt: Date.now(),
      }),
    ),
  );
  const state = await setupDeckDisplay(page, { cardCount: 4 });
  await page.route(BACKEND + '/supabase/card-lists?**', (route) =>
    route.fulfill({
      json: {
        decklists: [],
        totalCount: 0,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    }),
  );
  await page.route(`${BACKEND}/bulkdata/commanders.min.json`, (route) =>
    route.fulfill({ json: [cards[0].name] }),
  );
  await page.route(`${BACKEND}/bulkdata/partner-commanders`, (route) =>
    route.fulfill({
      json: {
        partner: [],
        partnerWith: {},
        friendsForever: [],
        chooseABackground: [],
        background: [],
        doctorsCompanion: [],
        timeLordDoctor: [],
      },
    }),
  );
  await page.route(`${BACKEND}/cards/with-llm/**`, (route) =>
    route.fulfill({
      json: {
        card: cards.find((c) => route.request().url().endsWith(c.oracle_id)),
        llm: {
          card_name: cards[0].name,
          llm: {
            power_level: 3,
            strategy_rankings: { aggro: 5, control: 5, combo: 5, midrange: 5 },
            roles: ['Combo Piece', 'beater'],
            themes: ['Big Mana'],
            community_sentiment: ['powerful'],
            long_summary: 'A card for this strategy.',
          },
        },
      },
    }),
  );
  const requests: Record<string, Request[]> = {};
  for (const endpoint of Object.values(endpoints)) {
    requests[endpoint] = [];
    await page.route(BACKEND + endpoint, (route) => {
      const body = route.request().postDataJSON() as Request;
      requests[endpoint].push(body);
      const result = {
        card_name: cards[3].name,
        card_data: cards[3],
        count: 10,
        popularity: 0.3,
      };
      const results = body.filters?.isArena
        ? []
        : [
            endpoint === endpoints.Commanders
              ? {
                  ...result,
                  card_data: [cards[0]],
                  commanders: [cards[0].name],
                }
              : result,
          ];
      return route.fulfill({
        json: endpoint === endpoints.Similar ? results : { results },
      });
    });
  }
  // A fresh app instance avoids carrying the deck fixture's cached commander list.
  await gotoHydrated(page, '/about');
  return { requests, state };
}
async function navigate(page: Page, card = cards[0]) {
  await page.evaluate((path) => {
    const root = document.getElementById('__nuxt') as unknown as {
      __vue_app__: {
        config: {
          globalProperties: {
            $router: { push: (path: string) => Promise<unknown> };
          };
        };
      };
    };
    return root.__vue_app__.config.globalProperties.$router.push(path);
  }, `/card/${card.oracle_id}`);
}
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('card discussion opens above Suggest Decks and supports posting, paging and deleting', async ({ page }) => {
  await setup(page);
  const rows = Array.from({ length: 26 }, (_, i) => ({
    id: 26 - i, user_id: cards[1].oracle_id, profiles: { username: 'Another player' },
    body: `Comment ${26 - i}`, created_at: '2026-11-15T18:00:00Z',
  }));
  let reads = 0;
  await page.route(SUPABASE + '/rest/v1/card_comments**', (route) => {
    const request = route.request();
    const params = new URL(request.url()).searchParams;
    if (request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({ oracle_id: cards[0].oracle_id, body: 'Worth trying in Commander.' });
      rows.unshift({ ...rows[0], id: 27, user_id: FAKE_USER.id, body: request.postDataJSON().body });
      return route.fulfill({ status: 201, body: '' });
    }
    expect(params.get('oracle_id')).toBe('eq.' + cards[0].oracle_id);
    if (request.method() === 'DELETE') {
      expect(params.get('user_id')).toBe('eq.' + FAKE_USER.id);
      expect(params.get('id')).toBe('eq.27');
      rows.shift();
      return route.fulfill({ status: 204 });
    }
    reads++;
    const cursor = Number(params.get('id')?.replace('lt.', '') || Infinity);
    return route.fulfill({ json: rows.filter((row) => row.id < cursor).slice(0, 26) });
  });
  await navigate(page);
  const button = page.getByRole('button', { name: 'Discuss Card', exact: true });
  const suggest = page.getByRole('button', { name: /Suggest Decks/ }).first();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual((await suggest.boundingBox())!.y + 1);
  }
  expect(reads).toBe(0);
  await button.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: `Discussing ${cards[0].name}`, exact: true });
  await expect(dialog.getByText('Comment 26', { exact: true })).toBeVisible();
  const thread = dialog.getByRole('region', { name: 'Comment thread' });
  const bounds = (await thread.boundingBox())!;
  const threadHeight = await thread.evaluate((el) => el.clientHeight);
  const editor = dialog.getByRole('textbox', { name: 'Comment' });
  expect((await editor.boundingBox())!.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
  expect(await thread.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await dialog.getByRole('button', { name: 'Load more comments' }).click();
  await expect(dialog.getByText('Comment 1', { exact: true })).toBeVisible();
  expect(await thread.evaluate((el) => el.clientHeight)).toBe(threadHeight);
  await editor.fill('Worth trying in Commander.');
  await dialog.getByRole('button', { name: 'Post Comment' }).click();
  await expect(dialog.getByText('Worth trying in Commander.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete comment' }).click();
  await expect(dialog.getByText('Worth trying in Commander.')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(button).toBeFocused();
});

test('visitors can read card discussions and sign in to post', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: {} }));
  await page.route(BACKEND + '/cards/with-llm/*', (route) => route.fulfill({ json: { card: cards[0], llm: null } }));
  let finishLoading!: () => void;
  const pending = new Promise<void>((resolve) => { finishLoading = resolve; });
  await page.route(SUPABASE + '/rest/v1/card_comments**', async (route) => {
    await pending;
    await route.fulfill({ json: [] });
  });
  await gotoHydrated(page, '/about');
  await navigate(page);
  await page.getByRole('button', { name: 'Discuss Card' }).click();
  const dialog = page.getByRole('dialog', { name: `Discussing ${cards[0].name}` });
  const thread = dialog.getByRole('region', { name: 'Comment thread' });
  let loadingHeight: number;
  try {
    await expect(thread).toBeVisible();
    loadingHeight = await thread.evaluate((el) => el.clientHeight);
    expect(loadingHeight).toBeGreaterThan(150);
  } finally {
    finishLoading();
  }
  await expect(dialog.getByText('No comments yet.', { exact: false })).toBeVisible();
  expect(await thread.evaluate((el) => el.clientHeight)).toBe(loadingHeight);
  await expect(dialog.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Post Comment' })).toHaveCount(0);
});

test('Your Tags appears below the card summary and expands only tags assigned to this card', async ({
  page,
}) => {
  await setup(page);
  const tags = Array.from({ length: 8 }, (_, index) => ({
    id: String(index),
    name: `Personal tag ${index + 1}`,
  }));
  await page.route(BACKEND + '/library/tags', (route) =>
    route.fulfill({ json: { tags } }),
  );
  let releaseTags!: () => void;
  const tagsGate = new Promise<void>((resolve) => {
    releaseTags = resolve;
  });
  await page.route(BACKEND + '/library/tags/assignments', async (route) => {
    await tagsGate;
    return route.fulfill({
      json: {
        assignments: route
          .request()
          .postDataJSON()
          .oracleIds.includes(cards[0].oracle_id)
          ? tags
              .slice(0, 7)
              .map((tag) => ({ oracle_id: cards[0].oracle_id, tag_id: tag.id }))
          : [],
      },
    });
  });
  try {
    await navigate(page);
    await expect(
      page.getByRole('status', { name: 'Loading your tags' }),
    ).toBeVisible();
  } finally {
    releaseTags();
  }
  const section = page.getByRole('region', { name: 'Your Tags' });
  await expect(section.getByText('Your Tags:', { exact: true })).toBeVisible();
  await expect(section.getByText(/^Personal tag /)).toHaveCount(5);
  await expect(
    section.getByText('Personal tag 1', { exact: true }),
  ).toHaveClass(/text-info/);
  const summary = await page.locator('.summary-card').boundingBox();
  expect((await section.boundingBox())!.y).toBeGreaterThanOrEqual(
    summary!.y + summary!.height - 1,
  );
  await section.getByRole('button', { name: 'Show more' }).click();
  await expect(section.getByText(/^Personal tag /)).toHaveCount(7);
  await section.getByRole('button', { name: 'Show less' }).click();
  await expect(section.getByText(/^Personal tag /)).toHaveCount(5);
  await navigate(page, cards[1]);
  await expect(section.getByText(/^Personal tag /)).toHaveCount(0);
  await section.getByRole('button', { name: 'Edit tags' }).click();
  const editor = page.getByRole('dialog', { name: 'Edit tags', exact: true });
  await expect(
    editor.getByRole('button', { name: 'Select tags' }),
  ).toBeVisible();
});

test('all card-detail searches apply independent filters on submit and retain controls for empty results', async ({
  page,
}) => {
  const { requests } = await setup(page);
  await navigate(page);
  const summary = page.locator('.summary-card');
  await expect(
    summary.getByRole('link', { name: 'Combo Piece', exact: true }),
  ).toHaveAttribute('href', '/roles/combo-piece');
  await expect(
    summary.getByRole('link', { name: 'Big Mana', exact: true }),
  ).toHaveAttribute('href', '/themes/big-mana');
  await expect(
    summary.getByRole('link', { name: 'beater', exact: true }),
  ).toHaveCount(0);
  await expect(
    summary.getByRole('link', { name: 'powerful', exact: true }),
  ).toHaveCount(0);
  const section = page.locator('.card-results');
  const popularChip = section.getByRole('button', {
    name: tabLabels.Popular,
    exact: true,
  });
  await expect(popularChip.locator('.tab-label')).toHaveCSS('opacity', '0');
  await popularChip.hover();
  await expect(popularChip.locator('.tab-label')).toHaveCSS('opacity', '1');
  await page.mouse.move(0, 0);
  await expect(popularChip.locator('.tab-label')).toHaveCSS('opacity', '0');
  await popularChip.focus();
  await expect(popularChip.locator('.tab-label')).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(popularChip).toHaveAttribute('aria-pressed', 'true');

  for (const [tab, endpoint] of Object.entries(endpoints)) {
    await section
      .getByRole('button', { name: tabLabels[tab], exact: true })
      .click();
    await expect(section.locator('.active .tab-label')).toHaveCSS(
      'opacity',
      '1',
    );
    await expect.poll(() => requests[endpoint].length).toBeGreaterThan(0);
    expect(requests[endpoint].at(-1)?.filters?.isArena).not.toBe(true);
    const form = section.locator('form');
    const selectedCard =
      tab === 'Recommender'
        ? form.getByRole('combobox', {
            name: 'Select a commander (optional)',
            exact: true,
          })
        : form.getByRole('textbox', { name: 'Selected card' });
    await expect(selectedCard).toHaveValue(cards[0].name);
    if (tab === 'Recommender') {
      await expect(selectedCard).toBeEditable();
      await expect(
        form.getByRole('button', { name: 'Select a Decklist', exact: true }),
      ).toBeVisible();
      await expect(form.getByPlaceholder(/Paste your decklist/)).toHaveValue(
        '',
      );
      expect(requests[endpoint].at(-1)?.limit).toBe(200);
    } else {
      await expect(selectedCard).toHaveAttribute('readonly', '');
    }
    const query = form.getByRole('textbox', { name: 'Search query' });
    const action = tab === 'Recommender' ? 'Recommend' : 'Search';
    await expect(
      form.getByRole('button', { name: action, exact: true }),
    ).toBeEnabled();
    if (tab !== 'Similar') {
      const selectedBounds = await selectedCard.boundingBox();
      const queryBounds = await query.boundingBox();
      if (tab === 'Recommender') {
        expect(selectedBounds!.y).toBeGreaterThanOrEqual(
          queryBounds!.y + queryBounds!.height,
        );
      } else {
        expect(queryBounds!.y).toBeGreaterThanOrEqual(
          selectedBounds!.y + selectedBounds!.height,
        );
      }
      await query.fill('  ramp  ');
    }
    const before = requests[endpoint].length;
    await form.getByRole('button', { name: 'Filters', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Search filters' });
    await drawer
      .getByRole('button', { name: 'Arena', exact: true })
      .first()
      .click();
    await drawer.getByRole('button', { name: 'Done', exact: true }).click();
    await expect(drawer).toHaveCount(0);
    expect(requests[endpoint]).toHaveLength(before);
    await form.getByRole('button', { name: action, exact: true }).click();
    await expect
      .poll(() => requests[endpoint].at(-1)?.filters?.isArena)
      .toBe(true);
    const sent = requests[endpoint].at(-1)!;
    expect(
      tab === 'Recommender' || tab === 'Popular'
        ? sent.commanders
        : sent.card_name,
    ).toEqual(
      tab === 'Recommender' || tab === 'Popular'
        ? [cards[0].name]
        : cards[0].name,
    );
    if (tab !== 'Similar') expect(sent.query).toBe('ramp');
    await expect(
      form.getByRole('button', { name: action, exact: true }),
    ).toBeEnabled();
    await expect(
      form.getByRole('button', { name: 'Filters (1 selected)' }),
    ).toBeVisible();
    await expect(section.locator('.card-root')).toHaveCount(0);
    const bounds = await form.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(1024);
    expect(
      Math.abs(bounds!.x + bounds!.width / 2 - page.viewportSize()!.width / 2),
    ).toBeLessThan(3);
  }
  await section
    .getByRole('button', { name: tabLabels.Recommender, exact: true })
    .click();
  await expect(
    section.getByRole('textbox', { name: 'Search query' }),
  ).toHaveValue('  ramp  ');
  await expect(
    section.getByRole('button', { name: 'Filters (1 selected)' }),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Filters (1 selected)' }).click();
  const drawer = page.getByRole('dialog', { name: 'Search filters' });
  await drawer
    .getByRole('button', { name: 'Arena', exact: true })
    .first()
    .click();
  await drawer.getByRole('button', { name: 'Recommend', exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(
    section.getByRole('button', { name: 'Top Results', exact: true }),
  ).toBeVisible();
  await expect(section.locator('.card-root')).toHaveCount(2);
  await expect(
    section.getByRole('button', { name: 'Filters', exact: true }),
  ).toBeVisible();
  await section.getByRole('button', { name: 'Clear input' }).click();
  await expect(
    section.getByRole('textbox', { name: 'Search query' }),
  ).toHaveValue('');
  await section.locator('form').scrollIntoViewIfNeeded();
  await page.screenshot({
    path: '.cache/card-detail-search-desktop.png',
    animations: 'disabled',
  });
});

test('card recommendations use the newest matching owned deck without delaying details, and support manual entry', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      /hydrat|TypeError|ReferenceError/i.test(message.text()) &&
      ['warning', 'error'].includes(message.type())
    )
      errors.push(message.text());
  });
  const { state } = await setup(page);
  const deck = {
    ...state.deck,
    name: 'Recent Tamiyo deck',
    commanders: [cards[0].name],
    format: 'Commander',
    updated_at: '2026-11-21T18:00:00Z',
  };
  state.items[0].is_commander = true;
  // A newer unrelated deck must be skipped, and the older matching deck must
  // not replace the first match from the server's newest-first page.
  const decklists = [
    {
      ...deck,
      id: '41000000-0000-4000-8000-000000000002',
      name: 'Other commander',
      commanders: [cards[1].name],
      updated_at: '2026-11-22T18:00:00Z',
    },
    deck,
    {
      ...deck,
      id: '41000000-0000-4000-8000-000000000003',
      name: 'Older Tamiyo deck',
      updated_at: '2026-11-20T18:00:00Z',
    },
  ];
  const listQueries: URLSearchParams[] = [];
  await page.route(BACKEND + '/supabase/card-lists?**', (route) => {
    listQueries.push(new URL(route.request().url()).searchParams);
    return route.fulfill({
      json: {
        decklists,
        totalCount: decklists.length,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    });
  });
  await page.route(BACKEND + '/supabase/card-lists/mine/' + deck.id, (route) =>
    route.fulfill({ json: { decklist: deck } }),
  );
  const searches: Request[] = [];
  let releaseSearch!: () => void;
  const searchGate = new Promise<void>((resolve) => {
    releaseSearch = resolve;
  });
  await page.route(BACKEND + endpoints.Recommender, async (route) => {
    searches.push(route.request().postDataJSON());
    await searchGate;
    return route.fulfill({ json: { results: [], not_found: [] } });
  });
  const section = page.locator('.card-results');
  const form = section.locator('form');
  try {
    await navigate(page);
    await expect.poll(() => searches.length).toBe(1);
    await expect(page.locator('.card-detail-art .card-image')).toBeVisible();
    await expect(
      page.locator('.card-detail-info .card-details-card'),
    ).toBeVisible();
    await expect(page.locator('.summary-card')).toContainText(
      'A card for this strategy.',
    );
    await expect(
      form.getByRole('combobox', { name: 'Select a decklist', exact: true }),
    ).toHaveValue(deck.name);
    expect(listQueries.at(-1)?.get('kind')).toBe('deck');
    expect(listQueries.at(-1)?.get('sort')).toBe('updated_at');
    expect(listQueries.at(-1)?.get('direction')).toBe('desc');
    expect(searches[0]).toMatchObject({
      commanders: [cards[0].name],
      cards: cards.map((card) => card.name),
      limit: 200,
    });
    await expect(
      section.getByRole('link', { name: 'Go to deck', exact: true }),
    ).toHaveAttribute('href', '/lists/' + deck.id);
  } finally {
    releaseSearch();
  }
  await expect(
    section.getByText('No matching recommendations', { exact: true }),
  ).toBeVisible();
  const cardUrl = page.url();
  await form.getByRole('button', { name: 'Manual Entry', exact: true }).focus();
  await page.keyboard.press('Enter');
  expect(errors).toEqual([]);
  await expect(
    form.getByRole('combobox', {
      name: 'Select a commander (optional)',
      exact: true,
    }),
  ).toHaveValue(cards[0].name);
  await expect(form.getByPlaceholder(/Paste your decklist/)).toHaveValue('');
  await form.getByRole('textbox', { name: 'Search query' }).fill('draw cards');
  await form.getByRole('button', { name: 'Recommend', exact: true }).click();
  await expect.poll(() => searches.length).toBe(2);
  expect(searches[1]).toMatchObject({
    cards: [],
    commanders: [cards[0].name],
    query: 'draw cards',
    limit: 200,
  });
  expect(page.url()).toBe(cardUrl);
  await expect(
    form.getByRole('button', { name: 'Select a Decklist', exact: true }),
  ).toBeVisible();
  await form
    .getByRole('combobox', { name: 'Search mode', exact: true })
    .click();
  await page.getByRole('option', { name: 'Normal', exact: true }).click();
  await expect.poll(() => searches.length).toBe(3);
  expect(searches[2]).toMatchObject({
    cards: [],
    commanders: [cards[0].name],
    query: 'draw cards',
    limit: 200,
    useRerank: false,
  });
  expect(new URL(page.url()).pathname).toBe(new URL(cardUrl).pathname);
  expect(errors).toEqual([]);
});

test('late matching deck lookup preserves a manual card recommendation search', async ({
  page,
}) => {
  const { requests, state } = await setup(page);
  const deck = {
    ...state.deck,
    commanders: [cards[0].name],
    updated_at: '2026-11-21T18:00:00Z',
  };
  let releaseDecks!: () => void;
  const decksGate = new Promise<void>((resolve) => {
    releaseDecks = resolve;
  });
  let listReads = 0;
  await page.route(BACKEND + '/supabase/card-lists?**', async (route) => {
    listReads++;
    await decksGate;
    return route.fulfill({
      json: {
        decklists: [deck],
        totalCount: 1,
        totalPages: 1,
        page: 1,
        pageSize: 50,
      },
    });
  });
  const form = page.locator('.card-results form');
  const textarea = form.getByPlaceholder(/Paste your decklist/);
  const query = form.getByRole('textbox', { name: 'Search query' });
  const searches = requests[endpoints.Recommender];
  try {
    await navigate(page);
    await expect.poll(() => listReads).toBe(1);
    await textarea.fill(cards[2].name);
    await query.fill('manual draft');
    await form.getByRole('button', { name: 'Recommend', exact: true }).click();
    await expect.poll(() => searches.length).toBe(1);
    expect(searches[0]).toMatchObject({
      cards: [cards[2].name],
      commanders: [cards[0].name],
      query: 'manual draft',
      limit: 200,
    });
    const listResponse = page.waitForResponse((response) =>
      response.url().startsWith(BACKEND + '/supabase/card-lists?'),
    );
    releaseDecks();
    await (await listResponse).finished();
    // Observe the first paint after the completed query and its Vue watchers.
    await page.evaluate(
      () => new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    await expect(textarea).toHaveValue(cards[2].name);
    await expect(query).toHaveValue('manual draft');
    await expect(
      form.getByRole('button', { name: 'Select a Decklist', exact: true }),
    ).toBeVisible();
    await expect(
      form.getByRole('combobox', { name: 'Select a decklist', exact: true }),
    ).toHaveCount(0);
    expect(searches).toHaveLength(1);
  } finally {
    releaseDecks();
  }
});

test('mobile non-commander searches share the input and filter layout and apply similarity mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { requests } = await setup(page);
  await navigate(page, cards[3]);
  const section = page.locator('.card-results');
  for (const tab of ['Commanders', 'Similar Cards']) {
    await section
      .getByRole('button', { name: tabLabels[tab], exact: true })
      .click();
    await expect(section.locator('.active .tab-label')).toHaveCSS(
      'opacity',
      '1',
    );
    const form = section.locator('form');
    const mode = form.getByRole('combobox', {
      name: 'Search mode',
      exact: true,
    });
    await expect(
      form.getByRole('textbox', { name: 'Selected card' }),
    ).toHaveValue(cards[3].name);
    const input = await form
      .getByRole('textbox', {
        name: tab === 'Similar Cards' ? 'Selected card' : 'Search query',
      })
      .boundingBox();
    const filter = await form
      .getByRole('button', { name: 'Filters', exact: true })
      .boundingBox();
    const modeBounds = await mode.boundingBox();
    expect(input!.height).toBe(40);
    expect(filter!.y).toBeGreaterThanOrEqual(input!.y + input!.height);
    expect(modeBounds!.y).toBeGreaterThanOrEqual(input!.y + input!.height);
    expect(filter!.x).toBeLessThan(modeBounds!.x);
    expect(Math.abs(filter!.y - modeBounds!.y)).toBeLessThanOrEqual(14);
    await form.getByRole('button', { name: 'Filters', exact: true }).click();
    const drawer = page.getByRole('dialog', { name: 'Search filters' });
    await drawer
      .getByRole('button', { name: 'Arena', exact: true })
      .first()
      .click();
    await drawer.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(drawer).toHaveCount(0);
    const endpoint =
      tab === 'Similar Cards' ? endpoints.Similar : endpoints.Commanders;
    await expect
      .poll(() => requests[endpoint].at(-1)?.filters?.isArena)
      .toBe(true);
    await expect(
      form.getByRole('button', { name: 'Filters (1 selected)' }),
    ).toBeVisible();
  }
  await section.getByRole('combobox', { name: 'Search mode' }).click();
  await page.getByRole('option', { name: 'Normal', exact: true }).click();
  await expect
    .poll(() => requests[endpoints.Similar].at(-1)?.useRerank)
    .toBe(false);
  expect(requests[endpoints.Similar].at(-1)?.filters?.isArena).toBe(true);
  expect(page.url()).toContain(`/card/${cards[3].oracle_id}`);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: '.cache/card-detail-search-mobile.png',
    animations: 'disabled',
  });
});

// The shared artwork aspect ratio needs one browser check, on a narrow screen.
for (const width of [390]) {
  test(`card-detail image and controls keep their space while artwork loads at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page);
    const card = {
      ...cards[3],
      image_uris: {
        ...cards[3].image_uris,
        normal: `${cards[3].image_uris.normal}?delayed-detail`,
        large: `${cards[3].image_uris.large}?delayed-detail`,
      },
    };
    await page.route(`${BACKEND}/cards/with-llm/${card.oracle_id}`, (route) =>
      route.fulfill({ json: { card, llm: null } }),
    );
    let releaseImage!: () => void;
    const imageReady = new Promise<void>((resolve) => {
      releaseImage = resolve;
    });
    await page.route('**/*?delayed-detail', async (route) => {
      await imageReady;
      await route.fulfill({
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700"><rect width="500" height="700" fill="#204e68"/></svg>',
      });
    });
    try {
      await navigate(page, card);
      const image = page.locator('.card-detail-art .card-image');
      const printing = page.getByRole('button', {
        name: 'Choose Default Printing',
        exact: true,
      });
      await expect(printing).toBeVisible();
      const marketplace = page.getByRole('link', { name: /^(Buy|Search) on TCGPlayer$/ });
      await expect(marketplace.locator('..').getByRole('link').first()).toHaveAccessibleName(/^(Buy|Search) on TCGPlayer$/);
      await expect(image).toBeVisible();
      expect(
        await image.evaluate(
          (element) => (element as HTMLImageElement).complete,
        ),
      ).toBe(false);
      const before = await image.boundingBox();
      const buttonBefore = await printing.boundingBox();
      const detailsBefore = await page
        .locator('.card-detail-info')
        .boundingBox();
      expect(before!.height / before!.width).toBeCloseTo(1.4, 2);
      expect(buttonBefore!.width).toBeCloseTo(before!.width, 0);
      releaseImage();
      await expect
        .poll(() =>
          image.evaluate(
            (element) => (element as HTMLImageElement).naturalWidth,
          ),
        )
        .toBeGreaterThan(0);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
      });
      expect(await image.boundingBox()).toEqual(before);
      expect(await printing.boundingBox()).toEqual(buttonBefore);
      expect(await page.locator('.card-detail-info').boundingBox()).toEqual(
        detailsBefore,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    } finally {
      releaseImage();
    }
  });
}
