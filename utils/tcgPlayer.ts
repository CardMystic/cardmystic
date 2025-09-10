/**
 * Generate affiliate link for TCGPlayer ID
 */
export function getAffiliateLink(tcgId: string | number): string {
  if (!tcgId) return '';
  const productUrl = `https://www.tcgplayer.com/product/${tcgId}`;
  return `https://partner.tcgplayer.com/Z6vBoK?u=${encodeURIComponent(productUrl)}`;
}
