import { z } from 'zod';
import { DecklistSummarySchema } from './cardListModel';

// Password policy: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
export const SignUpSchema = z.object({
  email: z.email(),
  password: z.string(),
  confirmPassword: z.string(),
  username: z.string().min(1).max(50).trim(),
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
    .max(50)
    .default(20)
    .describe('Maximum number of users to return'),
});

export type SearchUsersQuery = z.infer<typeof SearchUsersQuerySchema>;

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

export const SetUsernameSchema = z.object({
  username: z.string().min(1).max(50).trim().describe('The username to set'),
});
export type SetUsernameRequest = z.infer<typeof SetUsernameSchema>;

export const SetUsernameResponseSchema = z.object({
  message: z.string(),
});
export type SetUsernameResponse = z.infer<typeof SetUsernameResponseSchema>;
