import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import {
  FollowUserResponseSchema,
  GetFollowingResponseSchema,
  GetAccountStatsResponseSchema,
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
 */
export function useFollows() {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const isLoggedIn = computed(() => !!userProfile.value?.id);

  const {
    data,
    isLoading: isLoadingFollowing,
    error: followingError,
  } = useQuery({
    queryKey: ['following', computed(() => userProfile.value?.id)],
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/user/following`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to load followed users (${response.status})`);
      }
      return GetFollowingResponseSchema.parse(await response.json());
    },
    enabled: computed(() => !process.server && !!userProfile.value?.id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const following = computed(() => data.value?.users ?? []);

  const isFollowing = (userId: string) =>
    following.value.some((u) => u.id === userId);

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
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update follow (${response.status})`);
      }
      return FollowUserResponseSchema.parse(await response.json());
    },
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['account-stats'] });
      // Follower count is shown on the public profile page
      queryClient.invalidateQueries({
        queryKey: ['discovery', 'public-profile', userId],
      });
    },
  });

  return {
    isLoggedIn,
    following,
    isFollowing,
    isLoadingFollowing,
    followingError,
    setFollow: (userId: string, follow: boolean) =>
      setFollowMutation.mutateAsync({ userId, follow }),
    isSettingFollow: computed(() => setFollowMutation.isPending.value),
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
