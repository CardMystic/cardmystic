import { describe, it, expect } from 'vitest';
import {
  parseLinkEmbedTarget,
  extractLinkEmbedTargets,
  extractAndTokenizeLinkEmbeds,
} from '~/utils/linkEmbeds';

describe('parseLinkEmbedTarget', () => {
  it('parses relative decklist paths', () => {
    expect(parseLinkEmbedTarget('/lists/abc-123')).toEqual({
      href: '/lists/abc-123',
      type: 'decklist',
      id: 'abc-123',
    });
  });

  it('strips a cardmystic.com origin before parsing', () => {
    expect(parseLinkEmbedTarget('https://cardmystic.com/lists/xyz')).toEqual({
      href: '/lists/xyz',
      type: 'decklist',
      id: 'xyz',
    });
    expect(
      parseLinkEmbedTarget('https://www.cardmystic.com/lists/xyz'),
    ).toEqual({
      href: '/lists/xyz',
      type: 'decklist',
      id: 'xyz',
    });
  });

  it('parses article paths', () => {
    expect(parseLinkEmbedTarget('/articles/9f8-abc')).toEqual({
      href: '/articles/9f8-abc',
      type: 'article',
      id: '9f8-abc',
    });
  });

  it('parses UUID-ish user paths and rejects reserved slugs', () => {
    expect(
      parseLinkEmbedTarget('/user/00000000-0000-4000-8000-000000000000'),
    ).toEqual({
      href: '/user/00000000-0000-4000-8000-000000000000',
      type: 'user',
      id: '00000000-0000-4000-8000-000000000000',
    });
    expect(parseLinkEmbedTarget('/user/account')).toBeNull();
    expect(parseLinkEmbedTarget('/user/setup')).toBeNull();
    expect(parseLinkEmbedTarget('/user/bob')).toBeNull();
  });

  it('parses search paths with and without slug', () => {
    expect(parseLinkEmbedTarget('/search/all/smart')).toEqual({
      href: '/search/all/smart',
      type: 'search',
      search: { platform: 'all', searchType: 'smart', slug: null },
    });
    expect(parseLinkEmbedTarget('/search/all/smart/best-card-draw')).toEqual({
      href: '/search/all/smart/best-card-draw',
      type: 'search',
      search: {
        platform: 'all',
        searchType: 'smart',
        slug: 'best-card-draw',
      },
    });
  });

  it('parses popularity paths', () => {
    expect(parseLinkEmbedTarget('/popular-cards/arena')).toEqual({
      href: '/popular-cards/arena',
      type: 'popular',
      search: { platform: 'arena', searchType: 'popular-cards', slug: null },
    });
    expect(
      parseLinkEmbedTarget('/popular-by-commander/all/atraxa-praetors-voice'),
    ).toEqual({
      href: '/popular-by-commander/all/atraxa-praetors-voice',
      type: 'popular',
      search: {
        platform: 'all',
        searchType: 'popular-by-commander',
        slug: 'atraxa-praetors-voice',
      },
    });
  });

  it('drops query strings and trailing slashes for canonicalization', () => {
    expect(parseLinkEmbedTarget('/lists/abc/?ref=discord')).toEqual({
      href: '/lists/abc',
      type: 'decklist',
      id: 'abc',
    });
  });

  it('ignores non-CardMystic and unknown paths', () => {
    expect(parseLinkEmbedTarget('https://example.com/lists/abc')).toBeNull();
    expect(parseLinkEmbedTarget('/random/path')).toBeNull();
    expect(parseLinkEmbedTarget('not a url')).toBeNull();
    expect(parseLinkEmbedTarget('')).toBeNull();
  });
});

describe('extractLinkEmbedTargets', () => {
  it('extracts full-line URLs and preserves order', () => {
    const src = [
      'Intro paragraph.',
      '',
      '/lists/abc-123',
      '',
      'Something about the deck.',
      '',
      'https://cardmystic.com/articles/piece',
      '',
      '/user/00000000-0000-4000-8000-000000000000',
    ].join('\n');
    const targets = extractLinkEmbedTargets(src);
    expect(targets).toHaveLength(3);
    expect(targets[0].type).toBe('decklist');
    expect(targets[1].type).toBe('article');
    expect(targets[2].type).toBe('user');
  });

  it('dedupes by canonical href across origins', () => {
    const src = [
      '/lists/abc',
      '',
      'https://cardmystic.com/lists/abc',
      '',
      'https://www.cardmystic.com/lists/abc/',
    ].join('\n');
    const targets = extractLinkEmbedTargets(src);
    expect(targets).toHaveLength(1);
    expect(targets[0].href).toBe('/lists/abc');
  });

  it('does not extract inline URLs mid-paragraph', () => {
    const src = 'Check out https://cardmystic.com/lists/abc for a deck.';
    expect(extractLinkEmbedTargets(src)).toEqual([]);
  });
});

describe('extractAndTokenizeLinkEmbeds', () => {
  it('replaces matching lines with token placeholders and returns targets', () => {
    const src = ['Intro.', '', '/lists/abc-123', '', 'Outro.'].join('\n');
    const { processed, targets } = extractAndTokenizeLinkEmbeds(src);
    expect(targets).toHaveLength(1);
    expect(processed).toContain('LINKEMBEDTOKEN0LINKEMBEDTOKEN');
    expect(processed).not.toContain('/lists/abc-123');
  });

  it('reuses the same token index for duplicate URLs', () => {
    const src = [
      '/lists/abc',
      '',
      'text',
      '',
      'https://cardmystic.com/lists/abc',
    ].join('\n');
    const { processed, targets } = extractAndTokenizeLinkEmbeds(src);
    expect(targets).toHaveLength(1);
    const matches = processed.match(/LINKEMBEDTOKEN0LINKEMBEDTOKEN/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  it('leaves non-matching lines untouched', () => {
    const src =
      'Just a paragraph with https://cardmystic.com/lists/abc inline.';
    const { processed, targets } = extractAndTokenizeLinkEmbeds(src);
    expect(targets).toEqual([]);
    expect(processed).toBe(src);
  });
});
