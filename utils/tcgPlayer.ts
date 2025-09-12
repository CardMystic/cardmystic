/**
 * Generate affiliate link for TCGPlayer ID
 */
export function getAffiliateLink(tcgId: string | number): string {
  if (!tcgId) return '';
  const productUrl = `https://www.tcgplayer.com/product/${tcgId}`;
  return `https://partner.tcgplayer.com/Z6vBoK?u=${encodeURIComponent(productUrl)}`;
}

/**
 * Generate a WORKING TCGplayer Mass Entry URL (no affiliate params).
 * - Each item formatted as: QTY+Card+Name
 * - Name is encodeURIComponent'd, then spaces -> '+', and '%2B' normalized back to '+'
 * - Items joined with encoded '||' => %7C%7C
 * - Do NOT wrap this in URLSearchParams (it will break the + signs)
 */
export function getMassEntryAffiliateLink(cardNames: string[]): string {
  if (!cardNames?.length) return '';

  const entries = cardNames.map((raw) => {
    const t = raw.trim();
    const m = t.match(/^(\d+)\s+(.*)$/); // optional leading qty
    const qty = m ? m[1] : '1';
    const name = (m ? m[2] : t).trim();

    // Encode punctuation, then force word separators to '+'
    const encodedName = encodeURIComponent(name)
      .replace(/%20/g, '+') // spaces -> '+'
      .replace(/%2B/gi, '+'); // normalize any '+'
    return `${qty}+${encodedName}`;
  });

  // Use encoded '||' between items
  const cParam = entries.join('%7C%7C');

  // Raw Mass Entry URL
  const massEntryUrl = `https://www.tcgplayer.com/massentry?c=${cParam}`;

  // Wrap with partner redirect
  return `https://partner.tcgplayer.com/Z6vBoK?u=${encodeURIComponent(massEntryUrl)}`;
}
