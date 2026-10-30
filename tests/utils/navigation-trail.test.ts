import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import {
  advanceNavigationTrail,
  inferredNavigationAction,
  navigationTrailEntry,
  pageBreadcrumbs,
  restoredNavigationTrail,
} from '~/utils/navigation-trail';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: {} }],
});
const entry = (path: string) => navigationTrailEntry(router.resolve(path))!;
const card = entry('/card/11111111-1111-4111-8111-111111111111');

describe('navigation trail', () => {
  it('restores the complete search and filters after opening a card, refining, and returning', () => {
    const search = entry(
      '/search/arena/keyword?query=artifact&filters=%7B%22isArena%22%3Atrue%7D',
    );
    const refined = entry(
      '/search/arena/keyword?query=artifact&filters=%7B%22cmc%22%3A3%7D',
    );
    expect(inferredNavigationAction(search, refined)).toBe('refine');
    const trail = advanceNavigationTrail([search], refined, 'refine');
    expect(trail).toEqual([refined]);
    const opened = advanceNavigationTrail(
      trail,
      card,
      inferredNavigationAction(refined, card),
    );
    expect(restoredNavigationTrail(opened, card.to)).toEqual([refined, card]);
    expect(advanceNavigationTrail(opened, refined, 'return')).toEqual([
      refined,
    ]);
    const sameFilters = entry(
      '/search/arena/keyword?query=artifact&filters={%22cmc%22:3}',
    );
    expect(advanceNavigationTrail(opened, sameFilters, 'return')).toEqual([
      refined,
    ]);
    expect(refined.to).toBe(
      '/search/arena/keyword?query=artifact&filters=%7B%22cmc%22%3A3%7D',
    );
  });

  it('supports collection searches and every current platform without exposing pasted decklists', () => {
    expect(pageBreadcrumbs('/sets')).toEqual([{ label: 'Sets' }]);
    const collection = entry('/themes/artifacts?query=draw&useRerank=false');
    expect(advanceNavigationTrail([collection], card, 'drill-down')).toEqual([
      collection,
      card,
    ]);
    for (const platform of [
      'all',
      'paper',
      'arena',
      'mtgo',
      'modern',
      'commander',
    ]) {
      expect(entry(`/search/${platform}/smart?query=ramp`).label).toBe(
        'Smart Search: ramp',
      );
    }
    expect(
      entry('/search/all/deckbuilder?decklist=PRIVATE&description=PRIVATE')
        .label,
    ).toBe('Deck Recommender');
  });

  it('bounds history, ignores foreign snapshots, and resets outside card browsing', () => {
    const trail = advanceNavigationTrail(
      Array.from({ length: 10 }, () => card),
      card,
      'drill-down',
    );
    expect(trail.length).toBeLessThanOrEqual(10);
    expect(
      restoredNavigationTrail(
        [{ ...card, to: 'https://example.com' }],
        card.to,
      ),
    ).toBeUndefined();
    expect(restoredNavigationTrail([card], '/about')).toBeUndefined();
    expect(
      advanceNavigationTrail(
        [card],
        navigationTrailEntry(router.resolve('/about')),
      ),
    ).toEqual([]);
  });
});
