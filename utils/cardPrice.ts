/** Uses the Basic supertype, including snow basics and Wastes, rather than card names. */
export function isBasicLand(card?: { type_line?: string } | null): boolean {
  return /\bBasic\b.*\bLand\b/.test(card?.type_line?.split('—')[0] ?? '');
}

/** Prefer this printing's USD quotes, then the separately identified paper-printing estimate. */
export function getUsdPrice(
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    usd_estimate?: string | null;
  } | null,
): string | null {
  for (const raw of [prices?.usd, prices?.usd_foil, prices?.usd_estimate]) {
    if (raw?.trim() && Number.isFinite(Number(raw)) && Number(raw) >= 0)
      return raw.trim();
  }
  return null;
}
