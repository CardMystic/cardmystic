import { test, expect } from '@playwright/test';
import { getAllSeoSlugs } from '../utils/seoQueries';

/**
 * SEO infrastructure coverage: sitemap server route + robots.txt.
 * No auth required — plain requests against the built Nuxt server.
 */

test.describe('SEO infrastructure', () => {
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
    expect(xml).toContain('<loc>https://cardmystic.com/search/all/smart</loc>');

    // Every registered SEO slug group has its first slug listed.
    for (const { platform, searchType, slugs } of getAllSeoSlugs()) {
      expect(
        xml,
        `sitemap missing ${platform}/${searchType}/${slugs[0]}`,
      ).toContain(
        `<loc>https://cardmystic.com/search/${platform}/${searchType}/${slugs[0]}</loc>`,
      );
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
