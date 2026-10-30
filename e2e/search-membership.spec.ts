import { expect, test } from '@playwright/test';
import { BACKEND, mockSignedInUser, gotoHydrated } from './utils/mocks';

const access = {
  enabled: true,
  authenticated: true,
  tier: 'normal',
  enhancedRemaining: 10,
  enhancedTopUpRemaining: 0,
  resetsAt: '2026-10-15T00:00:00Z',
};
test('guest sees pricing and Normal search with a sign-in link without hydration errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) errors.push(message.text());
  });
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({
      json: {
        ...access,
        authenticated: false,
        enhancedRemaining: 0,
        resetsAt: null,
      },
    }),
  );
  await page.route(`${BACKEND}/search/colbert`, (route) => {
    expect(route.request().headers()['content-type']).toBe('application/json');
    expect(route.request().postDataJSON().useRerank).toBe(false);
    return route.fulfill({
      json: [],
      headers: {
        'x-search-access': JSON.stringify({
          ...access,
          enhancedRemaining: 0,
          effectiveMode: 'normal',
          reason: 'sign_in_required',
        }),
      },
    });
  });
  await gotoHydrated(page, '/memberships');
  await expect(
    page.getByRole('heading', { name: 'CardMystic Enhanced', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Sign in to choose Enhanced' }),
  ).toHaveAttribute('href', '/user/login?redirect=/memberships');
  await expect(page.locator('.membership-price')).toContainText('$4.99');
  for (const [name, href] of [
    ['Terms of Service', '/terms'],
    ['Billing & Refunds', '/billing-policy'],
    ['Privacy Policy', '/privacyPolicy'],
  ]) {
    await expect(
      page
        .locator('.membership-muted')
        .getByRole('link', { name, exact: true }),
    ).toHaveAttribute('href', href);
  }
  await expect(page.locator('.membership-features')).toContainText(
    'Unlimited Enhanced searches',
  );
  await expect(page.locator('.membership-plan')).not.toContainText(
    '30% cheaper',
  );
  await expect(page.locator('.membership-topups')).toContainText(
    'Or one time purchase:',
  );
  await expect(
    page.getByText('Compare all features', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('.membership-current')).toContainText(
    /Current Search Membership: Free\s*\|\s*Sign in for enhanced searches/,
  );
  await expect(
    page.getByRole('button', { name: 'Refresh search membership' }),
  ).toHaveText('');
  await expect(
    page.locator('.membership-plan-action + .search-evidence'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Buy 500 Enhanced searches for $4.99' }),
  ).toHaveAttribute('href', '/user/login?redirect=/memberships');
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
  await gotoHydrated(page, '/search/all/smart?query=draw+cards&useRerank=true');
  const mode = page.getByRole('combobox', { name: 'Search mode', exact: true });
  await expect(mode).toContainText('Normal');
  const link = page.getByRole('link', {
    name: 'Sign in for enhanced searches',
    exact: true,
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /\/user\/login\?redirect=/);
  await expect(
    page.getByRole('dialog', { name: 'Search mode switched to Normal' }),
  ).not.toBeVisible();
  await mode.click();
  await expect(
    page.getByRole('option', { name: 'Enhanced', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: '.cache/guest-search-mobile.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

for (const action of ['close', 'upgrade'] as const) {
  test(`Normal fallback modal can ${action}`, async ({ page }) => {
    await mockSignedInUser(page);
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
    await gotoHydrated(page, '/search/all/smart?query=draw+cards');
    const modal = page.getByRole('dialog', {
      name: 'Search mode switched to Normal',
    });
    await expect(modal).toBeVisible();
    await expect(page).toHaveURL(/useRerank=false/);
    if (action === 'upgrade') {
      await page.screenshot({
        path: '.cache/search-mode-modal-desktop.png',
        fullPage: true,
      });
      await modal.getByRole('link', { name: 'Upgrade', exact: true }).click();
      await expect(page).toHaveURL(/\/memberships$/);
      await expect(
        page.getByRole('heading', { name: 'CardMystic Enhanced', exact: true }),
      ).toBeVisible();
    } else {
      await modal
        .getByRole('button', { name: 'Continue on Normal and close' })
        .click();
      await expect(page).toHaveURL(
        /\/search\/all\/smart\?query=draw\+cards&useRerank=false$/,
      );
      await expect(
        page.getByRole('combobox', { name: 'Search mode', exact: true }),
      ).toContainText('Normal');
    }
    await expect(modal).not.toBeVisible();
  });
}

test('search allowance can recover from a failed lookup beside the mode selector', async ({
  page,
}) => {
  await mockSignedInUser(page);
  let available = false;
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill(
      available
        ? {
            json: {
              ...access,
              tier: 'enhanced',
              authenticated: true,
              enhancedRemaining: null,
              resetsAt: null,
              enhancedTopUpRemaining: 42,
            },
          }
        : { status: 503, json: { message: 'Temporarily unavailable' } },
    ),
  );
  await gotoHydrated(page, '/search/all/smart');
  const mode = page.getByRole('combobox', { name: 'Search mode', exact: true });
  const description = page.locator(
    `[id="${await mode.getAttribute('aria-describedby')}"]`,
  );
  await expect(description).toContainText(
    'Search allowance could not be checked.',
  );
  available = true;
  await page.getByRole('button', { name: 'Retry allowance' }).click();
  await expect(description).toHaveText('Unlimited | Memberships');
  await mode.click();
  await page.getByRole('option', { name: 'Normal', exact: true }).click();
  await expect(description).toHaveText('Unlimited | Memberships');
  await expect(
    page.getByRole('button', { name: 'Retry allowance' }),
  ).toHaveCount(0);
});

test('signed-in checkout uses the gateway token, rejects unsafe redirects, and opens Stripe', async ({
  page,
}) => {
  await mockSignedInUser(page);
  let subscribed = false;
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({
      json: {
        ...access,
        authenticated: true,
        ...(subscribed
          ? {
              tier: 'enhanced',
              enhancedRemaining: null,
              resetsAt: null,
              enhancedTopUpRemaining: 42,
            }
          : {}),
      },
    }),
  );
  await page.route(`${BACKEND}/billing/status`, (route) =>
    route.fulfill({
      json: {
        enabled: true,
        status: subscribed ? 'trialing' : 'none',
        tier: subscribed ? 'enhanced' : 'normal',
        canManage: subscribed,
        hasSubscription: subscribed,
        trialEligible: !subscribed,
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
  await expect(page.locator('.membership-current')).toContainText(
    /Current Search Membership: Free\s*\|\s*10 left today/,
  );
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
  subscribed = true;
  await gotoHydrated(page, '/memberships?billing=success');
  await expect(page.locator('.membership-current')).toContainText(
    /Current Search Membership: Enhanced\s*\|\s*Unlimited Enhanced searches\s*\|\s*42 purchased/,
  );
  await expect(page.locator('.membership-current')).not.toContainText(
    'left this month',
  );
});

test('free search status shows the available count without repeating the mode', async ({
  page,
}) => {
  await mockSignedInUser(page);
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({ json: access }),
  );
  await gotoHydrated(page, '/search/all/smart');
  const mode = page.getByRole('combobox', { name: 'Search mode', exact: true });
  const description = page.locator(
    `[id="${await mode.getAttribute('aria-describedby')}"]`,
  );
  await expect(description).toHaveText('10 Left | Memberships');
});
