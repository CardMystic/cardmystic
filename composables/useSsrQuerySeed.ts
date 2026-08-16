import { shallowRef, type Ref } from 'vue';
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
 *
 * Returns the parsed response ref so callers can derive additional SSR data
 * (e.g. the primary card name for the `og:image` URL).
 */
export async function useSsrQuerySeed<T>(opts: {
  cacheKey: string;
  path: string;
  schema: ZodType<T>;
  queryKey: readonly unknown[];
}): Promise<Ref<T | null>> {
  const config = useRuntimeConfig();
  const queryClient = useQueryClient();

  // useAsyncData's generic pipes through `PickFrom<T, KeysOf<T>>`, which
  // clashes with our outer `T` generic. Route the whole call through
  // `unknown` so callers get a clean `Ref<T | null>`.
  const asyncResult = (await useAsyncData(opts.cacheKey, async () => {
    try {
      const raw = await $fetch(`${config.public.backendUrl}${opts.path}`);
      return opts.schema.parse(raw);
    } catch {
      return null;
    }
  })) as unknown as { data: Ref<T | null> };

  const value = asyncResult.data.value ?? null;
  if (value) {
    queryClient.setQueryData(opts.queryKey, value);
  }

  return shallowRef(value);
}
