/** Prefer nonfoil USD, falling back to foil when no usable nonfoil quote exists. */
export function getUsdPrice(
  prices?: { usd?: string | null; usd_foil?: string | null } | null,
): string | null {
  for (const raw of [prices?.usd, prices?.usd_foil]) {
    if (raw?.trim() && Number.isFinite(Number(raw)) && Number(raw) >= 0)
      return raw.trim();
  }
  return null;
}
