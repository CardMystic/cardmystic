import type { ScryfallCard } from '~/models/cardModel';

export type DeckHighlightMode =
  'none' | 'owned' | 'color' | 'manaValue' | 'type';

export const highlightColors = [
  { label: 'White', value: 'W' },
  { label: 'Blue', value: 'U' },
  { label: 'Black', value: 'B' },
  { label: 'Red', value: 'R' },
  { label: 'Green', value: 'G' },
  { label: 'Colorless', value: 'colorless' },
  { label: 'Multicolor', value: 'multicolor' },
];
export const highlightTypes = [
  'Land',
  'Creature',
  'Planeswalker',
  'Artifact',
  'Enchantment',
  'Instant',
  'Sorcery',
  'Battle',
];

export function cardHighlight(
  card: ScryfallCard,
  mode: DeckHighlightMode,
  target: string,
) {
  let status: string | null = null;
  if (target && mode === 'color') {
    const colors = card.colors ?? card.card_faces?.[0]?.colors ?? [];
    const matches =
      target === 'colorless'
        ? colors.length === 0
        : target === 'multicolor'
          ? colors.length > 1
          : colors.includes(target);
    if (matches)
      status =
        highlightColors.find((color) => color.value === target)?.label ?? null;
  } else if (target && mode === 'manaValue') {
    const value = Math.max(0, card.cmc ?? 0);
    if (value === Number(target)) status = `Mana value ${value}`;
  } else if (target && mode === 'type' && highlightTypes.includes(target)) {
    const line = card.card_faces?.[0]?.type_line ?? card.type_line ?? '';
    const cardTypes = line.split('—')[0].split(/\s+/);
    if (cardTypes.includes(target)) status = target;
  }
  return {
    status,
    classes: status ? 'bg-primary/25 ring-2 ring-inset ring-primary' : '',
  };
}
