import type { Card } from '~/models/cardModel';
import { groupAndSortCards, sortSearchResults, type CardGroup } from './sort';

export const TOP_RESULTS_COUNT = 14;
export const TOP_RESULTS_GROUP_KEY = 'search-top-results';

export function groupSearchResults(
  cards: Card[] | null | undefined,
  groupBy: string | null | undefined,
  sortBy: string | null | undefined,
  sortDirection: 'asc' | 'desc',
  preserveResultOrder = false,
): CardGroup[] | null {
  if (!groupBy || !cards?.length) return null;

  const groups = groupAndSortCards(
    cards,
    groupBy,
    sortBy,
    sortDirection,
    undefined,
    undefined,
    preserveResultOrder,
  );
  // Keep the search's best matches first even when the user sorts the groups
  // by name, price, or mana value. Each card also stays in its normal group.
  const ranked = sortSearchResults(
    cards,
    undefined,
    'asc',
    preserveResultOrder,
  )!;
  return [
    {
      key: TOP_RESULTS_GROUP_KEY,
      label: 'Top Results',
      cards: ranked.slice(0, TOP_RESULTS_COUNT),
    },
    ...(groups ?? []),
  ];
}
