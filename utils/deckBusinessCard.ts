export interface DeckBusinessCardDetails {
  playstyles: string[];
  opening_hand: string[];
  combos: { name: string; description: string; oracle_ids: string[] }[];
  summary: string;
  win_plan: string;
  hero_oracle_id: string | null;
  core_oracle_ids: string[];
}

export function deckBusinessCardUrl(listId: string): string {
  return `https://cardmystic.com/lists/${encodeURIComponent(listId)}`;
}

/** Generated in the browser; no URL or deck information is sent to a QR service. */
export async function deckBusinessCardQr(listId: string): Promise<string> {
  const { default: QRCode } = await import('qrcode');
  return QRCode.toString(deckBusinessCardUrl(listId), {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
