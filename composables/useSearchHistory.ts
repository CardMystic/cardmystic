import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';

type SearchHistory = Database['public']['Tables']['search_history']['Row'];
type SearchHistoryInsert =
  Database['public']['Tables']['search_history']['Insert'];

export const useSearchHistory = () => {
  const supabase = useSupabase();
  const { userProfile } = useUserProfile();

  const saveSearch = async (
    query: string,
    searchType: 'ai' | 'similarity' | 'keyword' | 'commander',
    filters?: any,
  ) => {
    if (!userProfile.value?.id) {
      return { error: new Error('User not authenticated') };
    }

    const newSearch: SearchHistoryInsert = {
      user_id: userProfile.value.id,
      query,
      search_type: searchType,
      filters: filters || null,
    };

    const { error, data } = await supabase
      .from('search_history')
      .insert(newSearch);

    if (error) {
      console.error('Error saving search history:', error);
    }

    return { error };
  };

  const fetchSearchHistory = async () => {
    if (!userProfile.value?.id) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userProfile.value.id)
      .order('created_at', { ascending: false })
      .limit(50);

    return { data, error };
  };

  const deleteSearchHistory = async (searchId: string) => {
    if (!userProfile.value?.id) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', searchId)
      .eq('user_id', userProfile.value.id);

    return { error };
  };

  const clearAllHistory = async () => {
    if (!userProfile.value?.id) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userProfile.value.id);

    return { error };
  };

  return {
    saveSearch,
    fetchSearchHistory,
    deleteSearchHistory,
    clearAllHistory,
  };
};
