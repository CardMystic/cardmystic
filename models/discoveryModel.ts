import { z } from 'zod';

/**
 * Frontend mirrors of the backend discovery schemas. The backend's OpenAPI
 * document is the source of truth — keep these in sync with
 * `cardmystic-backend/src/common/models/cardListModel.ts` (DecklistSummary,
 * GetFeaturedDecklists*, SearchDecklists*) and
 * `cardmystic-backend/src/services/userService.ts` (PublicProfile,
 * SearchUsers*, GetUserProfile*).
 */

export const DecklistSummarySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  format: z.string(),
  avatar_card_name: z.string().nullable(),
  commanders: z.array(z.string()),
  updated_at: z.string().nullable(),
  user_id: z.string(),
  username: z.string().nullable(),
});

export type DecklistSummary = z.infer<typeof DecklistSummarySchema>;

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
