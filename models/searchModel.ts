import { z } from 'zod';
import { CardFormat, CardFormatStatus, CardSchema } from '@/models/cardModel';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';

export type ExampleQueryResponse = z.infer<typeof ExampleQueryResponseSchema>;
export const ExampleQueryResponseSchema = z.object({
  query: z.string().min(1).max(100),
  cards: z.array(CardSchema),
});

export const ColorFilterEnum = z.enum([
  'Match Exactly',
  'Contains At Least',
  'Contains At Most',
  'Color Identity',
]);
export type ColorFilterOption = z.infer<typeof ColorFilterEnum>;
export const ComparisonOperatorEnum = z.enum([
  'Equal To',
  'Not Equal To',
  'Greater Than',
  'Less Than',
]);
export type ComparisonOperator = z.infer<typeof ComparisonOperatorEnum>;

export const SelectedCardFormatsSchema = z
  .array(
    z.object({
      format: CardFormat.optional(),
      status: CardFormatStatus.optional(),
    }),
  )
  .optional();

export type SelectedCardFormats = z.infer<typeof SelectedCardFormatsSchema>;

export type WordSearch = z.infer<typeof WordSearchSchema>;
export const WordSearchSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).optional(),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
  isTryTopQuery: z.boolean().optional().default(false),
});

export type SimilaritySearch = z.infer<typeof SimilaritySearchSchema>;
export const SimilaritySearchSchema = z.object({
  card_name: z.string().meta({
    description: 'The name of the card to find similar cards for.',
    examples: ['Elspeth, Storm Slayer'],
  }),
  limit: z.number().min(1).max(1000).optional(),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});

export type KeywordSearch = z.infer<typeof KeywordSearchSchema>;
export const KeywordSearchSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  limit: z.number().int().positive().max(500).default(100),
  filters: CardSearchFiltersSchema.optional(),
});
