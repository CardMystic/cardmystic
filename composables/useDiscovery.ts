import { useQuery, useInfiniteQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import {
  GetFeaturedDecklistsResponseSchema,
  SearchDecklistsResponseSchema,
} from '~/models/cardListModel';
import {
  GetUserProfileResponseSchema,
  SearchUsersResponseSchema,
  type GetUserProfileResponse,
} from '~/models/userModel';

/**
 * Recent decklists owned by featured users (profiles.is_featured = true).
 * Public endpoint — no auth required.
 */
export function useFeaturedDecklists(limit = 10) {
  const config = useRuntimeConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['discovery', 'featured-decklists', limit],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/featured?limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load featured decklists (${response.status})`,
        );
      }
      return GetFeaturedDecklistsResponseSchema.parse(await response.json());
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    decklists: computed(() => data.value?.decklists ?? []),
    isLoading,
    error,
    refetch,
  };
}

/**
 * Fuzzy-search public decklists by name/description with cursor-based
 * infinite scrolling. The query string is debounced by the caller.
 */
export function useDecklistSearch(query: Ref<string>, limit = 20) {
  const config = useRuntimeConfig();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(() => ({
    queryKey: ['discovery', 'search-decklists', query.value, limit] as const,
    queryFn: async ({ pageParam }) => {
      const trimmed = query.value.trim();
      const params = new URLSearchParams({
        query: trimmed,
        limit: String(limit),
      });
      if (pageParam) params.set('cursor', pageParam);
      const url = `${config.public.backendUrl}/supabase/card-lists/search?${params}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to search decklists (${response.status})`);
      }
      return SearchDecklistsResponseSchema.parse(await response.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: query.value.trim().length > 0,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  }));

  return {
    decklists: computed(
      () => data.value?.pages.flatMap((p) => p.decklists) ?? [],
    ),
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  };
}

/**
 * Fuzzy-search public user profiles by username with cursor-based
 * infinite scrolling.
 */
export function useUserSearch(query: Ref<string>, limit = 20) {
  const config = useRuntimeConfig();

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(() => ({
    queryKey: ['discovery', 'search-users', query.value, limit] as const,
    queryFn: async ({ pageParam }) => {
      const trimmed = query.value.trim();
      const params = new URLSearchParams({
        query: trimmed,
        limit: String(limit),
      });
      if (pageParam) params.set('cursor', pageParam);
      const url = `${config.public.backendUrl}/user/search?${params}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to search users (${response.status})`);
      }
      return SearchUsersResponseSchema.parse(await response.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: query.value.trim().length > 0,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  }));

  return {
    users: computed(() => data.value?.pages.flatMap((p) => p.users) ?? []),
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
  };
}

/**
 * Public profile + public decklists for a given user id. Returns a 404 if
 * the user does not exist.
 */
export function usePublicUserProfile(userId: Ref<string | null | undefined>) {
  const config = useRuntimeConfig();

  const enabled = computed(() => !!userId.value);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: computed(() => ['discovery', 'public-profile', userId.value]),
    queryFn: async (): Promise<GetUserProfileResponse | null> => {
      if (!userId.value) return null;
      const url = `${config.public.backendUrl}/user/profile/${encodeURIComponent(userId.value)}`;
      const response = await fetch(url);
      if (response.status === 404) {
        throw createError({ statusCode: 404, statusMessage: 'User not found' });
      }
      if (!response.ok) {
        throw new Error(`Failed to load user profile (${response.status})`);
      }
      return GetUserProfileResponseSchema.parse(await response.json());
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    profile: computed(() => data.value?.profile ?? null),
    decklists: computed(() => data.value?.decklists ?? []),
    isLoading,
    error,
    refetch,
  };
}
