// server/routes/sitemap.xml.ts
import cardIds from '~/public/card-ids.min.json';

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
