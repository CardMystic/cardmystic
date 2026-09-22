import { z } from 'zod';

export const DeckPreferencesSchema = z.object({
  deck_view: z.enum(['grid', 'text']),
  deck_group_by: z.enum(['type', 'color', 'colorIdentity', 'cmc']).nullable(),
  deck_sort_by: z
    .enum(['name', 'cmc', 'price', 'rarity', 'power', 'toughness', 'released'])
    .nullable(),
  deck_sort_direction: z.enum(['asc', 'desc']),
});
export type DeckPreferences = z.infer<typeof DeckPreferencesSchema>;
export const defaultDeckPreferences: DeckPreferences = {
  deck_view: 'grid',
  deck_group_by: 'type',
  deck_sort_by: 'cmc',
  deck_sort_direction: 'asc',
};
export const deckViewOptions = [
  { value: 'grid', label: 'Card Grid' },
  { value: 'text', label: 'Card Text' },
] satisfies { value: DeckPreferences['deck_view']; label: string }[];
export const deckGroupOptions = [
  { value: 'none', label: 'None' },
  { value: 'type', label: 'Card Type' },
  { value: 'color', label: 'Color' },
  { value: 'colorIdentity', label: 'Color Identity' },
  { value: 'cmc', label: 'Mana Value' },
] satisfies {
  value: NonNullable<DeckPreferences['deck_group_by']> | 'none';
  label: string;
}[];
export const deckSortOptions = [
  { value: 'none', label: 'None' },
  { value: 'name', label: 'Name' },
  { value: 'cmc', label: 'Mana Value' },
  { value: 'price', label: 'Price' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'power', label: 'Power' },
  { value: 'toughness', label: 'Toughness' },
  { value: 'released', label: 'Release Date' },
] satisfies {
  value: NonNullable<DeckPreferences['deck_sort_by']> | 'none';
  label: string;
}[];
