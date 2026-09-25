import { z } from 'zod';
import { CardSchema } from '@/models/cardModel';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';

export type ExampleQueryResponse = z.infer<typeof ExampleQueryResponseSchema>;
export const ExampleQueryResponseSchema = z.object({
  query: z.string().min(1).max(100),
  cards: z.array(CardSchema),
});

export type WordSearch = z.infer<typeof WordSearchSchema>;
export const WordSearchSchema = z.object({
  query: z.string(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'Maximum returned cards, up to 100. Defaults to 100. Filters may reduce the count.',
    ),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
  isTryTopQuery: z.boolean().optional().default(false),
  useRerank: z.boolean().optional().default(true),
});

export type SimilaritySearch = z.infer<typeof SimilaritySearchSchema>;
export const SimilaritySearchSchema = z.object({
  card_name: z.string().meta({
    description: 'The name of the card to find similar cards for.',
    examples: ['Elspeth, Storm Slayer'],
  }),
  limit: z.number().int().min(1).max(100).optional(),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});

export type KeywordSearch = z.infer<typeof KeywordSearchSchema>;
export const KeywordSearchSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  limit: z.number().int().positive().max(100).default(100),
  filters: CardSearchFiltersSchema.optional(),
});
