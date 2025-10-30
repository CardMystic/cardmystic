import type { CardColorType } from '~/models/cardModel';

// Use CardColor values for colors
export type CardColor =
  | 'White'
  | 'Blue'
  | 'Black'
  | 'Red'
  | 'Green'
  | 'Colorless';
export type Pairing = { name: string; colors: CardColor[] };

export const pairings: Pairing[] = [
  { name: 'White', colors: ['White'] },
  { name: 'Blue', colors: ['Blue'] },
  { name: 'Black', colors: ['Black'] },
  { name: 'Red', colors: ['Red'] },
  { name: 'Green', colors: ['Green'] },
  { name: 'Azorius', colors: ['White', 'Blue'] },
  { name: 'Dimir', colors: ['Blue', 'Black'] },
  { name: 'Rakdos', colors: ['Black', 'Red'] },
  { name: 'Gruul', colors: ['Red', 'Green'] },
  { name: 'Selesnya', colors: ['Green', 'White'] },
  { name: 'Orzhov', colors: ['White', 'Black'] },
  { name: 'Izzet', colors: ['Blue', 'Red'] },
  { name: 'Golgari', colors: ['Black', 'Green'] },
  { name: 'Boros', colors: ['Red', 'White'] },
  { name: 'Simic', colors: ['Green', 'Blue'] },
  { name: 'Esper', colors: ['White', 'Blue', 'Black'] },
  { name: 'Grixis', colors: ['Blue', 'Black', 'Red'] },
  { name: 'Jund', colors: ['Black', 'Red', 'Green'] },
  { name: 'Naya', colors: ['Red', 'Green', 'White'] },
  { name: 'Bant', colors: ['Green', 'White', 'Blue'] },
  { name: 'Abzan', colors: ['White', 'Black', 'Green'] },
  { name: 'Jeskai', colors: ['Blue', 'Red', 'White'] },
  { name: 'Sultai', colors: ['Black', 'Green', 'Blue'] },
  { name: 'Mardu', colors: ['Red', 'White', 'Black'] },
  { name: 'Temur', colors: ['Green', 'Blue', 'Red'] },
  { name: 'Yore-Tiller', colors: ['White', 'Blue', 'Black', 'Red'] },
  { name: 'Glint-Eye', colors: ['Blue', 'Black', 'Red', 'Green'] },
  { name: 'Dune-Brood', colors: ['Black', 'Red', 'Green', 'White'] },
  { name: 'Ink-Treader', colors: ['Red', 'Green', 'White', 'Blue'] },
  { name: 'Witch-Maw', colors: ['Green', 'White', 'Blue', 'Black'] },
  { name: 'Five-Color', colors: ['White', 'Blue', 'Black', 'Red', 'Green'] },
];

export const groupedPairings = [
  {
    label: 'Mono-color',
    slot: 'mono',
    pairings: pairings.filter((p) => p.colors.length === 1),
  },
  {
    label: 'Two-color',
    slot: 'two',
    pairings: pairings.filter((p) => p.colors.length === 2),
  },
  {
    label: 'Three-color',
    slot: 'three',
    pairings: pairings.filter((p) => p.colors.length === 3),
  },
  {
    label: 'Four-color',
    slot: 'four',
    pairings: pairings.filter((p) => p.colors.length === 4),
  },
  {
    label: 'Five-color',
    slot: 'five',
    pairings: pairings.filter((p) => p.colors.length === 5),
  },
];

// Helper: map a set of colors to a known pairing name (order-agnostic), or fallback to initials
export function getColorIdentityName(colors: CardColorType[] | undefined) {
  if (!colors || colors.length === 0) return '';
  const normalized = [...new Set(colors)];
  const match = pairings.find((p) => {
    if (p.colors.length !== normalized.length) return false;
    return (
      p.colors.every((c) => normalized.includes(c as CardColorType)) &&
      normalized.every((c) => p.colors.includes(c as CardColorType))
    );
  });
  if (match) return match.name;
  const initials = normalized
    .map((c) => {
      switch (c) {
        case 'White':
          return 'W';
        case 'Blue':
          return 'U';
        case 'Black':
          return 'B';
        case 'Red':
          return 'R';
        case 'Green':
          return 'G';
        case 'Colorless':
          return 'Colorless';
        default:
          return String(c)[0];
      }
    })
    .join('');
  return initials;
}
