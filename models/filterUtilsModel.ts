import { z } from 'zod';
import { CardFormat, CardFormatStatus } from '@/models/cardModel';

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
