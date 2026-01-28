import type { SearchHistory, SearchHistoryInsert } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

export const useSearchHistory = () => {
  const supabase = useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();

  // Fetch search history with TanStack Query
  const {
    data: searchHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery<SearchHistory[]>({
    queryKey: ['search-history', computed(() => userProfile.value?.id)],
    queryFn: async () => {
      if (!userProfile.value?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userProfile.value.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: computed(() => !!userProfile.value?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const saveSearch = async (
    query: string,
    searchType: 'ai' | 'similarity' | 'keyword' | 'commander',
    filters?: any,
  ) => {
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const newSearch: SearchHistoryInsert = {
      user_id: userProfile.value.id,
      query,
      search_type: searchType,
      filters: filters || null,
    };

    const { error } = await supabase.from('search_history').insert(newSearch);

    if (error) throw error;
  };

  const saveSearchMutation = useMutation({
    mutationFn: ({
      query,
      searchType,
      filters,
    }: {
      query: string;
      searchType: 'ai' | 'similarity' | 'keyword' | 'commander';
      filters?: any;
    }) => saveSearch(query, searchType, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
  });

  const deleteSearchHistory = async (searchId: string) => {
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('id', searchId)
      .eq('user_id', userProfile.value.id);

    if (error) throw error;
  };

  const deleteSearchHistoryMutation = useMutation({
    mutationFn: (searchId: string) => deleteSearchHistory(searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
  });

  const clearAllHistory = async () => {
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userProfile.value.id);

    if (error) throw error;
  };

  const clearAllHistoryMutation = useMutation({
    mutationFn: () => clearAllHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    },
  });

  return {
    // Query data and states
    searchHistory,
    isLoadingHistory,
    historyError,
    refetchHistory,

    // Mutations
    saveSearchMutation,
    deleteSearchHistoryMutation,
    clearAllHistoryMutation,
  };
};
