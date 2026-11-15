import type { ScryfallCard } from '~/models/cardModel';
import { collectionSlug } from '~/utils/card-collections';

export const cardLabelGroups = {
  roles: 'Roles',
  themes: 'Themes',
  tags: 'Tags',
  sets: 'Sets',
} as const;
export type DeckLabelGroup = keyof typeof cardLabelGroups;
export type DeckCardLabels = Partial<Record<DeckLabelGroup, string[]>>;
export type VisibleLabelGroup = Exclude<DeckLabelGroup, 'sets'>;
export const cardLabelColors = {
  roles: 'primary',
  themes: 'success',
  tags: 'info',
} as const;
export function isLabelGroup(mode: DeckHighlightMode): mode is DeckLabelGroup {
  return Object.hasOwn(cardLabelGroups, mode);
}

export type DeckHighlightMode =
  'none' | 'owned' | 'color' | 'manaValue' | 'type' | DeckLabelGroup;

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
  labels?: DeckCardLabels,
) {
  let status: string | null = null;
  if (target && isLabelGroup(mode)) {
    const match = labels?.[mode]?.find(
      (name) =>
        (mode === 'roles' || mode === 'themes'
          ? collectionSlug(name, mode)
          : name) === target,
    );
    if (match) status = mode === 'sets' ? match.toUpperCase() : match;
  } else if (target && mode === 'color') {
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
  const highlightColor =
    mode === 'tags'
      ? 'bg-info/25 ring-info'
      : mode === 'themes'
        ? 'bg-success/25 ring-success'
        : 'bg-primary/25 ring-primary';
  return {
    status,
    classes: status ? `ring-2 ring-inset ${highlightColor}` : '',
  };
}
