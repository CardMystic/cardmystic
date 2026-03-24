import type { Ref } from 'vue';
import type { Card } from '~/models/cardModel';
import { pairings } from '~/utils/colorPairings';

export type CardGroup = {
  label: string;
  cards: Card[];
};

type RarityOrder = Record<'common' | 'uncommon' | 'rare' | 'mythic', number>;

const rarityOrder: RarityOrder = {
  common: 1,
  uncommon: 2,
  rare: 3,
  mythic: 4,
};

const typeOrder: Record<string, number> = {
  creature: 2,
  sorcery: 3,
  instant: 4,
  artifact: 5,
  enchantment: 6,
  planeswalker: 1,
  land: 7,
};

const colorOrder: Record<string, number> = {
  W: 1,
  U: 2,
  B: 3,
  R: 4,
  G: 5,
};

function getEffectiveScore(card: Card): number {
  if (card.ai_normalized_score !== undefined) return card.ai_normalized_score;
  if (card.als_score !== undefined) return card.als_score;
  return 0;
}

function scoreTiebreaker(a: Card, b: Card): number {
  const primary = getEffectiveScore(b) - getEffectiveScore(a); // higher score first
  if (primary !== 0) return primary;
  // Break effective-score ties: prefer higher popularity, then ALS
  if (a.popularity !== undefined && b.popularity !== undefined) {
    const diff = (b.popularity ?? 0) - (a.popularity ?? 0);
    if (diff !== 0) return diff;
  }
  return (b.als_score ?? 0) - (a.als_score ?? 0);
}

/**
 * Sort-aware tiebreaker: when the primary sort field ties, use a related
 * secondary score (e.g. popularity for AI score ties) before falling back
 * to the generic effective-score tiebreaker.
 */
function sortAwareTiebreaker(
  a: Card,
  b: Card,
  sortBy: string | null | undefined,
): number {
  switch (sortBy) {
    case 'ai_score': {
      // Tie on AI score → prefer higher popularity, then ALS
      if (a.popularity !== undefined && b.popularity !== undefined) {
        const diff = (b.popularity ?? 0) - (a.popularity ?? 0);
        if (diff !== 0) return diff;
      }
      return (b.als_score ?? 0) - (a.als_score ?? 0);
    }
    case 'popularity': {
      // Tie on popularity → prefer higher AI score, then ALS
      if (
        a.ai_normalized_score !== undefined &&
        b.ai_normalized_score !== undefined
      ) {
        const diff =
          (b.ai_normalized_score ?? 0) - (a.ai_normalized_score ?? 0);
        if (diff !== 0) return diff;
      }
      return (b.als_score ?? 0) - (a.als_score ?? 0);
    }
    case 'deck_score': {
      // Tie on deck/ALS score → prefer higher AI score, then popularity
      if (
        a.ai_normalized_score !== undefined &&
        b.ai_normalized_score !== undefined
      ) {
        const diff =
          (b.ai_normalized_score ?? 0) - (a.ai_normalized_score ?? 0);
        if (diff !== 0) return diff;
      }
      return (b.popularity ?? 0) - (a.popularity ?? 0);
    }
    default:
      return scoreTiebreaker(a, b);
  }
}

function compareWithTiebreaker(
  primary: number,
  a: Card,
  b: Card,
  sortBy?: string | null,
): number {
  return primary !== 0 ? primary : sortAwareTiebreaker(a, b, sortBy);
}

export function sortSearchResults(
  searchResults: Array<Card> | null | undefined,
  sortBy: string | null | undefined,
  sortDirection: 'asc' | 'desc',
): Array<Card> | null | undefined {
  if (!searchResults) {
    return searchResults;
  }

  const results = [...searchResults];

  if (!sortBy) {
    // No explicit sort — use default score-based ordering
    return results.sort(scoreTiebreaker);
  }

  const direction = sortDirection === 'asc' ? 1 : -1;

  return results.sort((a, b) => {
    let primary: number;
    switch (sortBy) {
      case 'name': {
        const aValue = a.card_data.name.toLowerCase();
        const bValue = b.card_data.name.toLowerCase();
        primary = direction * aValue.localeCompare(bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'cmc': {
        const aValue = a.card_data.cmc ?? 0;
        const bValue = b.card_data.cmc ?? 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'price': {
        const aValue = parseFloat(a.card_data.prices?.usd ?? '0') || 0;
        const bValue = parseFloat(b.card_data.prices?.usd ?? '0') || 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'rarity': {
        const aValue =
          rarityOrder[a.card_data.rarity.toLowerCase() as keyof RarityOrder] ??
          0;
        const bValue =
          rarityOrder[b.card_data.rarity.toLowerCase() as keyof RarityOrder] ??
          0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'power': {
        const aValue = parseInt(a.card_data.power ?? '0') || 0;
        const bValue = parseInt(b.card_data.power ?? '0') || 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'toughness': {
        const aValue = parseInt(a.card_data.toughness ?? '0') || 0;
        const bValue = parseInt(b.card_data.toughness ?? '0') || 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'released': {
        const aValue = new Date(a.card_data.released_at).getTime();
        const bValue = new Date(b.card_data.released_at).getTime();
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b);
      }

      case 'deck_score': {
        const aValue = a.als_score ?? 0;
        const bValue = b.als_score ?? 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b, sortBy);
      }

      case 'ai_score': {
        const aValue = a.ai_normalized_score ?? 0;
        const bValue = b.ai_normalized_score ?? 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b, sortBy);
      }

      case 'popularity': {
        const aValue = a.popularity ?? 0;
        const bValue = b.popularity ?? 0;
        primary = direction * (aValue - bValue);
        return compareWithTiebreaker(primary, a, b, sortBy);
      }

      default:
        return 0;
    }
  });
}

function getCardTypePrimary(typeLine: string): string {
  const lower = typeLine.toLowerCase();
  for (const type of Object.keys(typeOrder)) {
    if (lower.includes(type)) return type;
  }
  return 'other';
}

function getCardTypeLabel(type: string): string {
  if (type === 'other') return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Map Scryfall color identity letters to CardColor names for pairing lookup
const letterToColorName: Record<string, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

// Canonical WUBRG order for consistent key generation
const wubrgOrder = ['W', 'U', 'B', 'R', 'G'];

function getColorGroupKey(colorIdentity: string[]): string {
  if (!colorIdentity || colorIdentity.length === 0) return 'Colorless';
  // Sort by WUBRG order for consistent keys
  const sorted = [...colorIdentity].sort(
    (a, b) => (wubrgOrder.indexOf(a) ?? 99) - (wubrgOrder.indexOf(b) ?? 99),
  );
  return sorted.join('');
}

function getColorLabel(key: string): string {
  if (key === 'Colorless') return 'Colorless';
  // Convert letter key to color names and look up pairing
  const colorNames = key
    .split('')
    .map((l) => letterToColorName[l])
    .filter(Boolean);
  const match = pairings.find((p) => {
    if (p.colors.length !== colorNames.length) return false;
    return (
      p.colors.every((c) => colorNames.includes(c)) &&
      colorNames.every((c) => (p.colors as string[]).includes(c))
    );
  });
  if (match) return match.name;
  return key; // fallback to raw letters
}

export function groupCards(cards: Card[], groupBy: string): CardGroup[] {
  const groupMap = new Map<string, Card[]>();

  for (const card of cards) {
    let key: string;
    switch (groupBy) {
      case 'type':
        key = getCardTypePrimary(card.card_data.type_line ?? '');
        break;
      case 'color':
        key = getColorGroupKey(card.card_data.color_identity);
        break;
      case 'cmc':
        key = String(Math.floor(card.card_data.cmc ?? 0));
        break;
      default:
        key = 'other';
    }
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(card);
  }

  // Sort groups by their natural order
  const entries = [...groupMap.entries()];
  entries.sort(([a], [b]) => {
    switch (groupBy) {
      case 'type': {
        const aOrder = typeOrder[a] ?? 99;
        const bOrder = typeOrder[b] ?? 99;
        return aOrder - bOrder;
      }
      case 'color': {
        // Sort: mono colors in WUBRG, then 2-color, 3-color, etc., then Colorless last
        if (a === 'Colorless' && b === 'Colorless') return 0;
        if (a === 'Colorless') return 1;
        if (b === 'Colorless') return -1;
        // Sort by number of colors first, then by WUBRG position
        if (a.length !== b.length) return a.length - b.length;
        // Same number of colors — compare lexicographically by WUBRG-sorted key
        return a.localeCompare(b);
      }
      case 'cmc':
        return Number(a) - Number(b);
      default:
        return 0;
    }
  });

  return entries.map(([key, groupCards]) => ({
    label:
      groupBy === 'type'
        ? `${getCardTypeLabel(key)} (${groupCards.length})`
        : groupBy === 'color'
          ? `${getColorLabel(key)} (${groupCards.length})`
          : `Mana Value ${key} (${groupCards.length})`,
    cards: groupCards,
  }));
}

export function groupAndSortCards(
  cards: Card[] | null | undefined,
  groupBy: string | null | undefined,
  sortBy: string | null | undefined,
  sortDirection: 'asc' | 'desc',
): CardGroup[] | null {
  if (!cards || cards.length === 0) return null;

  if (!groupBy) {
    // No grouping - return single group with sorted cards
    const sorted = sortSearchResults(cards, sortBy, sortDirection) || cards;
    return [{ label: '', cards: sorted }];
  }

  const groups = groupCards(cards, groupBy);

  // Sort cards within each group (default to score descending when no sortBy)
  return groups.map((group) => {
    if (sortBy) {
      return {
        ...group,
        cards:
          sortSearchResults(group.cards, sortBy, sortDirection) || group.cards,
      };
    }
    return { ...group, cards: [...group.cards].sort(scoreTiebreaker) };
  });
}
