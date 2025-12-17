import type { Ref } from 'vue';
import type { Card } from '~/models/cardModel';

type RarityOrder = Record<'common' | 'uncommon' | 'rare' | 'mythic', number>;

const rarityOrder: RarityOrder = {
  common: 1,
  uncommon: 2,
  rare: 3,
  mythic: 4,
};

export function sortSearchResults(
  searchResults: Array<Card> | null | undefined,
  sortBy: string | null | undefined,
  sortDirection: 'asc' | 'desc',
): Array<Card> | null | undefined {
  if (!searchResults || !sortBy) {
    return searchResults;
  }

  const results = [...searchResults];
  const direction = sortDirection === 'asc' ? 1 : -1;

  return results.sort((a, b) => {
    switch (sortBy) {
      case 'name': {
        const aValue = a.card_data.name.toLowerCase();
        const bValue = b.card_data.name.toLowerCase();
        return direction * aValue.localeCompare(bValue);
      }

      case 'cmc': {
        const aValue = a.card_data.cmc ?? 0;
        const bValue = b.card_data.cmc ?? 0;
        return direction * (aValue - bValue);
      }

      case 'price': {
        const aValue = parseFloat(a.card_data.prices?.usd ?? '0') || 0;
        const bValue = parseFloat(b.card_data.prices?.usd ?? '0') || 0;
        return direction * (aValue - bValue);
      }

      case 'rarity': {
        const aValue =
          rarityOrder[a.card_data.rarity.toLowerCase() as keyof RarityOrder] ??
          0;
        const bValue =
          rarityOrder[b.card_data.rarity.toLowerCase() as keyof RarityOrder] ??
          0;
        return direction * (aValue - bValue);
      }

      case 'power': {
        const aValue = parseInt(a.card_data.power ?? '0') || 0;
        const bValue = parseInt(b.card_data.power ?? '0') || 0;
        return direction * (aValue - bValue);
      }

      case 'toughness': {
        const aValue = parseInt(a.card_data.toughness ?? '0') || 0;
        const bValue = parseInt(b.card_data.toughness ?? '0') || 0;
        return direction * (aValue - bValue);
      }

      case 'released': {
        const aValue = new Date(a.card_data.released_at).getTime();
        const bValue = new Date(b.card_data.released_at).getTime();
        return direction * (aValue - bValue);
      }

      default:
        return 0;
    }
  });
}
