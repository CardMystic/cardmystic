import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UserFollow, UserSearchResult } from '~/models/userModel';

export const useUserFollow = () => {
  const queryClient = useQueryClient();

  // Fetch following list
  const { data: following, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const response = await fetch('/api/user/following');
      if (!response.ok) throw new Error('Failed to fetch following list');
      return response.json() as Promise<UserFollow[]>;
    },
  });

  // Fetch followers list
  const { data: followers, isLoading: isLoadingFollowers } = useQuery({
    queryKey: ['followers'],
    queryFn: async () => {
      const response = await fetch('/api/user/followers');
      if (!response.ok) throw new Error('Failed to fetch followers list');
      return response.json() as Promise<UserFollow[]>;
    },
  });

  // Search users
  const searchUsers = async (query: string) => {
    const response = await fetch(`/api/user/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json() as Promise<UserSearchResult[]>;
  };

  // Follow user
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!response.ok) throw new Error('Failed to follow user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  // Unfollow user
  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/user/follow/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to unfollow user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  return {
    following,
    followers,
    isLoadingFollowing,
    isLoadingFollowers,
    searchUsers,
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
};
