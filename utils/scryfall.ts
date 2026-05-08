import type { CardFormatType, ScryfallCard } from '~/models/cardModel';

/**
 * Which Scryfall image variant to use. Scryfall serves the same artwork
 * at different resolutions:
 *   - `small`  →  146 × 204  (~10–30 kB)   thumbnails / carousels / grids
 *   - `normal` →  488 × 680  (~60–150 kB)  default detail / list cards
 *   - `large`  →  672 × 936  (~160–400 kB) hovered preview / detail page
 *
 * Picking the right variant is the single biggest win for homepage
 * Lighthouse — eleven `normal` thumbnails ≈ 1.4 MB, while eleven
 * `small` thumbnails ≈ 200 kB.
 */
export type CardImageSize = 'small' | 'normal' | 'large';

/**
 * Try `image_uris` keys in priority order based on the requested size,
 * falling back to whatever's available so we always return *something*
 * if the card has any image at all.
 */
const pickFromImageUris = (
  uris: Partial<Record<string, string>> | undefined,
  size: CardImageSize,
): string | undefined => {
  if (!uris) return undefined;
  const order: string[] =
    size === 'small'
      ? ['small', 'normal', 'large', 'png']
      : size === 'large'
        ? ['large', 'normal', 'small', 'png']
        : ['normal', 'large', 'small', 'png'];
  for (const key of order) {
    const url = uris[key];
    if (url) return url;
  }
  return undefined;
};

export function getCardImageUrl(
  cardData: ScryfallCard,
  isFlipped: boolean = false,
  size: CardImageSize = 'normal',
): string {
  // Use current printing instead of passed cardData
  const printingData = cardData;
  const isDualFaced = cardData?.card_faces && cardData.card_faces.length >= 2;

  // For dual-faced cards, show the appropriate face
  if (isDualFaced && printingData.card_faces) {
    const face = isFlipped
      ? printingData.card_faces[1]
      : printingData.card_faces[0];
    const faceUrl = pickFromImageUris(face.image_uris, size);
    if (faceUrl) return faceUrl;
  }

  // Single-faced cards
  const url = pickFromImageUris(printingData.image_uris, size);
  if (url) return url;

  // Fallback to first face if available
  if (printingData.card_faces && printingData.card_faces[0]?.image_uris) {
    const fallback = pickFromImageUris(
      printingData.card_faces[0].image_uris,
      size,
    );
    if (fallback) return fallback;
  }

  return '';
}

export const formatsToIgnore: CardFormatType[] = [
  'Old School',
  'Standard Brawl',
  'Explorer',
  'Historic Brawl',
  'Gladiator',
  'Premodern',
  'Predh',
  'Pauper Commander',
];

export const getLegalityColor = (status: string) => {
  const s = status.toUpperCase();
  switch (s) {
    case 'LEGAL':
      return 'info';
    case 'BANNED':
      return 'error';
    case 'NOT LEGAL':
      return 'neutral';
    case 'RESTRICTED':
      return 'warning';
    default:
      return 'primary';
  }
};

export const standardizeFormatName = (raw: string) => {
  return raw.replace(/([A-Z])/g, ' $1').trim();
};

export function getCardArtUrl(
  cardData: ScryfallCard,
  isFlipped: boolean = false,
): string {
  const isDualFaced = cardData?.card_faces && cardData.card_faces.length >= 2;

  // For dual-faced cards, show the appropriate face
  if (isDualFaced && cardData.card_faces) {
    const face = isFlipped ? cardData.card_faces[1] : cardData.card_faces[0];
    if (face.image_uris?.art_crop) {
      return face.image_uris.art_crop;
    }
  }

  // For single-faced cards, try art_crop
  if (cardData.image_uris?.art_crop) {
    return cardData.image_uris.art_crop;
  }

  // Fallback to first face if available
  if (cardData.card_faces && cardData.card_faces[0]?.image_uris?.art_crop) {
    return cardData.card_faces[0].image_uris.art_crop;
  }

  return '';
}
