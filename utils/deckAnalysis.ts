import type { ScryfallCard } from '~/models/cardModel';
export interface AnalysisCard {
  card: ScryfallCard;
  quantity: number;
  commander?: boolean;
}
export function analyzeDeck(entries: AnalysisCard[]) {
  const library = entries.filter((entry) => !entry.commander);
  const total = library.reduce((sum, entry) => sum + entry.quantity, 0);
  const lands = library.reduce(
    (sum, entry) =>
      sum +
      (/\bLand\b/.test(
        entry.card.card_faces?.[0]?.type_line ?? entry.card.type_line ?? '',
      )
        ? entry.quantity
        : 0),
    0,
  );
  const modalLands = library.reduce(
    (sum, entry) =>
      sum +
      (entry.card.layout === 'modal_dfc' &&
      !/\bLand\b/.test(entry.card.card_faces?.[0]?.type_line ?? '') &&
      entry.card.card_faces?.some((face) =>
        /\bLand\b/.test(face.type_line ?? ''),
      )
        ? entry.quantity
        : 0),
    0,
  );
  const curve = Array.from({ length: 8 }, (_, i) => ({
    label: i === 7 ? '7+' : String(i),
    count: 0,
  }));
  const colors = ['W', 'U', 'B', 'R', 'G', 'C'].map((color) => ({
    label: color,
    count: 0,
  }));
  for (const { card, quantity } of library) {
    if (
      !/\bLand\b/.test(card.card_faces?.[0]?.type_line ?? card.type_line ?? '')
    )
      curve[Math.min(7, Math.max(0, Math.floor(card.cmc ?? 0)))].count +=
        quantity;
    const identity = card.color_identity ?? [];
    for (const color of identity.length ? identity : ['C']) {
      const bucket = colors.find((value) => value.label === color);
      if (bucket) bucket.count += quantity;
    }
  }
  // Exact hypergeometric probability, without replacement. No mulligan assumption.
  const hand = Math.min(7, total);
  const choose = (n: number, k: number) => {
    if (k < 0 || k > n) return 0;
    let value = 1;
    for (let i = 1; i <= k; i++) value *= (n - i + 1) / i;
    return value;
  };
  const denominator = choose(total, hand);
  const atLeastTwo =
    denominator && hand >= 2
      ? 1 -
        (choose(total - lands, hand) +
          lands * choose(total - lands, hand - 1)) /
          denominator
      : 0;
  return {
    total,
    lands,
    modalLands,
    curve,
    colors,
    atLeastTwo: Math.max(0, Math.min(1, atLeastTwo)),
    averageOpeningLands: total ? (hand * lands) / total : 0,
  };
}
