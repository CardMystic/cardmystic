import { useQuery } from '@tanstack/vue-query';

const STALE_TIME = 1000 * 60 * 60 * 24; // 24 hours

export function useCardNames() {
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
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    persister: undefined,
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
    persister: undefined,
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
    persister: undefined,
  });
}

export function useCardIds() {
  const config = useRuntimeConfig();

  return useQuery<string[]>({
    queryKey: ['bulkdata', 'card-ids'],
    queryFn: async () => {
      const response = await fetch(
        `${config.public.backendUrl}/bulkdata/card-ids.min.json`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch card IDs');
      }
      return response.json();
    },
    staleTime: STALE_TIME,
    refetchOnWindowFocus: false,
    persister: undefined,
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
    persister: undefined,
  });
}
