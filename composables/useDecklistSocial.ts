import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/vue-query';
import { computed, ref, watch, type Ref } from 'vue';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import {
  DecklistSocialStateResponseSchema,
  ToggleLikeResponseSchema,
  ToggleSaveResponseSchema,
  GetDecklistCommentsResponseSchema,
  AddDecklistCommentResponseSchema,
  GetLikedDecklistsResponseSchema,
  GetSavedDecklistsResponseSchema,
} from '~/models/cardListModel';

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
 * Records a view of a public decklist — fires POST /view/:listId once per
 * list id when the deck resolves as public. Client-only and fire-and-forget:
 * view tracking must never block or break the page.
 */
export function useDecklistViewTracker(
  listId: Ref<string | null | undefined>,
  isPublic: Ref<boolean>,
) {
  const config = useRuntimeConfig();
  const recordedForId = ref<string | null>(null);

  watch(
    [listId, isPublic],
    () => {
      if (import.meta.server) return;
      if (!listId.value || !isPublic.value) return;
      if (recordedForId.value === listId.value) return;
      recordedForId.value = listId.value;
      fetch(
        `${config.public.backendUrl}/supabase/card-lists/view/${encodeURIComponent(listId.value)}`,
        { method: 'POST' },
      ).catch(() => {
        // Best-effort — ignore failures
      });
    },
    { immediate: true },
  );
}

/**
 * Like/save state and toggles for a single public decklist. The counts on
 * the decklist itself come from the public decklist query — after a toggle
 * we invalidate it so the counts refresh.
 */
export function useDecklistSocial(listId: Ref<string | null | undefined>) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const isLoggedIn = computed(() => !!userProfile.value?.id);

  const { data: socialState, isLoading: isLoadingSocialState } = useQuery({
    queryKey: computed(() => [
      'decklist-social',
      listId.value,
      userProfile.value?.id,
    ]),
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/social/${encodeURIComponent(listId.value!)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load social state (${response.status})`);
      }
      return DecklistSocialStateResponseSchema.parse(await response.json());
    },
    enabled: computed(
      () => !process.server && !!listId.value && isLoggedIn.value,
    ),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  /** Invalidate everything that displays like/save counts for this list. */
  const invalidateSocialCaches = () => {
    queryClient.invalidateQueries({
      queryKey: ['discovery', 'public-decklist', listId.value],
    });
    queryClient.invalidateQueries({ queryKey: ['liked-decklists'] });
    queryClient.invalidateQueries({ queryKey: ['saved-decklists'] });
    queryClient.invalidateQueries({ queryKey: ['user-lists'] });
  };

  const toggleLikeMutation = useMutation({
    mutationFn: async (liked: boolean) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/like/${encodeURIComponent(listId.value!)}`,
        {
          method: liked ? 'POST' : 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update like (${response.status})`);
      }
      return ToggleLikeResponseSchema.parse(await response.json());
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['decklist-social', listId.value, userProfile.value?.id],
        (prev: { liked: boolean; saved: boolean } | undefined) => ({
          liked: result.liked,
          saved: prev?.saved ?? false,
        }),
      );
      invalidateSocialCaches();
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (saved: boolean) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/save/${encodeURIComponent(listId.value!)}`,
        {
          method: saved ? 'POST' : 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update save (${response.status})`);
      }
      return ToggleSaveResponseSchema.parse(await response.json());
    },
    onSuccess: (result) => {
      queryClient.setQueryData(
        ['decklist-social', listId.value, userProfile.value?.id],
        (prev: { liked: boolean; saved: boolean } | undefined) => ({
          liked: prev?.liked ?? false,
          saved: result.saved,
        }),
      );
      invalidateSocialCaches();
    },
  });

  return {
    isLoggedIn,
    liked: computed(() => socialState.value?.liked ?? false),
    saved: computed(() => socialState.value?.saved ?? false),
    isLoadingSocialState,
    toggleLike: (liked: boolean) => toggleLikeMutation.mutateAsync(liked),
    toggleSave: (saved: boolean) => toggleSaveMutation.mutateAsync(saved),
    isTogglingLike: computed(() => toggleLikeMutation.isPending.value),
    isTogglingSave: computed(() => toggleSaveMutation.isPending.value),
  };
}

/**
 * Comments on a public decklist with cursor-based infinite scrolling, plus
 * add/delete mutations for authenticated users.
 */
export function useDecklistComments(
  listId: Ref<string | null | undefined>,
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
    queryKey: ['decklist-comments', listId.value, limit] as const,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (pageParam) params.set('cursor', pageParam);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/comments/${encodeURIComponent(listId.value!)}?${params}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to load comments (${response.status})`);
      }
      return GetDecklistCommentsResponseSchema.parse(await response.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!listId.value,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  }));

  const invalidateComments = () => {
    queryClient.invalidateQueries({
      queryKey: ['decklist-comments', listId.value],
    });
    // comment_count is shown on the public decklist
    queryClient.invalidateQueries({
      queryKey: ['discovery', 'public-decklist', listId.value],
    });
  };

  const addCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/comments/${encodeURIComponent(listId.value!)}`,
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
      return AddDecklistCommentResponseSchema.parse(await response.json());
    },
    onSuccess: invalidateComments,
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/comment/${encodeURIComponent(commentId)}`,
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

/** The public decklists the authenticated user has liked. */
export function useLikedDecklists(limit = 20) {
  return useReactedDecklists('liked-decklists', 'liked', limit);
}

/** The public decklists the authenticated user has saved. */
export function useSavedDecklists(limit = 20) {
  return useReactedDecklists('saved-decklists', 'saved', limit);
}

function useReactedDecklists(
  queryKey: 'liked-decklists' | 'saved-decklists',
  endpoint: 'liked' | 'saved',
  limit: number,
) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const config = useRuntimeConfig();
  const schema =
    endpoint === 'liked'
      ? GetLikedDecklistsResponseSchema
      : GetSavedDecklistsResponseSchema;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(() => ({
    queryKey: [queryKey, userProfile.value?.id, limit] as const,
    queryFn: async ({ pageParam }) => {
      const token = await getAuthToken(supabase!);
      const params = new URLSearchParams({ limit: String(limit) });
      if (pageParam) params.set('cursor', pageParam);
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/${endpoint}?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load ${endpoint} decklists (${response.status})`,
        );
      }
      return schema.parse(await response.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !process.server && !!userProfile.value?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  }));

  return {
    decklists: computed(
      () => data.value?.pages.flatMap((p) => p.decklists) ?? [],
    ),
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  };
}
