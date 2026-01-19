import type { Database } from '~/database.types';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';

type CardList = Database['public']['Tables']['card_lists']['Row'];
type CardListInsert = Database['public']['Tables']['card_lists']['Insert'];
type CardListItem = Database['public']['Tables']['card_list_items']['Row'];

export const useCardLists = () => {
  const supabase = useSupabase();
  const { userProfile } = useUserProfile();

  const fetchUserLists = async () => {
    if (!userProfile.value?.id) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('card_lists')
      .select('*')
      .eq('user_id', userProfile.value.id)
      .order('updated_at', { ascending: false });

    return { data, error };
  };

  const createList = async (name: string, description?: string) => {
    if (!userProfile.value?.id) {
      return { data: null, error: new Error('User not authenticated') };
    }

    if (!name.trim()) {
      return { data: null, error: new Error('List name cannot be empty') };
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

    return { data, error };
  };

  const addCardsToList = async (listId: string, cardIds: string[]) => {
    if (!userProfile.value?.id) {
      return { error: new Error('User not authenticated') };
    }

    if (!cardIds.length) {
      return { error: new Error('No cards to add') };
    }

    // Create card list items
    const items = cardIds.map((cardId) => ({
      list_id: listId,
      card_id: cardId,
    }));

    const { error: insertError } = await supabase
      .from('card_list_items')
      .insert(items);

    // Update the list's updated_at timestamp
    if (!insertError) {
      const { error: updateError } = await supabase
        .from('card_lists')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', listId);

      return { error: updateError };
    }

    return { error: insertError };
  };

  const getListItems = async (listId: string) => {
    const { data, error } = await supabase
      .from('card_list_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    return { data, error };
  };

  const removeCardFromList = async (listId: string, cardId: string) => {
    const { error } = await supabase
      .from('card_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('card_id', cardId);

    return { error };
  };

  const deleteList = async (listId: string) => {
    if (!userProfile.value?.id) {
      return { error: new Error('User not authenticated') };
    }

    const { error } = await supabase
      .from('card_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userProfile.value.id);

    return { error };
  };

  const updateList = async (
    listId: string,
    updates: {
      name?: string;
      description?: string;
      visibility?: 'private' | 'unlisted' | 'public';
    },
  ) => {
    if (!userProfile.value?.id) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await supabase
      .from('card_lists')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listId)
      .eq('user_id', userProfile.value.id)
      .select()
      .single();

    return { data, error };
  };

  return {
    fetchUserLists,
    createList,
    addCardsToList,
    getListItems,
    removeCardFromList,
    deleteList,
    updateList,
  };
};
