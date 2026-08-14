import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import {
  AddArticleCommentResponseSchema,
  ArticleSocialStateResponseSchema,
  GetArticleCommentsResponseSchema,
  ToggleArticleLikeResponseSchema,
} from '~/models/articleModel';

/** Returns the current Supabase access token, or throws when logged out. */
async function getAuthToken(
  supabase: ReturnType<typeof useSupabase>,
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('No authentication token available');
  return token;
}

/**
 * Like state and toggle for a single published article. The counts on the
 * article itself come from the article view query — after a toggle we
 * invalidate it so the counts refresh.
 */
export function useArticleSocial(articleId: Ref<string | null | undefined>) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const isLoggedIn = computed(() => !!userProfile.value?.id);

  const { data: socialState, isLoading: isLoadingSocialState } = useQuery({
    queryKey: computed(() => [
      'article-social',
      articleId.value,
      userProfile.value?.id,
    ]),
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/social/${encodeURIComponent(articleId.value!)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load social state (${response.status})`);
      }
      return ArticleSocialStateResponseSchema.parse(await response.json());
    },
    enabled: computed(
      () => !process.server && !!articleId.value && isLoggedIn.value,
    ),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (liked: boolean) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/like/${encodeURIComponent(articleId.value!)}`,
        {
          method: liked ? 'POST' : 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update like (${response.status})`);
      }
      return ToggleArticleLikeResponseSchema.parse(await response.json());
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['article-social', articleId.value, userProfile.value?.id],
        { liked: result.liked },
      );
      // like_count is shown on the article itself
      queryClient.invalidateQueries({
        queryKey: ['articles', 'view', articleId.value],
      });
    },
  });

  return {
    isLoggedIn,
    liked: computed(() => socialState.value?.liked ?? false),
    isLoadingSocialState,
    toggleLike: (liked: boolean) => toggleLikeMutation.mutateAsync(liked),
    isTogglingLike: computed(() => toggleLikeMutation.isPending.value),
  };
}

/**
 * Comments on a published article with cursor-based pagination, plus
 * add/delete mutations for authenticated users.
 */
export function useArticleComments(
  articleId: Ref<string | null | undefined>,
  limit = 25,
) {
  const supabase = process.server ? null : useSupabase();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(() => ({
    queryKey: ['article-comments', articleId.value, limit] as const,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (pageParam) params.set('cursor', pageParam);
      const response = await fetch(
        `${config.public.backendUrl}/articles/comments/${encodeURIComponent(articleId.value!)}?${params}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load comments (${response.status})`);
      }
      return GetArticleCommentsResponseSchema.parse(await response.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!articleId.value,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  }));

  const invalidateComments = () => {
    queryClient.invalidateQueries({
      queryKey: ['article-comments', articleId.value],
    });
    // comment_count is shown on the article itself
    queryClient.invalidateQueries({
      queryKey: ['articles', 'view', articleId.value],
    });
  };

  const addCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/comments/${encodeURIComponent(articleId.value!)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ body }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to add comment (${response.status})`);
      }
      return AddArticleCommentResponseSchema.parse(await response.json());
    },
    onSuccess: invalidateComments,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/comment/${encodeURIComponent(commentId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to delete comment (${response.status})`);
      }
    },
    onSuccess: invalidateComments,
  });

  return {
    comments: computed(
      () => data.value?.pages.flatMap((p) => p.comments) ?? [],
    ),
    isLoading,
    isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
    addComment: (body: string) => addCommentMutation.mutateAsync(body),
    deleteComment: (commentId: string) =>
      deleteCommentMutation.mutateAsync(commentId),
    isAddingComment: computed(() => addCommentMutation.isPending.value),
  };
}
