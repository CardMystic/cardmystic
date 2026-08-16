import { useQueryClient } from '@tanstack/vue-query';
import type { ZodType } from 'zod';

/**
 * SSR-blocking fetch that seeds the vue-query cache so link unfurlers
 * (Discord, Twitter, iMessage, etc.) see real page data in the initial HTML
 * instead of the fallback title/image that TanStack `useQuery` would otherwise
 * leave blank during SSR.
 *
 * The matching `useQuery(queryKey, ...)` on the client hydrates from the seeded
 * cache without triggering a second fetch. Errors (404/network) are swallowed
 * so private/missing resources fall through to the normal client-side flow.
 */
export async function useSsrQuerySeed<T>(opts: {
  cacheKey: string;
  path: string;
  schema: ZodType<T>;
  queryKey: readonly unknown[];
}): Promise<void> {
  const config = useRuntimeConfig();
  const queryClient = useQueryClient();

  const { data } = await useAsyncData(opts.cacheKey, async () => {
    try {
      const raw = await $fetch(`${config.public.backendUrl}${opts.path}`);
      return opts.schema.parse(raw);
    } catch {
      return null;
    }
  });

  if (data.value) {
    queryClient.setQueryData(opts.queryKey, data.value);
  }
}
