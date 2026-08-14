import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, ref, watch, type Ref } from 'vue';
import { useSupabase } from './useSupabase';
import {
  ArticleResponseSchema,
  GetLikedArticlesResponseSchema,
  GetMyArticlesResponseSchema,
  GetRecentArticlesResponseSchema,
  SearchArticlesResponseSchema,
  type CreateArticleRequest,
  type UpdateArticleRequest,
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

/** Latest published articles, newest first. Public endpoint — no auth. */
export function useRecentArticles(limit = 3) {
  const config = useRuntimeConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['articles', 'recent', limit],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/articles/recent?limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load recent articles (${response.status})`);
      }
      return GetRecentArticlesResponseSchema.parse(await response.json());
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    articles: computed(() => data.value?.articles ?? []),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Keyword search over published article titles/descriptions with 1-indexed
 * offset pagination. The query string is debounced by the caller.
 */
export function useArticleSearch(
  query: Ref<string>,
  page: Ref<number>,
  pageSize = 50,
) {
  const config = useRuntimeConfig();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(
      () => ['articles', 'search', query.value, page.value, pageSize] as const,
    ),
    queryFn: async () => {
      const params = new URLSearchParams({
        query: query.value.trim(),
        page: String(page.value),
        pageSize: String(pageSize),
      });
      const response = await fetch(
        `${config.public.backendUrl}/articles/search?${params}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to search articles (${response.status})`);
      }
      return SearchArticlesResponseSchema.parse(await response.json());
    },
    enabled: computed(() => query.value.trim().length > 0),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    articles: computed(() => data.value?.articles ?? []),
    totalCount: computed(() => data.value?.totalCount ?? 0),
    totalPages: computed(() => data.value?.totalPages ?? 1),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * All of the authenticated author's articles, drafts included, with
 * 1-indexed offset pagination.
 */
export function useMyArticles(
  page: Ref<number>,
  enabled: Ref<boolean> | boolean = true,
  pageSize = 50,
) {
  const supabase = process.server ? null : useSupabase();
  const config = useRuntimeConfig();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(
      () => ['articles', 'mine', page.value, pageSize] as const,
    ),
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const params = new URLSearchParams({
        page: String(page.value),
        pageSize: String(pageSize),
      });
      const response = await fetch(
        `${config.public.backendUrl}/articles/mine?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load your articles (${response.status})`);
      }
      return GetMyArticlesResponseSchema.parse(await response.json());
    },
    enabled: computed(() => {
      if (process.server) return false;
      return typeof enabled === 'boolean' ? enabled : !!enabled.value;
    }),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    articles: computed(() => data.value?.articles ?? []),
    totalCount: computed(() => data.value?.totalCount ?? 0),
    totalPages: computed(() => data.value?.totalPages ?? 1),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Published articles the authenticated user has liked, most recently liked
 * first, with 1-indexed offset pagination. Requires a logged-in session —
 * disabled during SSR.
 */
export function useLikedArticles(
  page: Ref<number>,
  enabled: Ref<boolean> | boolean = true,
  pageSize = 50,
) {
  const supabase = process.server ? null : useSupabase();
  const config = useRuntimeConfig();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(
      () => ['articles', 'liked', page.value, pageSize] as const,
    ),
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const params = new URLSearchParams({
        page: String(page.value),
        pageSize: String(pageSize),
      });
      const response = await fetch(
        `${config.public.backendUrl}/articles/liked?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load your liked articles (${response.status})`,
        );
      }
      return GetLikedArticlesResponseSchema.parse(await response.json());
    },
    enabled: computed(() => {
      if (process.server) return false;
      return typeof enabled === 'boolean' ? enabled : !!enabled.value;
    }),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    articles: computed(() => data.value?.articles ?? []),
    totalCount: computed(() => data.value?.totalCount ?? 0),
    totalPages: computed(() => data.value?.totalPages ?? 1),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Fetches a single article by ID (including its markdown content). Drafts
 * are only readable by their owner, so the auth token is attached when a
 * session exists. Returns null on 404.
 */
export function useArticle(articleId: Ref<string | null | undefined>) {
  const supabase = process.server ? null : useSupabase();
  const config = useRuntimeConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: computed(() => ['articles', 'view', articleId.value]),
    queryFn: async () => {
      if (!articleId.value) return null;
      const headers: Record<string, string> = {};
      if (import.meta.client && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(
        `${config.public.backendUrl}/articles/view/${encodeURIComponent(articleId.value)}`,
        { headers },
      );
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to load article (${response.status})`);
      }
      return ArticleResponseSchema.parse(await response.json());
    },
    enabled: computed(() => !!articleId.value),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: (query) => (query.state.data === null ? 'always' : false),
    refetchOnWindowFocus: false,
  });

  return {
    article: computed(() => data.value?.article ?? null),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Records a view of a published article — fires POST /view/:articleId once
 * per article id when the article resolves as published. Client-only and
 * fire-and-forget: view tracking must never block or break the page.
 */
export function useArticleViewTracker(
  articleId: Ref<string | null | undefined>,
  isPublished: Ref<boolean>,
) {
  const config = useRuntimeConfig();
  const recordedForId = ref<string | null>(null);

  watch(
    [articleId, isPublished],
    () => {
      if (import.meta.server) return;
      if (!articleId.value || !isPublished.value) return;
      if (recordedForId.value === articleId.value) return;
      recordedForId.value = articleId.value;
      fetch(
        `${config.public.backendUrl}/articles/view/${encodeURIComponent(articleId.value)}`,
        { method: 'POST' },
      ).catch(() => {
        // Best-effort — ignore failures
      });
    },
    { immediate: true },
  );
}

/** Create/update/delete mutations for authors. */
export function useArticleMutations() {
  const supabase = process.server ? null : useSupabase();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const invalidateArticleCaches = (articleId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['articles', 'mine'] });
    queryClient.invalidateQueries({ queryKey: ['articles', 'liked'] });
    queryClient.invalidateQueries({ queryKey: ['articles', 'recent'] });
    queryClient.invalidateQueries({ queryKey: ['articles', 'search'] });
    if (articleId) {
      queryClient.invalidateQueries({
        queryKey: ['articles', 'view', articleId],
      });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (article: CreateArticleRequest) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/create`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(article),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to create article (${response.status})`);
      }
      return ArticleResponseSchema.parse(await response.json());
    },
    onSuccess: (result) => invalidateArticleCaches(result.article.id),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: {
      articleId: string;
      updates: UpdateArticleRequest;
    }) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/${encodeURIComponent(input.articleId)}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input.updates),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update article (${response.status})`);
      }
      return ArticleResponseSchema.parse(await response.json());
    },
    onSuccess: (result) => invalidateArticleCaches(result.article.id),
  });

  const deleteMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/articles/${encodeURIComponent(articleId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to delete article (${response.status})`);
      }
    },
    onSuccess: () => invalidateArticleCaches(),
  });

  return {
    createArticle: (article: CreateArticleRequest) =>
      createMutation.mutateAsync(article),
    updateArticle: (articleId: string, updates: UpdateArticleRequest) =>
      updateMutation.mutateAsync({ articleId, updates }),
    deleteArticle: (articleId: string) => deleteMutation.mutateAsync(articleId),
    isCreating: computed(() => createMutation.isPending.value),
    isUpdating: computed(() => updateMutation.isPending.value),
    isDeleting: computed(() => deleteMutation.isPending.value),
  };
}
