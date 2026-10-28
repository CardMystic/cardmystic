import {
  BACKEND,
  SUPABASE,
  mockSignedInUser,
  gotoHydrated,
} from './utils/mocks';
import { expect, test } from '@playwright/test';

test('slow session validation keeps the signed-in user on Account', async ({
  page,
}) => {
  await mockSignedInUser(page);
  await page.route(`${SUPABASE}/auth/v1/user`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    // Exercise session validation beyond the former three-second guard.
    await new Promise((resolve) => setTimeout(resolve, 4_000));
    await route.fallback();
  });

  await gotoHydrated(page, '/user/account');

  await expect(page).toHaveURL(/\/user\/account$/);
  await expect(
    page.getByRole('heading', { name: 'Update Username', exact: true }),
  ).toBeVisible();
});

for (const scenario of [
  { name: 'desktop', width: 1280, height: 900, tier: 'enhanced' },
  { name: 'mobile', width: 390, height: 844, tier: 'normal' },
] as const) {
  test(`account shows following and membership on ${scenario.name}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({
      width: scenario.width,
      height: scenario.height,
    });
    await mockSignedInUser(page);
    let users = Array.from({ length: 13 }, (_, index) => ({
      id: `followed-${index}`,
      username: `Player ${index + 1}`,
      avatar_card_name: null,
      is_featured: false,
      follower_count: 1,
    }));
    await page.route(`${BACKEND}/user/account-stats`, (route) =>
      route.fulfill({
        json: {
          deckCount: 7,
          publicDeckCount: 6,
          totalLikes: 2,
          totalSaves: 1,
          totalComments: 1,
          totalViews: 271,
          followerCount: 1,
          followingCount: users.length,
          memberSince: '2026-06-26T00:00:00Z',
        },
      }),
    );
    await page.route(`${BACKEND}/user/following?**`, (route) =>
      route.fulfill({ json: { users, nextCursor: null } }),
    );
    await page.route(`${BACKEND}/user/follow/*`, (route) => {
      const id = route.request().url().split('/').pop();
      users = users.filter((user) => user.id !== id);
      return route.fulfill({ json: { following: false, follower_count: 0 } });
    });
    await page.route(`${BACKEND}/search-access`, (route) =>
      route.fulfill({
        json: {
          enabled: true,
          authenticated: true,
          tier: scenario.tier,
          enhancedRemaining: scenario.tier === 'enhanced' ? null : 7,
          enhancedTopUpRemaining: 500,
          resetsAt: null,
        },
      }),
    );
    await gotoHydrated(page, '/user/account');
    await page.getByRole('button', { name: 'Reject all', exact: true }).click();
    const following = page.getByRole('region', {
      name: 'Following',
      exact: true,
    });
    const membership = page.getByRole('region', {
      name: 'Your membership',
      exact: true,
    });
    await expect(
      following.getByRole('link', { name: 'Player 1 1 follower', exact: true }),
    ).toBeVisible();
    await expect(
      following.getByRole('button', { name: 'Unfollow', exact: true }),
    ).toHaveCount(13);
    // A visible DOM child alone doesn't catch clipping by a collapsed card.
    const followingBox = await following.boundingBox();
    expect(followingBox!.height).toBeGreaterThan(200);
    await expect(
      membership.getByText(
        scenario.tier === 'enhanced'
          ? 'Unlimited Enhanced searches.'
          : '7 free Enhanced searches left today.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      membership.getByText('500 purchased search credits remaining.'),
    ).toBeVisible();
    await expect(
      membership.getByRole('link', { name: 'Search membership and billing' }),
    ).toHaveAttribute('href', '/memberships');
    const membershipBox = await membership.boundingBox();
    if (scenario.name === 'desktop') {
      expect(membershipBox!.x).toBeGreaterThan(followingBox!.x);
      expect(Math.abs(membershipBox!.y - followingBox!.y)).toBeLessThan(2);
    } else {
      const profileBox = await page
        .getByRole('region', { name: 'Account info', exact: true })
        .boundingBox();
      const statsBox = await page
        .getByRole('region', { name: 'Account stats', exact: true })
        .boundingBox();
      expect(statsBox!.y).toBeGreaterThanOrEqual(
        profileBox!.y + profileBox!.height,
      );
      expect(followingBox!.y).toBeGreaterThanOrEqual(
        statsBox!.y + statsBox!.height,
      );
      expect(membershipBox!.y).toBeGreaterThanOrEqual(
        followingBox!.y + followingBox!.height,
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`account-${scenario.name}.png`),
      fullPage: true,
    });
    await following
      .getByRole('button', { name: 'Unfollow', exact: true })
      .first()
      .click();
    await expect(
      following.getByRole('button', { name: 'Unfollow', exact: true }),
    ).toHaveCount(12);
    await expect(
      following.getByRole('link', { name: 'Player 1 1 follower', exact: true }),
    ).toHaveCount(0);
  });
}

test('account retries a failed membership lookup without showing a false tier', async ({
  page,
}) => {
  await mockSignedInUser(page);
  let failed = true;
  await page.route(`${BACKEND}/search-access`, (route) =>
    failed
      ? route.fulfill({ status: 503, json: { message: 'Unavailable' } })
      : route.fulfill({
          json: {
            enabled: true,
            authenticated: true,
            tier: 'enhanced',
            enhancedRemaining: null,
            enhancedTopUpRemaining: 0,
            resetsAt: null,
          },
        }),
  );
  await page.route(`${BACKEND}/user/following?**`, (route) =>
    route.fulfill({ json: { users: [], nextCursor: null } }),
  );
  await gotoHydrated(page, '/user/account');
  const membership = page.getByRole('region', {
    name: 'Your membership',
    exact: true,
  });
  await expect(
    membership.getByText("We couldn't check your membership."),
  ).toBeVisible();
  await expect(membership.getByText('Normal', { exact: true })).toHaveCount(0);
  failed = false;
  await membership.getByRole('button', { name: 'Retry membership' }).click();
  await expect(
    membership.getByText('Unlimited Enhanced searches.'),
  ).toBeVisible();
});
