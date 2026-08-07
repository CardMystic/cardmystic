import { z } from 'zod';

export const CardType = z.enum([
  'Artifact',
  'Conspiracy',
  'Creature',
  'Enchantment',
  'Instant',
  'Land',
  'Phenomenon',
  'Plane',
  'Planeswalker',
  'Scheme',
  'Sorcery',
  'Tribal',
  'Vanguard',
]);

export const CardRarity = z.enum(['Common', 'Uncommon', 'Rare', 'Mythic']);

export const CardColor = z.enum([
  'White',
  'Blue',
  'Black',
  'Red',
  'Green',
  'Colorless',
]);
export type CardColorType = z.infer<typeof CardColor>;

export const CardFormat = z.enum([
  'Alchemy',
  'Brawl',
  'Commander',
  'Duel',
  'Explorer',
  'Future',
  'Gladiator',
  'Historic',
  'Historic Brawl',
  'Legacy',
  'Modern',
  'Oathbreaker',
  'Old School',
  'Pauper',
  'Pauper Commander',
  'Penny',
  'Pioneer',
  'Predh',
  'Premodern',
  'Standard',
  'Standard Brawl',
  'Timeless',
  'Vintage',
]);
export type CardFormatType = z.infer<typeof CardFormat>;

export const CardFormatStatus = z.enum([
  'Legal',
  'Banned',
  'Not Legal',
  'Restricted',
]);

// Image URIs Schema
const imageUrisSchema = z.object({
  small: z.url(),
  normal: z.url(),
  large: z.url(),
  png: z.url(),
  art_crop: z.url(),
  border_crop: z.url(),
});

// Legalities Schema
const legalitiesSchema = z.object({
  standard: z.string().optional(),
  future: z.string().optional(),
  historic: z.string().optional(),
  gladiator: z.string().optional(),
  pioneer: z.string().optional(),
  explorer: z.string().optional(),
  modern: z.string().optional(),
  legacy: z.string().optional(),
  pauper: z.string().optional(),
  vintage: z.string().optional(),
  penny: z.string().optional(),
  commander: z.string().optional(),
  oathbreaker: z.string().optional(),
  brawl: z.string().optional(),
  alchemy: z.string().optional(),
  paupercommander: z.string().optional(),
  duel: z.string().optional(),
  oldschool: z.string().optional(),
  premodern: z.string().optional(),
  predh: z.string().optional(),
  timeless: z.string().optional(),
  standardbrawl: z.string().optional(),
});

// RelatedUris Schema
const relatedUrisSchema = z.object({}).catchall(z.url());

// PurchaseUris Schema
const purchaseUrisSchema = z.object({
  tcgplayer: z.url().optional(),
  cardmarket: z.url().optional(),
  cardhoarder: z.url().optional(),
});

// Preview Schema
const previewSchema = z
  .object({
    source: z.string(),
    source_uri: z.string(),
    previewed_at: z.string(),
  })
  .optional();

// Card Face Schema (for double-faced cards)
const cardFaceSchema = z.object({
  object: z.literal('card_face'),
  name: z.string(),
  mana_cost: z.string().optional(),
  type_line: z.string(),
  oracle_text: z.string().optional(),
  colors: z.array(z.string()).optional(),
  artist: z.string().optional(),
  artist_id: z.guid().optional(),
  illustration_id: z.guid().optional(),
  image_uris: imageUrisSchema.optional(),
  flavor_text: z.string().optional(),
  power: z.string().optional(),
  toughness: z.string().optional(),
  loyalty: z.string().optional(),
  watermark: z.string().optional(),
  printed_name: z.string().optional(),
  printed_type_line: z.string().optional(),
  printed_text: z.string().optional(),
});

// Main Scryfall Card Schema
export type ScryfallCard = z.infer<typeof ScryfallCardSchema>;
export const ScryfallCardSchema = z.object({
  object: z.literal('card'),
  id: z.guid(),
  oracle_id: z.guid(),
  multiverse_ids: z.array(z.number()).optional(),
  mtgo_id: z.number().optional(),
  mtgo_foil_id: z.number().optional(),
  tcgplayer_id: z.number().optional(),
  cardmarket_id: z.number().optional(),
  name: z.string(),
  lang: z.string(),
  released_at: z.string(),
  uri: z.url(),
  scryfall_uri: z.url(),
  layout: z.string(),
  highres_image: z.boolean(),
  image_status: z.string(),
  image_uris: imageUrisSchema.optional(),
  mana_cost: z.string().optional(),
  cmc: z.number(),
  type_line: z.string(),
  oracle_text: z.string().optional(),
  power: z.string().optional(),
  toughness: z.string().optional(),
  loyalty: z.string().optional(),
  colors: z.array(z.string()).optional(),
  color_identity: z.array(z.string()),
  keywords: z.array(z.string()),
  legalities: legalitiesSchema.optional(),
  produced_mana: z.array(z.string()).optional(),
  all_parts: z
    .array(
      z.object({
        object: z.string(),
        id: z.guid(),
        component: z.string(),
        name: z.string(),
        type_line: z.string(),
        uri: z.url(),
      }),
    )
    .optional(),
  games: z.array(z.string()),
  reserved: z.boolean(),
  game_changer: z.boolean().optional(),
  foil: z.boolean(),
  nonfoil: z.boolean(),
  finishes: z.array(z.string()),
  oversized: z.boolean(),
  promo: z.boolean(),
  promo_types: z.array(z.string()).optional(),
  reprint: z.boolean(),
  variation: z.boolean(),
  set_id: z.guid(),
  set: z.string(),
  set_name: z.string(),
  set_type: z.string(),
  set_uri: z.url(),
  set_search_uri: z.url(),
  scryfall_set_uri: z.url(),
  rulings_uri: z.url(),
  prints_search_uri: z.url(),
  collector_number: z.string(),
  digital: z.boolean(),
  rarity: z.string(),
  flavor_text: z.string().optional(),
  watermark: z.string().optional(),
  card_back_id: z.guid().optional(),
  artist: z.string().optional(),
  artist_ids: z.array(z.guid()).optional(),
  illustration_id: z.guid().optional(),
  border_color: z.string(),
  frame: z.string(),
  frame_effects: z.array(z.string()).optional(),
  security_stamp: z.string().optional(),
  full_art: z.boolean(),
  textless: z.boolean(),
  booster: z.boolean(),
  story_spotlight: z.boolean(),
  edhrec_rank: z.number().optional(),
  penny_rank: z.number().optional(),
  prices: z.object({}).catchall(z.string().nullable()),
  related_uris: relatedUrisSchema,
  purchase_uris: purchaseUrisSchema.optional(),
  preview: previewSchema,
  card_faces: z.array(cardFaceSchema).optional(),
});

export type Card = z.infer<typeof CardSchema>;
export const CardSchema = z.object({
  card_name: z.string(),
  card_data: ScryfallCardSchema,
  partner_card_data: ScryfallCardSchema.optional(),
  rank: z.number().optional(),
  als_score: z.number().optional(),
  ai_raw_score: z.number().optional(),
  ai_normalized_score: z.number().optional(),
  popularity: z.number().optional(),
});
