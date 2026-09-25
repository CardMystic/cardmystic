// Run with Node 22: node --experimental-strip-types scripts/export-protected-searches.mjs [backend output path]
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  getAllSeoSlugs,
  getSeoEntry,
  getSeoPath,
} from '../utils/seoQueries.ts';
import { getPlatformFilters } from '../utils/platformConfig.ts';

const entries = [];
for (const { platform, searchType, slugs } of getAllSeoSlugs()) {
  for (const slug of slugs) {
    const entry = getSeoEntry(platform, searchType, slug);
    const filters = { ...entry.filters, ...getPlatformFilters(platform) };
    let endpoint, request;
    switch (searchType) {
      case 'smart':
      case 'commander':
        endpoint = '/search/colbert';
        if (searchType === 'commander') filters.isCommander = true;
        request = {
          query: entry.query,
          limit: 100,
          filters,
          exclude_card_data: false,
          useRerank: true,
        };
        break;
      case 'keyword':
        endpoint = '/search/keyword';
        request = { query: entry.query, limit: 100, filters };
        break;
      case 'similarity':
        endpoint = '/search/similarity';
        request = {
          card_name: entry.query,
          limit: 100,
          filters,
          exclude_card_data: false,
        };
        break;
      case 'deckbuilder':
        endpoint = '/als/recommend';
        request = { cards: [], commanders: [entry.query], limit: 100, filters };
        break;
      case 'popular-cards':
      case 'popular-commanders':
        endpoint =
          searchType === 'popular-cards'
            ? '/deck-stats/top-cards'
            : '/deck-stats/top-commanders';
        request = { query: entry.query, limit: 100, filters };
        break;
      case 'popular-by-commander':
        endpoint = '/deck-stats/popular-by-commander';
        request = {
          commanders: [entry.query],
          limit: 100,
          filters: entry.filters ?? {},
        };
        break;
      default:
        throw new Error('Unmapped SEO search type: ' + searchType);
    }
    const path = getSeoPath(platform, searchType, slug);
    entries.push({ path, endpoint, request });
    if (endpoint === '/search/colbert')
      entries.push({
        path,
        endpoint,
        request: { ...request, useRerank: false },
      });
  }
}
const output = resolve(
  process.argv[2] ??
    '../cardmystic-backend/src/common/utils/protectedSearchCatalog.ts',
);
await writeFile(
  output,
  '// Generated from cardmystic/utils/seoQueries.ts by scripts/export-protected-searches.mjs.\n' +
    '// Re-export when SEO slugs, platform filters or their request defaults change.\n' +
    'export const PROTECTED_SEARCH_CATALOG: { path: string; endpoint: string; request: Record<string, unknown> }[] = ' +
    JSON.stringify(entries, null, '\t') +
    ';\n',
);
console.log(
  JSON.stringify({
    pages: new Set(entries.map((x) => x.path)).size,
    requestVariants: entries.length,
    endpoints: [...new Set(entries.map((x) => x.endpoint))],
    output,
  }),
);
