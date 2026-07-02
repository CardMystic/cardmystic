import { useQuery, keepPreviousData } from '@tanstack/vue-query';
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
 * Fuzzy-search public decklists by name/description. The query string is
 * debounced by the caller — pass an already-debounced ref.
 */
export function useDecklistSearch(query: Ref<string>, limit = 20) {
  const config = useRuntimeConfig();

  const enabled = computed(() => query.value.trim().length > 0);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(() => [
      'discovery',
      'search-decklists',
      query.value,
      limit,
    ]),
    queryFn: async () => {
      const trimmed = query.value.trim();
      const url = `${config.public.backendUrl}/supabase/card-lists/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to search decklists (${response.status})`);
      }
      return SearchDecklistsResponseSchema.parse(await response.json());
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    decklists: computed(() => data.value?.decklists ?? []),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Fuzzy-search public user profiles by username.
 */
export function useUserSearch(query: Ref<string>, limit = 20) {
  const config = useRuntimeConfig();

  const enabled = computed(() => query.value.trim().length > 0);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(() => ['discovery', 'search-users', query.value, limit]),
    queryFn: async () => {
      const trimmed = query.value.trim();
      const url = `${config.public.backendUrl}/user/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to search users (${response.status})`);
      }
      return SearchUsersResponseSchema.parse(await response.json());
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  return {
    users: computed(() => data.value?.users ?? []),
    isLoading,
    isFetching,
    error,
    refetch,
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
