import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

export const useSupabase = () => {
  const nuxtApp = useNuxtApp();
  const PROTECTED_PREFIXES = ['sb-', '__cm_', 'cm.clipboard.v1']; // don't purge Supabase auth or our own namespaced state

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

    /** Last resort: purges everything non-auth */
    const purgeAllNonAuth = () => {
      Object.keys(localStorage)
        .filter((k) => !PROTECTED_PREFIXES.some((p) => k.startsWith(p)))
        .forEach((k) => localStorage.removeItem(k));
    };

    const safeStorage = import.meta.client
      ? {
          getItem: (key: string) => localStorage.getItem(key),
          setItem: (key: string, value: string) => {
            try {
              localStorage.setItem(key, value);
              return;
            } catch {
              // Quota exceeded
            }
            try {
              purgeAllNonAuth();
              localStorage.setItem(key, value);
            } catch {
              // Still full after purging everything non-auth
              console.error(
                'LocalStorage is full (after purging nonessential items) or unusable. Auth persistence may not work properly. Consider clearing localStorage or using a different browser.',
              );
            }
          },
          removeItem: (key: string) => localStorage.removeItem(key),
        }
      : undefined;

    nuxtApp._supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
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
  }

  return nuxtApp._supabaseClient as SupabaseClient<Database>;
};
