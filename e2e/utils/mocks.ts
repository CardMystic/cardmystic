import { expect, type Locator, type Page, type Route } from '@playwright/test';

/**
 * Shared test helpers for CardMystic E2E tests.
 *
 * These are integration tests: they hit the real backend
 * (`api.next.cardmystic.com` by default) and the real Supabase project,
 * so we exercise the full stack frontend ↔ backend ↔ model server end
 * to end. We only stub the two things that can't be made deterministic
 * in a headless browser:
 *
 *   1. **reCAPTCHA challenge** — Google's invisible reCAPTCHA can't be
 *      solved by an automated browser, so we stub `window.grecaptcha`
 *      to return a fake token AND mock the backend's `/recaptcha/verify`
 *      to accept it. Real verification is covered by manual QA / the
 *      backend's own tests.
 *   2. **Google OAuth round-trip** — Hitting accounts.google.com from
 *      CI is impractical and would create real Google sessions. Tests
 *      that need an OAuth flow either intercept Supabase's `/authorize`
 *      redirect or opt into `mockSupabaseAuth` to synthesize a session.
 *
 * Everything else (login, logout, signup, search, etc.) goes to the
 * real backend.
 */

const SUPABASE_URL =
  process.env.NUXT_PUBLIC_SUPABASE_URL ??
  'https://ddbgietanhxrozzmogur.supabase.co';
const BACKEND_URL =
  process.env.NUXT_PUBLIC_BACKEND_URL ?? 'https://api.next.cardmystic.com';

export const BACKEND = BACKEND_URL;
export const SUPABASE = SUPABASE_URL;

/**
 * Real Supabase test user credentials, provided via env. Tests that
 * need a real session should call `requireTestUser()` to skip cleanly
 * when these are unset (e.g. in fork PRs).
 */
export const TEST_USER_EMAIL = process.env.E2E_TEST_EMAIL ?? '';
export const TEST_USER_PASSWORD = process.env.E2E_TEST_PASSWORD ?? '';

/** A structurally-valid fake user used by `mockSupabaseAuth` only. */
export const FAKE_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'e2e@cardmystic.test',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'E2E Test User' },
  identities: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Issue a fake JWT-shaped string. Supabase's client doesn't verify the
 * signature locally, so structure is enough for mocked OAuth flows.
 */
export const fakeJwt = (sub = FAKE_USER.id) => {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub,
      email: FAKE_USER.email,
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    }),
  ).toString('base64url');
  return `${header}.${payload}.fake-signature`;
};

/**
 * Stub the reCAPTCHA grecaptcha global so verifyRecaptcha() resolves
 * without loading Google's script. Pair with `mockRecaptchaVerify()`.
 *
 * The recaptcha.client plugin injects `<script src="...recaptcha/api.js">`
 * via useHead which would overwrite `window.grecaptcha` once loaded, so
 * we also block all requests to Google's reCAPTCHA endpoints to keep
 * our stub authoritative.
 */
export const stubRecaptcha = async (page: Page) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stub: any = {
      ready: (cb: () => void) => cb(),
      execute: () => Promise.resolve('fake-recaptcha-token'),
    };
    Object.defineProperty(window, 'grecaptcha', {
      configurable: false,
      get: () => stub,
      set: () => {
        /* keep our stub authoritative */
      },
    });
  });

  await page.route('**/recaptcha/api.js**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: '',
    }),
  );
  await page.route('**/recaptcha/api2/**', (route) =>
    route.fulfill({ status: 200, body: '' }),
  );
};

/**
 * Mock the backend's `/recaptcha/verify` endpoint to always succeed.
 * Required because verifyRecaptcha() POSTs there with our fake token,
 * which the real backend would (correctly) reject.
 */
export const mockRecaptchaVerify = async (page: Page) => {
  await page.route(`${BACKEND_URL}/recaptcha/verify`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, score: 0.9 }),
    }),
  );
};

/**
 * Default test setup: stub reCAPTCHA + mock its verify endpoint. All
 * other traffic (Supabase, backend) goes to the real services.
 */
export const setupRecaptchaStubs = async (page: Page) => {
  await stubRecaptcha(page);
  await mockRecaptchaVerify(page);
};

/**
 * OPT-IN: mock Supabase auth endpoints to synthesize a session without
 * real credentials. Use this only for tests that exercise client-side
 * auth wiring (e.g. the OAuth implicit-flow hash-callback regression
 * test) where hitting real Supabase isn't possible or desirable.
 */
export const mockSupabaseAuth = async (page: Page) => {
  await page.route(`${SUPABASE_URL}/auth/v1/user**`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(FAKE_USER),
    }),
  );

  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: fakeJwt(),
        refresh_token: 'fake-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: FAKE_USER,
      }),
    }),
  );

  await page.route(`${SUPABASE_URL}/auth/v1/logout**`, (route: Route) =>
    route.fulfill({ status: 204, body: '' }),
  );

  // The auth plugin pings the backend after login; with a fake JWT the
  // real backend would 401, so swallow it.
  await page.route(`${BACKEND_URL}/user/ping`, (route: Route) =>
    route.fulfill({ status: 200, body: '{}' }),
  );

  // Profile lookup via Supabase REST.
  await page.route(`${SUPABASE_URL}/rest/v1/profiles**`, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: FAKE_USER.id, avatar_card_name: null }]),
    }),
  );
};

/**
 * Wait for the Nuxt/Vue app to finish hydrating before interacting.
 *
 * SSR ships a server-rendered DOM that Playwright can see immediately,
 * but Vue's reactive bindings (v-model, @click handlers) only attach
 * after hydration. Filling inputs or clicking buttons before then will
 * appear to succeed but state changes are dropped.
 */
export const waitForHydration = async (page: Page) => {
  await page.waitForFunction(
    () => {
      const el = document.getElementById('__nuxt');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !!el && !!(el as any).__vue_app__;
    },
    undefined,
    { timeout: 30_000 },
  );
};

/** Convenience: navigate AND wait for hydration in one call. */
export const gotoHydrated = async (page: Page, url: string) => {
  await page.goto(url);
  await waitForHydration(page);
};

/**
 * Fill an input and verify the value actually stuck. Hydration races
 * can swallow the first fill; this re-fills until the input reports
 * the expected value or runs out of attempts.
 */
export const reliableFill = async (
  locator: Locator,
  value: string,
  attempts = 4,
) => {
  await expect(locator).toBeVisible();
  await locator.click();
  for (let i = 0; i < attempts; i++) {
    await locator.fill('');
    await locator.pressSequentially(value, { delay: 10 });
    if ((await locator.inputValue()) === value) return;
    await locator.page().waitForTimeout(150);
  }
  await locator.fill(value);
  await expect(locator).toHaveValue(value);
};
