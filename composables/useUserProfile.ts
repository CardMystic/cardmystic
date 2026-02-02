import { useSupabase } from './useSupabase';
import { useQuery, useQueryClient } from '@tanstack/vue-query';

export const useUserProfile = () => {
  // Only initialize Supabase on client side
  const supabase = process.server ? null : useSupabase();
  const queryClient = useQueryClient();

  // Fetch user with TanStack Query
  const {
    data: userProfile,
    isLoading: loading,
    refetch: fetchUser,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!supabase) return null;
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        if (error.name === 'AuthSessionMissingError') {
          // This is fine, the user logged out
          return null;
        }
        console.error('Error fetching user:', error);
        return null;
      }
      return user;
    },
    enabled: !process.server && !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Computed userId that depends on the userProfile query result
  const userId = computed(() => userProfile.value?.id ?? null);

  // Fetch profile data with TanStack Query
  const { data: profileData, refetch: fetchProfileData } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!supabase || !userId.value) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId.value)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: computed(() => !process.server && !!supabase && !!userId.value),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const signOut = async () => {
    if (!supabase) return;

    try {
      // Clear all query caches first
      queryClient.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear local storage to be sure
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force hard reload
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Still try to redirect even if there was an error
      window.location.href = '/';
    }
  };

  const updateProfileAvatar = async (cardName: string) => {
    if (!supabase || !cardName || !userProfile.value?.id) {
      return { error: new Error('Invalid card name or user not logged in') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        avatar_card_name: cardName,
      })
      .eq('id', userProfile.value.id);

    if (!error) {
      // Refetch profile data to update cache
      await fetchProfileData();
    }

    return { error };
  };

  const updateUsername = async (username: string) => {
    if (!supabase || !username.trim()) {
      return { error: new Error('Username cannot be empty') };
    }

    const { error } = await supabase.auth.updateUser({
      data: { username },
    });

    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    if (!supabase || newPassword.length < 6) {
      return { error: new Error('Password must be at least 6 characters') };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error };
  };

  // Computed properties
  const username = computed(() => {
    return (
      userProfile.value?.user_metadata?.username ||
      userProfile.value?.email?.split('@')[0] ||
      ''
    );
  });

  const profileIconUrl = computed(() => {
    if (!profileData.value?.avatar_card_name) return null;
    return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(profileData.value.avatar_card_name)}&format=image&version=art_crop`;
  });

  // Listen to auth state changes
  const initAuthListener = () => {
    if (!supabase) return;
    supabase.auth.onAuthStateChange(async (event, session) => {
      // Refetch queries when auth state changes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await fetchUser();
      } else if (event === 'SIGNED_OUT') {
        // Clear all cached data when user signs out
        queryClient.clear();
      }
    });
  };

  return {
    userProfile: readonly(userProfile),
    profileData: readonly(profileData),
    loading: readonly(loading),
    username: readonly(username),
    profileIconUrl: readonly(profileIconUrl),
    fetchUser,
    fetchProfileData,
    updateProfileAvatar,
    updateUsername,
    updatePassword,
    signOut,
    initAuthListener,
  };
};
