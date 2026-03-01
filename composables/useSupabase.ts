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

    nuxtApp._supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return nuxtApp._supabaseClient as SupabaseClient<Database>;
};
