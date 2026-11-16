// Run with Node 22: node --experimental-strip-types scripts/export-protected-searches.mjs [backend output path]
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  getAllSeoSlugs,
  getSeoEntry,
  getSeoPath,
} from '../utils/seoQueries.ts';
import {
  landingConfigs,
  baseQueries,
  moreQueries,
} from '../utils/searchExamples.ts';
import { searchDemos } from '../utils/search-showcase.ts';
import { parseDecklist } from '../utils/decklist.ts';
import { validPlatforms, getPlatformFilters } from '../utils/platformConfig.ts';

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
// Keep the cache allowlist tied to the examples actually displayed by the frontend.
const examples = [];
function addExample(path) {
  const url = new URL(path, 'https://cardmystic.com');
  const parts = url.pathname.split('/');
  const platform = parts[2];
  const type = parts[1] === 'search' ? parts[3] : parts[1];
  const params = url.searchParams;
  const filters = getPlatformFilters(platform);
  const request = { limit: 100, filters };
  let endpoint;
  switch (type) {
    case 'smart':
    case 'commander':
      endpoint = '/search/colbert';
      request.query = params.get('query');
      if (type === 'commander') filters.isCommander = true;
      break;
    case 'keyword':
      endpoint = '/search/keyword';
      request.query = params.get('query');
      break;
    case 'similarity':
      endpoint = '/search/similarity';
      request.card_name = params.get('card_name');
      break;
    case 'deckbuilder':
      endpoint = '/als/recommend';
      request.commanders = [params.get('commander')];
      request.cards = parseDecklist(params.get('decklist') ?? '');
      if (params.get('description')) request.query = params.get('description');
      break;
    case 'popular-cards':
      endpoint = '/deck-stats/top-cards';
      break;
    case 'popular-commanders':
      endpoint = '/deck-stats/top-commanders';
      break;
    case 'popular-by-commander':
      endpoint = '/deck-stats/popular-by-commander';
      request.commanders = [params.get('commander')];
      request.filters = {};
      break;
    case 'popular-by-card':
      endpoint = '/deck-stats/popular-commanders-for-card';
      request.card_name = params.get('card_name');
      break;
    default:
      throw new Error('Unmapped example search: ' + path);
  }
  examples.push({ path, endpoint, request });
}
for (const platform of validPlatforms) {
  for (const type of ['popular-cards', 'popular-commanders'])
    addExample(`/${type}/${platform}`);
  for (const [type, config] of Object.entries(landingConfigs)) {
    const routeType = type === 'recommend' ? 'deckbuilder' : type;
    const param = ['similarity', 'popular-by-card'].includes(type)
      ? 'card_name'
      : ['recommend', 'popular-by-commander'].includes(type)
        ? 'commander'
        : 'query';
    for (const { label } of config.suggestions)
      addExample(
        (type.startsWith('popular-')
          ? `/${routeType}/${platform}?`
          : `/search/${platform}/${routeType}?`) +
          new URLSearchParams({ [param]: label }),
      );
  }
}
for (const query of [...baseQueries, ...moreQueries])
  addExample('/search/all/smart?' + new URLSearchParams({ query }));
for (const demo of searchDemos) {
  addExample(demo.to);
  for (const example of demo.examples) addExample(example.to);
}
const exampleEntries = [
  ...new Map(examples.map((entry) => [entry.path, entry])).values(),
];

const output = resolve(
  process.argv[2] ??
    '../cardmystic-backend/src/common/utils/protectedSearchCatalog.ts',
);
await writeFile(
  output,
  '// Generated from frontend SEO and displayed search examples by scripts/export-protected-searches.mjs.\n' +
    '// Re-export when SEO slugs, UI examples, platform filters or request defaults change.\n' +
    'export const PROTECTED_SEARCH_CATALOG: { path: string; endpoint: string; request: Record<string, unknown> }[] = ' +
    JSON.stringify(entries, null, '\t') +
    ';\n' +
    'export const EXAMPLE_SEARCH_CATALOG: { path: string; endpoint: string; request: Record<string, unknown> }[] = ' +
    JSON.stringify(exampleEntries, null, '\t') +
    ';\n',
);
console.log(
  JSON.stringify({
    pages: new Set(entries.map((x) => x.path)).size,
    requestVariants: entries.length,
    exampleRequests: exampleEntries.length,
    endpoints: [
      ...new Set([...entries, ...exampleEntries].map((x) => x.endpoint)),
    ],
    output,
  }),
);
