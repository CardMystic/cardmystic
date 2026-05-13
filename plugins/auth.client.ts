import { useSupabase } from '~/composables/useSupabase';
import { useUserProfile } from '~/composables/useUserProfile';

/**
 * Synchronously capture OAuth implicit-flow tokens from the URL hash
 * BEFORE Vue Router mounts and calls history.replaceState (which strips
 * the hash). We hand the tokens to Supabase via setSession() ourselves
 * instead of relying on Supabase's built-in `detectSessionInUrl`, which
 * runs asynchronously inside _acquireLock and races against the router.
 */
const captureOAuthHash = (): {
  access_token: string;
  refresh_token: string;
} | null => {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return null;

  const params = new URLSearchParams(hash.slice(1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;

  // Strip tokens from the URL immediately so they don't leak into
  // analytics, history, or back/forward navigation.
  history.replaceState(
    history.state,
    '',
    window.location.pathname + window.location.search,
  );

  return { access_token, refresh_token };
};

export default defineNuxtPlugin(async () => {
  // Must run before any other plugin / router activity that could mutate
  // the URL. Nuxt client plugins run synchronously at app startup, so
  // reading window.location.hash here is the earliest reliable point.
  const oauthTokens = captureOAuthHash();

  const { initAuthListener, userProfile, pingActivity } = useUserProfile();

  // Initialize the global Supabase auth listener once on app startup.
  // Previously lived in Navbar.vue's onMounted, but it's app-level
  // infrastructure and should not be tied to a UI component.
  initAuthListener();

  // If we captured OAuth tokens above, hand them to Supabase directly.
  // This bypasses Supabase's `detectSessionInUrl` flow, which races
  // against Vue Router stripping the hash and silently fails.
  if (oauthTokens) {
    const supabase = useSupabase();
    const { error } = await supabase.auth.setSession(oauthTokens);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[auth] Failed to apply OAuth session from URL:', error);
    }
  }

  // Ping backend activity once when the user is (or becomes) logged in
  if (userProfile.value) {
    pingActivity();
  } else {
    const stopWatch = watch(userProfile, (profile) => {
      if (profile) {
        pingActivity();
        stopWatch();
      }
    });
  }
});
