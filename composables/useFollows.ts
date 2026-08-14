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
  FollowStatusResponseSchema,
  FollowUserResponseSchema,
  GetAccountStatsResponseSchema,
  GetFollowingResponseSchema,
} from '~/models/userModel';

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
 * The users the authenticated user follows, plus follow/unfollow mutations.
 * The list is cursor-paginated for infinite scroll (25 per page by default).
 */
export function useFollows(limit = 25) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const isLoggedIn = computed(() => !!userProfile.value?.id);

  const {
    data,
    isLoading: isLoadingFollowing,
    isFetchingNextPage,
    error: followingError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(() => ({
    queryKey: ['following', userProfile.value?.id, limit] as const,
    queryFn: async ({ pageParam }) => {
      const token = await getAuthToken(supabase!);
      const params = new URLSearchParams({ limit: String(limit) });
      if (pageParam) params.set('cursor', pageParam);
      const response = await fetch(
        `${config.public.backendUrl}/user/following?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load followed users (${response.status})`);
      }
      return GetFollowingResponseSchema.parse(await response.json());
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !process.server && !!userProfile.value?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  }));

  const following = computed(
    () => data.value?.pages.flatMap((p) => p.users) ?? [],
  );

  const setFollowMutation = useMutation({
    mutationFn: async ({
      userId,
      follow,
    }: {
      userId: string;
      follow: boolean;
    }) => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/user/follow/${encodeURIComponent(userId)}`,
        {
          method: follow ? 'POST' : 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update follow (${response.status})`);
      }
      return FollowUserResponseSchema.parse(await response.json());
    },
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['account-stats'] });
      queryClient.invalidateQueries({
        queryKey: ['discovery', 'public-profile', userId],
      });
    },
  });

  return {
    isLoggedIn,
    following,
    isLoadingFollowing,
    isFetchingNextPage,
    followingError,
    fetchNextPage,
    hasNextPage,
    setFollow: (userId: string, follow: boolean) =>
      setFollowMutation.mutateAsync({ userId, follow }),
    isSettingFollow: computed(() => setFollowMutation.isPending.value),
  };
}

/**
 * Cheap boolean check for whether the authenticated user follows a given
 * target user. Powers the FollowButton without pulling the full following
 * list. Cached per userId so multiple buttons on a page share the request.
 */
export function useFollowStatus(userId: Ref<string | null | undefined>) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const config = useRuntimeConfig();

  const { data, isLoading, error } = useQuery({
queryKey: computed(
      () =>
        ['follow-status', userId.value, userProfile.value?.id] as const,
    ),
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/user/follow-status/${encodeURIComponent(userId.value!)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load follow status (${response.status})`);
      }
      return FollowStatusResponseSchema.parse(await response.json());
    },
    enabled: computed(
      () => !process.server && !!userProfile.value?.id && !!userId.value,
    ),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  return {
    following: computed(() => data.value?.following ?? false),
    isLoading,
    error,
  };
}

/**
 * Aggregate account stats for the authenticated user (deck counts, deck
 * traffic, followers, member since). Shown on the Account page.
 */
export function useAccountStats() {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const config = useRuntimeConfig();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['account-stats', computed(() => userProfile.value?.id)],
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/user/account-stats`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load account stats (${response.status})`);
      }
      return GetAccountStatsResponseSchema.parse(await response.json());
    },
    enabled: computed(() => !process.server && !!userProfile.value?.id),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  return {
    stats: computed(() => data.value ?? null),
    isLoading,
    error,
    refetch,
  };
}
