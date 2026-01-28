import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export const useSupabase = () => {
  if (!_supabase) {
    const config = useRuntimeConfig();
    const supabaseUrl =
      config.public.supabaseUrl || 'https://ddbgietanhxrozzmogur.supabase.co';
    const supabaseKey =
      config.public.supabaseKey ||
      'sb_publishable_yFYuk_hrvXA6gcW8wPATHA_ek3KU1vs';

    _supabase = createClient(supabaseUrl, supabaseKey);
  }

  return _supabase;
};
