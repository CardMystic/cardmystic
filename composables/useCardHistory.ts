import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';

type CardHistoryInsert = Database['public']['Tables']['card_history']['Insert'];

export const useCardHistory = () => {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();

  // Fetch card history with TanStack Query
  const {
    data: cardHistory,
    isLoading: isLoadingHistory,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['card-history', computed(() => userProfile.value?.id)],
    queryFn: async () => {
      if (!supabase) return [];
      if (!userProfile.value?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('card_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: computed(() => !!userProfile.value?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const saveCardView = async (cardId: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const newEntry: CardHistoryInsert = {
      user_id: userProfile.value.id,
      card_id: cardId,
    };

    const { error } = await supabase.from('card_history').insert(newEntry);

    if (error) throw error;
  };

  const saveCardViewMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!supabase) return;
      return saveCardView(cardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-history'] });
    },
  });

  const clearAllHistory = async () => {
    if (!supabase) return [];
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('card_history')
      .delete()
      .eq('user_id', userProfile.value.id);

    if (error) throw error;
  };

  const clearAllHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!supabase) return;
      return clearAllHistory();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-history'] });
    },
  });

  return {
    // Query data and states
    cardHistory,
    isLoadingHistory,
    historyError,
    refetchHistory,

    // Mutations
    saveCardViewMutation,
    clearAllHistoryMutation,
  };
};
