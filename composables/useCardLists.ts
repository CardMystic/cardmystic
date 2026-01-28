import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';

type CardList = Database['public']['Tables']['card_lists']['Row'];
type CardListInsert = Database['public']['Tables']['card_lists']['Insert'];
type CardListItem = Database['public']['Tables']['card_list_items']['Row'];

export const useCardLists = () => {
  const supabase = useSupabase();
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
    mutationFn: ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => createList(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const addCardsToList = async (listId: string, cardIds: string[]) => {
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
    mutationFn: ({ listId, cardIds }: { listId: string; cardIds: string[] }) =>
      addCardsToList(listId, cardIds),
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
    const { error } = await supabase
      .from('card_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('card_id', cardId);

    if (error) throw error;
  };

  const removeCardFromListMutation = useMutation({
    mutationFn: ({ listId, cardId }: { listId: string; cardId: string }) =>
      removeCardFromList(listId, cardId),
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const deleteList = async (listId: string) => {
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
    mutationFn: (listId: string) => deleteList(listId),
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
    mutationFn: ({
      listId,
      updates,
    }: {
      listId: string;
      updates: { name?: string; description?: string };
    }) => updateList(listId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const updateListAvatar = async (listId: string, cardName: string) => {
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
    mutationFn: ({ listId, cardName }: { listId: string; cardName: string }) =>
      updateListAvatar(listId, cardName),
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
  };
};
