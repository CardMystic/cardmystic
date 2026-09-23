import { Marked } from 'marked';
import { getSeoEntry } from '~/utils/seoQueries';
import {
  getPlatformFilters,
  getPlatformDisplayName,
  isValidPlatform,
} from '~/utils/platformConfig';

const searchModes = {
  smart: { label: 'Smart Search', key: 'query' },
  similarity: { label: 'Similarity Search', key: 'card_name' },
  keyword: { label: 'Keyword Search', key: 'query' },
  commander: { label: 'Commander Search', key: 'query' },
  deckbuilder: { label: 'Deck Recommendations', key: 'commander' },
} as const;

export interface SearchEmbed {
  href: string;
  action: string;
  label: string;
  platformLabel: string;
  query: string;
  queryKey: string;
  params: [string, string][];
}

/** Accept production CardMystic search links and internal search paths only. */
export function parseSearchEmbedUrl(raw: string): SearchEmbed | null {
  const value = raw
    .trim()
    .replace(/\\([&()[\]])/g, '$1')
    .replace(/&amp;/g, '&');
  if (value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return null;
  if (!/^https?:\/\//i.test(value) && !/^\/search\//.test(value)) return null;
  try {
    const url = new URL(value, 'https://cardmystic.com');
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !['cardmystic.com', 'www.cardmystic.com'].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    decodeURIComponent(url.pathname + url.search);
    const match = url.pathname.match(
      /^\/search\/([^/]+)\/([^/]+)(?:\/([^/]+))?\/?$/,
    );
    if (
      !match ||
      !isValidPlatform(match[1]) ||
      !Object.hasOwn(searchModes, match[2])
    )
      return null;
    const platform = match[1];
    const mode = match[2] as keyof typeof searchModes;
    const config = searchModes[mode];
    const slug = match[3] ? decodeURIComponent(match[3]) : undefined;
    const entry = slug ? getSeoEntry(platform, mode, slug) : undefined;
    if (slug && !entry) return null;
    const params = new URLSearchParams(url.search);
    // The path defines the mode. Ensure submissions cannot switch to another
    // search type through a stale searchType parameter.
    params.set('searchType', mode === 'deckbuilder' ? 'recommend' : mode);
    const queryKey =
      mode === 'deckbuilder' && params.get('decklist')
        ? 'decklist'
        : config.key;
    const query =
      queryKey === 'decklist'
        ? params.get(queryKey)!
        : (entry?.query ?? params.get(queryKey) ?? '');
    if (entry && !params.has('filters')) {
      params.set(
        'filters',
        JSON.stringify({ ...entry.filters, ...getPlatformFilters(platform) }),
      );
    }
    params.delete(queryKey);
    return {
      href: url.pathname + url.search + url.hash,
      action: '/search/' + platform + '/' + mode,
      label: config.label,
      platformLabel:
        platform === 'all' ? 'All cards' : getPlatformDisplayName(platform),
      query,
      queryKey,
      params: [...params.entries()],
    };
  } catch {
    return null;
  }
}

const embedLexer = new Marked({
  extensions: [
    {
      name: 'cardMysticSearchEmbed',
      level: 'block',
      tokenizer(source) {
        const match = source.match(
          /^ {0,3}@\[search\]\(([^\n]+)\)[ \t]*(?:\n|$)/,
        );
        if (!match) return;
        const embed = parseSearchEmbedUrl(match[1]);
        if (embed)
          return { type: 'cardMysticSearchEmbed', raw: match[0], embed };
      },
    },
  ],
});

/**
 * Explicit block embeds only. Markdown's lexer protects fenced/indented code
 * and raw HTML examples. Preserve original source gaps (e.g. link definitions)
 * instead of rebuilding the rest of the Markdown from parsed tokens.
 */
export function extractSearchEmbeds(source: string): {
  processed: string;
  embeds: SearchEmbed[];
} {
  if (!source.includes('@[search](')) return { processed: source, embeds: [] };
  const normalized = source.replace(/\r\n?/g, '\n');
  const embeds: SearchEmbed[] = [];
  let processed = '';
  let cursor = 0;
  for (const token of embedLexer.lexer(normalized)) {
    const start = normalized.indexOf(token.raw, cursor);
    // Do not guess offsets if a future lexer normalizes a token's raw text.
    if (start < 0) return { processed: source, embeds: [] };
    processed += normalized.slice(cursor, start);
    if (token.type === 'cardMysticSearchEmbed') {
      const index = embeds.push(token.embed as SearchEmbed) - 1;
      processed += '\n\nCMSEARCHTOKEN' + index + 'CMSEARCHTOKEN\n\n';
    } else {
      processed += token.raw;
    }
    cursor = start + token.raw.length;
  }
  return { processed: processed + normalized.slice(cursor), embeds };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Trusted markup restored after sanitizing authored Markdown. No fetch or JS required. */
export function renderSearchEmbed(embed: SearchEmbed): string {
  const href = escapeHtml(embed.href);
  const query = escapeHtml(embed.query);
  const label = escapeHtml(embed.label);
  const hidden = embed.params
    .map(
      ([key, value]) =>
        '<input type="hidden" name="' +
        escapeHtml(key) +
        '" value="' +
        escapeHtml(value) +
        '">',
    )
    .join('');
  const attributes =
    'class="search-embed-input" name="' +
    escapeHtml(embed.queryKey) +
    '" aria-label="' +
    label +
    ' query" placeholder="Enter a search…" required';
  const input =
    embed.queryKey === 'decklist'
      ? '<textarea rows="1" ' + attributes + '>' + query + '</textarea>'
      : '<input type="search" ' + attributes + ' value="' + query + '">';
  return (
    '<section class="search-embed">' +
    '<div class="search-embed-header"><a class="search-embed-link" href="' +
    href +
    '" aria-label="' +
    label +
    (query ? ': ' + query : '') +
    '">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
    label +
    '</a><span class="search-embed-platform">' +
    escapeHtml(embed.platformLabel) +
    '</span></div>' +
    '<form class="search-embed-form" action="' +
    escapeHtml(embed.action) +
    '" method="get" data-search-href="' +
    href +
    '">' +
    hidden +
    '<div class="search-embed-bar">' +
    input +
    '<button class="search-embed-submit" type="submit">TRY ME<span aria-hidden="true"> &rarr;</span></button></div></form></section>'
  );
}
