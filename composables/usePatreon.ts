import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useSupabase } from './useSupabase';
import { useUserProfile } from './useUserProfile';
import {
  DisconnectPatreonResponseSchema,
  GetPatreonStatusResponseSchema,
  StartPatreonConnectResponseSchema,
} from '~/models/patreonModel';

/** Returns the current Supabase access token, or throws when logged out. */
async function getAuthToken(
  supabase: ReturnType<typeof useSupabase>,
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('No authentication token available');
  return token;
}

/**
 * The authenticated user's Patreon connection/subscription status, plus
 * mutations to start the Patreon OAuth flow and disconnect the account.
 * Shown on the Account page.
 */
export function usePatreon() {
  const supabase = process.server ? null : useSupabase();
  const { userProfile } = useUserProfile();
  const queryClient = useQueryClient();
  const config = useRuntimeConfig();

  const {
    data: status,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['patreon-status', computed(() => userProfile.value?.id)],
    queryFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(`${config.public.backendUrl}/patreon/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to load Patreon status (${response.status})`);
      }
      return GetPatreonStatusResponseSchema.parse(await response.json());
    },
    enabled: computed(() => !process.server && !!userProfile.value?.id),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(
        `${config.public.backendUrl}/patreon/connect/start`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`Failed to start Patreon connect (${response.status})`);
      }
      return StartPatreonConnectResponseSchema.parse(await response.json());
    },
  });

  /** Kicks off the Patreon OAuth flow by navigating the browser to Patreon's authorize page. */
  const connect = async () => {
    const { authorizeUrl } = await connectMutation.mutateAsync();
    window.location.href = authorizeUrl;
  };

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const token = await getAuthToken(supabase!);
      const response = await fetch(`${config.public.backendUrl}/patreon/connect`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Failed to disconnect Patreon (${response.status})`);
      }
      return DisconnectPatreonResponseSchema.parse(await response.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patreon-status'] });
    },
  });

  return {
    status,
    isLoading,
    error,
    connect,
    isConnecting: computed(() => connectMutation.isPending.value),
    disconnect: () => disconnectMutation.mutateAsync(),
    isDisconnecting: computed(() => disconnectMutation.isPending.value),
  };
}
