import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/database.types';

declare module '#app' {
  interface NuxtApp {
    _supabaseClient?: SupabaseClient<Database>;
    _supabaseClientPromise?: Promise<SupabaseClient<Database>>;
  }
}

export {};
