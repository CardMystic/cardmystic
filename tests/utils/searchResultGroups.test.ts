import { describe, expect, it } from 'vitest';
import type { Card } from '~/models/cardModel';
import {
  groupSearchResults,
  TOP_RESULTS_GROUP_KEY,
} from '~/utils/searchResultGroups';

const cards = Array.from(
  { length: 200 },
  (_, index) =>
    ({
      card_name: `Card ${String(index).padStart(3, '0')}`,
      ai_normalized_score: index,
      card_data: {
        id: `printing-${index}`,
        oracle_id: `oracle-${index}`,
        name: `Card ${String(index).padStart(3, '0')}`,
        cmc: index % 6,
        type_line: index % 2 === 0 ? 'Creature' : 'Instant',
        colors: index % 3 === 0 ? ['U'] : [],
        color_identity: index % 3 === 0 ? ['U'] : [],
      },
    }) as Card,
);

describe('grouped search highlights', () => {
  it.each(['type', 'color', 'colorIdentity', 'cmc'])(
    'puts the fourteen best matches first when grouped by %s, independently of the selected sort',
    (groupBy) => {
      const groups = groupSearchResults(cards, groupBy, 'name', 'asc')!;
      expect(groups[0]).toEqual({
        key: TOP_RESULTS_GROUP_KEY,
        label: 'Top Results',
        cards: cards.slice(-14).reverse(),
      });
      const normalCards = groups.slice(1).flatMap((group) => group.cards);
      expect(normalCards).toHaveLength(200);
      expect(new Set(normalCards)).toEqual(new Set(cards));
      expect(groups[1].cards[0].card_name).toBe('Card 000');
    },
  );

  it('keeps server reranking for Top Results and the normal groups', () => {
    const groups = groupSearchResults(cards, 'type', undefined, 'asc', true)!;
    expect(groups[0].cards).toEqual(cards.slice(0, 14));
    expect(groups[1].cards).toEqual(
      cards.filter((_, index) => index % 2 === 0),
    );
  });

  it('handles a short result set without inventing cards', () => {
    const groups = groupSearchResults(
      cards.slice(0, 3),
      'type',
      undefined,
      'asc',
    )!;
    expect(groups[0].cards).toEqual(cards.slice(0, 3).reverse());
  });

  it('does not add groups to an ungrouped or empty result set', () => {
    expect(groupSearchResults(cards, undefined, undefined, 'asc')).toBeNull();
    expect(groupSearchResults([], 'type', undefined, 'asc')).toBeNull();
  });
});
