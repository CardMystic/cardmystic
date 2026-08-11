import { useQuery } from '@tanstack/vue-query';
import { toValue, type MaybeRefOrGetter } from 'vue';

const STALE_TIME = 1000 * 60 * 60 * 24; // 24 hours

export function useCardNames(enabled?: MaybeRefOrGetter<boolean>) {
  const config = useRuntimeConfig();

  return useQuery<string[]>({
    queryKey: ['bulkdata', 'card-names'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/card-names.min.json`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch card names');
      }
      return response.json();
    },
    enabled: enabled === undefined ? true : () => toValue(enabled),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCommanders() {
  const config = useRuntimeConfig();

  return useQuery<string[]>({
    queryKey: ['bulkdata', 'commanders'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/commanders.min.json`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch commanders');
      }
      return response.json();
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

/** Same cached query as useCommanders(), but returns a Set for O(1) lookups. */
export function useCommandersSet() {
  const config = useRuntimeConfig();

  return useQuery<string[], Error, Set<string>>({
    queryKey: ['bulkdata', 'commanders'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/commanders.min.json`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch commanders');
      }
      return response.json();
    },
    select: (data) => new Set(data),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function useCardOracleIds() {
  const config = useRuntimeConfig();

  return useQuery<string[]>({
    queryKey: ['bulkdata', 'card-oracle-ids'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/card-oracle-ids.min.json`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch card oracle IDs');
      }
      return response.json();
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

/**
 * Map of lowercased full card name -> oracle_id. Used to resolve autocomplete
 * selections to oracle_ids client-side so we don't need to hit
 * `/cards/name/:name` (which breaks for DFC names containing `//` behind
 * proxies that decode `%2F` in URL paths).
 */
export function useCardNameToOracleId(enabled?: MaybeRefOrGetter<boolean>) {
  const config = useRuntimeConfig();

  return useQuery<Record<string, string>>({
    queryKey: ['bulkdata', 'card-name-to-oracle-id'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/card-name-to-oracle-id.min.json`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch card name to oracle ID map');
      }
      return response.json();
    },
    enabled: enabled === undefined ? true : () => toValue(enabled),
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export interface PartnerCommanders {
  partner: string[];
  chooseABackground: string[];
  background: string[];
  doctorsCompanion: string[];
  timeLordDoctor: string[];
}

export function usePartnerCommanders() {
  const config = useRuntimeConfig();

  return useQuery<PartnerCommanders>({
    queryKey: ['bulkdata', 'partner-commanders'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/partner-commanders`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch partner commanders');
      }
      return response.json();
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
  });
}
