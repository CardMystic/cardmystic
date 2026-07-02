import { z } from 'zod';

export const BoardSchema = z.enum(['Mainboard', 'Sideboard', 'Considering']);
export type Board = z.infer<typeof BoardSchema>;

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
  listId: z.string().uuid().describe('The ID of the card list to bulk-edit'),
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

export const PublicProfileSchema = z.object({
  id: z.string(),
  username: z.string().nullable(),
  avatar_card_name: z.string().nullable(),
  is_featured: z.boolean(),
});

export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const GetFeaturedDecklistsResponseSchema = z.object({
  decklists: z.array(DecklistSummarySchema),
});

export type GetFeaturedDecklistsResponse = z.infer<
  typeof GetFeaturedDecklistsResponseSchema
>;

export const SearchDecklistsResponseSchema = z.object({
  decklists: z.array(DecklistSummarySchema),
});

export type SearchDecklistsResponse = z.infer<
  typeof SearchDecklistsResponseSchema
>;

export const SearchUsersResponseSchema = z.object({
  users: z.array(PublicProfileSchema),
});

export type SearchUsersResponse = z.infer<typeof SearchUsersResponseSchema>;

export const GetUserProfileResponseSchema = z.object({
  profile: PublicProfileSchema,
  decklists: z.array(DecklistSummarySchema),
});

export type GetUserProfileResponse = z.infer<
  typeof GetUserProfileResponseSchema
>;
