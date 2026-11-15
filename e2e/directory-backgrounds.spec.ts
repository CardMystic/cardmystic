import { expect, test } from '@playwright/test';
import {
  BACKEND,
  SUPABASE,
  gotoHydrated,
  waitForHydration,
} from './utils/mocks';

const pages = [
  ['/explore/decklists', 'liliana-of-the-veil'],
  ['/explore/users', 'liliana-of-the-veil'],
  ['/explore/articles', 'liliana-of-the-veil'],
  ['/roles', 'urza-lord-high-artificer'],
  ['/themes', 'urza-lord-high-artificer'],
  ['/sets', 'urza-lord-high-artificer'],
] as const;

for (const [path, art] of pages.filter(
  ([path]) => path === '/sets' || path === '/explore/users',
)) {
  test(`${path} renders its artwork on direct load and reload`, async ({
    page,
  }) => {
    const hydrationMessages: string[] = [];
    page.on('console', (message) => {
      if (
        /hydrat/i.test(message.text()) &&
        ['error', 'warning'].includes(message.type())
      )
        hydrationMessages.push(message.text());
    });
    page.on('pageerror', (error) => hydrationMessages.push(error.message));
    for (const navigate of [() => page.goto(path), () => page.reload()]) {
      const response = await navigate();
      expect(response?.ok()).toBe(true);
      expect(await response!.text()).toMatch(
        new RegExp(`<img[^>]+src="/_nuxt/[^"]*${art}[^"]*\\.webp"`),
      );
      await waitForHydration(page);
      await expect(
        page.locator('.search-background-header img'),
      ).toHaveAttribute('src', new RegExp(art));
    }
    expect(hydrationMessages).toEqual([]);
  });
}

test('directory backgrounds use bundled art and stay behind usable headers on mobile and desktop', async ({
  page,
}) => {
  await page.route(BACKEND + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(SUPABASE + '/**', (route) => route.fulfill({ json: [] }));
  await page.route(BACKEND + '/card-collections', (route) =>
    route.fulfill({ json: { sets: [], themes: [], roles: [] } }),
  );
  await gotoHydrated(page, '/about');
  for (const width of [390, 1440, 2790]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, art] of pages) {
      await page.evaluate((path) => {
        const root = document.getElementById('__nuxt') as unknown as {
          __vue_app__: {
            config: {
              globalProperties: {
                $router: { push: (path: string) => Promise<unknown> };
              };
            };
          };
        };
        return root.__vue_app__.config.globalProperties.$router.push(path);
      }, path);
      const background = page.locator('.search-background-header');
      const image = background.locator('img');
      await expect(image).toHaveAttribute(
        'src',
        new RegExp(
          `/_nuxt/(?:assets/images/search-backgrounds/)?${art}.*\\.webp`,
        ),
      );
      await expect
        .poll(() =>
          image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0);
      await expect(background).toHaveCSS('pointer-events', 'none');
      await expect(image).toHaveCSS('filter', 'blur(16px)');
      await expect(background).toHaveCSS('z-index', '-1');
      const header = background.locator('..');
      await expect(header).toHaveCSS('isolation', 'isolate');
      const community = path.startsWith('/explore/');
      const navigation = header.getByRole('navigation', {
        name: community ? 'Browse community' : 'Browse cards',
      });
      const destinations = community
        ? ['Decklists', 'Users', 'Articles']
        : ['Themes', 'Roles', 'Sets'];
      await expect(navigation.getByRole('link')).toHaveText(
        destinations.map((label) => `Go To ${label}`),
      );
      for (const label of destinations) {
        const to = `${community ? '/explore' : ''}/${label.toLowerCase()}`;
        const link = navigation.getByRole('link', { name: `Go To ${label}` });
        await expect(link).toHaveAttribute('href', to);
        await expect(link.locator('.iconify')).toBeVisible();
      }
      await expect(navigation.locator('[aria-current="page"]')).toHaveAttribute(
        'href',
        path,
      );
      const input = header.locator('input').first();
      await input.fill('test');
      await expect(input).toHaveValue('test');
      const bounds = await background.boundingBox();
      const headerBounds = await header.boundingBox();
      const breadcrumb = page.getByRole('navigation', {
        name: /^(Breadcrumb|Browsing history)$/,
      });
      await expect(breadcrumb).toHaveCount(1);
      const breadcrumbBounds = await breadcrumb.boundingBox();
      expect(breadcrumbBounds!.y).toBeGreaterThanOrEqual(bounds!.y - 1);
      expect(
        breadcrumbBounds!.y + breadcrumbBounds!.height,
      ).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
      expect(bounds!.y).toBeCloseTo(headerBounds!.y, 0);
      expect(bounds!.height).toBeCloseTo(headerBounds!.height, 0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (path === '/sets' || path === '/explore/users')
        await page.screenshot({
          path: `.cache/directory-background-${art}-${width}.png`,
        });
    }
  }
});
