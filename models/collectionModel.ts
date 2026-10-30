import type { Card } from './cardModel';
export type CardCollectionKind = 'themes' | 'roles' | 'sets';
export interface CardCollectionEntry {
  slug: string;
  name: string;
  cardCount: number;
  imageUrl: string | null;
  imageCardName: string | null;
  releasedAt: string | null;
}
export interface CardCollectionCatalog {
  dataReleaseId: string;
  themes: CardCollectionEntry[];
  roles: CardCollectionEntry[];
  sets: CardCollectionEntry[];
}
export interface CollectionCardsPage {
  dataReleaseId: string;
  results: Card[];
  total: number;
  offset: number;
}
