import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import {
  DeckPreferencesSchema,
  defaultDeckPreferences,
  type DeckPreferences,
} from '~/models/preferencesModel';

export function useDeckPreferences({
  persist = false,
}: { persist?: boolean } = {}) {
  const supabase = process.server ? null : useSupabase();
  const { userProfile, loading: userLoading } = useUserProfile();
  const userId = computed(() => userProfile.value?.id);
  const client = useQueryClient();
  const toast = useToast();
  // Deck controls override account defaults only for this mounted page.
  // Account settings explicitly opt into saving defaults.
  const overrides = ref<Partial<DeckPreferences>>({});
  watch(userId, () => {
    overrides.value = {};
  });
  const key = (id: string | undefined) => ['preferences', id] as const;
  const query = useQuery({
    queryKey: computed(() => key(userId.value)),
    enabled: computed(() => !!supabase && !!userId.value),
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const id = userId.value;
      if (!supabase || !id) return { ...defaultDeckPreferences };
      const { data, error } = await supabase
        .from('preferences')
        .select('deck_view, deck_group_by, deck_sort_by, deck_sort_direction')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return DeckPreferencesSchema.parse(data ?? defaultDeckPreferences);
    },
  });
  const mutation = useMutation({
    mutationKey: ['save-deck-preferences'],
    // Serialize rapid edits across every mounted instance of this composable.
    scope: { id: 'save-deck-preferences' },
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<DeckPreferences>;
    }) => {
      if (!supabase) throw new Error('Please sign in to save preferences.');
      const { error } = await supabase
        .from('preferences')
        .upsert({ user_id: id, ...patch }, { onConflict: 'user_id' });
      if (error) throw error;
    },
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: key(id) });
      const previous = client.getQueryData<DeckPreferences>(key(id));
      const optimistic = { ...(previous ?? defaultDeckPreferences), ...patch };
      const cached = client.setQueryData(key(id), optimistic);
      return { previous, optimistic: cached };
    },
    onError: (_error, { id }, context) => {
      // An older failed write must not roll back newer local choices.
      if (context && client.getQueryData(key(id)) === context.optimistic) {
        client.setQueryData(
          key(id),
          context.previous ?? { ...defaultDeckPreferences },
        );
      }
      if (userId.value === id)
        toast.add({
          title: 'Could not save display preferences',
          description: 'Please try again.',
          color: 'error',
        });
    },
    onSettled: (_data, _error, { id }) => {
      if (client.isMutating({ mutationKey: ['save-deck-preferences'] }) === 1) {
        void client.invalidateQueries({ queryKey: key(id) });
      }
    },
  });
  function updatePreferences(patch: Partial<DeckPreferences>) {
    const parsed = DeckPreferencesSchema.partial().parse(patch);
    if (!persist) {
      overrides.value = { ...overrides.value, ...parsed };
      return;
    }
    if (userId.value) mutation.mutate({ id: userId.value, patch: parsed });
  }
  return {
    preferences: computed(() => ({
      ...(userId.value
        ? (query.data.value ?? defaultDeckPreferences)
        : defaultDeckPreferences),
      ...overrides.value,
    })),
    isLoading: computed(
      () => userLoading.value || (!!userId.value && query.isPending.value),
    ),
    error: query.error,
    isSaving: mutation.isPending,
    retry: query.refetch,
    updatePreferences,
  };
}
