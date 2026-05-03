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
    const safeStorage =
      import.meta.client
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

    nuxtApp._supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        ...(safeStorage && { storage: safeStorage }),
      },
    });
  }

  return nuxtApp._supabaseClient as SupabaseClient<Database>;
};
