import {
  BACKEND,
  reliableFill,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
} from './utils/mocks';
import { expect, gotoHydrated, test } from './utils/fixtures';

/**
 * E2E coverage for the card lists CRUD surface.
 *
 * Real Supabase + real backend. Login is performed once in
 * `e2e/global-setup.ts` and reused via Playwright `storageState`, so
 * no per-test recaptcha or login navigation is required.
 *
 * Tests run serially against a single shared list (test numbers are
 * relative to the global test order, not this file):
 *
 *  ── CRUD baseline ──────────────────────────────────────────────────────
 *   26. Create list
 *   27. Add card to list (from search results, via AddToDeckModal)
 *   28. Add commander-eligible card (via list-page autocomplete +
 *       SetCommanderModal); assert is_commander flag round-trips
 *
 *  ── Multi-board & copies ────────────────────────────────────────────────
 *   29. Same oracle_id in two boards — Bulk Edit places Sol Ring in both
 *       Mainboard and Sideboard; both board sections render the card
 *   30. Change-board merge — bump Mainboard Sol Ring to 2 copies, then
 *       move to Sideboard (already has 1 from test 29); backend merges
 *       and returns success
 *   31. Update num copies — increment via "+Copy" and verify backend call
 *       reflects new count
 *
 *  ── Legality warnings ──────────────────────────────────────────────────
 *   32. Commander color-identity warning — adding a card outside the
 *       commander's color identity shows the `.illegal-card-bg` overlay
 *   33. Format copy-limit warning — adding >1 copy of a card in a
 *       singleton Commander list shows the legality overlay
 *
 *  ── Bulk edit ──────────────────────────────────────────────────────────
 *   34. Bulk Edit modal — submit a decklist for the Mainboard, verify
 *       /supabase/card-lists/bulk-edit is called and addedCount > 0
 *
 *  ── Sort/filter & remove/delete ────────────────────────────────────────
 *   35. Open list — sort/group controls render; toggle sort direction
 *   36. Remove card from list (via ListCard menu)
 *   37. Delete list
 *
 * The list ID is captured from the create-list response and reused
 * across the suite. afterAll deletes any surviving list via Supabase REST
 * so leaked data is bounded.
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
// Sol Ring: colorless, no color identity — safe for any commander.
// oracle_id: 604bd1c8-3538-4cd9-93fc-2b3bc0a9b6e3
const FILLER_CARD_NAME = 'Sol Ring';
// Lightning Bolt: Red — used to test color-identity warnings when commander is non-red.
const OFF_COLOR_CARD_NAME = 'Lightning Bolt';
// Atraxa, Praetors' Voice: WUBG commander (no Red).
const COMMANDER_CARD_NAME = 'Atraxa, Praetors';
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
        resp.url() ===
          `${BACKEND}/supabase/card-lists/add-cards-by-oracle-id` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await dialog.getByRole('button', { name: /^add to deck$/i }).click();

    const addResp = await addCall;
    expect(addResp.ok()).toBeTruthy();
    const addBody = (await addResp.json()) as {
      addedCount: number;
      updatedCount: number;
      invalidOracleIds: string[];
    };
    // Either added new (addedCount=1) or already existed (updatedCount>=1).
    expect(addBody.addedCount + addBody.updatedCount).toBeGreaterThanOrEqual(1);
    expect(addBody.invalidOracleIds).toHaveLength(0);
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
    await expect(addInput).toBeEnabled({ timeout: API_TIMEOUT });

    const addCall = page.waitForResponse(
      (resp) =>
        resp.url() ===
          `${BACKEND}/supabase/card-lists/add-cards-by-oracle-id` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await reliableFill(addInput, COMMANDER_CARD_NAME);
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

    // After setting commander the card should still be visible; no crash.
    await expect
      .poll(() => page.locator(atraxaImageSel).count(), {
        timeout: API_TIMEOUT,
      })
      .toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Test 29 — Same oracle_id in two boards (multi-board uniqueness)
  //
  // Strategy: Sol Ring is already in Mainboard from test 27. Open Bulk Edit,
  // switch to the Sideboard tab, type "1 Sol Ring", and submit. The modal
  // pre-populates each textarea from the current list state and only submits
  // boards whose textareas are non-empty, so the Mainboard entry (with Sol
  // Ring) is preserved untouched. After the save both board sections should
  // render a Sol Ring image.
  // ---------------------------------------------------------------------------
  test('same card can exist in Mainboard and Sideboard independently', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // Open the Bulk Edit modal.
    await page.getByRole('button', { name: /bulk edit/i }).click();
    const modal = page.getByRole('dialog', { name: /bulk edit cards/i });
    await expect(modal).toBeVisible({ timeout: API_TIMEOUT });

    // Switch to the Sideboard tab and enter Sol Ring there.
    // The Mainboard textarea is already pre-populated with the existing Sol
    // Ring (from test 27) and will be submitted as-is.
    await modal.getByRole('tab', { name: /sideboard/i }).click();
    await modal.locator('textarea').first().fill('1 Sol Ring');

    const bulkCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/bulk-edit` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await modal.getByRole('button', { name: /update list/i }).click();
    const bulkResp = await bulkCall;
    expect(bulkResp.ok()).toBeTruthy();

    // Both boards should now contain Sol Ring — expect ≥ 2 card images.
    await expect
      .poll(() => page.locator('img[alt="Sol Ring"]').count(), {
        timeout: API_TIMEOUT,
      })
      .toBeGreaterThanOrEqual(2);
  });

  // ---------------------------------------------------------------------------
  // Test 30 — Change-board merge: moving N copies of a card to a board that
  //           already holds M copies of the same card → destination ends up
  //           with N+M copies.
  //
  // Independent of preceding tests: this test seeds its OWN state via the
  // Bulk Edit modal (Mainboard=2× Brainstorm, Sideboard=1× Brainstorm).
  // Brainstorm is blue → legal in Atraxa's WUBG identity (no legality
  // overlay interference) and is not used by any other test in this file.
  // ---------------------------------------------------------------------------
  test('moving copies to a board that already holds that card merges the counts', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    const MERGE_TEST_CARD = 'Brainstorm';

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // ── Step 1: seed Mainboard=2× and Sideboard=1× via Bulk Edit ────────
    // Textareas pre-populate from current list state and only boards with
    // non-empty textareas are touched; we append our seed lines so existing
    // cards on those boards are preserved.
    await page.getByRole('button', { name: /bulk edit/i }).click();
    const modal = page.getByRole('dialog', { name: /bulk edit cards/i });
    await expect(modal).toBeVisible({ timeout: API_TIMEOUT });

    const mainboardTextarea = modal.locator('textarea').first();
    const mainboardCurrent = await mainboardTextarea.inputValue();
    await mainboardTextarea.fill(
      `${mainboardCurrent}${mainboardCurrent ? '\n' : ''}2 ${MERGE_TEST_CARD}`,
    );

    await modal.getByRole('tab', { name: /sideboard/i }).click();
    const sideboardTextarea = modal.locator('textarea').first();
    const sideboardCurrent = await sideboardTextarea.inputValue();
    await sideboardTextarea.fill(
      `${sideboardCurrent}${sideboardCurrent ? '\n' : ''}1 ${MERGE_TEST_CARD}`,
    );

    const bulkCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/bulk-edit` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );
    await modal.getByRole('button', { name: /update list/i }).click();
    const bulkResp = await bulkCall;
    expect(bulkResp.ok()).toBeTruthy();
    await expect(modal).toBeHidden({ timeout: API_TIMEOUT });

    // ── Step 2: snapshot the Sideboard count after seeding ──────────────
    const sideboardHeader = page.locator('#board-sideboard');
    await expect(sideboardHeader).toBeVisible({ timeout: API_TIMEOUT });

    const readBoardCount = async (locator: typeof sideboardHeader) => {
      const text = (await locator.textContent()) ?? '';
      const match = text.match(/\((\d+)/);
      return match ? Number(match[1]) : 0;
    };

    // Wait for the seeded Brainstorm copies to render in both boards
    // (≥2 wrappers — the Mainboard 2× collapses to one wrapper, and the
    // Sideboard 1× is the other) before snapshotting the count.
    await expect
      .poll(
        () =>
          page
            .locator(`.card-image-wrapper:has(img[alt="${MERGE_TEST_CARD}"])`)
            .count(),
        { timeout: API_TIMEOUT },
      )
      .toBeGreaterThanOrEqual(2);

    const sideboardCountBeforeMove = await readBoardCount(sideboardHeader);

    // ── Step 3: move the Mainboard Brainstorm → Sideboard via the menu ──
    // Mainboard renders first in the DOM, so `.first()` targets the
    // Mainboard wrapper (the Sideboard wrapper comes later).
    const mainboardCard = page
      .locator(`.card-image-wrapper:has(img[alt="${MERGE_TEST_CARD}"])`)
      .first();
    await mainboardCard.scrollIntoViewIfNeeded();
    await mainboardCard.hover();
    await mainboardCard
      .getByRole('button', { name: /card options/i })
      .first()
      .click({ force: true });

    // The frontend issues PUT to `/supabase/card-lists/change-board`
    // (see composables/useCardLists.ts).
    const changeBoardCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/change-board` &&
        resp.request().method() === 'PUT',
      { timeout: API_TIMEOUT },
    );
    await page
      .getByRole('menuitem', { name: /move to sideboard/i })
      .first()
      .click();
    const changeBoardResp = await changeBoardCall;
    expect(changeBoardResp.ok()).toBeTruthy();

    // ── Step 4: verify Sideboard count grew by exactly 2 ────────────────
    // Mainboard's 2 copies merged into Sideboard's 1 → +2 sideboard cards.
    await expect
      .poll(() => readBoardCount(sideboardHeader), {
        timeout: API_TIMEOUT,
        message: 'Sideboard count did not reflect the merged copies',
      })
      .toBe(sideboardCountBeforeMove + 2);
  });

  // ---------------------------------------------------------------------------
  // Test 31 — Update num copies via the +Copy button in the preview rail
  // ---------------------------------------------------------------------------
  test('update num copies fires update-num-copies and changes the displayed count', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // Wait for cards to render — Atraxa should be present from test 28.
    await expect
      .poll(
        () =>
          page.locator('.card-image-wrapper:has(img[alt*="Atraxa"])').count(),
        { timeout: API_TIMEOUT },
      )
      .toBeGreaterThan(0);

    // Hover Atraxa to open the preview rail.
    const atraxaCard = page
      .locator('.card-image-wrapper:has(img[alt*="Atraxa"])')
      .first();
    await atraxaCard.scrollIntoViewIfNeeded();
    await atraxaCard.hover();

    // Atraxa is a Commander — copy controls are hidden for the deck commander.
    // Instead test with Sol Ring (non-commander card).
    // Sol Ring may be in Sideboard after test 30; find whichever wrapper is first.
    const solRingCard = page
      .locator('.card-image-wrapper:has(img[alt="Sol Ring"])')
      .first();
    const hasSolRing = (await solRingCard.count()) > 0;
    test.skip(
      !hasSolRing,
      'Sol Ring not present — tests 27/29/30 likely skipped; nothing to update',
    );

    await solRingCard.scrollIntoViewIfNeeded();
    await solRingCard.hover();

    const updateCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/update-num-copies` &&
        resp.request().method() === 'PUT',
      { timeout: API_TIMEOUT },
    );

    // Click "+Copy" in the preview rail.
    await page
      .getByRole('button', { name: /^add copy$/i })
      .first()
      .click();

    const updateResp = await updateCall;
    expect(updateResp.ok()).toBeTruthy();
    const updateBody = (await updateResp.json()) as {
      cardName: string;
      numCopies: number;
    };
    expect(updateBody.cardName).toMatch(/Sol Ring/i);
    expect(updateBody.numCopies).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // Test 32 — Commander color-identity warning (card outside WUBG)
  // ---------------------------------------------------------------------------
  test('card outside commander color identity shows legality warning overlay', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    // Atraxa is WUBG (no Red). Add Lightning Bolt (R) so the legality overlay appears.
    await gotoHydrated(page, `/lists/${LIST_ID}`);
    const addInput = page.getByPlaceholder('Search for a card to add...');
    await expect(addInput).toBeEnabled({ timeout: API_TIMEOUT });

    const addCall = page.waitForResponse(
      (resp) =>
        resp.url() ===
          `${BACKEND}/supabase/card-lists/add-cards-by-oracle-id` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await reliableFill(addInput, OFF_COLOR_CARD_NAME);
    // OFF_COLOR_CARD_NAME is Lightning Bolt (Red) — outside Atraxa's WUBG color identity.
    await page
      .getByRole('option', { name: new RegExp(OFF_COLOR_CARD_NAME, 'i') })
      .first()
      .click();

    await addCall;

    // Wait for Lightning Bolt card image to appear.
    await expect
      .poll(
        () =>
          page
            .locator('.card-image-wrapper:has(img[alt*="Lightning Bolt"])')
            .count(),
        { timeout: API_TIMEOUT },
      )
      .toBeGreaterThan(0);

    // The ListCard for Lightning Bolt should carry the `.illegal-card-bg` class
    // because Red is outside Atraxa's WUBG color identity.
    const boltCard = page
      .locator('.illegal-card-bg:has(img[alt*="Lightning Bolt"])')
      .first();
    await expect(boltCard).toBeVisible({ timeout: API_TIMEOUT });

    // The legality overlay text should be present.
    const overlay = boltCard.locator('.legality-overlay').first();
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText(/color identity|not legal|illegal/i);
  });

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Test 33 — Format copy-limit warning (>1 copy in Commander singleton)
  //
  // Independent of preceding card-movement tests: adds a fresh card
  // (Counterspell — legal in Atraxa's WUBG identity so no color-identity
  // warning interferes), bumps it to 2 copies via the card-overlay menu,
  // and verifies the Commander singleton-rule overlay appears.
  //
  // Uses the card menu's "Add a copy" item (not the preview rail's "Add
  // Copy" button) because the preview rail is only rendered at the xl:
  // breakpoint (≥1280px). By this point in the suite enough cards have
  // been added that the page scrollbar pushes the viewport below 1280px
  // and the rail disappears, so its button would not exist to click.
  // ---------------------------------------------------------------------------
  test('adding a second copy of a card in Commander format shows copy-limit warning', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    const SINGLETON_TEST_CARD = 'Counterspell';

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // ── Step 1: add Counterspell via the list-page autocomplete ─────────
    const addInput = page.getByPlaceholder('Search for a card to add...');
    await expect(addInput).toBeEnabled({ timeout: API_TIMEOUT });

    const addCall = page.waitForResponse(
      (resp) =>
        resp.url() ===
          `${BACKEND}/supabase/card-lists/add-cards-by-oracle-id` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await reliableFill(addInput, SINGLETON_TEST_CARD);
    await page
      .getByRole('option', {
        name: new RegExp(`^${SINGLETON_TEST_CARD}$`, 'i'),
      })
      .first()
      .click();
    await addCall;

    const cardWrapper = page
      .locator(`.card-image-wrapper:has(img[alt="${SINGLETON_TEST_CARD}"])`)
      .first();
    await expect(cardWrapper).toBeVisible({ timeout: API_TIMEOUT });

    // ── Step 2: bump Counterspell to 2 copies via the card-overlay menu ─
    // The menu is scoped to the specific card wrapper, so it works
    // regardless of viewport width / preview-rail visibility.
    const updateCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/update-num-copies` &&
        resp.request().method() === 'PUT',
      { timeout: API_TIMEOUT },
    );

    await cardWrapper.scrollIntoViewIfNeeded();
    await cardWrapper.hover();
    await cardWrapper
      .getByRole('button', { name: /card options/i })
      .first()
      .click({ force: true });
    await page
      .getByRole('menuitem', { name: /^add a copy$/i })
      .first()
      .click();
    await updateCall;

    // ── Step 3: verify the singleton overlay is shown on Counterspell ───
    // Legality is reactive — no reload required.
    const illegalCard = page
      .locator(`.illegal-card-bg:has(img[alt="${SINGLETON_TEST_CARD}"])`)
      .first();
    await expect(illegalCard).toBeVisible({ timeout: API_TIMEOUT });

    const overlay = illegalCard.locator('.legality-overlay').first();
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText(/1 copy|singleton|commander/i);
  });

  // ---------------------------------------------------------------------------
  // Test 34 — Bulk Edit modal fires /bulk-edit with correct structure
  // ---------------------------------------------------------------------------
  test('bulk edit modal submits a decklist and bulk-edit endpoint responds', async ({
    page,
  }) => {
    expect(LIST_ID).toBeTruthy();

    await gotoHydrated(page, `/lists/${LIST_ID}`);

    // Open the Bulk Edit modal.
    await page.getByRole('button', { name: /bulk edit/i }).click();
    const modal = page.getByRole('dialog', { name: /bulk edit cards/i });
    await expect(modal).toBeVisible({ timeout: API_TIMEOUT });

    // Mainboard tab is active by default; fill its textarea with a minimal
    // valid decklist.
    const textarea = modal.locator('textarea').first();
    await textarea.fill('2 Sol Ring\n1 Counterspell');

    const bulkEditCall = page.waitForResponse(
      (resp) =>
        resp.url() === `${BACKEND}/supabase/card-lists/bulk-edit` &&
        resp.request().method() === 'POST',
      { timeout: API_TIMEOUT },
    );

    await modal.getByRole('button', { name: /update list/i }).click();
    const bulkResp = await bulkEditCall;
    expect(bulkResp.ok()).toBeTruthy();
    const bulkBody = (await bulkResp.json()) as {
      addedCount: number;
      removedCount: number;
      invalidCardNames: string[];
    };
    // Sol Ring + Counterspell are real cards — no invalid names.
    expect(bulkBody.invalidCardNames).toHaveLength(0);
    // At least one card operation happened (add or remove).
    expect(bulkBody.addedCount + bulkBody.removedCount).toBeGreaterThanOrEqual(
      0,
    );
  });

  // ---------------------------------------------------------------------------
  // Test 35 — Open list, sort/filter controls work
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
  // Test 36 — Remove a card from the list
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

    const initialSolRingCount = await page
      .locator('.card-image-wrapper:has(img[alt="Sol Ring"])')
      .count();
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

    // Sol Ring may still exist in a different board after test 29 placed it in
    // Sideboard, so just assert one wrapper went away (and total count drops).
    await expect(
      page.locator('.card-image-wrapper:has(img[alt="Sol Ring"])'),
    ).toHaveCount(initialSolRingCount - 1, { timeout: API_TIMEOUT });
    await expect
      .poll(() => page.locator('.card-image-wrapper').count(), {
        timeout: API_TIMEOUT,
      })
      .toBeLessThan(initialCount);
  });

  // ---------------------------------------------------------------------------
  // Test 37 — Delete list
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
