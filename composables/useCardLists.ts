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
      // Invalidate list-items - the list-cards query will auto-refetch
      // because its queryKey includes cardIds which depends on list-items
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const addCardsByNameToList = async (listId: string, cardNames: string[]) => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    if (!cardNames.length) {
      throw new Error('No card names to add');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const config = useRuntimeConfig();
    const response = await $fetch<{
      addedCount: number;
      duplicatesSkipped: number;
      invalidCardNames: string[];
      message?: string;
    }>(`${config.public.backendUrl}/supabase/card-lists/add-cards`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        listId,
        cardNames,
      },
    });

    return response;
  };

  const addCardsByNameToListMutation = useMutation({
    mutationFn: async ({
      listId,
      cardNames,
    }: {
      listId: string;
      cardNames: string[];
    }) => {
      return addCardsByNameToList(listId, cardNames);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  // Get list items with TanStack Query (can be called from components)
  const useListItems = (listId: Ref<string> | string) => {
    const listIdRef = typeof listId === 'string' ? ref(listId) : listId;

    return useQuery({
      queryKey: computed(() => ['list-items', listIdRef.value]),
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

  // Get card details for list items with TanStack Query
  const useListCards = (listId: string, cardIds: Ref<string[]>) => {
    return useQuery({
      // Include cardIds in the queryKey so it refetches when the list items change
      queryKey: computed(() => ['list-cards', listId, cardIds.value]),
      queryFn: async () => {
        if (cardIds.value.length === 0) return [];

        const cardPromises = cardIds.value.map((id: string) =>
          $fetch(`https://api.scryfall.com/cards/${id}`),
        );
        const cardsData = await Promise.all(cardPromises);

        return cardsData.map((cardData: any) => ({
          card_name: cardData.name,
          card_data: cardData,
          score: undefined,
        }));
      },
      enabled: computed(() => cardIds.value.length > 0),
      staleTime: 1000 * 60 * 10, // 10 minutes
    });
  };

  const removeCardFromList = async (listId: string, cardId: string) => {
    if (!supabase) return;

    const { data, error, count } = await supabase
      .from('card_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('card_id', cardId)
      .select();
    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn(
        'No card found to delete with listId:',
        listId,
        'cardId:',
        cardId,
      );
    }
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
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
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
      .eq('id', listId);

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
      .eq('id', listId);

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
      .eq('id', listId);

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
    addCardsByNameToListMutation,
    removeCardFromListMutation,
    deleteListMutation,
    updateListMutation,
    updateListAvatarMutation,

    // For nested queries (list items)
    useListItems,
    useListCards,
  };
};
