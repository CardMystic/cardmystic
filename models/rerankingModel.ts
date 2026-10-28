import { z } from 'zod';

export const RecommendationRankingFields = {
  rerank_status: z
    .enum(['applied', 'disabled', 'unavailable', 'failed'])
    .optional(),
  reranker: z.literal('jev').nullable().optional(),
  reranker_model: z.string().nullable().optional(),
  ranking_version: z.string().optional(),
  rerank_candidate_count: z.number().int().min(0).max(100).optional(),
  rerank_ms: z.number().nonnegative().optional(),
};
