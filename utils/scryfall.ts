import type { CardFormatType, ScryfallCard } from '~/models/cardModel';

export function getCardImageUrl(
  cardData: ScryfallCard,
  isFlipped: boolean = false,
): string {
  // Use current printing instead of passed cardData
  const printingData = cardData;
  const isDualFaced = cardData?.card_faces && cardData.card_faces.length >= 2;

  // For dual-faced cards, show the appropriate face
  if (isDualFaced && printingData.card_faces) {
    const face = isFlipped
      ? printingData.card_faces[1]
      : printingData.card_faces[0];
    if (face.image_uris) {
      if (face.image_uris.normal) return face.image_uris.normal;
      if (face.image_uris.large) return face.image_uris.large;
      if (face.image_uris.small) return face.image_uris.small;
      if (face.image_uris.png) return face.image_uris.png;
    }
  }

  // For single-faced cards, try different image URI options
  if (printingData.image_uris?.normal) {
    return printingData.image_uris.normal;
  }
  if (printingData.image_uris?.large) {
    return printingData.image_uris.large;
  }
  if (printingData.image_uris?.small) {
    return printingData.image_uris.small;
  }
  if (printingData.image_uris?.png) {
    return printingData.image_uris.png;
  }

  // Fallback to first face if available
  if (printingData.card_faces && printingData.card_faces[0]?.image_uris) {
    const firstFace = printingData.card_faces[0].image_uris;
    if (firstFace.normal) return firstFace.normal;
    if (firstFace.large) return firstFace.large;
    if (firstFace.small) return firstFace.small;
    if (firstFace.png) return firstFace.png;
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
