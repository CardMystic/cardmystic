import { z } from 'zod';
import { CardSearchFiltersSchema } from './searchModel';
import { ScryfallCardSchema } from './cardModel';

export const TopCardsSearchSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
  colors: z.array(z.string()).optional(),
  filters: CardSearchFiltersSchema.optional(),
});
export type TopCardsSearch = z.infer<typeof TopCardsSearchSchema>;

export const TopCommandersSearchSchema = z.object({
  query: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
  colors: z.array(z.string()).optional(),
  filters: CardSearchFiltersSchema.optional(),
});
export type TopCommandersSearch = z.infer<typeof TopCommandersSearchSchema>;

export const TopCardResultSchema = z.object({
  card_name: z.string(),
  count: z.number(),
  popularity: z.number(),
  card_data: ScryfallCardSchema,
  ai_raw_score: z.number().optional(),
  ai_normalized_score: z.number().optional(),
});
export type TopCardResult = z.infer<typeof TopCardResultSchema>;

export const TopCardsResponseSchema = z.object({
  total_decks: z.number(),
  results: z.array(TopCardResultSchema),
});
export type TopCardsResponse = z.infer<typeof TopCardsResponseSchema>;

export const TopCommanderResultSchema = z.object({
  commanders: z.array(z.string()),
  count: z.number(),
  popularity: z.number(),
  card_data: z.array(ScryfallCardSchema).min(1).max(2),
  ai_raw_score: z.number().optional(),
  ai_normalized_score: z.number().optional(),
});
export type TopCommanderResult = z.infer<typeof TopCommanderResultSchema>;

export const TopCommandersResponseSchema = z.object({
  total_decks: z.number(),
  results: z.array(TopCommanderResultSchema),
});
export type TopCommandersResponse = z.infer<typeof TopCommandersResponseSchema>;

export const PopularByCommanderSearchSchema = z.object({
  commanders: z.array(z.string()),
  query: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
  filters: CardSearchFiltersSchema.optional(),
});
export type PopularByCommanderSearch = z.infer<
  typeof PopularByCommanderSearchSchema
>;

export const PopularCommandersForCardSearchSchema = z.object({
  card_name: z.string(),
  query: z.string().optional(),
  limit: z.number().min(1).max(200).optional(),
  filters: CardSearchFiltersSchema.optional(),
});
export type PopularCommandersForCardSearch = z.infer<
  typeof PopularCommandersForCardSearchSchema
>;
