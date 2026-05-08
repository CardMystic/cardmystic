import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

/**
 * Async accessor for the Supabase client. The `@supabase/supabase-js`
 * SDK is heavy (~160 kB minified) and isn't needed on first paint for
 * any unauthenticated pages — homepage, search results, card detail,
 * etc. Loading it via a dynamic `import()` here splits it into its own
 * chunk that browsers only fetch when something actually needs the
 * client (auth plugin idle-init, login/register forms, the lists and
 * history composables).
 *
 * The created client is cached on `nuxtApp` so the second call is
 * synchronous-fast and returns the same singleton.
 */
export const useSupabase = async (): Promise<SupabaseClient<Database>> => {
  const nuxtApp = useNuxtApp();

  if (nuxtApp._supabaseClient) {
    return nuxtApp._supabaseClient as SupabaseClient<Database>;
  }
  if (nuxtApp._supabaseClientPromise) {
    return nuxtApp._supabaseClientPromise as Promise<SupabaseClient<Database>>;
  }

  const config = useRuntimeConfig();
  const supabaseUrl = config.public.supabaseUrl;
  const supabaseKey = config.public.supabaseKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase configuration is missing. Please set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY environment variables.',
    );
  }

  const promise = (async () => {
    const { createClient } = await import('@supabase/supabase-js');

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

    const client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // We capture and apply OAuth implicit-flow tokens manually in
        // `plugins/auth.client.ts` (via setSession) because Supabase's
        // built-in URL detection runs asynchronously inside _acquireLock
        // and races against Vue Router stripping the URL hash on mount.
        // Disabling this prevents Supabase from also trying — and avoids
        // duplicate work / state-change events.
        detectSessionInUrl: false,
        flowType: 'implicit',
        ...(safeStorage && { storage: safeStorage }),
      },
    });

    nuxtApp._supabaseClient = client;
    return client;
  })();

  nuxtApp._supabaseClientPromise = promise;
  return promise;
};
