import { useUserProfile } from '~/composables/useUserProfile';

/**
 * Auth bootstrap plugin (client-only).
 *
 * Three-tier loading strategy for the ~160 kB Supabase SDK so it stays
 * off the critical path for anonymous visitors (the vast majority of
 * homepage traffic):
 *
 *   1. **OAuth redirect detected** (`#access_token=` in the URL): import
 *      the SDK immediately and apply `setSession` so we don't render a
 *      logged-out flash on the post-redirect landing page.
 *   2. **Persisted session found** (`sb-*-auth-token` key in
 *      localStorage): defer the SDK import + auth listener init until
 *      `requestIdleCallback` (or a 1.5 s `setTimeout` fallback). The
 *      navbar will briefly render its logged-out state, then re-render
 *      to the avatar once the listener fires `INITIAL_SESSION`.
 *   3. **No session at all**: skip the SDK import entirely. Login,
 *      register, profile, lists, and history pages pull in the SDK on
 *      demand via `useSupabase()` when the user actually interacts
 *      with auth UI.
 *
 * The hash-capture step in (1) must run synchronously before Vue Router
 * mounts — the router calls `history.replaceState` which strips the
 * hash, so deferring until idle would lose the OAuth tokens.
 */

/**
 * Synchronously capture OAuth implicit-flow tokens from the URL hash
 * BEFORE Vue Router mounts and calls history.replaceState (which strips
 * the hash). We hand the tokens to Supabase via setSession() ourselves
 * instead of relying on Supabase's built-in `detectSessionInUrl`, which
 * runs asynchronously inside _acquireLock and races against the router.
 *
 * Returning the tokens (rather than applying them immediately) lets the
 * rest of auth init defer until the browser is idle while still keeping
 * the URL-mutation step on the synchronous startup path.
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

/**
 * Cheaply check whether Supabase has a persisted session in localStorage
 * WITHOUT loading the Supabase SDK. The SDK stores its session under a
 * key shaped like `sb-<project-ref>-auth-token`. If no such key exists,
 * the user is definitely logged out and we can skip importing the SDK
 * entirely on this page load — saving ~160 kB of JS for the common
 * case of anonymous homepage visitors.
 */
const hasPersistedSession = (): boolean => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        return true;
      }
    }
  } catch {
    // localStorage can throw in private mode / sandboxed iframes — treat
    // as "no session" so we don't pull in the SDK unnecessarily.
  }
  return false;
};

export default defineNuxtPlugin(() => {
  // Must run before any other plugin / router activity that could mutate
  // the URL. Nuxt client plugins run synchronously at app startup, so
  // reading window.location.hash here is the earliest reliable point.
  const oauthTokens = captureOAuthHash();

  // Everything below pulls in the (large, dynamically-imported) Supabase
  // SDK. It's deferred until the browser is idle so it doesn't compete
  // with first contentful paint on unauthenticated visits — which are
  // the vast majority of homepage traffic. The trade-off is a brief
  // delay before the navbar reflects the logged-in state.
  //
  // If we just got back from an OAuth redirect, fast-track the init so
  // the user sees their session within the same tick rather than after
  // an idle gap (which would feel broken).
  const init = async () => {
    const { initAuthListener, userProfile, pingActivity } = useUserProfile();
    await initAuthListener();

    // If we captured OAuth tokens above, hand them to Supabase directly.
    // This bypasses Supabase's `detectSessionInUrl` flow, which races
    // against Vue Router stripping the hash and silently fails.
    if (oauthTokens) {
      const { useSupabase } = await import('~/composables/useSupabase');
      const supabase = await useSupabase();
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
  };

  if (oauthTokens) {
    // Run immediately so the OAuth tokens are applied without a visible
    // "logged out" flash on the post-redirect page.
    void init();
    return;
  }

  // No OAuth redirect in progress AND no persisted Supabase session in
  // localStorage → user is definitely logged out. Skip the SDK import
  // entirely; login/register pages will pull it in on demand when the
  // user actually interacts with auth UI.
  if (!hasPersistedSession()) {
    return;
  }

  const ric = (
    window as unknown as {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number },
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === 'function') {
    ric(() => void init(), { timeout: 4000 });
  } else {
    setTimeout(() => void init(), 1500);
  }
});
