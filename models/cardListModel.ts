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
