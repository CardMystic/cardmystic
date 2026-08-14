import { describe, it, expect } from 'vitest';
import {
  PaginationInfoSchema,
  PaginationQuerySchema,
} from '~/models/paginationModel';
import {
  GetActiveUserDecklistsResponseSchema,
  GetSavedDecklistsResponseSchema,
  SearchDecklistsQuerySchema,
  SearchDecklistsResponseSchema,
} from '~/models/cardListModel';
import {
  GetMyArticlesResponseSchema,
  GetLikedArticlesResponseSchema,
  SearchArticlesQuerySchema,
  SearchArticlesResponseSchema,
} from '~/models/articleModel';
import {
  SearchUsersQuerySchema,
  SearchUsersResponseSchema,
} from '~/models/userModel';

// ---------------------------------------------------------------------------
// Fixtures (kept minimal — schema validity is the point, not domain modeling)
// ---------------------------------------------------------------------------

const USER_ID = '11111111-1111-1111-1111-111111111111';
const LIST_ID = '22222222-2222-2222-2222-222222222222';
const ARTICLE_ID = '33333333-3333-3333-3333-333333333333';

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
  like_count: 0,
  save_count: 0,
  comment_count: 0,
  view_count: 0,
};

const publicProfile = {
  id: USER_ID,
  username: 'goblinfan',
  avatar_card_name: 'Krenko, Mob Boss',
  is_featured: false,
  follower_count: 0,
};

const articleSummary = {
  id: ARTICLE_ID,
  title: 'A Krenko Primer',
  description: 'Everything you never wanted to know.',
  image_url: null,
  is_published: true,
  published_at: '2025-06-01T00:00:00Z',
  created_at: '2025-05-01T00:00:00Z',
  updated_at: null,
  user_id: USER_ID,
  username: 'goblinfan',
  avatar_card_name: 'Krenko, Mob Boss',
  like_count: 0,
  comment_count: 0,
  view_count: 0,
};

const paginationInfo = {
  totalCount: 137,
  page: 2,
  pageSize: 50,
  totalPages: 3,
};

// ---------------------------------------------------------------------------
// Base pagination schemas
// ---------------------------------------------------------------------------

describe('PaginationQuerySchema', () => {
  it('applies defaults when nothing is supplied', () => {
    const parsed = PaginationQuerySchema.parse({});
    expect(parsed).toEqual({ page: 1, pageSize: 50 });
  });

  it('coerces string query params to numbers', () => {
    const parsed = PaginationQuerySchema.parse({ page: '3', pageSize: '25' });
    expect(parsed).toEqual({ page: 3, pageSize: 25 });
  });

  it('rejects page < 1', () => {
    expect(PaginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(PaginationQuerySchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it('rejects non-integer page or pageSize', () => {
    expect(PaginationQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
    expect(PaginationQuerySchema.safeParse({ pageSize: 2.5 }).success).toBe(
      false,
    );
  });

  it('rejects pageSize outside [1, 100]', () => {
    expect(PaginationQuerySchema.safeParse({ pageSize: 0 }).success).toBe(
      false,
    );
    expect(PaginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(
      false,
    );
    expect(PaginationQuerySchema.safeParse({ pageSize: 100 }).success).toBe(
      true,
    );
  });
});

describe('PaginationInfoSchema', () => {
  it('parses a full pagination info block', () => {
    expect(PaginationInfoSchema.parse(paginationInfo)).toEqual(paginationInfo);
  });

  it('requires all four fields', () => {
    expect(
      PaginationInfoSchema.safeParse({ totalCount: 1, page: 1, pageSize: 50 })
        .success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Response schemas that spread PaginationInfoSchema — verifies each keeps the
// shared shape (totalCount + page + pageSize + totalPages) alongside its own
// items array.
// ---------------------------------------------------------------------------

describe('page-paginated response schemas', () => {
  const cases = [
    {
      name: 'GetActiveUserDecklistsResponseSchema',
      schema: GetActiveUserDecklistsResponseSchema,
      payload: { decklists: [decklistSummary], ...paginationInfo },
      itemsKey: 'decklists' as const,
    },
    {
      name: 'GetSavedDecklistsResponseSchema',
      schema: GetSavedDecklistsResponseSchema,
      payload: { decklists: [decklistSummary], ...paginationInfo },
      itemsKey: 'decklists' as const,
    },
    {
      name: 'SearchDecklistsResponseSchema',
      schema: SearchDecklistsResponseSchema,
      payload: { decklists: [decklistSummary], ...paginationInfo },
      itemsKey: 'decklists' as const,
    },
    {
      name: 'SearchUsersResponseSchema',
      schema: SearchUsersResponseSchema,
      payload: { users: [publicProfile], ...paginationInfo },
      itemsKey: 'users' as const,
    },
    {
      name: 'GetMyArticlesResponseSchema',
      schema: GetMyArticlesResponseSchema,
      payload: { articles: [articleSummary], ...paginationInfo },
      itemsKey: 'articles' as const,
    },
    {
      name: 'GetLikedArticlesResponseSchema',
      schema: GetLikedArticlesResponseSchema,
      payload: { articles: [articleSummary], ...paginationInfo },
      itemsKey: 'articles' as const,
    },
    {
      name: 'SearchArticlesResponseSchema',
      schema: SearchArticlesResponseSchema,
      payload: { articles: [articleSummary], ...paginationInfo },
      itemsKey: 'articles' as const,
    },
  ];

  for (const { name, schema, payload, itemsKey } of cases) {
    it(`${name} parses items + pagination info`, () => {
      const parsed = schema.parse(payload) as Record<string, unknown> & {
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
      };
      expect(parsed[itemsKey]).toHaveLength(1);
      expect(parsed.totalCount).toBe(paginationInfo.totalCount);
      expect(parsed.page).toBe(paginationInfo.page);
      expect(parsed.pageSize).toBe(paginationInfo.pageSize);
      expect(parsed.totalPages).toBe(paginationInfo.totalPages);
    });

    it(`${name} rejects missing pagination fields`, () => {
      const bad = { ...payload } as Record<string, unknown>;
      delete bad.totalPages;
      expect(schema.safeParse(bad).success).toBe(false);
    });
  }
});

// ---------------------------------------------------------------------------
// Composed query schemas (search + pagination) must inherit the page/pageSize
// rules from PaginationQuerySchema.
// ---------------------------------------------------------------------------

describe('composed search + pagination query schemas', () => {
  it('SearchDecklistsQuerySchema requires query and applies pagination defaults', () => {
    const parsed = SearchDecklistsQuerySchema.parse({ query: 'krenko' });
    expect(parsed).toEqual({ query: 'krenko', page: 1, pageSize: 50 });
    expect(SearchDecklistsQuerySchema.safeParse({ query: '' }).success).toBe(
      false,
    );
  });

  it('SearchUsersQuerySchema coerces page/pageSize', () => {
    const parsed = SearchUsersQuerySchema.parse({
      query: 'gob',
      page: '2',
      pageSize: '25',
    });
    expect(parsed).toEqual({ query: 'gob', page: 2, pageSize: 25 });
  });

  it('SearchArticlesQuerySchema rejects pageSize > 100', () => {
    expect(
      SearchArticlesQuerySchema.safeParse({ query: 'a', pageSize: 200 })
        .success,
    ).toBe(false);
  });
});
