import { z } from 'zod';

export const StrategyRankingsSchema = z.object({
  midrange: z.coerce.number().int(),
  combo: z.coerce.number().int(),
  control: z.coerce.number().int(),
  aggro: z.coerce.number().int(),
});

export const LlmCardAttributesSchema = z.object({
  power_level: z.coerce.number().int(),
  community_sentiment: z.array(z.string()).default([]),
  format_strength: z.record(z.string(), z.coerce.number().int()).default({}),
  roles: z.array(z.string()).default([]),
  one_line_summary: z.string().default(''),
  strategy_rankings: StrategyRankingsSchema,
  why_to_play: z.string().default(''),
});

export const CardLlmResponseSchema = z.object({
  card_name: z.string().describe('The resolved card name'),
  scryfall_id: z.string().describe('The Scryfall card ID used for lookup'),
  llm: LlmCardAttributesSchema.nullable().describe(
    'LLM-derived card attributes returned by the model server',
  ),
});

export type StrategyRankings = z.infer<typeof StrategyRankingsSchema>;
export type LlmCardAttributes = z.infer<typeof LlmCardAttributesSchema>;
export type CardLlmResponse = z.infer<typeof CardLlmResponseSchema>;
