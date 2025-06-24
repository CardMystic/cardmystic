import { z } from "zod/v4";

export const CardType = z.enum([
  "Artifact",
  "Conspiracy",
  "Creature",
  "Enchantment",
  "Instant",
  "Land",
  "Phenomenon",
  "Plane",
  "Planeswalker",
  "Scheme",
  "Sorcery",
  "Tribal",
  "Vanguard",
]);

export const CardRarity = z.enum(["Common", "Uncommon", "Rare", "Mythic"]);

export const CardFormat = z.enum([
  "Alchemy",
  "Brawl",
  "Commander",
  "Duel",
  "Explorer",
  "Future",
  "Gladiator",
  "Historic",
  "HistoricBrawl",
  "Legacy",
  "Modern",
  "Oathbreaker",
  "OldSchool",
  "Pauper",
  "PauperCommander",
  "Penny",
  "Pioneer",
  "Predh",
  "Premodern",
  "Standard",
  "StandardBrawl",
  "Timeless",
  "Vintage",
]);

export const CardFormatStatus = z.enum([
  "Legal",
  "Banned",
  "Restricted",
  "Not Legal",
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
  standard: z.string(),
  future: z.string(),
  historic: z.string(),
  gladiator: z.string(),
  pioneer: z.string(),
  explorer: z.string(),
  modern: z.string(),
  legacy: z.string(),
  pauper: z.string(),
  vintage: z.string(),
  penny: z.string(),
  commander: z.string(),
  oathbreaker: z.string(),
  brawl: z.string(),
  alchemy: z.string(),
  paupercommander: z.string(),
  duel: z.string(),
  oldschool: z.string(),
  premodern: z.string(),
  predh: z.string(),
  timeless: z.string(),
  standardbrawl: z.string(),
});

// RelatedUris Schema
const relatedUrisSchema = z.record(z.string(), z.url());

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
    source_uri: z.url(),
    previewed_at: z.string(),
  })
  .optional();

// Card Face Schema (for double-faced cards)
const cardFaceSchema = z.object({
  object: z.literal("card_face"),
  name: z.string(),
  mana_cost: z.string(),
  type_line: z.string(),
  oracle_text: z.string().optional(),
  colors: z.array(z.string()),
  artist: z.string().optional(),
  artist_id: z.string().uuid().optional(),
  illustration_id: z.string().uuid().optional(),
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
  object: z.literal("card"),
  id: z.string().uuid(),
  oracle_id: z.string().uuid(),
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
  games: z.array(z.string()),
  reserved: z.boolean(),
  foil: z.boolean(),
  nonfoil: z.boolean(),
  finishes: z.array(z.string()),
  oversized: z.boolean(),
  promo: z.boolean(),
  reprint: z.boolean(),
  variation: z.boolean(),
  set_id: z.string().uuid(),
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
  rarity: CardRarity,
  card_back_id: z.string().uuid(),
  artist: z.string().optional(),
  artist_ids: z.array(z.string().uuid()).optional(),
  illustration_id: z.string().uuid().optional(),
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
  prices: z.record(z.string(), z.string().nullable()), // prices object with keys like "usd", "eur", etc.
  related_uris: relatedUrisSchema,
  purchase_uris: purchaseUrisSchema.optional(),
  preview: previewSchema,
  card_faces: z.array(cardFaceSchema).optional(),
});

export type Card = z.infer<typeof CardSchema>;
export const CardSchema = z.object({
  card_name: z.string(),
  card_data: ScryfallCardSchema,
  rank: z.number().optional(),
  score: z.number().optional(),
});
