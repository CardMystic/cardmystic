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
  let guestAccessRequests = 0;
  await page.route(`${BACKEND}/search-access`, (route) => {
    guestAccessRequests++;
    return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
  });
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
  await page.getByRole('button', { name: 'Reject all', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'CardMystic Pro', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Sign in to choose CardMystic Pro' }),
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
  await expect(page.locator('.membership-features')).toHaveText(
    'Unlimited Pro Searches & Access to All Pro Features (See Below)',
  );
  const artwork = page.getByRole('img', {
    name: 'CardMystic Pro',
    exact: true,
  });
  await expect(artwork).toHaveJSProperty('naturalWidth', 448);
  await expect(artwork).toHaveAttribute('src', '/images/cardmystic-pro.svg');
  const features = page.getByRole('table', {
    name: 'Free and CardMystic Pro features',
  });
  await expect(
    features.getByRole('row', { name: /^Pro search / }),
  ).toContainText('10 per day, plus purchased credits');
  for (const name of [
    'Normal searches',
    'Similar card search',
    'Deck recommendations',
    'Highlight cards owned in a collection',
  ]) {
    await expect(
      features
        .getByRole('row', { name: new RegExp(`^${name} `) })
        .locator('.text-green-500'),
    ).toHaveCount(2);
  }
  await expect(features).not.toContainText('Unlimited');
  const rows = features.locator('tbody tr');
  const firstProRow = (await rows.allTextContents()).findIndex((text) =>
    text.includes('Not included'),
  );
  expect(firstProRow).toBeGreaterThan(1);
  for (let index = firstProRow; index < (await rows.count()); index++) {
    await expect(rows.nth(index).getByRole('cell').first()).toHaveText(
      'Not included',
    );
    await expect(rows.nth(index).locator('.text-red-500')).toHaveCount(1);
    await expect(rows.nth(index).locator('.text-green-500')).toHaveCount(1);
  }
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
    /Current Search Membership: Free\s*\|\s*Sign in for Pro searches/,
  );
  await expect(
    page.getByRole('button', { name: 'Refresh search membership' }),
  ).toHaveText('');
  await page.getByRole('button', { name: 'Refresh search membership' }).click();
  await expect(page.locator('.membership-current')).toContainText('Free');
  await expect(page.locator('.membership-account [role="alert"]')).toHaveCount(
    0,
  );
  await expect(
    page.locator('.membership-plan-action + .search-evidence'),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Buy 500 Pro searches for $4.99' }),
  ).toHaveAttribute('href', '/user/login?redirect=/memberships');
  await page.screenshot({
    path: '.cache/membership-desktop.png',
    fullPage: true,
  });
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    // Body overflow can be hidden while the grid's contents are still clipped.
    for (const selector of [
      '.membership-account',
      '.membership-plan',
      '.evidence-chart',
      '#plan-features-title + div',
    ]) {
      await expect(async () => {
        const bounds = await page.locator(selector).boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      }).toPass();
    }
    const comparison = page.locator('#plan-features-title + div');
    await comparison.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    await expect(async () => {
      const edge = await comparison.evaluate((element) => {
        const table = element.querySelector('table')!;
        return table.getBoundingClientRect().right;
      });
      expect(edge).toBeLessThanOrEqual(width);
    }).toPass();
  }
  await page.screenshot({
    path: '.cache/membership-mobile.png',
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({
    path: '.cache/membership-mobile-dark.png',
    fullPage: true,
  });
  await gotoHydrated(page, '/search/all/smart?query=draw+cards&useRerank=true');
  const mode = page.getByRole('combobox', { name: 'Search mode', exact: true });
  await expect(mode).toContainText('Normal');
  await expect(page.getByText('Search mode', { exact: true })).toHaveCount(0);
  const link = page.getByRole('link', {
    name: 'Sign in for Pro searches',
    exact: true,
  });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', /\/user\/login\?redirect=/);
  await expect(
    page.getByRole('dialog', { name: 'Search mode switched to Normal' }),
  ).not.toBeVisible();
  await mode.click();
  await expect(
    page.getByRole('option', { name: 'Pro', exact: true }),
  ).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  await page.screenshot({
    path: '.cache/guest-search-mobile.png',
    fullPage: true,
  });
  expect(guestAccessRequests).toBe(0);
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
        page.getByRole('heading', { name: 'CardMystic Pro', exact: true }),
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
  await expect(description).toHaveCount(0);
  await expect(mode).not.toHaveAttribute('aria-describedby');
  await mode.click();
  await page.getByRole('option', { name: 'Normal', exact: true }).click();
  await expect(description).toHaveCount(0);
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
    name: 'Start CardMystic Pro free month',
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
  await expect(page.locator('.membership-current')).toHaveText(
    'Current Search Membership: CardMystic Pro',
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

test('complimentary Pro shows unlimited access without offering another subscription', async ({
  page,
}) => {
  await mockSignedInUser(page);
  await page.route(`${BACKEND}/search-access`, (route) =>
    route.fulfill({
      json: {
        ...access,
        tier: 'enhanced',
        enhancedRemaining: null,
        resetsAt: null,
      },
    }),
  );
  await page.route(`${BACKEND}/billing/status`, (route) =>
    route.fulfill({
      json: {
        enabled: true,
        status: 'complimentary',
        tier: 'enhanced',
        canManage: false,
        hasSubscription: false,
        trialEligible: false,
        enhancedAvailable: true,
        enhancedTopUpAvailable: true,
      },
    }),
  );
  await gotoHydrated(page, '/memberships');
  await expect(page.locator('.membership-current')).toHaveText(
    'Current Search Membership: CardMystic Pro',
  );
  await expect(
    page.getByText(
      'Your account has permanent complimentary CardMystic Pro access.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.locator('.membership-features + p')).toHaveText(
    'Your current plan · Complimentary access',
  );
  await expect(page.getByText('Current plan', { exact: true })).toHaveCount(0);
  await expect(page.locator('.membership-plan-action')).toHaveCount(0);
});
