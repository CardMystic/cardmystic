export interface IColbertResponse {
  results: ICardResult[];
}

export interface ICardResult {
  card_name: string;
  rank: number;
  score: number;
  card_data: ICardData;
}

export interface ICardData {
  id: string;
  name: string;
  object: string;
  mana_cost?: string;
  cmc: number;
  type_line: string;
  oracle_text?: string;
  colors: string[];
  color_identity: string[];
  power?: string;
  toughness?: string;
  layout: string;
  image_uris?: IImageUris;
  card_faces?: ICardFace[];
  legalities: ILegalities;
  rarity: string;
  set: string;
  set_name: string;
  prices: IPrices;
  keywords: string[];
  artist: string;
  released_at: string;
  edhrec_rank?: number;
  foil: boolean;
  nonfoil: boolean;
  oracle_id: string;
  [key: string]: any; // For any additional dynamic fields
}

export interface IImageUris {
  small: string;
  normal: string;
  large: string;
  png: string;
  art_crop: string;
  border_crop: string;
}

export interface ICardFace {
  name: string;
  mana_cost: string;
  type_line: string;
  oracle_text: string;
  power?: string;
  toughness?: string;
  colors: string[];
  image_uris: IImageUris;
  [key: string]: any;
}

export interface ILegalities {
  standard: string;
  future: string;
  historic: string;
  gladiator: string;
  pioneer: string;
  explorer: string;
  modern: string;
  legacy: string;
  pauper: string;
  vintage: string;
  penny: string;
  commander: string;
  oathbreaker: string;
  brawl: string;
  historicbrawl?: string;
  alchemy: string;
  paupercommander: string;
  duel: string;
  oldschool: string;
  premordern?: string;
  predh: string;
  timeless: string;
  standardbrawl?: string;
}

export interface IPrices {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  tix?: string | null;
}
