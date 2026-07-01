import { chromium, type FullConfig, request } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: '.env.test' });

/**
 * Global setup runs once before the test suite.
 *
 * Responsibilities:
 *
 *   1. Sign the shared E2E test user into Supabase via the real
 *      `/user/login` page and persist the resulting browser storage to
 *      `e2e/.auth/user.json`. Tests that need an authed session opt in
 *      via the `signedInPage` fixture, which loads this storage state
 *      into a fresh context — no per-test login round-trip.
 *
 *   2. Best-effort cleanup of any leaked `e2e-*` decklists from prior
 *      runs (failed afterEach hooks, killed processes, etc.) so the
 *      account stays tidy across runs.
 *
 * Skipped when `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` aren't set so
 * unauthenticated PRs (forks) still run the public-surface tests.
 */
export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL ?? '';
  const password = process.env.E2E_TEST_PASSWORD ?? '';
  const supabaseUrl =
    process.env.NUXT_PUBLIC_SUPABASE_URL ??
    'https://ddbgietanhxrozzmogur.supabase.co';
  const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '';

  const authDir = path.resolve('e2e/.auth');
  const storageStatePath = path.join(authDir, 'user.json');
  fs.mkdirSync(authDir, { recursive: true });

  if (!email || !password) {
    // No credentials → write an empty storage state so the fixture's
    // `storageState` reference is always valid; authed tests will skip
    // on their own via `requireTestUser()`.
    fs.writeFileSync(
      storageStatePath,
      JSON.stringify({ cookies: [], origins: [] }),
    );
    return;
  }

  // ---------------------------------------------------------------------------
  // 1. Sign in via the real Supabase auth REST endpoint and seed
  //    storage manually. This is faster + less flaky than driving the
  //    `/user/login` page in a headless browser, and storageState only
  //    needs the localStorage `sb-*` token entry to be valid.
  // ---------------------------------------------------------------------------
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';

  const reqCtx = await request.newContext();
  const tokenResp = await reqCtx.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: {
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      data: { email, password },
    },
  );
  if (!tokenResp.ok()) {
    const body = await tokenResp.text();
    throw new Error(
      `globalSetup: Supabase password grant failed (${tokenResp.status()}): ${body}`,
    );
  }
  const session = (await tokenResp.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: { id: string; email: string };
  };
  await reqCtx.dispose();

  // Derive the localStorage key Supabase uses (sb-<project-ref>-auth-token).
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  const storageKey = `sb-${projectRef}-auth-token`;
  const expiresAt =
    session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in;

  // Launch a browser, navigate to baseURL once so we can write to its
  // localStorage under the correct origin, then save storage state.
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(baseURL);
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    {
      key: storageKey,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: expiresAt,
        token_type: session.token_type,
        user: session.user,
      }),
    },
  );
  await context.storageState({ path: storageStatePath });
  await browser.close();

  // ---------------------------------------------------------------------------
  // 2. Best-effort cleanup of leaked `e2e-*` decklists from prior runs.
  // ---------------------------------------------------------------------------
  const cleanupCtx = await request.newContext();
  try {
    const headers = {
      apikey: supabaseKey,
      Authorization: `Bearer ${session.access_token}`,
    };
    const listResp = await cleanupCtx.get(
      `${supabaseUrl}/rest/v1/card_lists?user_id=eq.${session.user.id}&name=like.e2e-*&select=id,name`,
      { headers },
    );
    if (listResp.ok()) {
      const lists = (await listResp.json()) as { id: string; name: string }[];
      for (const list of lists) {
        await cleanupCtx.delete(
          `${supabaseUrl}/rest/v1/card_list_items?list_id=eq.${list.id}`,
          { headers },
        );
        await cleanupCtx.delete(
          `${supabaseUrl}/rest/v1/card_lists?id=eq.${list.id}`,
          { headers },
        );
      }
      if (lists.length > 0) {
        // eslint-disable-next-line no-console
        console.log(
          `[globalSetup] Cleaned up ${lists.length} leaked e2e-* decklist(s).`,
        );
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[globalSetup] cleanup skipped:', err);
  } finally {
    await cleanupCtx.dispose();
  }
}
