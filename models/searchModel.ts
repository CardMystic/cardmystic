import { z } from 'zod';
import {
  CardColor,
  CardFormat,
  CardFormatStatus,
  CardRarity,
  CardSchema,
  CardType,
} from './cardModel';

export const DefaultLimitAI = 40;
export const DefaultLimitSimilarity = 39;

const colorFilterOptionEnum = z.enum([
  'Match Exactly',
  'Contains At Least',
  'Contains At Most',
]);
export type ColorFilterOption = z.infer<typeof colorFilterOptionEnum>;
const comparisonOperatorEnum = z.enum([
  'Equal To',
  'Not Equal To',
  'Greater Than',
  'Less Than',
]);
export type ComparisonOperator = z.infer<typeof comparisonOperatorEnum>;

export const SelectedCardFormatsSchema = z
  .array(
    z.object({
      format: CardFormat.optional(),
      status: CardFormatStatus.optional(),
    }),
  )
  .optional();

export type SelectedCardFormats = z.infer<typeof SelectedCardFormatsSchema>;

export type CardSearchFilters = z.infer<typeof CardSearchFiltersSchema>;
export const CardSearchFiltersSchema = z.object({
  selectedCardTypes: z.array(CardType).optional(),
  selectedColorFilterOption: colorFilterOptionEnum.optional(),
  selectedColors: z.array(CardColor).optional(),
  selectedRarities: z.array(CardRarity).optional(),
  selectedCMCOption: comparisonOperatorEnum.optional(),
  selectedPowerOption: comparisonOperatorEnum.optional(),
  selectedToughnessOption: comparisonOperatorEnum.optional(),
  selectedCMC: z.string().optional(),
  selectedPower: z.string().optional(),
  selectedToughness: z.string().optional(),
  selectedCardFormats: SelectedCardFormatsSchema,
});

export type WordSearch = z.infer<typeof WordSearchSchema>;
export const WordSearchSchema = z.object({
  query: z.string().min(1, 'Query must not be empty'),
  limit: z.number().min(1).max(80).optional().default(DefaultLimitAI),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});

export type SimilaritySearch = z.infer<typeof SimilaritySearchSchema>;
export const SimilaritySearchSchema = z.object({
  card_name: z.string().min(1, 'Card name must not be empty'),
  limit: z.number().min(1).max(120).optional().default(DefaultLimitSimilarity),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});

export type ExampleQueryResponse = z.infer<typeof ExampleQueryResponseSchema>;
export const ExampleQueryResponseSchema = z.object({
  query: z.string().min(1).max(100),
  cards: z.array(CardSchema),
});
