import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env.test for local runs (gitignored). CI provides values via
// the workflow's `env:` block. We load BEFORE reading process.env below
// so dotenv values become defaults that an exported shell var can still
// override.
dotenv.config({ path: '.env.test' });

/**
 * Playwright config for CardMystic end-to-end tests.
 *
 * Tests run against a local Nuxt dev server which Playwright spins up
 * automatically. CI uses the same flow, just headless.
 *
 * These are integration e2e tests: by default they hit the REAL backend
 * (`api.next.cardmystic.com` for the `dev` branch) and the real Supabase
 * project. Only things that can't be reached deterministically from a
 * headless browser are stubbed (reCAPTCHA challenge, Google OAuth
 * round-trip). See `e2e/utils/mocks.ts`.
 *
 * Override any of the public env vars by exporting `E2E_PUBLIC_*` before
 * running, e.g. to point at prod or a local backend.
 */

// Test public config. Defaults match the `dev` branch deploy targets so
// CI runs validate the latest of all 3 containers (frontend, backend,
// research) deployed to *.next.cardmystic.com together.
const TEST_PUBLIC_ENV: Record<string, string> = {
  NUXT_PUBLIC_SUPABASE_URL:
    process.env.E2E_PUBLIC_SUPABASE_URL ??
    process.env.NUXT_PUBLIC_SUPABASE_URL ??
    'https://ddbgietanhxrozzmogur.supabase.co',
  NUXT_PUBLIC_SUPABASE_KEY:
    process.env.E2E_PUBLIC_SUPABASE_KEY ??
    process.env.NUXT_PUBLIC_SUPABASE_KEY ??
    'test-anon-key',
  NUXT_PUBLIC_RECAPTCHA_SITE_KEY:
    process.env.E2E_PUBLIC_RECAPTCHA_SITE_KEY ??
    process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY ??
    'test-recaptcha-site-key',
  NUXT_PUBLIC_BACKEND_URL:
    process.env.E2E_PUBLIC_BACKEND_URL ??
    process.env.NUXT_PUBLIC_BACKEND_URL ??
    'https://api.next.cardmystic.com',
};

// Mirror these into the test runner's process.env so mocks.ts reads the
// same values as the dev server.
for (const [key, value] of Object.entries(TEST_PUBLIC_ENV)) {
  process.env[key] = value;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Single worker by default. The Nuxt dev server (Vite) is heavy and
  // gets flaky under concurrent navigations on this app, especially on
  // first-load when SSR has to compile every page on demand.
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Spin up the Nuxt dev server before running tests. Reused if already
  // running locally so devs can iterate quickly with `pnpm test:e2e:ui`.
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: TEST_PUBLIC_ENV,
  },
});
