import { describe, expect, it } from 'vitest';
import {
  extractSearchEmbeds,
  parseSearchEmbedUrl,
  renderSearchEmbed,
} from '~/utils/searchEmbeds';

const url =
  'https://cardmystic.com/search/all/smart?searchType=smart&query=draw%20cards&limit=12';
const syntax = '@[search](' + url + ')';

describe('CardMystic search embeds', () => {
  it('preserves the authored query, filters and destination', () => {
    const filters = JSON.stringify({ isArena: true });
    const embed = parseSearchEmbedUrl(
      url + '&filters=' + encodeURIComponent(filters),
    )!;
    expect(embed.label).toBe('Smart Search');
    expect(embed.query).toBe('draw cards');
    expect(embed.href).toContain('query=draw%20cards&limit=12');
    expect(embed.params).toContainEqual(['filters', filters]);
    expect(embed.params).toContainEqual(['limit', '12']);
    expect(embed.params.some(([key]) => key === 'query')).toBe(false);
    expect(parseSearchEmbedUrl(url.replace('&query', '\\&query'))?.query).toBe(
      'draw cards',
    );
  });

  it.each([
    ['similarity', 'card_name', 'Similarity Search'],
    ['keyword', 'query', 'Keyword Search'],
    ['commander', 'query', 'Commander Search'],
    ['deckbuilder', 'commander', 'Deck Recommendations'],
  ])(
    'labels %s searches and reads their correct query field',
    (mode, key, label) => {
      const embed = parseSearchEmbedUrl(
        '/search/arena/' + mode + '?' + key + '=Sol%20Ring',
      )!;
      expect(embed.label).toBe(label);
      expect(embed.queryKey).toBe(key);
      expect(embed.query).toBe('Sol Ring');
    },
  );

  it('resolves curated search pages without discarding their canonical path', () => {
    const embed = parseSearchEmbedUrl('/search/all/similarity/lightning-bolt')!;
    expect(embed.query).toBe('Lightning Bolt');
    expect(embed.href).toBe('/search/all/similarity/lightning-bolt');
    expect(embed.action).toBe('/search/all/similarity');
    expect(embed.params.some(([key]) => key === 'filters')).toBe(true);
  });

  it('retains multiline decklist queries in a textarea and keeps other parameters', () => {
    const embed = parseSearchEmbedUrl(
      '/search/all/deckbuilder?decklist=1%20Sol%20Ring%0A1%20Island&commander=Atraxa',
    )!;
    expect(embed.query).toBe('1 Sol Ring\n1 Island');
    expect(embed.queryKey).toBe('decklist');
    expect(renderSearchEmbed(embed)).toContain('<textarea');
    expect(embed.params).toContainEqual(['commander', 'Atraxa']);
  });

  it.each([
    'https://evil.test/search/all/smart?query=x',
    'https://cardmystic.com.evil.test/search/all/smart?query=x',
    'https://cardmystic.com@evil.test/search/all/smart',
    'https://evil.test@cardmystic.com/search/all/smart',
    'https://cardmystic.com:8443/search/all/smart',
    '//cardmystic.com/search/all/smart',
    'javascript:alert(1)',
    '/search/invalid/smart?query=x',
    '/search/all/unknown?query=x',
    '/search/all/smart/not-a-curated-page',
    '/search/all/smart?query=%E0%A4%A',
    '/search/all/smart?query=%ZZ',
    '/articles/anything',
  ])('rejects unsupported destinations: %s', (value) => {
    expect(parseSearchEmbedUrl(value)).toBeNull();
  });

  it('embeds only explicit standalone syntax and preserves reference-link definitions', () => {
    const ordinary =
      '[draw cards](' + url + ')\n\n[Reference][draw]\n\n[draw]: ' + url;
    const source = ordinary + '\n\n' + syntax + '\n';
    const result = extractSearchEmbeds(source);
    expect(result.embeds).toHaveLength(1);
    expect(result.processed).toContain(ordinary);
    expect(result.processed).toContain('CMSEARCHTOKEN0CMSEARCHTOKEN');
    expect(extractSearchEmbeds('See ' + syntax + ' here.').embeds).toEqual([]);
  });

  it('leaves code examples and raw HTML untouched', () => {
    const tick = String.fromCharCode(96);
    const examples = [
      tick.repeat(3) + 'md\n' + syntax + '\n' + tick.repeat(3),
      '~~~\n' + syntax + '\n~~~',
      '    ' + syntax,
      '<pre>\n' + syntax + '\n</pre>',
      '<!--\n' + syntax + '\n-->',
      tick + syntax + tick,
    ];
    for (const source of examples) {
      expect(extractSearchEmbeds(source)).toEqual({
        processed: source,
        embeds: [],
      });
      const combined = extractSearchEmbeds(source + '\n\n' + syntax);
      expect(combined.embeds, source).toHaveLength(1);
      expect(combined.processed).toContain(source);
    }
  });

  it('emits a real link and a native GET form while escaping authored content', () => {
    const embed = parseSearchEmbedUrl(
      '/search/all/smart?query=' +
        encodeURIComponent('"><img src=x onerror=alert(1)>') +
        '&limit=12',
    )!;
    const html = renderSearchEmbed(embed);
    expect(html).toContain(
      '<a class="search-embed-link" href="/search/all/smart?query=',
    );
    expect(html).toContain('method="get"');
    expect(html).toContain('action="/search/all/smart"');
    expect(html).toContain('name="query"');
    expect(html).toContain('name="limit" value="12"');
    expect(html).toContain('TRY ME');
    expect(html).not.toContain('<img');
    expect(html).toContain('&quot;&gt;&lt;img');
  });
});
