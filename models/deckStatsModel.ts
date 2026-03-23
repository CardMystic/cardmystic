import { z } from 'zod';
import { CardSearchFiltersSchema } from './searchModel';
import { CardSchema } from './cardModel';

export const TopCardsSearchSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(200).optional().default(40),
  colors: z.array(z.string()).optional(),
  filters: CardSearchFiltersSchema.optional(),
});
export type TopCardsSearch = z.infer<typeof TopCardsSearchSchema>;

export const TopCommandersSearchSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(200).optional().default(40),
  colors: z.array(z.string()).optional(),
  filters: CardSearchFiltersSchema.optional(),
});
export type TopCommandersSearch = z.infer<typeof TopCommandersSearchSchema>;

export const DeckStatsResponseSchema = z.object({
  results: z.array(CardSchema),
});
export type DeckStatsResponse = z.infer<typeof DeckStatsResponseSchema>;
