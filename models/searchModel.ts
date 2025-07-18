import { z } from 'zod';
import {
  CardColor,
  CardFormat,
  CardFormatStatus,
  CardRarity,
  CardType,
} from './cardModel';

export const DefaultLimit = 40;

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
  limit: z.number().min(1).max(80).optional().default(DefaultLimit),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});

export type SimilaritySearch = z.infer<typeof SimilaritySearchSchema>;
export const SimilaritySearchSchema = z.object({
  card_name: z.string().min(1, 'Card name must not be empty'),
  limit: z.number().min(1).max(120).optional().default(DefaultLimit),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});

export const AutocompleteSearchSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().int().positive().max(50).default(DefaultLimit),
});

export const AutocompleteSearchResponseSchema = z.object({
  suggestions: z.array(z.string()),
  query: z.string(),
  count: z.number(),
});
