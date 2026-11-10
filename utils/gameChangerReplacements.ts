import type { Card } from '~/models/cardModel';
import type { AnalysisCard } from '~/utils/deckAnalysis';

export function replacementColors(entries: AnalysisCard[]): string[] {
  const commanders = entries.filter((entry) => entry.commander);
  return [
    ...new Set(
      (commanders.length ? commanders : entries).flatMap(
        ({ card }) => card.color_identity ?? [],
      ),
    ),
  ];
}

export function gameChangersInDeck(entries: AnalysisCard[]) {
  return [
    ...new Map(
      entries
        .filter(({ card, quantity }) => quantity > 0 && card.game_changer)
        .map(({ card }) => [card.oracle_id, card]),
    ).values(),
  ];
}

export function filterGameChangerReplacements(
  results: Card[],
  colors: string[],
  deckOracleIds: string[],
) {
  const allowed = new Set(colors);
  const used = new Set(deckOracleIds);
  return results.filter(({ card_data: card }) => {
    if (
      card.game_changer ||
      used.has(card.oracle_id) ||
      !Array.isArray(card.color_identity) ||
      !card.color_identity.every((color) => allowed.has(color))
    )
      return false;
    used.add(card.oracle_id);
    return true;
  });
}
