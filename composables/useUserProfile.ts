import type { User } from '@supabase/supabase-js';
import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useQuery } from '@tanstack/vue-query';

export const useUserProfile = () => {
  // Only initialize Supabase on client side
  const supabase = process.server ? null : useSupabase();

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
        console.error('Error fetching user:', error);
        return null;
      }
      return user;
    },
    enabled: !process.server && !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch profile data with TanStack Query
  const { data: profileData, refetch: fetchProfileData } = useQuery({
    queryKey: ['profile', userProfile],
    queryFn: async () => {
      if (!supabase || !userProfile.value?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.value.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    },
    enabled: !process.server && !!supabase && !!userProfile.value?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      // Refetch to clear user data
      await fetchUser();
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
        await fetchUser();
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
