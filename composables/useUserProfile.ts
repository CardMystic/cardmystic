import { useSupabase } from './useSupabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';

// Track if auth listener is already initialized (singleton)
let authListenerInitialized = false;

export const useUserProfile = () => {
  // Only initialize Supabase on client side
  const supabase = process.server ? null : useSupabase();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  function validatePasswordPolicy(password: string): string | null {
    if (password.length < 8)
      return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(password))
      return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(password))
      return 'Password must contain at least one lowercase letter.';
    if (!/[0-9]/.test(password))
      return 'Password must contain at least one number.';
    if (!/[^A-Za-z0-9]/.test(password))
      return 'Password must contain at least one special character.';
    if (/\s/.test(password)) return 'Password must not contain whitespace.';
    return null;
  }

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

  const updateAvatarMutation = useMutation({
    mutationFn: async (cardName: string) => {
      if (!supabase || !userProfile.value?.id) {
        throw new Error('Invalid card name or user not logged in');
      }
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_card_name: cardName })
        .eq('id', userProfile.value.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      if (!supabase || !username.trim()) {
        throw new Error('Username cannot be empty');
      }
      const { error } = await supabase.auth.updateUser({ data: { username } });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const pingActivity = async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) return;
    try {
      await fetch(`${config.public.backendUrl}/user/ping`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Non-critical — silently ignore
    }
  };

  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      if (!supabase) throw new Error('Not available on server');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Not authenticated');

      const res = await fetch(
        `${config.public.backendUrl}/user/update-password`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ newPassword }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password update failed');
    },
  });

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

  // Listen to auth state changes - only initialize once globally
  const initAuthListener = () => {
    if (!supabase || authListenerInitialized) return;

    authListenerInitialized = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Refetch queries when auth state changes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Invalidate instead of refetch to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else if (event === 'SIGNED_OUT') {
        // Clear all cached data when user signs out
        queryClient.clear();
        authListenerInitialized = false; // Allow re-initialization after sign out
      } else if (event === 'PASSWORD_RECOVERY') {
        // During a password recovery flow the user should not appear as logged in
        // in the navbar. Clear query cache so the Login button stays visible.
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
    validatePasswordPolicy,
    fetchUser,
    updateAvatarMutation,
    updateUsernameMutation,
    updatePasswordMutation,
    pingActivity,
    signOut,
    initAuthListener,
  };
};
