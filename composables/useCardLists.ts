import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/vue-query';
import { computed, ref, type Ref } from 'vue';
import type { CardFormatType } from '~/models/cardModel';
import {
  GetActiveUserDecklistsResponseSchema,
  GetOwnedDecklistResponseSchema,
  MAX_DECKLIST_CARDS,
  SearchMyDecklistsResponseSchema,
  type BulkEditRequest,
  type BulkEditResponse,
} from '~/models/cardListModel';

/**
 * The authenticated user's own decklists, 1-indexed offset paginated.
 * Powers the My Decklists page.
 */
export function useMyDecklists(page: Ref<number>, pageSize = 50) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const config = useRuntimeConfig();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(
      () =>
        ['user-lists', userProfile.value?.id, page.value, pageSize] as const,
    ),
    queryFn: async () => {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No authentication token available');
      const params = new URLSearchParams({
        page: String(page.value),
        pageSize: String(pageSize),
      });
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load active user decklists (${response.status})`,
        );
      }
      return GetActiveUserDecklistsResponseSchema.parse(await response.json());
    },
    enabled: computed(() => !process.server && !!userProfile.value?.id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    decklists: computed(() => data.value?.decklists ?? []),
    totalCount: computed(() => data.value?.totalCount ?? 0),
    totalPages: computed(() => data.value?.totalPages ?? 1),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Fuzzy-search the authenticated user's own decklists. Powers the deck
 * picker in Add-to-Deck / Bulk-Add modals. Caller should debounce the query
 * ref (300ms). Returns the top 25 by relevance / recency.
 */
export function useMyDecklistsSearch(query: Ref<string>, limit = 25) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const config = useRuntimeConfig();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: computed(
      () =>
        [
          'user-lists',
          'search',
          userProfile.value?.id,
          query.value,
          limit,
        ] as const,
    ),
    queryFn: async () => {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No authentication token available');
      const params = new URLSearchParams({
        query: query.value.trim(),
        limit: String(limit),
      });
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/mine/search?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to search user decklists (${response.status})`);
      }
      return SearchMyDecklistsResponseSchema.parse(await response.json());
    },
    enabled: computed(() => !process.server && !!userProfile.value?.id),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  return {
    decklists: computed(() => data.value?.decklists ?? []),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * Single owned decklist by id, for the owner-only deck detail and primer
 * pages. Returns `null` when the id doesn't correspond to a deck the user
 * owns (404).
 */
export function useOwnedDecklist(listId: Ref<string | null | undefined>) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const config = useRuntimeConfig();

  const { data, isLoading, error, refetch } = useQuery({
queryKey: computed(
      () =>
        [
          'user-lists',
          'owned',
          userProfile.value?.id,
          listId.value,
        ] as const,
    ),
    queryFn: async () => {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('No authentication token available');
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/mine/${encodeURIComponent(listId.value!)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.status === 404) return null;
      if (!response.ok) {
        throw new Error(`Failed to load decklist (${response.status})`);
      }
      return GetOwnedDecklistResponseSchema.parse(await response.json());
    },
    enabled: computed(
      () => !process.server && !!userProfile.value?.id && !!listId.value,
    ),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    decklist: computed(() => data.value?.decklist ?? null),
    isLoading,
    error,
    refetch,
  };
}

// Backend returns 400 on write endpoints when the resulting row count would
// exceed the per-decklist cap. Only 400 the add-cards endpoints ever emit.
function throwIfDeckCapExceeded(err: unknown): void {
  if ((err as { status?: number })?.status === 400) {
    throw new Error(`Cannot exceed ${MAX_DECKLIST_CARDS} cards per deck list`);
  }
}

export const useCardLists = () => {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const createList = async (
    name: string,
    description?: string,
    commanders?: string[],
    format?: CardFormatType,
    visibility?: 'private' | 'public',
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
          format: format || 'Commander',
          commanders: commanders?.filter((c) => c.trim()) || [],
          visibility: visibility || 'private',
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
      format,
      visibility,
    }: {
      name: string;
      description?: string;
      commanders?: string[];
      format?: CardFormatType;
      visibility?: 'private' | 'public';
    }) => {
      if (!supabase) return;
      return createList(name, description, commanders, format, visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const addCardsToList = async (
    listId: string,
    oracleIds: string[],
    board?: 'Mainboard' | 'Sideboard' | 'Considering',
  ) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    if (!oracleIds.length) {
      throw new Error('No cards to add');
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      throw new Error('No authentication token available');
    }

    const config = useRuntimeConfig();
    try {
      const response = await $fetch<{
        addedCount: number;
        updatedCount: number;
        invalidOracleIds: string[];
      }>(
        `${config.public.backendUrl}/supabase/card-lists/add-cards-by-oracle-id`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            listId,
            oracleIds,
            ...(board ? { board } : {}),
          },
        },
      );
      return response;
    } catch (err) {
      throwIfDeckCapExceeded(err);
      throw err;
    }
  };

  const addCardsToListMutation = useMutation({
    mutationFn: async ({
      listId,
      oracleIds,
      board,
    }: {
      listId: string;
      oracleIds: string[];
      board?: 'Mainboard' | 'Sideboard' | 'Considering';
    }) => {
      if (!supabase) return;
      return addCardsToList(listId, oracleIds, board);
    },
    onSuccess: (_, { listId }) => {
      // Invalidate list-items — the list-cards query will auto-refetch
      // because its queryKey includes oracleIds derived from list-items
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
    try {
      const response = await $fetch<{
        addedCount: number;
        updatedCount: number;
        invalidCardNames: string[];
        message?: string;
      }>(`${config.public.backendUrl}/supabase/card-lists/add-cards-by-name`, {
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
    } catch (err) {
      throwIfDeckCapExceeded(err);
      throw err;
    }
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

  const bulkEditList = async (
    request: BulkEditRequest,
  ): Promise<BulkEditResponse> => {
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
    try {
      const response = await $fetch<BulkEditResponse>(
        `${config.public.backendUrl}/supabase/card-lists/bulk-edit`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: request,
        },
      );
      return response;
    } catch (err) {
      throwIfDeckCapExceeded(err);
      throw err;
    }
  };

  const bulkEditListMutation = useMutation({
    mutationFn: async (request: BulkEditRequest) => {
      return bulkEditList(request);
    },
    onSuccess: (_, request) => {
      queryClient.invalidateQueries({
        queryKey: ['list-items', request.listId],
      });
      queryClient.invalidateQueries({
        queryKey: ['list-cards', request.listId],
      });
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
  const useListCards = (listId: string, oracleIds: Ref<string[]>) => {
    const config = useRuntimeConfig();
    return useQuery({
      // Include oracleIds in the queryKey so it refetches when the list items change
      queryKey: computed(() => ['list-cards', listId, oracleIds.value]),
      queryFn: async () => {
        if (oracleIds.value.length === 0) return [];

        const cardsData: any[] = await $fetch(
          `${config.public.backendUrl}/cards/cards-by-oracle-ids`,
          {
            method: 'POST',
            body: { oracleIds: oracleIds.value },
          },
        );

        return (cardsData || []).map((cardData: any) => ({
          card_name: cardData.name,
          card_data: cardData,
        }));
      },
      enabled: computed(() => oracleIds.value.length > 0),
      staleTime: 1000 * 60 * 10, // 10 minutes
      placeholderData: keepPreviousData,
    });
  };

  const removeCardFromList = async (
    listId: string,
    oracleId: string,
    board?: 'Mainboard' | 'Sideboard' | 'Considering',
  ) => {
    if (!supabase) return;

    let query = supabase
      .from('card_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('oracle_id', oracleId);
    if (board) query = query.eq('board', board);

    const { data, error } = await query.select();
    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn(
        'No card found to delete with listId:',
        listId,
        'oracleId:',
        oracleId,
        'board:',
        board,
      );
    }
  };

  const removeCardFromListMutation = useMutation({
    mutationFn: async ({
      listId,
      oracleId,
      board,
    }: {
      listId: string;
      oracleId: string;
      board?: 'Mainboard' | 'Sideboard' | 'Considering';
    }) => {
      if (!supabase) return;
      return removeCardFromList(listId, oracleId, board);
    },
    onMutate: async ({ listId, oracleId, board }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['list-items', listId] });
      await queryClient.cancelQueries({ queryKey: ['list-cards', listId] });

      // Optimistically remove the card from list-items cache.
      // When board is provided, only drop the row matching that board so
      // the same card in other boards remains.
      queryClient.setQueriesData<any[]>(
        { queryKey: ['list-items', listId] },
        (old) =>
          old?.filter((item: any) => {
            if (item.oracle_id !== oracleId) return true;
            if (board && item.board !== board) return true;
            return false;
          }),
      );

      // Optimistically remove the card from list-cards cache only if no
      // remaining list-items row references this oracle_id.
      queryClient.setQueriesData<any[]>(
        { queryKey: ['list-cards', listId] },
        (old) => {
          if (!old) return old;
          const items =
            queryClient.getQueryData<any[]>(['list-items', listId]) ?? [];
          const stillReferenced = items.some(
            (item: any) => item.oracle_id === oracleId,
          );
          if (stillReferenced) return old;
          return old.filter(
            (card: any) => card.card_data.oracle_id !== oracleId,
          );
        },
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

  const clearCommander = async (listId: string, oracleId?: string) => {
    if (!supabase) return;
    if (!userProfile.value?.id) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('card_list_items')
      .update({ is_commander: false })
      .eq('list_id', listId);

    if (oracleId) {
      query = query.eq('oracle_id', oracleId);
    }

    const { error } = await query;
    if (error) throw error;
  };

  const clearCommanderMutation = useMutation({
    mutationFn: async ({
      listId,
      oracleId,
    }: {
      listId: string;
      oracleId?: string;
    }) => {
      if (!supabase) return;
      return clearCommander(listId, oracleId);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const updateFormat = async (listId: string, format: CardFormatType) => {
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
    const response = await $fetch<{
      format: string;
      commandersCleared: boolean;
    }>(`${config.public.backendUrl}/supabase/card-lists/update-format`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        listId,
        format,
      },
    });

    return response;
  };

  const updateFormatMutation = useMutation({
    mutationFn: async ({
      listId,
      format,
    }: {
      listId: string;
      format: CardFormatType;
    }) => {
      if (!supabase) return;
      return updateFormat(listId, format);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['list-cards', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const updateVisibility = async (
    listId: string,
    visibility: 'private' | 'public',
  ) => {
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
    const response = await $fetch<{ visibility: string }>(
      `${config.public.backendUrl}/supabase/card-lists/update-visibility`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
          listId,
          visibility,
        },
      },
    );

    return response;
  };

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({
      listId,
      visibility,
    }: {
      listId: string;
      visibility: 'private' | 'public';
    }) => {
      if (!supabase) return;
      return updateVisibility(listId, visibility);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
      queryClient.invalidateQueries({
        queryKey: ['discovery', 'public-decklist', listId],
      });
    },
  });

  const updateNumCopies = async (
    listId: string,
    cardName: string,
    numCopies: number,
    fromBoard?: 'Mainboard' | 'Sideboard' | 'Considering',
  ) => {
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
    const response = await $fetch<{
      cardName: string;
      numCopies: number;
    }>(`${config.public.backendUrl}/supabase/card-lists/update-num-copies`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        listId,
        cardName,
        numCopies,
        ...(fromBoard ? { fromBoard } : {}),
      },
    });

    return response;
  };

  const updateNumCopiesMutation = useMutation({
    mutationFn: async ({
      listId,
      cardName,
      numCopies,
      fromBoard,
    }: {
      listId: string;
      cardName: string;
      numCopies: number;
      fromBoard?: 'Mainboard' | 'Sideboard' | 'Considering';
    }) => {
      if (!supabase) return;
      return updateNumCopies(listId, cardName, numCopies, fromBoard);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  const changeBoard = async (
    listId: string,
    cardName: string,
    board: 'Mainboard' | 'Sideboard' | 'Considering',
    fromBoard?: 'Mainboard' | 'Sideboard' | 'Considering',
  ) => {
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
    const response = await $fetch<{
      cardName: string;
      board: string;
      message?: string;
    }>(`${config.public.backendUrl}/supabase/card-lists/change-board`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        listId,
        cardName,
        board,
        ...(fromBoard ? { fromBoard } : {}),
      },
    });

    return response;
  };

  const changeBoardMutation = useMutation({
    mutationFn: async ({
      listId,
      cardName,
      board,
      fromBoard,
    }: {
      listId: string;
      cardName: string;
      board: 'Mainboard' | 'Sideboard' | 'Considering';
      fromBoard?: 'Mainboard' | 'Sideboard' | 'Considering';
    }) => {
      if (!supabase) return;
      return changeBoard(listId, cardName, board, fromBoard);
    },
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['list-items', listId] });
      queryClient.invalidateQueries({ queryKey: ['user-lists'] });
    },
  });

  return {
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
    updateFormatMutation,
    updateVisibilityMutation,
    updateNumCopiesMutation,
    changeBoardMutation,

    // For nested queries (list items)
    useListItems,
    useListCards,
  };
};
