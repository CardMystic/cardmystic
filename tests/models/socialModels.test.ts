import { describe, it, expect } from 'vitest';
import {
  DecklistSummarySchema,
  DecklistSocialStateResponseSchema,
  ToggleLikeResponseSchema,
  ToggleSaveResponseSchema,
  GetLikedDecklistsResponseSchema,
  DecklistCommentSchema,
  GetDecklistCommentsResponseSchema,
  AddDecklistCommentSchema,
} from '~/models/cardListModel';
import {
  PublicProfileSchema,
  FollowUserResponseSchema,
  GetFollowingResponseSchema,
  GetFeaturedUsersResponseSchema,
  GetAccountStatsResponseSchema,
} from '~/models/userModel';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = '11111111-1111-1111-1111-111111111111';
const LIST_ID = '22222222-2222-2222-2222-222222222222';
const COMMENT_ID = '33333333-3333-3333-3333-333333333333';

const decklistSummary = {
  id: LIST_ID,
  name: 'Krenko Goblins',
  description: 'Go wide, go fast.',
  format: 'commander',
  avatar_card_name: 'Krenko, Mob Boss',
  updated_at: '2025-06-01T00:00:00Z',
  created_at: '2025-05-01T00:00:00Z',
  visibility: 'public',
  user_id: USER_ID,
  username: 'goblinfan',
  commanders: [],
  color_ratios: { W: 0, U: 0, B: 0, R: 1, G: 0, C: 0 },
  like_count: 3,
  save_count: 2,
  comment_count: 1,
  view_count: 40,
};

const publicProfile = {
  id: USER_ID,
  username: 'goblinfan',
  avatar_card_name: 'Krenko, Mob Boss',
  is_featured: true,
  follower_count: 7,
};

// ---------------------------------------------------------------------------
// Decklist social schemas
// ---------------------------------------------------------------------------

describe('decklist social schemas', () => {
  it('parses a decklist summary with social counts', () => {
    const parsed = DecklistSummarySchema.parse(decklistSummary);
    expect(parsed.like_count).toBe(3);
    expect(parsed.save_count).toBe(2);
    expect(parsed.comment_count).toBe(1);
    expect(parsed.view_count).toBe(40);
  });

  it('parses the social state response', () => {
    const parsed = DecklistSocialStateResponseSchema.parse({
      liked: true,
      saved: false,
    });
    expect(parsed).toEqual({ liked: true, saved: false });
  });

  it('parses like/save toggle responses', () => {
    expect(
      ToggleLikeResponseSchema.parse({ liked: true, like_count: 4 }),
    ).toEqual({ liked: true, like_count: 4 });
    expect(
      ToggleSaveResponseSchema.parse({ saved: false, save_count: 0 }),
    ).toEqual({ saved: false, save_count: 0 });
  });

  it('parses liked decklists responses', () => {
    const parsed = GetLikedDecklistsResponseSchema.parse({
      decklists: [decklistSummary],
      nextCursor: null,
    });
    expect(parsed.decklists).toHaveLength(1);
    expect(parsed.decklists[0].id).toBe(LIST_ID);
    expect(parsed.nextCursor).toBeNull();
  });

  it('parses comments with nullable author fields', () => {
    const comment = {
      id: COMMENT_ID,
      list_id: LIST_ID,
      user_id: USER_ID,
      body: 'Nice deck!',
      created_at: '2025-06-02T00:00:00Z',
      username: null,
      avatar_card_name: null,
    };
    expect(DecklistCommentSchema.parse(comment).username).toBeNull();
    const page = GetDecklistCommentsResponseSchema.parse({
      comments: [comment],
      nextCursor: null,
    });
    expect(page.comments).toHaveLength(1);
    expect(page.nextCursor).toBeNull();
  });

  it('rejects empty or oversized comment bodies', () => {
    expect(AddDecklistCommentSchema.safeParse({ body: '' }).success).toBe(
      false,
    );
    expect(
      AddDecklistCommentSchema.safeParse({ body: 'a'.repeat(2001) }).success,
    ).toBe(false);
    expect(AddDecklistCommentSchema.safeParse({ body: 'hello' }).success).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// User social schemas
// ---------------------------------------------------------------------------

describe('user social schemas', () => {
  it('parses a public profile with follower count', () => {
    const parsed = PublicProfileSchema.parse(publicProfile);
    expect(parsed.follower_count).toBe(7);
    expect(parsed.is_featured).toBe(true);
  });

  it('parses follow/following responses', () => {
    expect(
      FollowUserResponseSchema.parse({ following: true, follower_count: 8 }),
    ).toEqual({ following: true, follower_count: 8 });
    const parsed = GetFollowingResponseSchema.parse({
      users: [publicProfile],
    });
    expect(parsed.users[0].id).toBe(USER_ID);
  });

  it('parses featured users responses', () => {
    const parsed = GetFeaturedUsersResponseSchema.parse({
      users: [publicProfile],
    });
    expect(parsed.users).toHaveLength(1);
  });

  it('parses account stats with nullable memberSince', () => {
    const stats = {
      deckCount: 5,
      publicDeckCount: 2,
      totalLikes: 10,
      totalSaves: 4,
      totalComments: 3,
      totalViews: 120,
      followerCount: 7,
      followingCount: 9,
      memberSince: null,
    };
    const parsed = GetAccountStatsResponseSchema.parse(stats);
    expect(parsed.memberSince).toBeNull();
    expect(parsed.totalViews).toBe(120);
  });
});
