export const cardFormats = [
  'Alchemy',
  'Brawl',
  'Commander',
  'Duel',
  'Explorer',
  'Future',
  'Gladiator',
  'Historic',
  'HistoricBrawl',
  'Legacy',
  'Modern',
  'Oathbreaker',
  'OldSchool',
  'Pauper',
  'PauperCommander',
  'Penny',
  'Pioneer',
  'Predh',
  'Premodern',
  'Standard',
  'StandardBrawl',
  'Timeless',
  'Vintage',
];

type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Mythic';

export const cardRarities: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Mythic'];

type Color = 'Red' | 'Blue' | 'Green' | 'White' | 'Black';

export const cardColors: Color[] = ['White', 'Black', 'Blue', 'Red', 'Green'];

export const cardTypes = [
  'Creature',
  'Land',
  'Artifact',
  'Enchantment',
  'Planeswalker',
  'Instant',
  'Sorcery',
];
