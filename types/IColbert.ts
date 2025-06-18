import type { IScryfallCard } from './IScryfall';

export interface IColbertResponse {
  results: ICardResult[];
}

export interface ICardResult {
  card_name: string;
  rank: number;
  score: number;
  card_data: IScryfallCard;
}
