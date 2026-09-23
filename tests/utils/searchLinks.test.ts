import { describe, expect, it } from 'vitest';
import { getSearchLink } from '~/utils/searchLinks';

describe('getSearchLink', () => {
  it.each([
    ['similarity', 'Lightning Bolt', '/search/all/similarity/lightning-bolt'],
    ['similarity', "Thassa's Oracle", '/search/all/similarity/thassas-oracle'],
    ['similarity', 'Flooded Strand', '/search/all/similarity/fetchlands'],
    ['keyword', 'Draw a card', '/search/all/keyword/card-draw'],
    [
      'recommend',
      'Kaalia of the Vast',
      '/search/all/deckbuilder/best-cards-for-kaalia-of-the-vast',
    ],
    [
      'deckbuilder',
      'Kaalia of the Vast',
      '/search/all/deckbuilder/best-cards-for-kaalia-of-the-vast',
    ],
    [
      'popular-by-commander',
      'Kaalia of the Vast',
      '/popular-by-commander/all/most-played-cards-for-kaalia-of-the-vast',
    ],
  ] as const)(
    'links the existing %s page for %s',
    (searchType, query, path) => {
      expect(getSearchLink({ platform: 'all', searchType, query })).toEqual({
        path,
      });
    },
  );

  it('ignores case and redundant whitespace when matching an existing page', () => {
    expect(
      getSearchLink({
        platform: 'all',
        searchType: 'similarity',
        query: '  lightning   BOLT ',
      }),
    ).toEqual({ path: '/search/all/similarity/lightning-bolt' });
  });

  it('keeps uncurated queries instead of substituting a broader topic', () => {
    expect(
      getSearchLink({
        platform: 'all',
        searchType: 'smart',
        query: 'token doublers',
      }),
    ).toEqual({
      path: '/search/all/smart',
      query: { searchType: 'smart', query: 'token doublers' },
    });
  });

  it('does not leak an all-platform curated page into Arena search', () => {
    expect(
      getSearchLink({
        platform: 'arena',
        searchType: 'similarity',
        query: 'Lightning Bolt',
      }),
    ).toEqual({
      path: '/search/arena/similarity',
      query: { searchType: 'similarity', card_name: 'Lightning Bolt' },
    });
  });

  it('uses a platform-specific page when its filters match platform defaults', () => {
    expect(
      getSearchLink({
        platform: 'arena',
        searchType: 'smart',
        query: 'cards that create creature tokens',
      }),
    ).toEqual({ path: '/search/arena/smart/token-generators' });
  });

  it('does not add curated filters to an unrestricted query', () => {
    const query = 'most powerful planeswalkers';
    expect(
      getSearchLink({ platform: 'all', searchType: 'smart', query }),
    ).toEqual({
      path: '/search/all/smart',
      query: { searchType: 'smart', query },
    });
    expect(
      getSearchLink({
        platform: 'all',
        searchType: 'smart',
        query,
        filters: { selectedCardTypes: ['Planeswalker'] },
      }),
    ).toEqual({ path: '/search/all/smart/best-planeswalkers' });
  });

  it('preserves extra filters rather than dropping them for a curated page', () => {
    const filters = { selectedColors: ['Blue' as const] };
    expect(
      getSearchLink({
        platform: 'all',
        searchType: 'similarity',
        query: 'Lightning Bolt',
        filters,
      }),
    ).toEqual({
      path: '/search/all/similarity',
      query: {
        searchType: 'similarity',
        card_name: 'Lightning Bolt',
        filters: JSON.stringify(filters),
      },
    });
  });

  it('uses commander defaults while looking up the commander registry', () => {
    expect(
      getSearchLink({
        platform: 'all',
        searchType: 'commander',
        query: 'graveyard recursion commander',
      }),
    ).toEqual({ path: '/search/all/commander/graveyard-recursion' });
    expect(
      getSearchLink({
        platform: 'all',
        searchType: 'commander',
        query: 'graveyard recursion',
      }),
    ).toEqual({
      path: '/search/all/commander',
      query: { searchType: 'commander', query: 'graveyard recursion' },
    });
  });

  it.each([
    [
      'recommend',
      '/search/all/deckbuilder',
      { searchType: 'recommend', commander: 'Uncurated Commander' },
    ],
    [
      'popular-by-commander',
      '/popular-by-commander/all',
      { commander: 'Uncurated Commander' },
    ],
  ] as const)(
    'keeps the commander parameter for an uncurated %s search',
    (searchType, path, query) => {
      expect(
        getSearchLink({
          platform: 'all',
          searchType,
          query: 'Uncurated Commander',
        }),
      ).toEqual({ path, query });
    },
  );
});
