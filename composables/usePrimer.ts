import { useQuery } from '@tanstack/vue-query';
import { useSupabase } from '~/composables/useSupabase';

/**
 * Fetches the primer text for a card list. Primers of public lists are
 * readable by anyone; private lists require the owner's token, which is
 * attached automatically when a session exists.
 */
export function usePrimer(listId: Ref<string | null | undefined>) {
  const config = useRuntimeConfig();
  const supabase = process.server ? null : useSupabase();

  const enabled = computed(() => !!listId.value);

  const { data, isPending, refetch } = useQuery({
    queryKey: computed(() => ['primer', listId.value]),
    queryFn: async () => {
      if (!listId.value) return null;
      const headers: Record<string, string> = {};
      if (import.meta.client && supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const response = await fetch(
        `${config.public.backendUrl}/supabase/card-lists/primer/${encodeURIComponent(listId.value)}`,
        { headers },
      );
      // 401 (private, not owner) / 404 (unknown list): no readable primer.
      if (!response.ok) return null;
      const body = (await response.json()) as { text: string | null };
      return body.text ?? null;
    },
    enabled,
    retry: false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  return {
    primerText: computed(() => data.value ?? null),
    isPending,
    refetch,
  };
}
