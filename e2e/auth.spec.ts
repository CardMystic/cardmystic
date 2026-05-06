import { expect, test } from '@playwright/test';

import {
  BACKEND,
  SUPABASE,
  TEST_USER_EMAIL,
  TEST_USER_PASSWORD,
  fakeJwt,
  gotoHydrated,
  mockSupabaseAuth,
  reliableFill,
  setupRecaptchaStubs,
  waitForHydration,
} from './utils/mocks';

/**
 * E2E coverage for the auth surface.
 *
 * These are integration tests: they hit the real backend
 * (`api.next.cardmystic.com` on `dev`) and the real Supabase project.
 * The only stubs are the reCAPTCHA challenge + verify (impossible to
 * solve from headless Chromium) and Google OAuth (we can't round-trip
 * accounts.google.com in CI). See `e2e/utils/mocks.ts` for rationale.
 *
 * Tests that need a real signed-in session use the `E2E_TEST_EMAIL` /
 * `E2E_TEST_PASSWORD` Supabase test user. They skip cleanly if those
 * env vars aren't set (e.g. in fork PRs).
 */

const requireTestUser = () => {
  test.skip(
    !TEST_USER_EMAIL || !TEST_USER_PASSWORD,
    'E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set — skipping real-auth integration test',
  );
};

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await setupRecaptchaStubs(page);
  });

  test('renders Google + email options', async ({ page }) => {
    await gotoHydrated(page, '/login');

    await expect(
      page.getByRole('heading', { name: /sign in to cardmystic/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue with google/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
  });

  test('email login with wrong credentials surfaces the real backend error', async ({
    page,
  }) => {
    await gotoHydrated(page, '/login');
    await reliableFill(
      page.getByPlaceholder('Email'),
      'definitely-not-a-real-user@cardmystic.test',
    );
    await reliableFill(page.getByPlaceholder('Password'), 'wrong-password-xyz');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Real backend returns a Supabase-style error. Match loosely so we
    // tolerate minor copy changes upstream.
    await expect(
      page.getByText(/invalid|incorrect|credentials|unauthorized|email/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('email login with valid credentials redirects home and shows logged-in navbar', async ({
    page,
  }) => {
    requireTestUser();

    await gotoHydrated(page, '/login');
    await reliableFill(page.getByPlaceholder('Email'), TEST_USER_EMAIL);
    await reliableFill(page.getByPlaceholder('Password'), TEST_USER_PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL((url) => url.pathname === '/', { timeout: 20_000 });
    await expect(page.getByRole('button', { name: /^login$/i })).toHaveCount(0);
  });
});

test.describe('Google OAuth', () => {
  test.beforeEach(async ({ page }) => {
    await setupRecaptchaStubs(page);
  });

  test('clicking "Continue with Google" navigates to Supabase OAuth endpoint', async ({
    page,
  }) => {
    let authorizeUrl: string | null = null;
    await page.route(`${SUPABASE}/auth/v1/authorize**`, (route, request) => {
      authorizeUrl = request.url();
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>oauth-stub</body></html>',
      });
    });

    await gotoHydrated(page, '/login');
    await page.getByRole('button', { name: /continue with google/i }).click();

    await expect
      .poll(() => authorizeUrl, { timeout: 15_000 })
      .toContain('provider=google');
    expect(authorizeUrl).toMatch(/\/auth\/v1\/authorize/);
  });

  test('OAuth callback hash is captured and establishes a session (regression: Vue Router race)', async ({
    page,
  }) => {
    // Purely client-side hash-fragment handling in plugins/auth.client.ts.
    // We mock Supabase to accept our synthetic JWT instead of round-
    // tripping a real OAuth flow.
    await mockSupabaseAuth(page);

    const hash =
      `#access_token=${fakeJwt()}` +
      `&refresh_token=fake-refresh-token` +
      `&expires_in=3600` +
      `&expires_at=${Math.floor(Date.now() / 1000) + 3600}` +
      `&token_type=bearer`;

    await page.goto(`/${hash}`);
    await waitForHydration(page);

    await expect
      .poll(
        async () =>
          page.evaluate(() =>
            Object.keys(localStorage).filter((k) => k.startsWith('sb-')),
          ),
        { timeout: 15_000 },
      )
      .not.toEqual([]);

    await expect(page.getByRole('button', { name: /^login$/i })).toHaveCount(0);
  });
});

test.describe('Register page', () => {
  test.beforeEach(async ({ page }) => {
    await setupRecaptchaStubs(page);
  });

  test('renders Google + email options', async ({ page }) => {
    await gotoHydrated(page, '/register');

    await expect(
      page.getByRole('heading', { name: /create your cardmystic account/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /continue with google/i }),
    ).toBeVisible();
  });

  test('rejects mismatched passwords without hitting backend', async ({
    page,
  }) => {
    // Validation runs entirely client-side. We stub /user/signup so a
    // regression that lets validation through still won't pollute the
    // real Supabase project with junk users.
    let signupCalled = false;
    await page.route(`${BACKEND}/user/signup`, (route) => {
      signupCalled = true;
      route.fulfill({ status: 500, body: '' });
    });

    await gotoHydrated(page, '/register');
    await reliableFill(page.getByPlaceholder('Email'), 'new@example.com');
    await reliableFill(
      page.getByPlaceholder('Password', { exact: true }),
      'GoodPassword1!',
    );
    await reliableFill(
      page.getByPlaceholder('Confirm Password'),
      'DifferentPassword2!',
    );
    await page.getByRole('button', { name: /^create account$/i }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    expect(signupCalled).toBe(false);
  });

  test('rejects weak passwords without hitting backend', async ({ page }) => {
    let signupCalled = false;
    await page.route(`${BACKEND}/user/signup`, (route) => {
      signupCalled = true;
      route.fulfill({ status: 500, body: '' });
    });

    await gotoHydrated(page, '/register');
    await reliableFill(page.getByPlaceholder('Email'), 'new@example.com');
    await reliableFill(
      page.getByPlaceholder('Password', { exact: true }),
      'weak',
    );
    await reliableFill(page.getByPlaceholder('Confirm Password'), 'weak');
    await page.getByRole('button', { name: /^create account$/i }).click();

    // Wording lives in useUserProfile.validatePasswordPolicy; match
    // loosely on common keywords from any rule violation.
    await expect(
      page
        .getByText(/at least 8 characters|uppercase|lowercase|number|special/i)
        .first(),
    ).toBeVisible();
    expect(signupCalled).toBe(false);
  });
});

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await setupRecaptchaStubs(page);
  });

  test('signing out clears the session and restores the Login button', async ({
    page,
  }) => {
    requireTestUser();

    await gotoHydrated(page, '/login');
    await reliableFill(page.getByPlaceholder('Email'), TEST_USER_EMAIL);
    await reliableFill(page.getByPlaceholder('Password'), TEST_USER_PASSWORD);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL((url) => url.pathname === '/', { timeout: 20_000 });

    // The Logout button lives inside the Profile popover. The popover
    // trigger is the cursor-pointer div wrapping the avatar img (or the
    // "Profile" UButton when there's no avatar). Click via the alt-text
    // image's parent so the Nuxt UI popover handler actually fires.
    const trigger = page
      .locator(
        'header div.cursor-pointer:has(img[alt]):visible, header button:has-text("Profile"):visible',
      )
      .first();
    await trigger.click();
    await page
      .getByRole('button', { name: /^logout$/i })
      .first()
      .click();

    await expect(
      page.getByRole('button', { name: /^login$/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () =>
        page.evaluate(() =>
          Object.keys(localStorage).filter((k) => k.startsWith('sb-')),
        ),
      )
      .toEqual([]);
  });
});
