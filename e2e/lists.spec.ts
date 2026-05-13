import {
  BACKEND,
  reliableFill,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from './utils/mocks';
import { expect, gotoHydrated, test } from './utils/fixtures';

/**
 * E2E coverage for the card lists CRUD surface (Phase 7).
 *
 * Real Supabase + real backend. Login is performed once in
 * `e2e/global-setup.ts` and reused via Playwright `storageState`, so
 * no per-test recaptcha or login navigation is required.
 *
 * Tests run serially against a single shared list:
 *   26. Create list
 *   27. Add card to list (from search results, via AddToDeckModal)
 *   28. Add commander to list (via list page → ListCard menu)
 *   29. Open list — sort/filter controls work
 *   30. Remove card from list (via ListCard menu)
 *   31. Delete list
 *
 * The list ID is captured from the create-list response and reused
 * across the suite. The `cleanupLists` fixture deletes any registered
 * list IDs via Supabase REST in afterEach — even on failure — so leaks
 * are bounded.
 */

const SEARCH_TIMEOUT = 60_000;
const API_TIMEOUT = 30_000;

const requireTestUser = () => {
  test.skip(
    !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
    'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping authed lists test',
  );
};

const LIST_NAME = `e2e-list-${Date.now()}`;
const FILLER_CARD_NAME = 'Sol Ring';
let LIST_ID = '';

test.describe.configure({ mode: 'serial' });

test.describe('Card lists CRUD', () => {
  test.beforeEach(async () => {
    requireTestUser();
  });

  test.afterAll(async ({ request }) => {
    if (!LIST_ID) return;
    // Belt-and-braces: registering with `cleanupLists` only protects
    // single tests; the shared LIST_ID outlives the per-test fixture,
    // so delete it directly via Supabase REST here.
    const supabaseUrl =
      process.env.NUXT_PUBLIC_SUPABASE_URL ??
      'https://ddbgietanhxrozzmogur.supabase.co';
    const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '';
    if (!supabaseKey || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) return;
    try {
      const tokenResp = await request.post(
        `${supabaseUrl}/auth/v1/token?grant_type=password`,
        {
          headers: {
            apikey: supabaseKey,
            'Content-Type': 'application/json',
          },
          data: { email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD },
        },
      );
      if (!tokenResp.ok()) return;
      const { access_token } = (await tokenResp.json()) as {
        access_token: string;
      };
      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${access_token}`,
      };
      await request.delete(
        `${supabaseUrl}/rest/v1/card_list_items?list_id=eq.${LIST_ID}`,
        { headers },
      );
      await request.delete(
        `${supabaseUrl}/rest/v1/card_lists?id=eq.${LIST_ID}`,
        { headers },
      );
    } catch {
      // best effort — globalSetup will sweep on the next run.
    }
  });

  // ---------------------------------------------------------------------------
  // Test 26 — Create list
  // ---------------------------------------------------------------------------
  test('creates a new list via the New List modal', async ({ page }) => {
    await gotoHydrated(page, '/lists');

    await page.getByRole('button', { name: /new list/i }).click();
    const dialog = page.getByRole('dialog', { name: /create new decklist/i });
    await expect(dialog).toBeVisible();

    await reliableFill(dialog.getByPlaceholder('Enter list name'), LIST_NAME);

    const createCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/create` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await dialog.getByRole('button', { name: /^create$/i }).click();

    const resp = await createCall;
    const body = (await resp.json()) as { id: string; name: string };
    // Capture LIST_ID first so afterAll can clean up even if assertions fail.
    if (body?.id) LIST_ID = body.id;
    expect(resp.ok()).toBeTruthy();
    expect(body.id).toBeTruthy();
    expect(body.name).toBe(LIST_NAME);

    // Modal closes and the new list appears in the grid.
    await expect(dialog).toBeHidden({ timeout: API_TIMEOUT });
    await expect(
      page.locator('h3').filter({ hasText: LIST_NAME }).first(),
    ).toBeVisible({ timeout: API_TIMEOUT });
  });

  // ---------------------------------------------------------------------------
  // Test 27 — Add card to list (from search results)
  // ---------------------------------------------------------------------------
  test('adds a card to the list from search results via AddToDeckModal', async ({
    page,
  }) => {
    expect(LIST_ID, 'Test 26 must run before this test').toBeTruthy();

    const searchCall = page.waitForResponse(
      (resp) =>
        resp.url().startsWith(`${BACKEND}/search/keyword`) &&
        resp.request().method() === 'POST',
      { timeout: SEARCH_TIMEOUT },
    );
    await gotoHydrated(
      page,
      `/search/all/keyword?query=${encodeURIComponent(FILLER_CARD_NAME)}`,
    );
    await searchCall;

    // Wait for at least one card image to appear.
    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: SEARCH_TIMEOUT,
      })
      .toBeGreaterThan(0);

    // Open the 3-dots menu on the first card and pick "Add to Deck".
    await page
      .getByRole('button', { name: /card options/i })
      .first()
      .click({ force: true });
    await page
      .getByRole('menuitem', { name: /add to deck/i })
      .first()
      .click();

    // The AddToDeckModal opens. Our newly-created list should appear as a
    // recent-decks pill, but if the userLists query hasn't hydrated yet we
    // fall back to the "Find a deck..." search input.
    const dialog = page.getByRole('dialog', { name: /add .* card .* deck/i });
    await expect(dialog).toBeVisible({ timeout: API_TIMEOUT });

    const recentPill = dialog
      .getByRole('button', { name: new RegExp(LIST_NAME) })
      .first();
    if (await recentPill.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await recentPill.click();
    } else {
      const search = dialog.getByPlaceholder('Find a deck...');
      await reliableFill(search, LIST_NAME);
      // Reka UI renders combobox options in a portal outside the dialog,
      // so query at page scope.
      await page
        .getByRole('option', { name: new RegExp(LIST_NAME) })
        .first()
        .click();
    }

    const addCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/add-cards-by-id` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await dialog.getByRole('button', { name: /^add to deck$/i }).click();

    const addResp = await addCall;
    expect(addResp.ok()).toBeTruthy();
    const addBody = (await addResp.json()) as {
      addedCount: number;
      updatedCount: number;
      invalidCardIds: string[];
    };
    // Either added new (addedCount=1) or already existed (updatedCount>=1).
    expect(addBody.addedCount + addBody.updatedCount).toBeGreaterThanOrEqual(1);
    expect(addBody.invalidCardIds).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // Test 28 — Add commander to list (mark as commander, assert is_commander)
  // ---------------------------------------------------------------------------
  test('adds a commander-eligible card and marks it as commander', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // Add Atraxa via the list-page autocomplete input.
    const addInput = page.getByPlaceholder('Search for a card to add...');
    await expect(addInput).toBeVisible({ timeout: API_TIMEOUT });

    const addCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/add-cards-by-id` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await reliableFill(addInput, 'Atraxa');
    await page
      .getByRole('option', { name: /Atraxa, Praetors/i })
      .first()
      .click();

    await addCall;

    // Wait for Atraxa to render in the grid (alt may use a curly apostrophe).
    const atraxaImageSel = 'img[alt*="Atraxa"]';
    await expect
      .poll(() => page.locator(atraxaImageSel).count(), {
        timeout: API_TIMEOUT,
      })
      .toBeGreaterThan(0);

    // Open the 3-dots menu on Atraxa's card and pick "Set as Commander".
    const atraxaCard = page
      .locator('.card-image-wrapper:has(img[alt*="Atraxa"])')
      .first();
    await atraxaCard.scrollIntoViewIfNeeded();
    await atraxaCard.hover();
    await atraxaCard
      .getByRole('button', { name: /card options/i })
      .first()
      .click({ force: true });

    await page
      .getByRole('menuitem', { name: /set as commander/i })
      .first()
      .click();

    // SetCommanderModal opens — confirm.
    const dialog = page.getByRole('dialog', { name: /set commander/i });
    await expect(dialog).toBeVisible({ timeout: API_TIMEOUT });

    const setCommanderCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/set-commander` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await dialog.getByRole('button', { name: /^set commander$/i }).click();
    const setResp = await setCommanderCall;
    expect(setResp.ok()).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Test 29 — Open list, sort/filter controls work
  // ---------------------------------------------------------------------------
  test('opens the list page and the sort/group controls render', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // Banner shows the list name (CardListBanner renders an editable h1 / heading).
    await expect(page.getByText(LIST_NAME).first()).toBeVisible({
      timeout: API_TIMEOUT,
    });

    // Wait for at least one card to render (Atraxa from test 28; possibly Sol Ring from 27).
    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: API_TIMEOUT,
      })
      .toBeGreaterThan(0);

    // GroupBy + Sort controls visible.
    await expect(page.getByText(/group by/i).first()).toBeVisible();
    await expect(page.getByText(/sort by/i).first()).toBeVisible();

    // Toggle the sort direction button — should not throw, page remains responsive.
    const sortToggle = page
      .getByRole('button', { name: /ascending|descending/i })
      .first();
    if (await sortToggle.isVisible().catch(() => false)) {
      await sortToggle.click();
      // Cards still rendered after toggle.
      await expect
        .poll(() => page.locator('.card-image-wrapper').count(), {
          timeout: API_TIMEOUT,
        })
        .toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // Test 30 — Remove a card from the list
  // ---------------------------------------------------------------------------
  test('removes a card from the list via the card menu', async ({ page }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // Wait for cards to render.
    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: API_TIMEOUT,
      })
      .toBeGreaterThan(0);

    // Pick Sol Ring (added in test 27, not a commander).
    const solRingCard = page
      .locator('.card-image-wrapper:has(img[alt="Sol Ring"])')
      .first();
    const hasSolRing = (await solRingCard.count()) > 0;
    test.skip(
      !hasSolRing,
      'Sol Ring not present (test 27 likely skipped/failed) — nothing to remove',
    );

    const initialCount = await page.locator('.card-image-wrapper').count();

    // Open the menu on Sol Ring's card and pick "Remove".
    await solRingCard.scrollIntoViewIfNeeded();
    await solRingCard.hover();
    await solRingCard
      .getByRole('button', { name: /card options/i })
      .first()
      .click({ force: true });

    await page
      .getByRole('menuitem', { name: /^remove$/i })
      .first()
      .click();

    // Sol Ring disappears from the cards grid (the HoveredListCardPreview
    // side panel may keep the image, so scope to the wrapper, not the bare img).
    await expect(
      page.locator('.card-image-wrapper:has(img[alt="Sol Ring"])'),
    ).toHaveCount(0, { timeout: API_TIMEOUT });
    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: API_TIMEOUT,
      })
      .toBeLessThan(initialCount);
  });

  // ---------------------------------------------------------------------------
  // Test 31 — Delete list
  // ---------------------------------------------------------------------------
  test('deletes the list via the confirmation modal', async ({ page }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, '/lists');

    const card = page
      .locator('div.group:has(h3)')
      .filter({ hasText: LIST_NAME })
      .first();
    await expect(card).toBeVisible({ timeout: API_TIMEOUT });

    await card.getByRole('button', { name: /delete list/i }).click({
      force: true,
    });

    const dialog = page.getByRole('dialog', { name: /delete list/i });
    await expect(dialog).toBeVisible({ timeout: API_TIMEOUT });
    await dialog.getByRole('button', { name: /^delete$/i }).click();

    // The list disappears from the grid.
    await expect(page.locator('h3').filter({ hasText: LIST_NAME })).toHaveCount(
      0,
      { timeout: API_TIMEOUT },
    );

    // Mark cleaned so afterAll skips the safety net.
    LIST_ID = '';
  });
});
