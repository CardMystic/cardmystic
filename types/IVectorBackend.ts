export interface FormatEntry {
  format: string | null;
  status: string | null;
}

export interface IMagicCardsSearch {
  query: string;
  limit?: number;
  filters: IMagicCardsSearchFilters;
}

export interface IMagicCardsSearchFilters {
  selectedCardTypes: string[];
  selectedColorFilterOption:
    | 'Match Exactly'
    | 'Contains At Least'
    | 'Contains At Most';
  selectedColors: {
    Red: boolean;
    Blue: boolean;
    Green: boolean;
    White: boolean;
    Black: boolean;
  };
  selectedRarities: {
    Common: boolean;
    Uncommon: boolean;
    Rare: boolean;
    Mythic: boolean;
  };
  selectedCMCOption: 'Equal To' | 'Less Than' | 'Greater Than' | 'Not Equal To';
  selectedPowerOption:
    | 'Equal To'
    | 'Less Than'
    | 'Greater Than'
    | 'Not Equal To';
  selectedToughnessOption:
    | 'Equal To'
    | 'Less Than'
    | 'Greater Than'
    | 'Not Equal To';
  selectedCMC: string;
  selectedPower: string;
  selectedToughness: string;
  selectedCardFormats: {
    format: string | null;
    status: string | null;
  }[];
}

export interface IWeaviateMagicCardResponse {
  metadata: {
    score: number;
    explainScore: number;
  };
  properties: IWeaviateMagicCardSchema;
  uuid: string;
}

export interface IWeaviateMagicCardSchema {
  id?: string;
  name: string;
  types: string;
  subtypes: string;
  supertypes: string;
  manaCost: string;
  manaCostNLP: string;
  cardColors: string[];
  cardColorsLength: Number;
  colorIdentity: string[];
  convertedManaCost: Number;
  convertedManaCostNLP: string;
  rarity: string;
  rarityNLP: string;
  setCode: string;
  setName: string;
  setNameNLP: string;
  cardText: string;
  flavorText?: string;
  power: Number;
  powerNLP: string;
  toughness: Number;
  toughnessNLP: string;
  artist?: string;
  url?: string;
  legalityInAlchemyFormat?: string;
  legalityInBrawlFormat?: string;
  legalityInCommanderFormat?: string;
  legalityInDuelFormat?: string;
  legalityInExplorerFormat?: string;
  legalityInFutureFormat?: string;
  legalityInGladiatorFormat?: string;
  legalityInHistoricFormat?: string;
  legalityInHistoricBrawlFormat?: string;
  legalityInLegacyFormat?: string;
  legalityInModernFormat?: string;
  legalityInOathbreakerFormat?: string;
  legalityInOldSchoolFormat?: string;
  legalityInPauperFormat?: string;
  legalityInPauperCommanderFormat?: string;
  legalityInPennyFormat?: string;
  legalityInPioneerFormat?: string;
  legalityInPredhFormat?: string;
  legalityInPremodernFormat?: string;
  legalityInStandardFormat?: string;
  legalityInStandardBrawlFormat?: string;
  legalityInTimelessFormat?: string;
  legalityInVintageFormat?: string;
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
