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

// Always run e2e against the built Nuxt server (Nitro on port 3000).
// Vite dev mode streams chunks lazily and was the source of multi-minute
// CI runs and flaky hydration races, so we never use it for tests.
//
// Set PLAYWRIGHT_SKIP_BUILD=1 to skip the build step (CI builds in a
// dedicated step so build failures surface directly instead of being
// hidden inside Playwright's webServer output).
const isCI = !!process.env.CI;
const PORT = 3000;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const SERVER_COMMAND = process.env.PLAYWRIGHT_SKIP_BUILD
  ? 'node .output/server/index.mjs'
  : 'pnpm build && node .output/server/index.mjs';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // Built app handles concurrency well; bump workers if the suite grows
  // and CI starts feeling slow again.
  workers: isCI ? 1 : 2,
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
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
  // Reused if already running locally so devs can iterate quickly with
  // `pnpm test:e2e:ui` (start the built server once in another terminal
  // with `node .output/server/index.mjs`). CI always builds fresh.
  webServer: {
    command: SERVER_COMMAND,
    url: BASE_URL,
    reuseExistingServer: !isCI,
    // Cold builds can take ~30s; bump generously so flaky CI runners
    // don't time out before Nitro is ready.
    timeout: 300_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...TEST_PUBLIC_ENV, PORT: String(PORT), HOST: '127.0.0.1' },
  },
});
