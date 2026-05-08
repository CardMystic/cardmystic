import { expect, test } from '@playwright/test';

import { gotoHydrated } from './utils/mocks';

/**
 * Phase 8 — maintenance mode banner.
 *
 * The banner is gated on `useRuntimeConfig().public.maintenanceMode`,
 * which on the client is hydrated from `window.__NUXT__.config.public`
 * embedded in the SSR HTML. Spinning up a second Nitro server with
 * `NUXT_PUBLIC_MAINTENANCE_MODE=enabled` for one test is heavyweight,
 * so instead we intercept the homepage HTML response and rewrite the
 * inlined maintenanceMode value to "enabled". The Vue runtime then
 * picks it up at hydration and renders the banner.
 */

test.describe('Maintenance banner', () => {
  test('renders when runtime config has maintenanceMode="enabled"', async ({
    page,
  }) => {
    await page.route('**/', async (route, request) => {
      // Only rewrite navigation requests for the homepage HTML; let
      // other resources pass through untouched.
      if (
        request.resourceType() !== 'document' ||
        !request.url().endsWith('/')
      ) {
        return route.fallback();
      }
      const response = await route.fetch();
      const body = await response.text();
      // Nitro serialises runtime config via `devalue`, which produces
      // unquoted keys (e.g. `maintenanceMode:"disabled"`). Match either
      // quoted or unquoted-key forms so the test isn't tied to one
      // serialiser.
      const patched = body
        .replace(/maintenanceMode:"[^"]*"/g, 'maintenanceMode:"enabled"')
        .replace(/"maintenanceMode":"[^"]*"/g, '"maintenanceMode":"enabled"');
      await route.fulfill({ response, body: patched });
    });

    await gotoHydrated(page, '/');

    await expect(
      page.getByText(/CardMystic is currently under maintenance/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
