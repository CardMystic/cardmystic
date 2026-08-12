import { z } from 'zod';
import { DecklistSummarySchema } from './cardListModel';

// Password policy: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
export const SignUpSchema = z.object({
  email: z.email(),
  password: z.string(),
  confirmPassword: z.string(),
  username: z.string().min(1).max(50).trim(),
  avatarCardName: z
    .string()
    .trim()
    .optional()
    .describe('Optional MTG card name to use as the profile avatar'),
});

export type SignUpRequest = z.infer<typeof SignUpSchema>;

export const SignUpResponseSchema = z.object({
  message: z.string(),
});
export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginSchema>;

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: z.any(),
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const UpdatePasswordSchema = z.object({
  newPassword: z.string().min(1),
});
export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordSchema>;

export const UpdatePasswordResponseSchema = z.object({
  message: z.string(),
});
export type UpdatePasswordResponse = z.infer<
  typeof UpdatePasswordResponseSchema
>;

// ---- User Discovery ----

export const PublicProfileSchema = z.object({
  id: z.string().describe("The user's ID"),
  username: z.string().nullable().describe("The user's username"),
  avatar_card_name: z
    .string()
    .nullable()
    .describe("Card name used as the user's avatar"),
  is_featured: z.boolean().describe('Whether the user is a featured profile'),
  follower_count: z
    .number()
    .int()
    .describe('Number of users following this profile'),
});

export type PublicProfile = z.infer<typeof PublicProfileSchema>;

export const SearchUsersQuerySchema = z.object({
  query: z
    .string()
    .min(1)
    .max(100)
    .describe('Search keywords matched against display name'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50)
    .describe('Maximum number of users to return (default 50, max 200)'),
  cursor: z
    .uuid()
    .optional()
    .describe(
      'Profile ID of the last entry from the previous page (omit for first page)',
    ),
});

export type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>;

export const SearchUsersResponseSchema = z.object({
  users: z.array(PublicProfileSchema),
  nextCursor: z
    .uuid()
    .nullable()
    .describe(
      'Profile ID to pass as cursor for the next page, or null if no more results',
    ),
});

export type SearchUsersResponse = z.infer<typeof SearchUsersResponseSchema>;

export const GetUserProfileResponseSchema = z.object({
  profile: PublicProfileSchema,
  decklists: z.array(DecklistSummarySchema),
});

export type GetUserProfileResponse = z.infer<
  typeof GetUserProfileResponseSchema
>;

export const SetUsernameSchema = z.object({
  username: z.string().min(1).max(50).trim().describe('The username to set'),
});
export type SetUsernameRequest = z.infer<typeof SetUsernameSchema>;

export const SetUsernameResponseSchema = z.object({
  message: z.string(),
});
export type SetUsernameResponse = z.infer<typeof SetUsernameResponseSchema>;

// ---- Follows ----

export const FollowUserResponseSchema = z.object({
  following: z
    .boolean()
    .describe('Whether the authenticated user now follows the target user'),
  follower_count: z
    .number()
    .int()
    .describe("The target user's updated follower count"),
});

export type FollowUserResponse = z.infer<typeof FollowUserResponseSchema>;

export const GetFollowingResponseSchema = z.object({
  users: z
    .array(PublicProfileSchema)
    .describe('Profiles the authenticated user follows, newest first'),
});

export type GetFollowingResponse = z.infer<typeof GetFollowingResponseSchema>;

// ---- Featured Users ----

export const GetFeaturedUsersQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of featured users to return (default 10)'),
});

export type GetFeaturedUsersQuery = z.infer<typeof GetFeaturedUsersQuerySchema>;

export const GetFeaturedUsersResponseSchema = z.object({
  users: z.array(PublicProfileSchema),
});

export type GetFeaturedUsersResponse = z.infer<
  typeof GetFeaturedUsersResponseSchema
>;

// ---- Account Stats ----

export const GetAccountStatsResponseSchema = z.object({
  deckCount: z.number().int().describe('Total number of decklists owned'),
  publicDeckCount: z
    .number()
    .int()
    .describe('Number of public decklists owned'),
  totalLikes: z
    .number()
    .int()
    .describe("Total likes across the user's decklists"),
  totalSaves: z
    .number()
    .int()
    .describe("Total saves across the user's decklists"),
  totalComments: z
    .number()
    .int()
    .describe("Total comments across the user's decklists"),
  totalViews: z
    .number()
    .int()
    .describe("Total public views across the user's decklists"),
  followerCount: z.number().int().describe('Number of users following you'),
  followingCount: z.number().int().describe('Number of users you follow'),
  memberSince: z
    .string()
    .nullable()
    .describe('Account creation timestamp (ISO 8601)'),
});

export type GetAccountStatsResponse = z.infer<
  typeof GetAccountStatsResponseSchema
>;
