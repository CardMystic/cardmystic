import { COOKIE_CONSENT_KEY } from '~/utils/cookieConsent';
import { useSupabase } from './useSupabase';
import { DECK_PREFERENCES_STORAGE_PREFIX } from './useDeckPreferences';
import { useQuery, useQueryClient } from '@tanstack/vue-query';

// Track if auth listener is already initialized (singleton)
let authListenerInitialized = false;
// Suppress user queries during password-recovery so the navbar shows "Login"
let inPasswordRecovery = false;

export const useUserProfile = () => {
  // Only initialize Supabase on client side
  const supabase = process.server ? null : useSupabase();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  // Fetch user with TanStack Query
  const {
    data: userProfile,
    isLoading: loading,
    refetch: fetchUser,
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      if (!supabase) return null;
      // During password recovery the session is valid but the user should
      // not appear logged-in in the UI (navbar should show "Login").
      if (inPasswordRecovery) return null;
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        if (error.name === 'AuthSessionMissingError') {
          // This is fine, the user logged out
          return null;
        }
        // Keep the last authenticated user on transient failures. Returning null
        // unmounts owner-only editors and discards unsaved work during refresh.
        throw error;
      }
      return user;
    },
    enabled: !process.server && !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Computed userId that depends on the userProfile query result
  const userId = computed(() => userProfile.value?.id ?? null);

  // Fetch profile data with TanStack Query
  const { data: profileData } = useQuery({
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

      // Keep browser preferences and consent; remove auth, account, and cached data.
      if (typeof window !== 'undefined') {
        for (const key of Object.keys(localStorage)) {
          if (
            !key.startsWith(DECK_PREFERENCES_STORAGE_PREFIX) &&
            key !== COOKIE_CONSENT_KEY
          ) {
            localStorage.removeItem(key);
          }
        }
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

  const pingActivity = async () => {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) return;
    try {
      await fetch(`${config.public.backendPath}/user/ping`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Non-critical — silently ignore
    }
  };

  const recordOAuthSignup = async (accessToken: string) => {
    try {
      await fetch(`${config.public.backendPath}/user/signup/record`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Non-critical — silently ignore
    }
  };

  // Computed properties
  const username = computed(() => profileData.value?.username ?? '');

  const profileIconUrl = computed(() => {
    if (!profileData.value?.avatar_card_name) return null;
    return scryfallArtCropUrl(profileData.value.avatar_card_name);
  });

  // Listen to auth state changes - only initialize once globally
  const initAuthListener = () => {
    if (!supabase || authListenerInitialized) return;

    authListenerInitialized = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // After an OAuth redirect, Supabase may have already processed the
      // URL tokens before the listener is registered, so the first event
      // is INITIAL_SESSION rather than SIGNED_IN.  Check both for the
      // pending OAuth signup flag.
      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
        session &&
        sessionStorage.getItem('pendingOAuthSignup')
      ) {
        sessionStorage.removeItem('pendingOAuthSignup');
        const accessToken = session.access_token;
        if (accessToken) {
          recordOAuthSignup(accessToken);
        }
      }

      // Refetch queries when auth state changes.
      // INITIAL_SESSION fires after an OAuth redirect when Supabase exchanges
      // the URL code for a session before this listener is registered. Without
      // handling it here, the navbar keeps showing the hydrated "logged out"
      // state because the user query has a 5-minute staleTime.
      if (
        (event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'INITIAL_SESSION') &&
        session
      ) {
        // Skip if we're in a recovery flow — the user should stay "logged out" in the UI
        if (inPasswordRecovery) return;

        // Invalidate instead of refetch to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ['user'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else if (event === 'SIGNED_OUT') {
        // Null-out data instead of queryClient.clear() — clear() destroys
        // query observers and leaves isLoading permanently stuck when
        // components (e.g. Navbar) stay mounted across navigations.
        queryClient.cancelQueries();
        queryClient.setQueryData(['user'], null);
        queryClient.removeQueries({ queryKey: ['profile'] });
        inPasswordRecovery = false;
        authListenerInitialized = false; // Allow re-initialization after sign out
      } else if (event === 'PASSWORD_RECOVERY') {
        // During a password recovery flow the user should not appear as
        // logged in.  Cancel any in-flight refetch that the preceding
        // SIGNED_IN event may have triggered, then set user data to null
        // so the navbar shows the Login button.
        inPasswordRecovery = true;
        queryClient.cancelQueries({ queryKey: ['user'] });
        queryClient.cancelQueries({ queryKey: ['profile'] });
        queryClient.setQueryData(['user'], null);
        queryClient.removeQueries({ queryKey: ['profile'] });
      }
    });
  };

  return {
    userId: readonly(userId),
    userProfile: readonly(userProfile),
    profileData: readonly(profileData),
    loading: readonly(loading),
    username: readonly(username),
    profileIconUrl: readonly(profileIconUrl),
    fetchUser,
    pingActivity,
    signOut,
    initAuthListener,
  };
};
