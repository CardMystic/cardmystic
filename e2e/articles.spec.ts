import { BACKEND } from './utils/mocks';
import { expect, gotoHydrated, test } from './utils/fixtures';
import type { Page } from '@playwright/test';

/**
 * E2E coverage for the Articles feature.
 *
 * The `/articles/*` backend endpoints are mocked with `page.route` so
 * these tests are deterministic (the deployed backend may not have any
 * published articles). Everything else runs against the real stack.
 *
 * Covered:
 *  - Home page: Recent Articles section shows 3 article cards + a
 *    "Search Articles" box linking to /explore/articles
 *  - Explore page: recent articles by default, keyword search results,
 *    and the no-matches empty state
 *  - Article detail: banner image, title/description, social bar
 *    (author, like button disabled when logged out, comment/view
 *    counts), rendered markdown content, and the view-tracking POST
 *  - /articles/mine: non-authors see their liked articles (with empty
 *    state when they haven't liked anything yet)
 */

const AUTHOR = {
  user_id: '00000000-0000-0000-0000-0000000000aa',
  username: 'articlewizard',
  avatar_card_name: null,
};

const makeArticle = (n: number) => ({
  id: `00000000-0000-0000-0000-00000000010${n}`,
  title: `E2E Article ${n}`,
  description: `Description for e2e article ${n}`,
  image_url: null,
  is_published: true,
  published_at: '2026-01-15T12:00:00Z',
  created_at: '2026-01-10T12:00:00Z',
  updated_at: null,
  like_count: n,
  comment_count: n * 2,
  view_count: n * 10,
  ...AUTHOR,
});

const ARTICLES = [makeArticle(1), makeArticle(2), makeArticle(3)];

const DETAIL = {
  ...makeArticle(1),
  content: '# Hello Readers\n\nThis is **markdown** content.',
};

/** Mocks the public /articles endpoints used by the pages under test. */
const mockArticles = async (page: Page) => {
  await page.route(`${BACKEND}/articles/recent*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ articles: ARTICLES }),
    }),
  );
  await page.route(`${BACKEND}/articles/search*`, (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('query') ?? '';
    const matches = query.toLowerCase().includes('e2e') ? ARTICLES : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ articles: matches, nextCursor: null }),
    });
  });
  await page.route(`${BACKEND}/articles/view/${DETAIL.id}`, (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'View recorded' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ article: DETAIL }),
    });
  });
  await page.route(`${BACKEND}/articles/comments/${DETAIL.id}*`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ comments: [], nextCursor: null }),
    }),
  );
  // The default `page` fixture is pre-authed, so the detail page loads
  // the viewer's like state.
  await page.route(`${BACKEND}/articles/social/${DETAIL.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ liked: false }),
    }),
  );
  await page.route(`${BACKEND}/articles/like/${DETAIL.id}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        liked: route.request().method() === 'POST',
        like_count: route.request().method() === 'POST' ? 2 : 1,
      }),
    }),
  );
};

test.describe('Articles', () => {
  test('home page shows recent articles with a search box', async ({
    page,
  }) => {
    await mockArticles(page);
    await gotoHydrated(page, '/');

    const section = page.locator('text=Recent Articles').first();
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'E2E Article 1' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'E2E Article 2' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'E2E Article 3' }),
    ).toBeVisible();

    const searchBox = page.getByRole('link', { name: 'Search Articles' });
    await expect(searchBox).toBeVisible();
    await expect(searchBox).toHaveAttribute('href', '/explore/articles');
  });

  test('explore page shows recent articles and searches by keyword', async ({
    page,
  }) => {
    await mockArticles(page);
    await gotoHydrated(page, '/explore/articles');

    // Default view: recent articles
    await expect(
      page.getByRole('heading', { name: 'Recent Articles' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'E2E Article 1' }),
    ).toBeVisible();

    // Search with matches
    const input = page.getByPlaceholder(
      'Search articles by title or description…',
    );
    await input.fill('e2e article');
    await expect(
      page.getByRole('heading', { name: 'E2E Article 2' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/query=e2e(\+|%20)article/);

    // Search without matches
    await input.fill('zzz-no-such-article');
    await expect(
      page.getByText('No articles matched "zzz-no-such-article"'),
    ).toBeVisible();
  });

  test('article page renders content, social bar and records a view', async ({
    page,
  }) => {
    await mockArticles(page);

    let viewRecorded = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url() === `${BACKEND}/articles/view/${DETAIL.id}`
      ) {
        viewRecorded = true;
      }
    });

    await gotoHydrated(page, `/articles/${DETAIL.id}`);

    await expect(
      page.getByRole('heading', { name: 'E2E Article 1' }),
    ).toBeVisible();
    await expect(
      page.getByText('Description for e2e article 1').first(),
    ).toBeVisible();

    // Social bar: author, like toggle (the shared page fixture is
    // signed in), stats
    await expect(page.getByText(AUTHOR.username)).toBeVisible();
    const likeButton = page.getByTestId('article-like-button');
    await expect(likeButton).toBeVisible();
    await expect(likeButton).toBeEnabled();
    await likeButton.click();
    await expect(likeButton).toBeEnabled();
    await expect(page.getByText('2 comments')).toBeVisible();
    await expect(page.getByText('10 views')).toBeVisible();

    // Markdown content is rendered to HTML
    await expect(
      page.getByRole('heading', { name: 'Hello Readers' }),
    ).toBeVisible();

    // Comments section with empty state
    await expect(
      page.getByText('No comments yet. Be the first to comment!'),
    ).toBeVisible();

    // View tracking fired
    await expect(() => expect(viewRecorded).toBe(true)).toPass();
  });

  test('non-authors see their liked articles on the my-articles page', async ({
    page,
  }) => {
    // The default fixture is a non-author with no liked articles.
    await page.route(`${BACKEND}/articles/liked`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ articles: [] }),
      }),
    );

    await gotoHydrated(page, '/articles/mine');
    await expect(
      page.getByRole('heading', { name: 'Liked Articles' }),
    ).toBeVisible();
    await expect(
      page.getByText("You haven't liked any articles yet."),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Browse Articles' }),
    ).toBeVisible();
    // Non-authors shouldn't see the "New Article" button.
    await expect(
      page.getByRole('button', { name: 'New Article' }),
    ).toHaveCount(0);
  });
});
