// server/routes/sitemap.xml.ts
import cardIds from '~/public/card-ids.min.json';
import { getAllSeoSlugs } from '~/utils/seoQueries';

export default defineEventHandler((event) => {
  const baseUrl = 'https://cardmystic.io';
  const now = new Date().toISOString();

  setResponseHeaders(event, {
    'content-type': 'application/xml; charset=utf-8',
    'cache-control': 'public, max-age=86400, s-maxage=86400',
  });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Core pages
  xml += `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

  // Search pages
  const searchPages = [
    '/search',
    '/search/similarity',
    '/search/keyword',
    '/search/recommend',
  ];
  for (const page of searchPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // Platform & format landing pages
  const landingPages = [
    '/arena/ai-search',
    '/arena/similarity-search',
    '/arena/deckbuilder',
    '/arena/commander-search',
    '/mtgo/ai-search',
    '/mtgo/similarity-search',
    '/mtgo/deckbuilder',
    '/mtgo/commander-search',
    '/modern/ai-search',
    '/modern/similarity-search',
  ];
  for (const page of landingPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  }

  // SEO slug pages (high-intent search results)
  const seoSlugs = getAllSeoSlugs();
  const seoCategories = Object.entries(seoSlugs) as [string, string[]][];
  for (const [category, slugs] of seoCategories) {
    for (const slug of slugs) {
      xml += `
  <url>
    <loc>${baseUrl}/${category}/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  // Card pages
  for (const id of cardIds) {
    xml += `
  <url>
    <loc>${baseUrl}/card/${id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += '</urlset>';
  return xml;
});
