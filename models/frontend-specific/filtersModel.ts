/**
 * The frontend and backend filters schemas are backend/frontend specific
 *  because the frontend has all optional values, but the backend does not.
 *  this is just because the model server requires those values.
 * TODO: Consider enforcing default values in the model server
 */

import { z } from 'zod';
import { CardColor, CardRarity, CardType } from '@/models/cardModel';
import {
  ColorFilterEnum,
  ComparisonOperatorEnum,
  SelectedCardFormatsSchema,
} from '@/models/filterUtilsModel';

export const CardSearchFiltersSchema = z.object({
  selectedCardTypes: z.array(CardType).optional(),
  selectedColorFilterOption: ColorFilterEnum.optional(),
  selectedColors: z.array(CardColor).optional(),
  selectedRarities: z.array(CardRarity).optional(),
  selectedCMCOption: ComparisonOperatorEnum.optional(),
  selectedPowerOption: ComparisonOperatorEnum.optional(),
  selectedToughnessOption: ComparisonOperatorEnum.optional(),
  selectedCMC: z.string().optional(),
  selectedPower: z.string().optional(),
  selectedToughness: z.string().optional(),
  selectedCardFormats: SelectedCardFormatsSchema,
  isCommander: z.boolean().optional(),
  isMTGO: z.boolean().optional(),
  isArena: z.boolean().optional(),
  isPaper: z.boolean().optional(),
  isGameChanger: z.boolean().optional(),
});
export type CardSearchFilters = z.infer<typeof CardSearchFiltersSchema>;
