import { expect, test } from '@playwright/test';
import { gotoHydrated } from './utils/mocks';

const policies = [
  { path: '/terms', title: 'Terms of Service', section: 'Your account' },
  {
    path: '/billing-policy',
    title: 'Billing, Cancellation & Refunds',
    section: 'Delivery and fulfillment',
  },
  {
    path: '/privacyPolicy',
    title: 'Privacy Policy',
    section: 'Payments through Stripe and Link',
  },
];

test.describe('Public policy documents', () => {
  test.use({ javaScriptEnabled: false });

  test('policies render their content and metadata without JavaScript or an account', async ({
    page,
  }) => {
    for (const { path, title, section } of policies) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(`${title} | CardMystic`);
      await expect(
        page.getByRole('heading', { name: title, exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: section, exact: true }),
      ).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://cardmystic.com${path}`,
      );
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /CardMystic/,
      );
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        `${title} | CardMystic`,
      );
    }
  });
});

test('mobile footer links reach every policy and billing help is available to guests', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoHydrated(page, '/terms');
  await page
    .getByRole('region', { name: 'Cookie preferences' })
    .getByRole('button', { name: 'Reject all', exact: true })
    .click();
  const footer = page.getByRole('navigation', { name: 'CardMystic policies' });
  for (const { path, title } of policies) {
    const link = footer.locator(`a[href="${path}"]`);
    await expect(link).toHaveCount(1);
    await link.click();
    await expect(page).toHaveURL(path);
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
  }
  await footer.getByRole('link', { name: 'Billing & Refunds' }).click();
  const content = page.getByRole('article');
  await expect(content).toContainText(
    'We review refund requests case by case.',
  );
  await expect(
    content.getByRole('heading', { name: 'How to cancel', exact: true }),
  ).toBeVisible();
  await expect(
    content.getByRole('link', { name: 'Membership page', exact: true }).first(),
  ).toHaveAttribute('href', '/memberships');
  await expect(
    content
      .getByRole('link', { name: 'thecardmystic@gmail.com', exact: true })
      .first(),
  ).toHaveAttribute('href', 'mailto:thecardmystic@gmail.com');
  await page.screenshot({
    path: '.cache/billing-policy-mobile.png',
    fullPage: true,
  });
});
