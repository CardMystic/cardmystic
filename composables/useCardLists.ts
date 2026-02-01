import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';

type CardListInsert = Database['public']['Tables']['card_lists']['Insert'];

export const useCardLists = () => {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();

  // Prefetch user lists AND all card details for each list
  const prefetchUserLists = async () => {
    if (!supabase || !userProfile.value?.id) return;

    try {
      // First, fetch all user lists
      const lists = await queryClient.fetchQuery({
        queryKey: ['user-lists', userProfile.value.id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('card_lists')
            .select('*')
            .eq('user_id', userProfile.value!.id)
            .order('updated_at', { ascending: false });

          if (error) throw error;
          return data;
        },
        staleTime: 1000 * 60 * 5,
      });

      // Then, for each list, prefetch the list items AND card details
      if (lists && lists.length > 0) {
        await Promise.all(
          lists.map(async (list: any) => {
            // Fetch list items
            const listItems = await queryClient.fetchQuery({
              queryKey: ['list-items', list.id],
              queryFn: async () => {
                const { data, error } = await supabase
                  .from('card_list_items')
                  .select('*')
                  .eq('list_id', list.id)
                  .order('created_at', { ascending: false });

                if (error) throw error;
                return data || [];
              },
              staleTime: 1000 * 60 * 5,
            });

            // Fetch all card details for this list
            if (listItems && listItems.length > 0) {
              const cardIds = listItems
                .map((item: any) => item.card_id)
                .join(',');
              await queryClient.prefetchQuery({
                queryKey: ['list-cards', list.id, cardIds],
                queryFn: async () => {
                  const cardPromises = listItems.map((item: any) =>
                    $fetch(`https://api.scryfall.com/cards/${item.card_id}`),
                  );
                  const cardsData = await Promise.all(cardPromises);

                  return cardsData.map((cardData: any) => ({
                    card_name: cardData.name,
                    card_data: cardData,
                    score: undefined,
                  }));
                },
                staleTime: 1000 * 60 * 10,
              });
            }
          }),
        );
      }
    } catch (error) {
      console.error('Error prefetching user lists:', error);
    }
  };

  // Fetch user lists with TanStack Query
  const {
    data: userLists,
    isLoading: isLoadingLists,
    error: listsError,
    refetch: refetchLists,
  } = useQuery({
    queryKey: ['user-lists', computed(() => userProfile.value?.id)],
    queryFn: async () => {
      if (!supabase) return [];
      if (!userProfile.value?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('card_lists')
        .select('*')
        .eq('user_id', userProfile.value.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: computed(() => !!userProfile.value?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createList = async (name: string, description?: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    if (!name.trim()) {
      throw new Error('List name cannot be empty');
    }

    const newList: CardListInsert = {
      user_id: userProfile.value.id,
      name: name.trim(),
      description: description?.trim() || null,
    };

    const { data, error } = await supabase
      .from('card_lists')
      .insert(newList)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const createListMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => {
      if (!supabase) return;
      return createList(name, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const addCardsToList = async (listId: string, cardIds: string[]) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    if (!cardIds.length) {
      throw new Error('No cards to add');
    }

    // Create card list items
    const items = cardIds.map((cardId) => ({
      list_id: listId,
      card_id: cardId,
    }));

    const { error: insertError } = await supabase
      .from('card_list_items')
      .insert(items);

    if (insertError) throw insertError;

    // Update the list's updated_at timestamp
    const { error: updateError } = await supabase
      .from('card_lists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', listId);

    if (updateError) throw updateError;
  };

  const addCardsToListMutation = useMutation({
    mutationFn: async ({
      listId,
      cardIds,
    }: {
      listId: string;
      cardIds: string[];
    }) => {
      if (!supabase) return;
      return addCardsToList(listId, cardIds);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  // Get list items with TanStack Query (can be called from components)
  const useListItems = (listId: Ref<string> | string) => {
    const listIdRef = typeof listId === 'string' ? ref(listId) : listId;

    return useQuery({
      queryKey: ['list-items', listIdRef],
      queryFn: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('card_list_items')
          .select('*')
          .eq('list_id', listIdRef.value)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      },
      enabled: computed(() => !!listIdRef.value),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const removeCardFromList = async (listId: string, cardId: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('card_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('card_id', cardId);

    if (error) throw error;
  };

  const removeCardFromListMutation = useMutation({
    mutationFn: async ({
      listId,
      cardId,
    }: {
      listId: string;
      cardId: string;
    }) => {
      if (!supabase) return;
      return removeCardFromList(listId, cardId);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const deleteList = async (listId: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('card_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userProfile.value.id);

    if (error) throw error;
  };

  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      if (!supabase) return;
      return deleteList(listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const updateList = async (
    listId: string,
    updates: {
      name?: string;
      description?: string;
    },
  ) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('card_lists')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listId)
      .eq('user_id', userProfile.value.id);

    if (error) throw error;
  };

  const updateListMutation = useMutation({
    mutationFn: async ({
      listId,
      updates,
    }: {
      listId: string;
      updates: { name?: string; description?: string };
    }) => {
      if (!supabase) return;
      return updateList(listId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const updateListAvatar = async (listId: string, cardName: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('card_lists')
      .update({
        avatar_card_name: cardName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listId)
      .eq('user_id', userProfile.value.id);

    if (error) throw error;
  };

  const updateListAvatarMutation = useMutation({
    mutationFn: async ({
      listId,
      cardName,
    }: {
      listId: string;
      cardName: string;
    }) => {
      if (!supabase) return;
      return updateListAvatar(listId, cardName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  return {
    // Query data and states
    userLists,
    isLoadingLists,
    listsError,
    refetchLists,

    // Mutations
    createListMutation,
    addCardsToListMutation,
    removeCardFromListMutation,
    deleteListMutation,
    updateListMutation,
    updateListAvatarMutation,

    // For nested queries (list items)
    useListItems,

    // Prefetching
    prefetchUserLists,
  };
};
