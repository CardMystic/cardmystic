/** Relative score cutoffs; normalized model scores are not confidence probabilities. */
export const DEFAULT_SEARCH_QUALITY_RATIOS = {
  smart: 0.8,
  similarity: 0.8,
} as const;

export type SearchQualityMode = keyof typeof DEFAULT_SEARCH_QUALITY_RATIOS;
export type SearchQualityOptions = {
  mode: SearchQualityMode;
  /** Runtime configuration may contain either a number or an environment string. */
  ratio?: unknown;
  /** Similarity responses prepend the searched card, which is not a recommendation. */
  preserveFirst?: boolean;
};

/** Accept decimal ratios from .env/runtime config; invalid values keep the app defaults. */
export function resolveSearchQualityRatio(
  value: unknown,
  mode: SearchQualityMode,
): number {
  const fallback = DEFAULT_SEARCH_QUALITY_RATIOS[mode];
  if (typeof value !== 'number' && typeof value !== 'string') return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  const ratio = Number(value);
  return Number.isFinite(ratio) && ratio >= 0 && ratio <= 1 ? ratio : fallback;
}

type ScoredResult = { ai_normalized_score?: number };

function normalizedScore(result: ScoredResult): number | undefined {
  const score = result.ai_normalized_score;
  // Unscored or malformed nonfinite results have no usable quality evidence.
  if (typeof score !== 'number' || !Number.isFinite(score)) return undefined;
  return Math.min(Math.max(score, 0), 1);
}

/** Keep matches close to the best candidate without changing cache data or ordering. */
export function filterSearchResultsByQuality<T extends ScoredResult>(
  results: readonly T[],
  { mode, ratio, preserveFirst = false }: SearchQualityOptions,
): T[] {
  let bestScore = 0;
  for (let index = preserveFirst ? 1 : 0; index < results.length; index++) {
    const score = normalizedScore(results[index]);
    if (score !== undefined && score > bestScore) bestScore = score;
  }

  const minimumScore = bestScore * resolveSearchQualityRatio(ratio, mode);
  return results.filter((result, index) => {
    if (preserveFirst && index === 0) return true;
    const score = normalizedScore(result);
    // Decimal API scores can differ from the multiplied cutoff by one rounding step.
    return (
      score === undefined ||
      (score > 0 && score >= minimumScore - Number.EPSILON)
    );
  });
}
