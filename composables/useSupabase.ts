import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export const useSupabase = () => {
  if (!_supabase) {
    const config = useRuntimeConfig();
    _supabase = createClient(
      'https://ddbgietanhxrozzmogur.supabase.co' as string,
      'sb_publishable_yFYuk_hrvXA6gcW8wPATHA_ek3KU1vs' as string,
    );
  }

  return _supabase;
};
