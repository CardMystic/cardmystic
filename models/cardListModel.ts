import { z } from 'zod';
import { CardFormat } from './cardModel';

export const BoardSchema = z
  .enum(['Mainboard', 'Sideboard', 'Considering'])
  .describe('The board for the card');
export type Board = z.infer<typeof BoardSchema>;

// Single parsed decklist entry — used for internal validation
export const ParsedDecklistEntrySchema = z.object({
  board: BoardSchema,
  card: z.object({
    name: z.string().min(1),
    copies: z.number().int().min(1),
  }),
});

export type ParsedDecklistEntry = z.infer<typeof ParsedDecklistEntrySchema>;

// ---- Add Cards ----

export const AddCardsToListByNameSchema = z.object({
  listId: z.guid().describe('The ID of the card list to add cards to'),
  cardNames: z
    .array(z.string().min(1))
    .min(1)
    .describe('Array of card names to add to the list'),
  board: BoardSchema.default('Mainboard').describe(
    'The board to add cards to. Defaults to Mainboard',
  ),
});

export type AddCardsToListByNameRequest = z.infer<
  typeof AddCardsToListByNameSchema
>;

export const AddCardsToListByNameResponseSchema = z.object({
  addedCount: z.number(),
  updatedCount: z.number(),
  invalidCardNames: z.array(z.string()),
});

export type AddCardsToListByNameResponse = z.infer<
  typeof AddCardsToListByNameResponseSchema
>;

// ---- Add Cards By Oracle IDs ----

export const AddCardsByOracleIdsSchema = z.object({
  listId: z.guid().describe('The ID of the card list to add cards to'),
  oracleIds: z
    .array(z.uuid())
    .min(1)
    .describe('Array of Scryfall oracle IDs to add (each adds 1 copy)'),
  board: BoardSchema.default('Mainboard').describe(
    'The board to add cards to. Defaults to Mainboard',
  ),
});

export type AddCardsByOracleIdsRequest = z.infer<
  typeof AddCardsByOracleIdsSchema
>;

export const AddCardsByOracleIdsResponseSchema = z.object({
  addedCount: z.number(),
  updatedCount: z.number(),
  invalidOracleIds: z.array(z.string()),
});

export type AddCardsByOracleIdsResponse = z.infer<
  typeof AddCardsByOracleIdsResponseSchema
>;

// ---- Bulk Edit ----

export const BulkEditCardSchema = z.object({
  name: z.string().min(1).max(200).describe('The card name'),
  num_copies: z.number().int().min(1).max(100).describe('Number of copies'),
});
export type BulkEditCard = z.infer<typeof BulkEditCardSchema>;

export const BulkEditBoardEntrySchema = z.object({
  board: BoardSchema.describe('The board for this group of cards'),
  cards: z
    .array(BulkEditCardSchema)
    .min(1)
    .describe('Cards in this board group'),
});
export type BulkEditBoardEntry = z.infer<typeof BulkEditBoardEntrySchema>;

export const BulkEditSchema = z.object({
  listId: z.guid().describe('The ID of the card list to bulk-edit'),
  entries: z
    .array(BulkEditBoardEntrySchema)
    .min(1)
    .describe(
      'Board groups to sync. For each board listed, cards not present will be removed (commanders are preserved) and missing cards will be added. Boards not mentioned are left untouched.',
    ),
});

export type BulkEditRequest = z.infer<typeof BulkEditSchema>;

export const BulkEditResponseSchema = z.object({
  addedCount: z.number(),
  removedCount: z.number(),
  invalidCardNames: z.array(z.string()),
});

export type BulkEditResponse = z.infer<typeof BulkEditResponseSchema>;

// ---- Set Commander ----

export const SetCommanderSchema = z.object({
  listId: z.guid().describe('The ID of the card list'),
  commanderName: z
    .string()
    .min(1)
    .max(200)
    .describe('The commander card name to set'),
});

export type SetCommanderRequest = z.infer<typeof SetCommanderSchema>;

export const SetCommanderResponseSchema = z.object({
  commanders: z
    .array(z.string())
    .describe('Current commander name(s) after the operation'),
  partnerKept: z
    .boolean()
    .describe('Whether the existing commander was kept as a partner'),
});

// ---- Create List ----

export const CardListFormatSchema = CardFormat.describe(
  'The format for the card list',
);

export const CreateListSchema = z.object({
  name: z.string().min(1).max(200).describe('The name of the card list'),
  description: z
    .string()
    .max(1000)
    .optional()
    .describe('Optional description for the list'),
  format: CardListFormatSchema.default('Commander').describe(
    'The format for the list. Defaults to Commander',
  ),
  commanders: z
    .array(z.string().min(1).max(200))
    .max(2)
    .default([])
    .describe('Optional commander name(s) to set'),
});

export type CreateListRequest = z.infer<typeof CreateListSchema>;

export const CreateListResponseSchema = z.object({
  id: z.string().describe('The ID of the created list'),
  name: z.string().describe('The name of the created list'),
  description: z
    .string()
    .nullable()
    .describe('The description of the created list'),
  format: z.string().describe('The format of the created list'),
  commanders: z.array(z.string()).describe('Commander name(s) set on the list'),
});

// ---- Update Format ----

export const UpdateFormatSchema = z.object({
  listId: z.guid().describe('The ID of the card list'),
  format: CardListFormatSchema.describe('The new format for the list'),
});

export type UpdateFormatRequest = z.infer<typeof UpdateFormatSchema>;

export const UpdateFormatResponseSchema = z.object({
  format: z.string().describe('The updated format'),
  commandersCleared: z
    .boolean()
    .describe('Whether commanders were cleared due to format change'),
});

// ---- Update Num Copies ----

export const UpdateNumCopiesSchema = z.object({
  listId: z.guid().describe('The ID of the card list'),
  cardName: z
    .string()
    .min(1)
    .max(200)
    .describe('The card name to update copies for'),
  numCopies: z
    .number()
    .int()
    .min(1)
    .max(100)
    .describe('The new number of copies (1-100)'),
  fromBoard: BoardSchema.optional().describe(
    'Required only when the card exists in multiple boards in this list. The board the card currently lives in.',
  ),
});

export type UpdateNumCopiesRequest = z.infer<typeof UpdateNumCopiesSchema>;

export const UpdateNumCopiesResponseSchema = z.object({
  cardName: z.string().describe('The card name'),
  numCopies: z.number().describe('The updated number of copies'),
});

// ---- Change Board ----

export const ChangeBoardSchema = z.object({
  listId: z.guid().describe('The ID of the card list'),
  cardName: z.string().min(1).max(200).describe('The card name to move'),
  board: BoardSchema.describe('The target board'),
  fromBoard: BoardSchema.optional().describe(
    'Required only when the card exists in multiple boards in this list. The board to move it FROM.',
  ),
});

export type ChangeBoardRequest = z.infer<typeof ChangeBoardSchema>;

export const ChangeBoardResponseSchema = z.object({
  cardName: z.string().describe('The card name'),
  board: z.string().describe('The new board'),
});

// ---- Primer ----

export const SavePrimerSchema = z.object({
  listId: z.guid().describe('The ID of the card list'),
  text: z
    .string()
    .max(200_000)
    .describe('Markdown content for the primer (max 200 000 chars)'),
});

export type SavePrimerRequest = z.infer<typeof SavePrimerSchema>;

export const SavePrimerResponseSchema = z.object({
  listId: z.string().describe('The card list ID'),
  text: z.string().nullable().describe('The sanitized, stored primer text'),
});

export const GetPrimerResponseSchema = z.object({
  listId: z.string().describe('The card list ID'),
  text: z.string().nullable().describe('The stored primer text'),
});

// ---- Decklist Discovery ----

export const ColorRatiosSchema = z.object({
  W: z.number().describe('White ratio (0-1)'),
  U: z.number().describe('Blue ratio (0-1)'),
  B: z.number().describe('Black ratio (0-1)'),
  R: z.number().describe('Red ratio (0-1)'),
  G: z.number().describe('Green ratio (0-1)'),
  C: z.number().describe('Colorless ratio (0-1)'),
});

export type ColorRatios = z.infer<typeof ColorRatiosSchema>;

export const DecklistSummarySchema = z.object({
  id: z.string().describe('The card list ID'),
  name: z.string().nullable().describe('The list name'),
  description: z.string().nullable().describe('The list description'),
  format: z.string().describe('The list format'),
  avatar_card_name: z
    .string()
    .nullable()
    .describe("Card name used as the list's avatar"),
  commanders: z
    .array(z.string())
    .describe('Commander card names (Mainboard, is_commander=true)'),
  color_ratios: ColorRatiosSchema.describe(
    'Color distribution of cards in the deck (ratios sum to 1)',
  ),
  updated_at: z
    .string()
    .nullable()
    .describe('Last update timestamp (ISO 8601)'),
  created_at: z.string().describe('Creation timestamp (ISO 8601)'),
  visibility: z
    .string()
    .describe('The visibility of the list (e.g., public, private)'),
  user_id: z.string().describe("The owner's user ID"),
  username: z.string().nullable().describe("The owner's username"),
});

export type DecklistSummary = z.infer<typeof DecklistSummarySchema>;

export const GetFeaturedDecklistsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of featured decklists to return (default 10)'),
});

export type GetFeaturedDecklistsQuery = z.infer<
  typeof GetFeaturedDecklistsQuerySchema
>;

export const GetFeaturedDecklistsResponseSchema = z.object({
  decklists: z.array(DecklistSummarySchema),
});

export type GetFeaturedDecklistsResponse = z.infer<
  typeof GetFeaturedDecklistsResponseSchema
>;

export const GetActiveUserDecklistsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(100)
    .describe(
      'Maximum number of active user decklists to return (default 100)',
    ),
});

export type GetActiveUserDecklistsQuery = z.infer<
  typeof GetActiveUserDecklistsQuerySchema
>;

export const GetActiveUserDecklistsResponseSchema = z.object({
  decklists: z.array(DecklistSummarySchema),
});

export type GetActiveUserDecklistsResponse = z.infer<
  typeof GetActiveUserDecklistsResponseSchema
>;

export const SearchDecklistsQuerySchema = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe('Search keywords matched against decklist name and description'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50)
    .describe('Maximum number of decklists to return (default 50, max 200)'),
  cursor: z
    .uuid()
    .optional()
    .describe(
      'Decklist ID of the last entry from the previous page (omit for first page)',
    ),
});

export type SearchDecklistsQuery = z.infer<typeof SearchDecklistsQuerySchema>;

export const SearchDecklistsResponseSchema = z.object({
  decklists: z.array(DecklistSummarySchema),
  nextCursor: z
    .uuid()
    .nullable()
    .describe(
      'Decklist ID to pass as cursor for the next page, or null if no more results',
    ),
});

export type SearchDecklistsResponse = z.infer<
  typeof SearchDecklistsResponseSchema
>;

// ---- Public Decklist View ----

export const PublicDecklistItemSchema = z.object({
  oracle_id: z.string().describe('Scryfall oracle ID of the card'),
  num_copies: z.number().int().min(1).describe('Number of copies'),
  board: z
    .string()
    .describe('Board the card belongs to (Mainboard, Sideboard, Considering)'),
  is_commander: z.boolean().describe('Whether this card is a commander'),
});

export type PublicDecklistItem = z.infer<typeof PublicDecklistItemSchema>;

export const GetPublicDecklistResponseSchema = z.object({
  decklist: DecklistSummarySchema,
  items: z.array(PublicDecklistItemSchema),
  owner: z
    .object({
      id: z.string().describe("The user's ID"),
      username: z.string().nullable().describe("The user's username"),
      avatar_card_name: z
        .string()
        .nullable()
        .describe("Card name used as the user's avatar"),
      is_featured: z
        .boolean()
        .describe('Whether the user is a featured profile'),
    })
    .describe('The profile of the decklist owner'),
});

export type GetPublicDecklistResponse = z.infer<
  typeof GetPublicDecklistResponseSchema
>;
