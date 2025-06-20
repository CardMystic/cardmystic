import { z } from "zod";

const ColorFilterEnum = z.enum([
  "Match Exactly",
  "Contains At Least",
  "Contains At Most",
]);
const ComparisonOperatorEnum = z.enum([
  "Equal To",
  "Not Equal To",
  "Greater Than",
  "Less Than",
]);

export const CardSearchFiltersSchema = z.object({
  selectedCardTypes: z.array(z.string()).optional().default([]),
  selectedColorFilterOption:
    ColorFilterEnum.optional().default("Contains At Least"),
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
  selectedCMCOption: ComparisonOperatorEnum.optional().default("Equal To"),
  selectedPowerOption: ComparisonOperatorEnum.optional().default("Equal To"),
  selectedToughnessOption:
    ComparisonOperatorEnum.optional().default("Equal To"),
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

export type WordSearch = z.infer<typeof WordSearchSchema>;
export const WordSearchSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).optional().default(10),
  filters: CardSearchFiltersSchema,
  exclude_card_data: z.boolean().optional().default(false),
});
