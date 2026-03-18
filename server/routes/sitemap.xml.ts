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

  // Search landing pages (one per platform × search type)
  const platforms = ['all', 'arena', 'mtgo', 'modern'];
  const searchTypes = [
    'ai',
    'similarity',
    'keyword',
    'commander',
    'deckbuilder',
  ];
  for (const platform of platforms) {
    for (const st of searchTypes) {
      xml += `
  <url>
    <loc>${baseUrl}/search/${platform}/${st}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  // SEO slug pages (high-intent search results)
  const seoEntries = getAllSeoSlugs();
  for (const { platform, searchType, slugs } of seoEntries) {
    for (const slug of slugs) {
      xml += `
  <url>
    <loc>${baseUrl}/search/${platform}/${searchType}/${slug}</loc>
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
