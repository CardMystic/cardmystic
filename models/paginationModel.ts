import { z } from 'zod';

// Shared 1-indexed offset pagination schema used by "normal" paginated
// endpoints (search results, My Decks, Liked/Saved decks, etc.). Cursor
// pagination for infinite scroll lives per-endpoint (comments, following).

export const PaginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Page number (1-indexed, default 1)'),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Items per page (default 50, max 100)'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationInfoSchema = z.object({
  totalCount: z.number().int().describe('Total item count across all pages'),
  page: z.number().int().describe('Current page number (1-indexed)'),
  pageSize: z.number().int().describe('Items per page'),
  totalPages: z.number().int().describe('Total number of pages'),
});

export type PaginationInfo = z.infer<typeof PaginationInfoSchema>;
