export interface IMagicCardsSearch {
  query: string;
  limit?: number;
  filters: IMagicCardsSearchFilters;
}

export interface IMagicCardsSearchFilters {
  types?: string[];
  colors?: string[];
  rarities?: string[];
  sets?: string[];
  powers?: number[];
  toughnesses?: number[];
  artists?: string[];
  manaCosts?: string[];
  legalities?: Legalities;
}

export type Legalities = {
  alchemy?: string;
  brawl?: string;
  commander?: string;
  duel?: string;
  explorer?: string;
  future?: string;
  gladiator?: string;
  historic?: string;
  historicbrawl?: string;
  legacy?: string;
  modern?: string;
  oathbreaker?: string;
  oldschool?: string;
  pauper?: string;
  paupercommander?: string;
  penny?: string;
  pioneer?: string;
  predh?: string;
  premodern?: string;
  standard?: string;
  standardbrawl?: string;
  timeless?: string;
  vintage?: string;
};

export interface IFilter {
  type: string;
  value: string | number;
}
