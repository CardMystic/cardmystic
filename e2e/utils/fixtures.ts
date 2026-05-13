import { test as base, expect, type Page, request } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: '.env.test' });

import { TEST_USER_EMAIL, TEST_USER_PASSWORD, gotoHydrated } from './mocks';

/**
 * Custom test fixtures for CardMystic E2E.
 *
 * - `signedInPage`: a `Page` whose context has the shared E2E user's
 *   Supabase session pre-loaded from `e2e/.auth/user.json` (written by
 *   `e2e/global-setup.ts`). Use this in any test that needs a logged-in
 *   user — no per-test login navigation, no recaptcha.
 *
 * - `cleanupListsAfter`: an automatically-cleaning `lists` registry.
 *   Tests register list IDs they create via `register(id)`; the fixture
 *   deletes all registered lists (and their items) via Supabase REST
 *   in `afterEach`, even on test failure.
 */

const STORAGE_STATE = path.resolve('e2e/.auth/user.json');

const requireAuth = () => {
  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
    base.skip(
      true,
      'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping authed test',
    );
  }
};

interface ListRegistry {
  /** Track this list ID for automatic deletion in afterEach. */
  register: (listId: string) => void;
}

export const test = base.extend<{
  signedInPage: Page;
  cleanupLists: ListRegistry;
}>({
  // Override the default `storageState` for tests in this file so the
  // shared `page` fixture is also pre-authed. This means tests can use
  // either `page` or `signedInPage` — both are signed in.
  storageState: STORAGE_STATE,

  signedInPage: async ({ page }, use) => {
    requireAuth();
    await use(page);
  },

  // eslint-disable-next-line no-empty-pattern
  cleanupLists: async ({}, use) => {
    const ids: string[] = [];
    const registry: ListRegistry = {
      register: (id: string) => {
        if (id) ids.push(id);
      },
    };

    await use(registry);

    if (ids.length === 0) return;

    const supabaseUrl =
      process.env.NUXT_PUBLIC_SUPABASE_URL ??
      'https://ddbgietanhxrozzmogur.supabase.co';
    const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '';
    if (!supabaseKey || !TEST_USER_EMAIL || !TEST_USER_PASSWORD) return;

    const ctx = await request.newContext();
    try {
      const tokenResp = await ctx.post(
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
      for (const id of ids) {
        await ctx.delete(
          `${supabaseUrl}/rest/v1/card_list_items?list_id=eq.${id}`,
          { headers },
        );
        await ctx.delete(`${supabaseUrl}/rest/v1/card_lists?id=eq.${id}`, {
          headers,
        });
      }
    } finally {
      await ctx.dispose();
    }
  },
});

export { expect, gotoHydrated };
