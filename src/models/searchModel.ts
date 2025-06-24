import { z } from "zod/v4";

const colorFilterOptionEnum = z.enum([
  "Match Exactly",
  "Contains At Least",
  "Contains At Most",
]);
export type ColorFilterOption = z.infer<typeof colorFilterOptionEnum>;
const comparisonOperatorEnum = z.enum([
  "Equal To",
  "Not Equal To",
  "Greater Than",
  "Less Than",
]);
export type ComparisonOperator = z.infer<typeof comparisonOperatorEnum>;

export type CardSearchFilters = z.infer<typeof CardSearchFiltersSchema>;
export const CardSearchFiltersSchema = z.object({
  selectedCardTypes: z.array(z.string()).optional().default([]),
  selectedColorFilterOption: colorFilterOptionEnum
    .optional()
    .default("Contains At Least"),
  selectedColors: z
    .object({
      White: z.boolean().optional().default(false),
      Blue: z.boolean().optional().default(false),
      Black: z.boolean().optional().default(false),
      Red: z.boolean().optional().default(false),
      Green: z.boolean().optional().default(false),
    })
    .optional(),
  selectedRarities: z
    .object({
      Common: z.boolean().optional(),
      Uncommon: z.boolean().optional(),
      Rare: z.boolean().optional(),
      Mythic: z.boolean().optional(),
    })
    .optional()
    .default({}),
  selectedCMCOption: comparisonOperatorEnum.optional().default("Equal To"),
  selectedPowerOption: comparisonOperatorEnum.optional().default("Equal To"),
  selectedToughnessOption: comparisonOperatorEnum
    .optional()
    .default("Equal To"),
  selectedCMC: z.string().optional().default(""),
  selectedPower: z.string().optional().default(""),
  selectedToughness: z.string().optional().default(""),
  selectedCardFormats: z
    .array(
      z.object({
        format: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export function cardSearchFiltersToQueryParams(
  filters: CardSearchFilters,
): string {
  const params = new URLSearchParams();

  if (filters.selectedCardTypes && filters.selectedCardTypes.length > 0) {
    params.set("cardTypes", filters.selectedCardTypes.join(","));
  }

  if (filters.selectedColorFilterOption) {
    params.set("colorFilterOption", filters.selectedColorFilterOption);
  }

  if (filters.selectedColors) {
    for (const [color, value] of Object.entries(filters.selectedColors)) {
      if (value) params.append("color", color);
    }
  }

  if (filters.selectedRarities) {
    for (const [rarity, value] of Object.entries(filters.selectedRarities)) {
      if (value) params.append("rarity", rarity);
    }
  }

  if (filters.selectedCMCOption) {
    params.set("cmcOption", filters.selectedCMCOption);
  }
  if (filters.selectedPowerOption) {
    params.set("powerOption", filters.selectedPowerOption);
  }
  if (filters.selectedToughnessOption) {
    params.set("toughnessOption", filters.selectedToughnessOption);
  }

  if (filters.selectedCMC && filters.selectedCMC !== "") {
    params.set("cmc", filters.selectedCMC);
  }
  if (filters.selectedPower && filters.selectedPower !== "") {
    params.set("power", filters.selectedPower);
  }
  if (filters.selectedToughness && filters.selectedToughness !== "") {
    params.set("toughness", filters.selectedToughness);
  }

  if (filters.selectedCardFormats && filters.selectedCardFormats.length > 0) {
    for (const formatObj of filters.selectedCardFormats) {
      if (formatObj.format) {
        params.append("format", formatObj.format);
      }
      if (formatObj.status) {
        params.append("formatStatus", formatObj.status);
      }
    }
  }

  return params.toString();
}

export type WordSearch = z.infer<typeof WordSearchSchema>;
export const WordSearchSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).optional().default(10),
  filters: CardSearchFiltersSchema.optional(),
  exclude_card_data: z.boolean().optional().default(false),
});
