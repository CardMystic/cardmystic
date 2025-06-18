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
