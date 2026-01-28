import { z } from 'zod';

// User Profile Schema
export const UserProfileSchema = z.object({
  id: z.string(),
  username: z.string().min(3).max(50),
  email: z.string().email(),
  profile_image: z.string().url().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// User Update Schema (for profile editing)
export const UserUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  profile_image: z.string().url().optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Password Update Schema
export const PasswordUpdateSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8),
  confirm_password: z.string().min(8),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

export type PasswordUpdate = z.infer<typeof PasswordUpdateSchema>;

// Search History Schema
export const SearchHistoryItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  query: z.string(),
  filters: z.any().optional(),
  created_at: z.string().datetime(),
});

export type SearchHistoryItem = z.infer<typeof SearchHistoryItemSchema>;

// Card History Schema
export const CardHistoryItemSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  card_id: z.string(),
  card_name: z.string(),
  viewed_at: z.string().datetime(),
});

export type CardHistoryItem = z.infer<typeof CardHistoryItemSchema>;

// User Follow Schema
export const UserFollowSchema = z.object({
  id: z.string(),
  follower_id: z.string(),
  following_id: z.string(),
  following_username: z.string(),
  created_at: z.string().datetime(),
});

export type UserFollow = z.infer<typeof UserFollowSchema>;

// User Search Result Schema
export const UserSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  profile_image: z.string().url().optional(),
  is_following: z.boolean(),
});

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;
