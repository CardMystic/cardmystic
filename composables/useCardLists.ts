import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';
import type { Card, ScryfallCard } from '~/models/cardModel';
import type { Database } from '~/database.types';

type CardListItem = Database['public']['Tables']['card_list_items']['Row'];

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

  const createList = async (
    name: string,
    description?: string,
    commanders?: string[],
  ) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    if (!name.trim()) {
      throw new Error('List name cannot be empty');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const config = useRuntimeConfig();
    const response = await $fetch<{ id: string; name: string }>(
      `${config.public.backendUrl}/supabase/card-lists/create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          name: name.trim(),
          description: description?.trim() || undefined,
          commanders: commanders?.filter((c) => c.trim()) || [],
        },
      },
    );

    return response;
  };

  const createListMutation = useMutation({
    mutationFn: async ({
      name,
      description,
      commanders,
    }: {
      name: string;
      description?: string;
      commanders?: string[];
    }) => {
      if (!supabase) return;
      return createList(name, description, commanders);
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

  const bulkEditList = async (listId: string, cardNames: string[]) => {
    if (!supabase) {
      throw new Error('Supabase client not available');
    }

    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const config = useRuntimeConfig();
    const response = await $fetch<{
      addedCount: number;
      removedCount: number;
      invalidCardNames: string[];
      message?: string;
    }>(`${config.public.backendUrl}/supabase/card-lists/bulk-edit`, {
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

  const bulkEditListMutation = useMutation({
    mutationFn: async ({
      listId,
      cardNames,
    }: {
      listId: string;
      cardNames: string[];
    }) => {
      return bulkEditList(listId, cardNames);
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
      enabled: computed(() => !!supabase && !!listIdRef.value),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Get card details for list items with TanStack Query
  const useListCards = (listId: string, cardIds: Ref<string[]>) => {
    const config = useRuntimeConfig();
    return useQuery({
      // Include cardIds in the queryKey so it refetches when the list items change
      queryKey: computed(() => ['list-cards', listId, cardIds.value]),
      queryFn: async () => {
        if (cardIds.value.length === 0) return [];

        const cardsData = await $fetch<ScryfallCard[]>(
          `${config.public.backendUrl}/cards/cards-by-ids`,
          {
            method: 'POST',
            body: { cardIds: cardIds.value },
          },
        );

        return (cardsData || []).map((cardData) => ({
          card_name: cardData.name,
          card_data: cardData,
        }));
      },
      enabled: computed(() => cardIds.value.length > 0),
      staleTime: 1000 * 60 * 10, // 10 minutes
      placeholderData: keepPreviousData,
    });
  };

  const removeCardFromList = async (listId: string, cardId: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
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
    onMutate: async ({ listId, cardId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['list-items', listId] });
      await queryClient.cancelQueries({ queryKey: ['list-cards', listId] });

      // Optimistically remove the card from list-items cache
      queryClient.setQueriesData<CardListItem[]>(
        { queryKey: ['list-items', listId] },
        (old) => old?.filter((item) => item.card_id !== cardId),
      );

      // Optimistically remove the card from list-cards cache
      queryClient.setQueriesData<Pick<Card, 'card_name' | 'card_data'>[]>(
        { queryKey: ['list-cards', listId] },
        (old) => old?.filter((card) => card.card_data.id !== cardId),
      );
    },
    onSuccess: (_, { listId }) => {
      // Only invalidate list-items — list-cards will re-key automatically
      // since its queryKey depends on cardIds derived from list-items
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
    onError: (_, { listId }) => {
      // Refetch on error to restore correct state
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
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

  const setCommander = async (listId: string, commanderName: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.public.backendUrl}/supabase/card-lists/set-commander`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          listId,
          commanderName,
        },
      },
    );

    return response;
  };

  const setCommanderMutation = useMutation({
    mutationFn: async ({
      listId,
      commanderName,
    }: {
      listId: string;
      commanderName: string;
    }) => {
      if (!supabase) return;
      return setCommander(listId, commanderName);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const clearCommander = async (listId: string, cardId?: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('card_list_items')
      .update({ is_commander: false })
      .eq('list_id', listId);

    if (cardId) {
      query = query.eq('card_id', cardId);
    }

    const { error } = await query;
    if (error) throw error;
  };

  const clearCommanderMutation = useMutation({
    mutationFn: async ({
      listId,
      cardId,
    }: {
      listId: string;
      cardId?: string;
    }) => {
      if (!supabase) return;
      return clearCommander(listId, cardId);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
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
    bulkEditListMutation,
    removeCardFromListMutation,
    deleteListMutation,
    updateListMutation,
    updateListAvatarMutation,
    setCommanderMutation,
    clearCommanderMutation,

    // For nested queries (list items)
    useListItems,
    useListCards,
  };
};
