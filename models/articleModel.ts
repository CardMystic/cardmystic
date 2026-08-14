import { z } from 'zod';
import { PaginationInfoSchema, PaginationQuerySchema } from './paginationModel';

// Length limits shared by the backend validators and frontend editors.
export const ARTICLE_TITLE_MAX_CHARS = 200;
export const ARTICLE_DESCRIPTION_MAX_CHARS = 500;
export const ARTICLE_CONTENT_MAX_CHARS = 200_000;
export const ARTICLE_COMMENT_MAX_CHARS = 2000;

// ---- Core shapes ----

export const ArticleSummarySchema = z.object({
  id: z.string().describe('The article ID'),
  title: z.string().describe('The article title'),
  description: z.string().describe('Short blurb shown on article cards'),
  image_url: z
    .string()
    .nullable()
    .describe("Public URL of the article's cover image, if set"),
  is_published: z
    .boolean()
    .describe('Whether the article is published (false = draft)'),
  published_at: z
    .string()
    .nullable()
    .describe(
      'First-publish timestamp (ISO 8601), null until first publication',
    ),
  created_at: z.string().describe('Creation timestamp (ISO 8601)'),
  updated_at: z
    .string()
    .nullable()
    .describe('Last update timestamp (ISO 8601)'),
  user_id: z.string().describe("The author's user ID"),
  username: z.string().nullable().describe("The author's username"),
  avatar_card_name: z
    .string()
    .nullable()
    .describe("Card name used as the author's avatar"),
  like_count: z.number().int().describe('Number of likes on the article'),
  comment_count: z.number().int().describe('Number of comments on the article'),
  view_count: z
    .number()
    .int()
    .describe('Number of public views of the article'),
});

export type ArticleSummary = z.infer<typeof ArticleSummarySchema>;

export const ArticleSchema = ArticleSummarySchema.extend({
  content: z.string().describe('Markdown body of the article'),
});

export type Article = z.infer<typeof ArticleSchema>;

// ---- Author CRUD ----

export const CreateArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(ARTICLE_TITLE_MAX_CHARS)
    .describe('The article title'),
  description: z
    .string()
    .trim()
    .max(ARTICLE_DESCRIPTION_MAX_CHARS)
    .default('')
    .describe('Short blurb shown on article cards'),
  content: z
    .string()
    .max(ARTICLE_CONTENT_MAX_CHARS)
    .default('')
    .describe('Markdown body of the article'),
  imageUrl: z
    .string()
    .nullable()
    .default(null)
    .describe(
      'Public URL of the cover image (must point at the article-images storage bucket)',
    ),
  isPublished: z
    .boolean()
    .default(false)
    .describe('Publish immediately (true) or save as draft (false)'),
});

export type CreateArticleRequest = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = z.object({
  title: z.string().trim().min(1).max(ARTICLE_TITLE_MAX_CHARS).optional(),
  description: z.string().trim().max(ARTICLE_DESCRIPTION_MAX_CHARS).optional(),
  content: z.string().max(ARTICLE_CONTENT_MAX_CHARS).optional(),
  imageUrl: z
    .string()
    .nullable()
    .optional()
    .describe('New cover image URL, or null to remove it'),
  isPublished: z.boolean().optional(),
});

export type UpdateArticleRequest = z.infer<typeof UpdateArticleSchema>;

export const ArticleResponseSchema = z.object({
  article: ArticleSchema,
});

export type ArticleResponse = z.infer<typeof ArticleResponseSchema>;

export const DeleteArticleResponseSchema = z.object({
  message: z.string(),
});

export type DeleteArticleResponse = z.infer<typeof DeleteArticleResponseSchema>;

export const GetMyArticlesQuerySchema = PaginationQuerySchema;

export type GetMyArticlesQuery = z.infer<typeof GetMyArticlesQuerySchema>;

export const GetMyArticlesResponseSchema = z.object({
  articles: z
    .array(ArticleSummarySchema)
    .describe("All of the authenticated author's articles, drafts included"),
  ...PaginationInfoSchema.shape,
});

export type GetMyArticlesResponse = z.infer<typeof GetMyArticlesResponseSchema>;

export const GetLikedArticlesQuerySchema = PaginationQuerySchema;

export type GetLikedArticlesQuery = z.infer<typeof GetLikedArticlesQuerySchema>;

export const GetLikedArticlesResponseSchema = z.object({
  articles: z
    .array(ArticleSummarySchema)
    .describe(
      'Published articles the authenticated user has liked, most recently liked first',
    ),
  ...PaginationInfoSchema.shape,
});

export type GetLikedArticlesResponse = z.infer<
  typeof GetLikedArticlesResponseSchema
>;

// ---- Discovery ----

export const GetRecentArticlesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(20)
    .default(3)
    .describe('Maximum number of recent articles to return (default 3)'),
});

export type GetRecentArticlesQuery = z.infer<
  typeof GetRecentArticlesQuerySchema
>;

export const GetRecentArticlesResponseSchema = z.object({
  articles: z
    .array(ArticleSummarySchema)
    .describe('Latest published articles, newest first'),
});

export type GetRecentArticlesResponse = z.infer<
  typeof GetRecentArticlesResponseSchema
>;

export const SearchArticlesQuerySchema = z.object({
  query: z
    .string()
    .min(1)
    .max(200)
    .describe('Search keywords matched against article title and description'),
  ...PaginationQuerySchema.shape,
});

export type SearchArticlesQuery = z.infer<typeof SearchArticlesQuerySchema>;

export const SearchArticlesResponseSchema = z.object({
  articles: z.array(ArticleSummarySchema),
  ...PaginationInfoSchema.shape,
});

export type SearchArticlesResponse = z.infer<
  typeof SearchArticlesResponseSchema
>;

// ---- Social (likes, comments) ----

export const ArticleSocialStateResponseSchema = z.object({
  liked: z
    .boolean()
    .describe('Whether the authenticated user has liked the article'),
});

export type ArticleSocialStateResponse = z.infer<
  typeof ArticleSocialStateResponseSchema
>;

export const ToggleArticleLikeResponseSchema = z.object({
  liked: z.boolean().describe('Whether the user now likes the article'),
  like_count: z.number().int().describe('The updated like count'),
});

export type ToggleArticleLikeResponse = z.infer<
  typeof ToggleArticleLikeResponseSchema
>;

export const ArticleCommentSchema = z.object({
  id: z.string().describe('The comment ID'),
  article_id: z.string().describe('The article ID the comment belongs to'),
  user_id: z.string().describe("The comment author's user ID"),
  username: z.string().nullable().describe("The comment author's username"),
  avatar_card_name: z
    .string()
    .nullable()
    .describe("Card name used as the author's avatar"),
  body: z.string().describe('The comment text'),
  created_at: z.string().describe('Creation timestamp (ISO 8601)'),
});

export type ArticleComment = z.infer<typeof ArticleCommentSchema>;

export const GetArticleCommentsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(25)
    .describe('Maximum comments per page (default 25)'),
  cursor: z
    .string()
    .optional()
    .describe(
      'Opaque pagination cursor from the previous page (omit for first page)',
    ),
});

export type GetArticleCommentsQuery = z.infer<
  typeof GetArticleCommentsQuerySchema
>;

export const GetArticleCommentsResponseSchema = z.object({
  comments: z.array(ArticleCommentSchema),
  nextCursor: z
    .string()
    .nullable()
    .describe('Cursor for the next page, or null if no more comments'),
});

export type GetArticleCommentsResponse = z.infer<
  typeof GetArticleCommentsResponseSchema
>;

export const AddArticleCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1)
    .max(ARTICLE_COMMENT_MAX_CHARS)
    .describe('The comment text (1-2000 chars)'),
});

export type AddArticleCommentRequest = z.infer<typeof AddArticleCommentSchema>;

export const AddArticleCommentResponseSchema = z.object({
  comment: ArticleCommentSchema,
  comment_count: z.number().int().describe('The updated comment count'),
});

export type AddArticleCommentResponse = z.infer<
  typeof AddArticleCommentResponseSchema
>;

export const DeleteArticleCommentResponseSchema = z.object({
  message: z.string(),
});

export type DeleteArticleCommentResponse = z.infer<
  typeof DeleteArticleCommentResponseSchema
>;
