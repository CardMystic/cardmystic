import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

export const useSupabase = () => {
  const nuxtApp = useNuxtApp();

  // Use a key on nuxtApp to store the client instance
  // This ensures proper scoping per request on server and single instance on client
  if (!nuxtApp._supabaseClient) {
    const config = useRuntimeConfig();
    const supabaseUrl = config.public.supabaseUrl;
    const supabaseKey = config.public.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase configuration is missing. Please set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY environment variables.',
      );
    }

    // Wrap localStorage so quota errors from Supabase auth
    // (session persistence) are handled gracefully by clearing
    // stale TanStack Query cache entries and retrying once.
    const safeStorage = import.meta.client
      ? {
          getItem: (key: string) => localStorage.getItem(key),
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value);
            } catch {
              // Quota exceeded — purge TanStack Query cache and retry
              try {
                Object.keys(localStorage)
                  .filter((k) => k.startsWith('tsqd-'))
                  .forEach((k) => localStorage.removeItem(k));
                localStorage.setItem(key, value);
              } catch {
                // Still full — silently skip persistence
              }
            }
          },
          removeItem: (key: string) => localStorage.removeItem(key),
        }
      : undefined;

    if (import.meta.client) {
      // TEMP debug: trace whether Supabase client is constructed and whether
      // it sees the OAuth hash on this page load. Remove once the Google
      // sign-in regression is resolved.
      // eslint-disable-next-line no-console
      console.log('[cm-auth] constructing supabase client', {
        href: window.location.href,
        hasHash: window.location.hash.includes('access_token'),
      });
    }

    nuxtApp._supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Our Supabase project's OAuth callback returns tokens in the URL
        // hash (#access_token=...&refresh_token=...) — i.e. the implicit
        // flow. supabase-js v2 defaults flowType to 'pkce', which only
        // parses ?code= query params and silently ignores hash tokens.
        // That mismatch caused Google sign-in to leave the user "logged
        // out" after the redirect. Force implicit so the hash is parsed.
        flowType: 'implicit',
        // TEMP: verbose logging from auth-js to help diagnose why no
        // session is being detected from the URL after OAuth redirect.
        debug: import.meta.client,
        ...(safeStorage && { storage: safeStorage }),
      },
    });
  }

  return nuxtApp._supabaseClient as SupabaseClient<Database>;
};
