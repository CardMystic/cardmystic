import { test, expect } from '@playwright/test';
import { getAllSeoSlugs, getSeoPath } from '../utils/seoQueries';
import { validPlatforms } from '../utils/platformConfig';

/**
 * SEO infrastructure coverage: sitemap server route + robots.txt.
 * No auth required — plain requests against the built Nuxt server.
 */

test.describe('SEO infrastructure', () => {
  test('homepage exposes crawlable explore and popularity links', async ({
    page,
  }) => {
    await page.goto('/');

    const links = page.getByRole('navigation', { name: 'Explore CardMystic' });
    const destinations = [
      ['/explore/decklists', 'Decklists'],
      ['/explore/users', 'Users'],
      ['/explore/articles', 'Articles'],
      ['/popular-cards/all', 'Commander Cards'],
      ['/popular-commanders/all', 'Commanders'],
      ['/popular-by-commander/all', 'Cards by Commander'],
    ] as const;

    await expect(links).toBeVisible();
    for (const [href, name] of destinations) {
      await expect(
        links.getByRole('link', { name, exact: true }),
      ).toHaveAttribute('href', href);
    }

    await expect(
      page.getByRole('button', { name: 'Build a New Deck' }),
    ).toBeDisabled();
  });

  test('sitemap.xml serves valid XML with core, landing, and slug URLs', async ({
    request,
  }) => {
    const resp = await request.get('/sitemap.xml');
    expect(resp.ok()).toBeTruthy();
    expect(resp.headers()['content-type']).toContain('application/xml');
    expect(resp.headers()['cache-control']).toContain('max-age=86400');

    const xml = await resp.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );

    // Core + landing pages.
    expect(xml).toContain('<loc>https://cardmystic.com/</loc>');
    expect(xml).toContain('<loc>https://cardmystic.com/about</loc>');
    const landingTypes = [
      'search/{platform}/smart',
      'search/{platform}/similarity',
      'search/{platform}/keyword',
      'search/{platform}/commander',
      'search/{platform}/deckbuilder',
      'popular-cards/{platform}',
      'popular-commanders/{platform}',
      'popular-by-commander/{platform}',
    ];
    for (const platform of validPlatforms) {
      for (const route of landingTypes) {
        const path = route.replace('{platform}', platform);
        expect(xml, `sitemap missing landing page ${path}`).toContain(
          `<loc>https://cardmystic.com/${path}</loc>`,
        );
      }
    }

    // Every registered SEO slug group has its first slug listed.
    for (const { platform, searchType, slugs } of getAllSeoSlugs()) {
      const path = getSeoPath(platform, searchType, slugs[0]);
      expect(
        xml,
        `sitemap missing ${platform}/${searchType}/${slugs[0]}`,
      ).toContain(`<loc>https://cardmystic.com${path}</loc>`);
    }

    // Card pages are included.
    expect(xml).toMatch(
      /<loc>https:\/\/cardmystic\.com\/card\/[0-9a-f-]+<\/loc>/,
    );

    // Well-formed: every <url> is closed.
    expect((xml.match(/<url>/g) ?? []).length).toBe(
      (xml.match(/<\/url>/g) ?? []).length,
    );
  });

  test('robots.txt allows crawling and points at the sitemap', async ({
    request,
  }) => {
    const resp = await request.get('/robots.txt');
    expect(resp.ok()).toBeTruthy();
    const body = await resp.text();
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: https://cardmystic.com/sitemap.xml');
  });
});

/**
 * SSR meta-tag coverage. These tests fetch the raw HTML delivered to
 * crawlers (no JavaScript execution) and assert that per-page SEO
 * metadata — title, description, canonical OG/Twitter tags, and the
 * `robots` directive — is populated with slug-specific content, not
 * the generic fallback. If any of these regress, Google, Discord, and
 * Twitter unfurlers will see stale or missing metadata even though the
 * hydrated page looks correct in a browser.
 */
test.describe('SSR meta tags for crawlers', () => {
  /** Extract the content of a `<meta>` tag by attribute+value pair. */
  const metaContent = (html: string, attr: string, value: string): string => {
    // Handle attributes in either order and single/double quotes.
    const patterns = [
      new RegExp(
        `<meta[^>]*\\s${attr}=["']${value}["'][^>]*\\scontent=["']([^"']*)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]*\\scontent=["']([^"']*)["'][^>]*\\s${attr}=["']${value}["']`,
        'i',
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) return m[1];
    }
    return '';
  };

  const titleTag = (html: string): string =>
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '';

  /**
   * Every SEO slug page must render slug-specific title/description on
   * the server so crawlers pick them up. We cover all five search
   * variants + all three stats pages with a single representative slug
   * so the suite stays quick.
   */
  const seoSlugPages = [
    {
      path: '/search/all/smart/best-card-draw',
      titleContains: 'Best MTG Card Draw',
      descContains: 'card draw',
    },
    {
      path: '/search/all/similarity/lightning-bolt',
      titleContains: 'Cards Similar to Lightning Bolt',
      descContains: 'Lightning Bolt',
    },
    {
      path: '/search/all/keyword/ward',
      titleContains: 'Ward',
      descContains: 'Ward',
    },
    {
      path: '/search/all/commander/graveyard-recursion',
      titleContains: 'Graveyard Recursion',
      descContains: 'graveyard',
    },
    {
      path: '/search/all/deckbuilder/best-cards-for-kaalia-of-the-vast',
      titleContains: 'Best Cards for Kaalia of the Vast',
      descContains: 'Kaalia of the Vast',
    },
    {
      path: '/popular-cards/all/card-draw',
      titleContains: 'Most Popular MTG Card Draw',
      descContains: 'card draw',
    },
    {
      path: '/popular-commanders/all/graveyard-recursion',
      titleContains: 'Most Popular Graveyard Recursion',
      descContains: 'graveyard recursion',
    },
    {
      path: '/popular-by-commander/all/most-played-cards-for-kaalia-of-the-vast',
      titleContains: 'Most Played Cards for Kaalia of the Vast',
      descContains: 'Kaalia of the Vast',
    },
  ] as const;

  for (const { path, titleContains, descContains } of seoSlugPages) {
    test(`SSR meta for ${path}`, async ({ request }) => {
      const resp = await request.get(path);
      expect(resp.ok(), `expected 200 for ${path}`).toBeTruthy();
      const html = await resp.text();

      // Title must reflect the slug, not the generic fallback.
      const title = titleTag(html);
      expect(title.toLowerCase()).toContain(titleContains.toLowerCase());
      expect(title).toContain('CardMystic');

      // Description must be slug-specific.
      const description = metaContent(html, 'name', 'description');
      expect(description.toLowerCase()).toContain(descContains.toLowerCase());

      // OG tags mirror the head so unfurlers see the same content.
      const ogTitle = metaContent(html, 'property', 'og:title');
      expect(ogTitle.toLowerCase()).toContain(titleContains.toLowerCase());
      const ogDescription = metaContent(html, 'property', 'og:description');
      expect(ogDescription.length).toBeGreaterThan(0);
      const ogImage = metaContent(html, 'property', 'og:image');
      expect(ogImage).toMatch(/^https?:\/\//);

      // Twitter card must be a large-image summary for rich previews.
      expect(metaContent(html, 'name', 'twitter:card')).toBe(
        'summary_large_image',
      );

      // SEO slug pages must be indexable.
      expect(metaContent(html, 'name', 'robots')).toBe('index, follow');
    });
  }

  test('user-typed search queries render `noindex, follow`', async ({
    request,
  }) => {
    // A landing search page with an ad-hoc `?query=` should NOT be
    // indexed — that would flood Google with low-quality URLs.
    const resp = await request.get(
      '/search/all/smart?query=some-random-user-query',
    );
    expect(resp.ok()).toBeTruthy();
    const html = await resp.text();
    expect(metaContent(html, 'name', 'robots')).toBe('noindex, follow');
  });

  test('bare landing pages are indexable with generic (but valid) meta', async ({
    request,
  }) => {
    const resp = await request.get('/search/all/deckbuilder');
    expect(resp.ok()).toBeTruthy();
    const html = await resp.text();
    expect(metaContent(html, 'name', 'robots')).toBe('index, follow');
    expect(titleTag(html)).toContain('CardMystic');
    expect(metaContent(html, 'name', 'description').length).toBeGreaterThan(0);
  });

  test('homepage exposes Organization + WebSite JSON-LD for rich results', async ({
    request,
  }) => {
    const resp = await request.get('/');
    expect(resp.ok()).toBeTruthy();
    const html = await resp.text();

    // The homepage attaches an external JSON-LD document via <script src>.
    // Its presence in SSR HTML is what crawlers pick up.
    expect(html).toMatch(
      /<script[^>]+type=["']application\/ld\+json["'][^>]+src=["'][^"']*home\.json["']/,
    );

    // Homepage title stays branded. The absence of a `<meta robots>`
    // tag is fine — crawlers default to `index, follow`.
    expect(titleTag(html)).toContain('CardMystic');
    const robots = metaContent(html, 'name', 'robots');
    if (robots) expect(robots).toBe('index, follow');
  });
});
