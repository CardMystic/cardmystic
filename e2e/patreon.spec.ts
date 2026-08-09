import { BACKEND } from './utils/mocks';
import { expect, gotoHydrated, test } from './utils/fixtures';
import type { Page } from '@playwright/test';

/**
 * E2E coverage for the Patreon integration on the Account page.
 *
 * A real Patreon OAuth round-trip can't run in CI (same reason as the
 * Google OAuth flows — see e2e/utils/mocks.ts), so the backend's
 * `/patreon/*` endpoints are mocked with `page.route` and the authorize
 * redirect is intercepted. Everything else (Supabase session, account
 * page, profile query) runs against the real stack via `signedInPage`.
 *
 * Covered:
 *  - Not-connected state: Connect button + membership page link
 *  - Connected + active Featured tier: tier badge, no billing warning
 *  - Connected + declined patron: billing warning with "Update on Patreon"
 *  - Connect flow: POST /patreon/connect/start → browser navigates to the
 *    authorize URL → redirect back lands with ?patreon=connected → success
 *    toast shown and the query param is stripped
 *  - ?patreon=error on arrival shows the failure toast
 *  - Disconnect flow: DELETE /patreon/connect → status refetch flips the
 *    section back to the not-connected state
 */

const MEMBERSHIP_URL = 'https://www.patreon.com/c/thecardmystic/membership';

type PatreonStatus = {
  connected: boolean;
  tier: 'supporter' | 'featured' | null;
  patronStatus: 'active_patron' | 'declined_patron' | 'former_patron' | null;
  isFeatured: boolean;
  membershipUrl: string;
};

const NOT_CONNECTED: PatreonStatus = {
  connected: false,
  tier: null,
  patronStatus: null,
  isFeatured: false,
  membershipUrl: MEMBERSHIP_URL,
};

const ACTIVE_FEATURED: PatreonStatus = {
  connected: true,
  tier: 'featured',
  patronStatus: 'active_patron',
  isFeatured: true,
  membershipUrl: MEMBERSHIP_URL,
};

/**
 * Serves GET /patreon/status from a mutable holder so a test can flip
 * the connection state mid-test (e.g. after disconnecting).
 */
const mockPatreonStatus = async (
  page: Page,
  holder: { status: PatreonStatus },
) => {
  await page.route(`${BACKEND}/patreon/status`, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(holder.status),
    });
  });
};

const patreonSection = (page: Page) =>
  page
    .locator('section, div')
    .filter({ hasText: 'Patreon Membership' })
    .last();

test.describe('Patreon integration', () => {
  test('not connected: shows Connect button and membership page link', async ({
    signedInPage: page,
  }) => {
    await mockPatreonStatus(page, { status: NOT_CONNECTED });
    await gotoHydrated(page, '/user/account');

    const section = patreonSection(page);
    await expect(
      section.getByRole('button', { name: 'Connect to Patreon' }),
    ).toBeVisible();
    await expect(
      section.locator(`a[href="${MEMBERSHIP_URL}"]`).first(),
    ).toBeVisible();
    await expect(
      section.getByRole('button', { name: 'Disconnect Patreon' }),
    ).toHaveCount(0);
  });

  test('connected with active Featured tier: shows badge, no billing warning', async ({
    signedInPage: page,
  }) => {
    await mockPatreonStatus(page, { status: ACTIVE_FEATURED });
    await gotoHydrated(page, '/user/account');

    const section = patreonSection(page);
    await expect(section.getByText('Featured On Our Site')).toBeVisible();
    await expect(
      section.getByRole('button', { name: 'Disconnect Patreon' }),
    ).toBeVisible();
    await expect(section.getByText('Update on Patreon')).toHaveCount(0);
  });

  test('connected but payment declined: shows billing warning with Patreon link', async ({
    signedInPage: page,
  }) => {
    await mockPatreonStatus(page, {
      status: {
        ...ACTIVE_FEATURED,
        patronStatus: 'declined_patron',
        isFeatured: false,
      },
    });
    await gotoHydrated(page, '/user/account');

    const section = patreonSection(page);
    const warningLink = section.getByText('Update on Patreon');
    await expect(warningLink).toBeVisible();
    await expect(
      section.locator(`a[href="${MEMBERSHIP_URL}"]`).first(),
    ).toBeVisible();
  });

  test('connect flow: authorize redirect round-trip shows the success toast', async ({
    signedInPage: page,
  }) => {
    await mockPatreonStatus(page, { status: NOT_CONNECTED });

    await page.route(`${BACKEND}/patreon/connect/start`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authorizeUrl:
            'https://www.patreon.com/oauth2/authorize?client_id=e2e-test',
        }),
      }),
    );

    await gotoHydrated(page, '/user/account');

    // Simulate Patreon → backend callback → 302 back to the account page.
    const returnUrl = new URL('/user/account?patreon=connected', page.url());
    await page.route('https://www.patreon.com/oauth2/authorize**', (route) =>
      route.fulfill({
        status: 302,
        headers: { location: returnUrl.toString() },
      }),
    );

    await patreonSection(page)
      .getByRole('button', { name: 'Connect to Patreon' })
      .click();

    await expect(
      page.getByText('Patreon account connected!', { exact: true }),
    ).toBeVisible();
    // The ?patreon param is stripped after the toast fires.
    await expect
      .poll(() => new URL(page.url()).searchParams.get('patreon'))
      .toBeNull();
  });

  test('arriving with ?patreon=error shows the failure toast', async ({
    signedInPage: page,
  }) => {
    await mockPatreonStatus(page, { status: NOT_CONNECTED });
    await gotoHydrated(page, '/user/account?patreon=error');

    await expect(
      page.getByText('Failed to connect Patreon', { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => new URL(page.url()).searchParams.get('patreon'))
      .toBeNull();
  });

  test('disconnect flow: DELETE is sent and the section flips to not connected', async ({
    signedInPage: page,
  }) => {
    const holder = { status: ACTIVE_FEATURED };
    await mockPatreonStatus(page, holder);

    let disconnectCalled = false;
    await page.route(`${BACKEND}/patreon/connect`, (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      disconnectCalled = true;
      holder.status = NOT_CONNECTED; // refetch after invalidation sees this
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Patreon account disconnected' }),
      });
    });

    await gotoHydrated(page, '/user/account');

    const section = patreonSection(page);
    await section.getByRole('button', { name: 'Disconnect Patreon' }).click();

    await expect(
      page.getByText('Patreon account disconnected', { exact: true }),
    ).toBeVisible();
    expect(disconnectCalled).toBe(true);
    await expect(
      section.getByRole('button', { name: 'Connect to Patreon' }),
    ).toBeVisible();
  });
});
