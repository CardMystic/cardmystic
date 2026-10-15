import { expect, test } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  FAKE_USER,
  fakeJwt,
  mockSupabaseAuth,
  gotoHydrated,
} from './utils/mocks';

const access = {
  enabled: true,
  authenticated: false,
  tier: 'normal',
  enhancedRemaining: 10,
  enhancedTopUpRemaining: 0,
  resetsAt: '2026-10-15T00:00:00Z',
};
test('guest can see pricing, free allowance, and the Normal fallback without hydration errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text());
  });
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({ json: access }),
  );
  await page.route(`${BACKEND}/search/colbert`, (route) =>
    route.fulfill({
      json: [],
      headers: {
        'x-search-access': JSON.stringify({
          ...access,
          enhancedRemaining: 0,
          effectiveMode: 'normal',
          reason: 'allowance_exhausted',
        }),
      },
    }),
  );
  await gotoHydrated(page, '/memberships');
  await expect(
    page.getByRole('heading', { name: 'CardMystic Enhanced', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Sign in to choose Enhanced' }),
  ).toHaveAttribute('href', '/user/login?redirect=/memberships');
  await expect(page.locator('.membership-price')).toContainText('$7');
  await page.screenshot({
    path: '.cache/membership-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: '.cache/membership-mobile.png',
    fullPage: true,
  });
  await gotoHydrated(page, '/search/all/smart');
  await expect(
    page.getByText(/10 Enhanced searches left today/).first(),
  ).toBeVisible();
  await gotoHydrated(page, '/search/all/smart?query=cards+that+draw+cards');
  await expect(
    page.getByText('Search mode switched to Normal', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Search mode', exact: true }),
  ).toContainText('Normal');
  await expect(page).toHaveURL(/useRerank=false/);
  expect(errors).toEqual([]);
});

test('signed-in checkout uses the gateway token, rejects unsafe redirects, and opens Stripe', async ({
  page,
}) => {
  await mockSupabaseAuth(page);
  await page.route(`${SUPABASE}/rest/v1/profiles**`, (route) =>
    route.fulfill({
      json: {
        id: FAKE_USER.id,
        username: 'BillingTester',
        avatar_card_name: null,
      },
    }),
  );
  await page.route(`${BACKEND}/user/ping`, (route) =>
    route.fulfill({ json: {} }),
  );
  await page.addInitScript(
    ({ key, session }) => localStorage.setItem(key, JSON.stringify(session)),
    {
      key: `sb-${new URL(SUPABASE).hostname.split('.')[0]}-auth-token`,
      session: {
        access_token: fakeJwt(),
        refresh_token: 'fake-refresh',
        token_type: 'bearer',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        user: FAKE_USER,
      },
    },
  );
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({ json: { ...access, authenticated: true } }),
  );
  await page.route(`${BACKEND}/billing/status`, (route) =>
    route.fulfill({
      json: {
        enabled: true,
        status: 'none',
        tier: 'normal',
        canManage: false,
        hasSubscription: false,
        trialEligible: true,
        enhancedAvailable: true,
        enhancedTopUpAvailable: true,
      },
    }),
  );
  let unsafe = true;
  await page.route(`${BACKEND}/billing/checkout`, (route) => {
    expect(route.request().headers()['x-cardmystic-authorization']).toContain(
      'Bearer ',
    );
    expect(route.request().postDataJSON()).toEqual({ product: 'enhanced' });
    return route.fulfill({
      json: {
        url: unsafe
          ? 'https://example.org/steal'
          : 'https://checkout.stripe.com/c/pay/test',
      },
    });
  });
  await page.route('https://checkout.stripe.com/c/pay/test', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Test Checkout</h1>' }),
  );
  await gotoHydrated(page, '/memberships?billing=success');
  await expect(page.getByText('Current search membership: Free')).toBeVisible();
  const checkout = page.getByRole('button', {
    name: 'Start Enhanced free month',
  });
  await checkout.click();
  await expect(page.getByRole('alert')).toContainText(
    'Invalid Stripe destination',
  );
  unsafe = false;
  await checkout.click();
  await expect(page).toHaveURL('https://checkout.stripe.com/c/pay/test');
});
