import type { APIRequestContext } from '@playwright/test';
import {
  BACKEND,
  reliableFill,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from './utils/mocks';
import { expect, gotoHydrated, test } from './utils/fixtures';

/**
 * E2E coverage for decklist social features & discovery surfaces.
 *
 * Real Supabase + real backend. Login is performed once in
 * `e2e/global-setup.ts` and reused via Playwright `storageState`.
 *
 * Tests run serially against a single shared public list (test numbers
 * are relative to the global test order, not this file):
 *
 *  ── Setup ──────────────────────────────────────────────────────────────
 *   38. Create a list via the New List modal and make it public via the
 *       modal's visibility selector (owner-only UI; can also be flipped
 *       later from the banner selector on the deck page)
 *
 *  ── Featured & discovery ───────────────────────────────────────────────
 *   39. Homepage Featured Decklists & Users section renders
 *   40. /explore/decklists shows Featured Decklists by default and finds
 *       the shared public deck when searched by name
 *   41. /explore/users shows Featured Users by default and user search
 *       round-trips through GET /user/search
 *
 *  ── Deck page social actions ───────────────────────────────────────────
 *   42. Visiting the public deck page records a view
 *       (POST /supabase/card-lists/view/:id) and renders the social bar
 *   43. Like toggle — like, unlike, like again; counts update
 *   44. Save toggle — save; count updates
 *   45. View-count regression — social actions must NOT record extra views
 *   46. Liked/Saved collapsible folders on My Decklists contain the deck
 *   47. Comments — post a comment, see it in the thread, delete it
 *
 *  ── Primer & profile surfaces ──────────────────────────────────────────
 *   48. Primer page renders the editor for the deck owner
 *   49. /user/account shows Account Stats and Following sections; the
 *       Follow button is hidden on your own public profile
 *
 *  ── Access control ─────────────────────────────────────────────────────
 *   50. Logged-out visitor sees the author link, disabled like/save,
 *       a sign-in comment prompt, and a disabled Follow button
 *   51. Private decks are not served by the public view/search endpoints
 *
 * The list ID is captured from the create-list response and reused
 * across the suite. afterAll deletes any surviving list via Supabase REST
 * (likes/saves/comments cascade with the list row).
 */

const API_TIMEOUT = 30_000;

const requireTestUser = () => {
  test.skip(
    !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
    'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping authed social test',
  );
};

const LIST_NAME = `e2e-social-${Date.now()}`;
const COMMENT_TEXT = `e2e comment ${Date.now()} — great deck!`;
let LIST_ID = '';

const SUPABASE_URL =
  process.env.NUXT_PUBLIC_SUPABASE_URL ??
  'https://ddbgietanhxrozzmogur.supabase.co';
const SUPABASE_KEY = process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '';

/**
 * Signs in via the Supabase REST password grant and returns headers +
 * user id for direct REST calls (visibility flip, cleanup, profile
 * lookups). Mirrors the cleanup pattern in lists.spec.ts.
 */
const supabaseAuth = async (request: APIRequestContext) => {
  const tokenResp = await request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
    },
  );
  if (!tokenResp.ok()) return null;
  const body = (await tokenResp.json()) as {
    access_token: string;
    user: { id: string };
  };
  return {
    userId: body.user.id,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${body.access_token}`,
      'Content-Type': 'application/json',
    },
  };
};

test.describe.configure({ mode: 'serial' });

test.describe('Decklist social & discovery', () => {
  test.beforeEach(async () => {
    requireTestUser();
  });

  test.afterAll(async ({ request }) => {
    if (!LIST_ID || !SUPABASE_KEY) return;
    try {
      const auth = await supabaseAuth(request);
      if (!auth) return;
      // Likes/saves/comments cascade when the list row is deleted.
      await request.delete(
        `${SUPABASE_URL}/rest/v1/card_list_items?list_id=eq.${LIST_ID}`,
        { headers: auth.headers },
      );
      await request.delete(
        `${SUPABASE_URL}/rest/v1/card_lists?id=eq.${LIST_ID}`,
        { headers: auth.headers },
      );
    } catch {
      // best effort — globalSetup will sweep on the next run.
    }
  });

  // ---------------------------------------------------------------------------
  // Test 38 — Create a list and make it public
  // ---------------------------------------------------------------------------
  test('creates a list and makes it public', async ({ page, request }) => {
    await gotoHydrated(page, '/lists');

    await page.getByRole('button', { name: /new list/i }).click();
    const dialog = page.getByRole('dialog', { name: /create new decklist/i });
    await expect(dialog).toBeVisible();

    await reliableFill(dialog.getByPlaceholder('Enter list name'), LIST_NAME);

    // Flip visibility to Public directly from the create modal — owners
    // can also change it later from the banner selector on the deck page.
    const visibilitySelect = dialog.getByTestId('create-visibility-select');
    await expect(visibilitySelect).toBeVisible();
    await visibilitySelect.click();
    await page.getByRole('option', { name: 'Public' }).click();

    const createCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/create` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await dialog.getByRole('button', { name: /^create$/i }).click();

    const resp = await createCall;
    const body = (await resp.json()) as { id: string; visibility?: string };
    // Capture LIST_ID first so afterAll can clean up even if assertions fail.
    if (body?.id) LIST_ID = body.id;
    expect(resp.ok()).toBeTruthy();
    expect(body.id).toBeTruthy();
    expect(body.visibility).toBe('public');

    // The public view endpoint should now serve the deck.
    const viewResp = await request.get(
      `${BACKEND}/supabase/card-lists/view/${LIST_ID}`,
    );
    expect(viewResp.ok()).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Test 39 — Homepage featured section
  // ---------------------------------------------------------------------------
  test('homepage renders the Featured Decklists & Users section', async ({
    page,
  }) => {
    await gotoHydrated(page, '/');

    const heading = page.getByRole('heading', {
      name: 'Awesome Decklists & Users',
    });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible({ timeout: API_TIMEOUT });

    // Once loading resolves, both rows show either featured content
    // (with a Search button) or their empty state (also with a Search
    // button) — so these are stable across empty/non-empty pools.
    await expect(page.getByText('Search Decklists').first()).toBeVisible({
      timeout: API_TIMEOUT,
    });
    await expect(page.getByText('Search Users').first()).toBeVisible({
      timeout: API_TIMEOUT,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 40 — Explore decklists: featured by default + search
  // ---------------------------------------------------------------------------
  test('explore decklists shows featured by default and finds the deck by search', async ({
    page,
  }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    await gotoHydrated(page, '/explore/decklists');

    // Featured section is the default view when nothing is searched.
    await expect(
      page.getByRole('heading', { name: 'Featured Decklists' }),
    ).toBeVisible({ timeout: API_TIMEOUT });

    // Search for the shared public deck by its unique name.
    const searchCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/supabase/card-lists/search`) &&
        resp.url().includes(encodeURIComponent(LIST_NAME)),
      { timeout: API_TIMEOUT },
    );
    await reliableFill(
      page.getByPlaceholder('Search decklists by name or description…'),
      LIST_NAME,
    );
    const searchResp = await searchCall;
    expect(searchResp.ok()).toBeTruthy();

    // The public deck appears in the results grid.
    await expect(page.getByText(LIST_NAME).first()).toBeVisible({
      timeout: API_TIMEOUT,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 41 — Explore users: featured by default + search
  // ---------------------------------------------------------------------------
  test('explore users shows featured by default and user search round-trips', async ({
    page,
    request,
  }) => {
    await gotoHydrated(page, '/explore/users');

    // Featured section is the default view when nothing is searched.
    await expect(
      page.getByRole('heading', { name: 'Featured Users' }),
    ).toBeVisible({ timeout: API_TIMEOUT });

    // Look up the test user's username so the search has a real target.
    const auth = await supabaseAuth(request);
    let username = '';
    if (auth) {
      const profileResp = await request.get(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${auth.userId}&select=username`,
        { headers: auth.headers },
      );
      if (profileResp.ok()) {
        const rows = (await profileResp.json()) as {
          username: string | null;
        }[];
        username = rows[0]?.username ?? '';
      }
    }
    const query = username || 'e2e';

    const searchCall = page.waitForResponse(
      (resp) => resp.url().startsWith(`${BACKEND}/user/search`),
      { timeout: API_TIMEOUT },
    );
    await reliableFill(
      page.getByPlaceholder('Search users by username…'),
      query,
    );
    const searchResp = await searchCall;
    expect(searchResp.ok()).toBeTruthy();

    if (username) {
      // The test user's own public profile shows up in the results.
      await expect(page.getByText(username).first()).toBeVisible({
        timeout: API_TIMEOUT,
      });
    } else {
      // No username set — just verify the search UI settles into either
      // a results grid or the explicit no-match state.
      await expect(
        page
          .getByText(`No users matched "${query}"`)
          .or(page.locator(`a[href^="/user/"]`).first()),
      ).toBeVisible({ timeout: API_TIMEOUT });
    }
  });

  // ---------------------------------------------------------------------------
  // Test 42 — Deck page records a view and renders the social bar
  // ---------------------------------------------------------------------------
  test('visiting the public deck page records a view and shows the social bar', async ({
    page,
  }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    // The view tracker fires exactly once per page visit.
    const viewCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/view/${LIST_ID}` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await gotoHydrated(page, `/lists/${LIST_ID}`);
    const viewResp = await viewCall;
    expect(viewResp.ok()).toBeTruthy();

    // Social bar renders with like/save toggles and read-only stats.
    await expect(page.getByTestId('decklist-like-button')).toBeVisible({
      timeout: API_TIMEOUT,
    });
    await expect(page.getByTestId('decklist-save-button')).toBeVisible();
    await expect(page.getByText(/\d+ comments?/).first()).toBeVisible();
    await expect(page.getByText(/\d+ views?/).first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Test 43 — Like toggle
  // ---------------------------------------------------------------------------
  test('likes, unlikes, and re-likes the deck', async ({ page }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);
    const likeButton = page.getByTestId('decklist-like-button');
    await expect(likeButton).toBeVisible({ timeout: API_TIMEOUT });
    await expect(likeButton).toBeEnabled({ timeout: API_TIMEOUT });

    const toggle = async (method: 'POST' | 'DELETE') => {
      const call = page.waitForResponse(
        (resp) =>
          resp.url() === `${BACKEND}/supabase/card-lists/like/${LIST_ID}` &&
          resp.request().method() === method,
        { timeout: API_TIMEOUT },
      );
      await likeButton.click();
      expect((await call).ok()).toBeTruthy();
    };

    // Like → count 1 (label refreshes via user-lists invalidation).
    await toggle('POST');
    await expect(likeButton).toHaveText('1', { timeout: API_TIMEOUT });

    // Unlike → back to 0.
    await toggle('DELETE');
    await expect(likeButton).toHaveText('0', { timeout: API_TIMEOUT });

    // Like again and leave it on for the folders test.
    await toggle('POST');
    await expect(likeButton).toHaveText('1', { timeout: API_TIMEOUT });
  });

  // ---------------------------------------------------------------------------
  // Test 44 — Save toggle
  // ---------------------------------------------------------------------------
  test('saves the deck', async ({ page }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);
    const saveButton = page.getByTestId('decklist-save-button');
    await expect(saveButton).toBeVisible({ timeout: API_TIMEOUT });
    await expect(saveButton).toBeEnabled({ timeout: API_TIMEOUT });

    const saveCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/save/${LIST_ID}` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await saveButton.click();
    expect((await saveCall).ok()).toBeTruthy();
    await expect(saveButton).toHaveText('1', { timeout: API_TIMEOUT });
  });

  // ---------------------------------------------------------------------------
  // Test 45 — View-count regression: social actions must not record views
  // ---------------------------------------------------------------------------
  test('does not record additional views after social actions', async ({
    page,
  }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    let viewPosts = 0;
    page.on('request', (req) => {
      if (
        req.url() === `${BACKEND}/supabase/card-lists/view/${LIST_ID}` &&
        req.method() === 'POST'
      ) {
        viewPosts += 1;
      }
    });

    const viewCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/view/${LIST_ID}` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await gotoHydrated(page, `/lists/${LIST_ID}`);
    await viewCall;

    // Unlike + re-like — each toggle refetches deck queries, which used
    // to inflate the view count before views got their own endpoint.
    const likeButton = page.getByTestId('decklist-like-button');
    await expect(likeButton).toBeEnabled({ timeout: API_TIMEOUT });

    for (const method of ['DELETE', 'POST'] as const) {
      const call = page.waitForResponse(
        (resp) =>
          resp.url() === `${BACKEND}/supabase/card-lists/like/${LIST_ID}` &&
          resp.request().method() === method,
        { timeout: API_TIMEOUT },
      );
      await likeButton.click();
      expect((await call).ok()).toBeTruthy();
    }

    // Let the post-toggle invalidation refetches settle, then confirm
    // the only view POST was the initial page visit.
    await expect(likeButton).toHaveText('1', { timeout: API_TIMEOUT });
    await page.waitForTimeout(2000);
    expect(viewPosts).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Test 46 — Liked/Saved folders on My Decklists
  // ---------------------------------------------------------------------------
  test('shows the deck in the Liked and Saved folders on My Decklists', async ({
    page,
  }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    await gotoHydrated(page, '/lists');

    const likedFolder = page.getByRole('button', {
      name: /liked decklists \(\d+\)/i,
    });
    await expect(likedFolder).toBeVisible({ timeout: API_TIMEOUT });
    await likedFolder.click();
    await expect(page.getByText(LIST_NAME).first()).toBeVisible({
      timeout: API_TIMEOUT,
    });

    const savedFolder = page.getByRole('button', {
      name: /saved decklists \(\d+\)/i,
    });
    await expect(savedFolder).toBeVisible();
    await savedFolder.click();
    // The deck appears in both folders (two matches once both are open).
    await expect(page.getByText(LIST_NAME).nth(1)).toBeVisible({
      timeout: API_TIMEOUT,
    });
  });

  // ---------------------------------------------------------------------------
  // Test 47 — Comments: post and delete
  // ---------------------------------------------------------------------------
  test('posts a comment and then deletes it', async ({ page }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    const textarea = page.getByPlaceholder(
      'Share your thoughts on this deck...',
    );
    await expect(textarea).toBeVisible({ timeout: API_TIMEOUT });
    await reliableFill(textarea, COMMENT_TEXT);

    const addCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/comments/${LIST_ID}` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Post Comment' }).click();
    expect((await addCall).ok()).toBeTruthy();

    // The comment shows up in the thread (own bubble).
    await expect(page.getByText(COMMENT_TEXT)).toBeVisible({
      timeout: API_TIMEOUT,
    });

    // Delete it again.
    const deleteCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/supabase/card-lists/comment/`) &&
        resp.request().method() === 'DELETE',
      { timeout: API_TIMEOUT },
    );
    await page.getByRole('button', { name: 'Delete comment' }).first().click();
    expect((await deleteCall).ok()).toBeTruthy();

    await expect(page.getByText(COMMENT_TEXT)).toBeHidden({
      timeout: API_TIMEOUT,
    });
    await expect(
      page.getByText('No comments yet. Be the first to comment!'),
    ).toBeVisible({ timeout: API_TIMEOUT });
  });

  // ---------------------------------------------------------------------------
  // Test 48 — Primer page
  // ---------------------------------------------------------------------------
  test('opens the primer page from the deck page', async ({ page }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);
    await page.getByRole('link', { name: 'Primer' }).click();
    await expect(page).toHaveURL(new RegExp(`/lists/${LIST_ID}/primer$`), {
      timeout: API_TIMEOUT,
    });

    // Owner sees the editable primer editor. Editability depends on the
    // async user-lists fetch resolving, so allow extra time here.
    await expect(
      page.getByRole('link', { name: /back to decklist/i }),
    ).toBeVisible({ timeout: API_TIMEOUT });
    await expect(
      page.getByPlaceholder(/Describe how this deck wins/).first(),
    ).toBeVisible({ timeout: 60_000 });
  });

  // ---------------------------------------------------------------------------
  // Test 49 — Account page & own-profile follow button
  // ---------------------------------------------------------------------------
  test('shows account stats and hides the Follow button on your own profile', async ({
    page,
    request,
  }) => {
    await gotoHydrated(page, '/user/account');
    await expect(
      page.getByRole('heading', { name: 'Account Stats' }),
    ).toBeVisible({ timeout: API_TIMEOUT });
    await expect(
      page.getByRole('heading', { name: 'Following' }),
    ).toBeVisible();

    // Visit your own public profile — the Follow button must be hidden
    // (self-follows are rejected by the backend and hidden in the UI).
    const auth = await supabaseAuth(request);
    expect(auth, 'Supabase password grant must succeed').toBeTruthy();

    const profileCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/user/profile/${auth!.userId}` && resp.ok(),
      { timeout: API_TIMEOUT },
    );
    await gotoHydrated(page, `/user/${auth!.userId}`);
    await profileCall;

    await expect(
      page.getByRole('button', { name: /^(follow|following)$/i }),
    ).toHaveCount(0);
  });

  // ---------------------------------------------------------------------------
  // Test 50 — Logged-out visitor: read-only social surfaces
  // ---------------------------------------------------------------------------
  test('logged-out visitor sees author link, disabled social buttons, and sign-in prompts', async ({
    browser,
    request,
  }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
    const context = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();

    try {
      await gotoHydrated(page, `/lists/${LIST_ID}`);

      // The visitor is not the owner, so the deck author link renders.
      await expect(page.getByText('Deck author')).toBeVisible({
        timeout: API_TIMEOUT,
      });

      // Like/save render but are disabled for logged-out visitors.
      const likeButton = page.getByTestId('decklist-like-button');
      const saveButton = page.getByTestId('decklist-save-button');
      await expect(likeButton).toBeVisible({ timeout: API_TIMEOUT });
      await expect(likeButton).toBeDisabled();
      await expect(saveButton).toBeDisabled();

      // Comment box is replaced by a sign-in prompt.
      await expect(page.getByText('Sign in to leave a comment.')).toBeVisible();
      await expect(
        page.getByPlaceholder('Share your thoughts on this deck...'),
      ).toBeHidden();

      // Non-owners never see owner-only list actions on the cards.
      // The per-card options menu (copies/boards/remove) is owner-only.
      await expect(page.getByLabel('Card options')).toHaveCount(0);

      // The deck has no saved primer, so non-owners get a disabled
      // "No Primer" button instead of the Primer link.
      const noPrimerButton = page.getByRole('button', { name: 'No Primer' });
      await expect(noPrimerButton).toBeVisible({ timeout: API_TIMEOUT });
      await expect(noPrimerButton).toBeDisabled();

      // Non-owners never see the visibility selector.
      await expect(page.getByTestId('visibility-select')).toHaveCount(0);

      // Public profile shows a disabled Follow button when logged out.
      const auth = await supabaseAuth(request);
      expect(auth, 'Supabase password grant must succeed').toBeTruthy();
      await gotoHydrated(page, `/user/${auth!.userId}`);
      const followButton = page.getByRole('button', { name: /^follow$/i });
      await expect(followButton).toBeVisible({ timeout: API_TIMEOUT });
      await expect(followButton).toBeDisabled();
    } finally {
      await context.close();
    }
  });

  // ---------------------------------------------------------------------------
  // Test 51 — Private decks are not publicly accessible
  // ---------------------------------------------------------------------------
  test('private decks are hidden from the public view and search endpoints', async ({
    request,
  }) => {
    expect(LIST_ID, 'Test 38 must run before this test').toBeTruthy();

    const auth = await supabaseAuth(request);
    expect(auth, 'Supabase password grant must succeed').toBeTruthy();
    const patchResp = await request.patch(
      `${SUPABASE_URL}/rest/v1/card_lists?id=eq.${LIST_ID}`,
      { headers: auth!.headers, data: { visibility: 'private' } },
    );
    expect(patchResp.ok()).toBeTruthy();

    // Public detail endpoint refuses to serve the private deck.
    const viewResp = await request.get(
      `${BACKEND}/supabase/card-lists/view/${LIST_ID}`,
    );
    expect(viewResp.status()).toBe(404);

    // View recording refuses too — private decks must not gain views.
    const recordResp = await request.post(
      `${BACKEND}/supabase/card-lists/view/${LIST_ID}`,
    );
    expect(recordResp.status()).toBe(404);

    // Public search no longer returns it.
    const searchResp = await request.get(
      `${BACKEND}/supabase/card-lists/search?query=${encodeURIComponent(LIST_NAME)}&limit=20`,
    );
    expect(searchResp.ok()).toBeTruthy();
    const searchBody = (await searchResp.json()) as {
      decklists: { id: string }[];
    };
    expect(searchBody.decklists.some((d) => d.id === LIST_ID)).toBe(false);
  });
});
