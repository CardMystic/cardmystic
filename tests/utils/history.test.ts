import { describe, it, expect } from 'vitest';
import type { Router } from 'vue-router';
import { rerunSearchHistory } from '~/utils/history';

// Captures router.push calls without a real router.
const makeRouter = () => {
  const pushes: any[] = [];
  const router = { push: (arg: any) => pushes.push(arg) } as unknown as Router;
  return { router, pushes };
};

describe('rerunSearchHistory', () => {
  it('reruns a smart search with its query', () => {
    const { router, pushes } = makeRouter();
    rerunSearchHistory({ search_type: 'smart', query: 'card draw' }, router);

    expect(pushes).toHaveLength(1);
    expect(pushes[0].path).toBe('/search/all/smart');
    expect(pushes[0].query).toEqual({
      searchType: 'smart',
      query: 'card draw',
    });
  });

  it('falls back to smart for unknown search types', () => {
    const { router, pushes } = makeRouter();
    rerunSearchHistory({ search_type: 'mystery', query: 'x' }, router);
    expect(pushes[0].path).toBe('/search/all/smart');
  });

  it('uses card_name for similarity searches', () => {
    const { router, pushes } = makeRouter();
    rerunSearchHistory(
      { search_type: 'similarity', query: 'Sol Ring' },
      router,
    );

    expect(pushes[0].path).toBe('/search/all/similarity');
    expect(pushes[0].query.card_name).toBe('Sol Ring');
    expect(pushes[0].query.query).toBeUndefined();
  });

  it('derives the platform segment from filters', () => {
    const { router, pushes } = makeRouter();
    rerunSearchHistory(
      { search_type: 'keyword', query: 'goblin', filters: { isArena: true } },
      router,
    );

    expect(pushes[0].path).toBe('/search/arena/keyword');
    expect(JSON.parse(pushes[0].query.filters)).toEqual({ isArena: true });
  });

  it('reconstructs deckbuilder queries from recommend filters', () => {
    const { router, pushes } = makeRouter();
    rerunSearchHistory(
      {
        search_type: 'recommend',
        query: 'aristocrats value',
        filters: {
          commander: 'Teysa Karlov',
          partnerCommander: '',
          decklist: '1 Sol Ring',
          limit: 25,
          isPaper: true,
        },
      },
      router,
    );

    expect(pushes[0].path).toBe('/search/paper/deckbuilder');
    expect(pushes[0].query.commander).toBe('Teysa Karlov');
    expect(pushes[0].query.decklist).toBe('1 Sol Ring');
    expect(pushes[0].query.limit).toBe(25);
    expect(pushes[0].query.description).toBe('aristocrats value');
    // Recommend-specific fields are stripped from the filters payload.
    expect(JSON.parse(pushes[0].query.filters)).toEqual({ isPaper: true });
  });

  it('omits the filters param when only recommend fields were present', () => {
    const { router, pushes } = makeRouter();
    rerunSearchHistory(
      {
        search_type: 'recommend',
        query: '',
        filters: { commander: 'Krenko, Mob Boss' },
      },
      router,
    );

    expect(pushes[0].query.filters).toBeUndefined();
  });
});
