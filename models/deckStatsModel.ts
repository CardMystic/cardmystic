import { z } from 'zod';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import { ScryfallCardSchema } from './cardModel';

// -----------------------------------
// Requests
// -----------------------------------

export const TopCardsRequestSchema = z.object({
  limit: z.number().int().min(1).max(500).default(50),
  query: z
    .string()
    .min(1)
    .max(1000)
    .optional()
    .describe('Optional ColBERT re-ranking query'),
  colors: z
    .array(z.enum(['white', 'blue', 'black', 'red', 'green']))
    .min(1)
    .optional()
    .describe('Filter to exact color identity'),
  filters: CardSearchFiltersSchema.optional().describe(
    'Optional card attribute filters',
  ),
});
export type TopCardsRequest = z.infer<typeof TopCardsRequestSchema>;

export const TopCommandersRequestSchema = z.object({
  limit: z.number().int().min(1).max(500).default(50),
  query: z
    .string()
    .min(1)
    .max(1000)
    .optional()
    .describe('Optional ColBERT re-ranking query'),
  colors: z
    .array(z.enum(['white', 'blue', 'black', 'red', 'green']))
    .min(1)
    .optional()
    .describe('Filter to exact color identity'),
  filters: CardSearchFiltersSchema.optional().describe(
    'Optional card attribute filters',
  ),
});
export type TopCommandersRequest = z.infer<typeof TopCommandersRequestSchema>;

export const PopularByCommanderRequestSchema = z.object({
  commanders: z
    .array(z.string().min(1).max(200))
    .min(1)
    .max(2)
    .describe('1 or 2 commander names (case-insensitive)'),
  limit: z.number().int().min(1).max(500).default(50),
  query: z
    .string()
    .min(1)
    .max(1000)
    .optional()
    .describe('Optional ColBERT re-ranking query'),
  filters: CardSearchFiltersSchema.optional().describe(
    'Optional card attribute filters',
  ),
});
export type PopularByCommanderRequest = z.infer<
  typeof PopularByCommanderRequestSchema
>;

export const PopularCommandersForCardRequestSchema = z.object({
  card_name: z
    .string()
    .min(1)
    .max(200)
    .describe('The card name to look up (case-insensitive)'),
  limit: z.number().int().min(1).max(500).default(50),
  query: z
    .string()
    .min(1)
    .max(1000)
    .optional()
    .describe('Optional ColBERT re-ranking query'),
  filters: CardSearchFiltersSchema.optional().describe(
    'Optional card attribute filters',
  ),
});
export type PopularCommandersForCardRequest = z.infer<
  typeof PopularCommandersForCardRequestSchema
>;

// -----------------------------------
// Responses
// -----------------------------------

const CardPopularitySchema = z.object({
  card_name: z.string(),
  count: z.number(),
  popularity: z.number(),
  card_data: ScryfallCardSchema,
  ai_raw_score: z.number().optional(),
  ai_normalized_score: z.number().optional(),
});

const CommanderPopularitySchema = z.object({
  commanders: z.array(z.string()),
  count: z.number(),
  popularity: z.number(),
  card_data: z.array(ScryfallCardSchema).min(1).max(2),
  ai_raw_score: z.number().optional(),
  ai_normalized_score: z.number().optional(),
});

export const TopCardsResponseSchema = z.object({
  total_decks: z.number(),
  results: z.array(CardPopularitySchema),
});

export type TopCardsResponse = z.infer<typeof TopCardsResponseSchema>;

export const TopCommandersResponseSchema = z.object({
  total_decks: z.number(),
  results: z.array(CommanderPopularitySchema),
});

export type TopCommandersResponse = z.infer<typeof TopCommandersResponseSchema>;

export const PopularByCommanderSchema = z.object({
  total_decks: z.number(),
  results: z.array(CardPopularitySchema),
});

export type PopularByCommander = z.infer<typeof PopularByCommanderSchema>;

export const PopularCommandersForCardResponseSchema = z.object({
  total_decks: z.number(),
  results: z.array(CommanderPopularitySchema),
});

export type PopularCommandersForCardResponse = z.infer<
  typeof PopularCommandersForCardResponseSchema
>;
