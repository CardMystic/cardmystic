/**
 * Nuxt 3 + TanStack Vue Query integration plugin.
 *
 * This plugin configures a shared QueryClient for the Nuxt app and handles:
 *
 * 1) Server-Side Rendering (SSR) hydration
 *    - During SSR, all resolved TanStack Query cache entries are "dehydrated"
 *      after the app finishes rendering.
 *    - The dehydrated cache is stored in Nuxt `useState` and embedded into the
 *      HTML payload.
 *    - On the client, this cache is "hydrated" back into the QueryClient,
 *      preventing duplicate refetches on initial load.
 *
 * 2) Client-side query persistence
 *    - On the client only, query results are persisted to `localStorage`
 *      using TanStack Query's experimental persister.
 *    - Cached data survives page reloads for up to 6 hours (`maxAge`).
 *    - Auth-sensitive queries (e.g. `user`, `profile`) are explicitly excluded
 *      from persistence to avoid stale or incorrect session state.
 *
 * 3) Sensible defaults
 *    - Queries use a global `staleTime` of 5 minutes to reduce unnecessary
 *      refetching.
 *    - Persistence and hydration are transparent to consumers of `useQuery`.
 *
 * Notes:
 * - This plugin does not automatically prefetch queries on the server.
 *   Queries must still be executed during SSR (e.g. via component setup,
 *   layouts, or explicit prefetching) to appear in the dehydrated state.
 * - Persistence is client-only; no browser APIs are accessed during SSR.
 */

import type {
  DehydratedState,
  VueQueryPluginOptions,
} from '@tanstack/vue-query';
import {
  VueQueryPlugin,
  QueryClient,
  hydrate,
  dehydrate,
} from '@tanstack/vue-query';
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core';

// Nuxt 3 app aliases
import { defineNuxtPlugin, useState } from '#imports';

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query');

  const persister = import.meta.client
    ? experimental_createQueryPersister({
        storage: localStorage,
        maxAge: 1000 * 60 * 60 * 6, // 6 hours
        // Don't persist auth-related queries - they need fresh data
        filters: {
          predicate: (query) => {
            const key = query.queryKey[0];
            // Exclude user auth and profile queries from persistence (stale identity can cause issues)
            return key !== 'user' && key !== 'profile';
          },
        },
      })
    : undefined;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 300000, persister: persister?.persisterFn },
    },
  });
  const options: VueQueryPluginOptions = { queryClient };

  nuxt.vueApp.use(VueQueryPlugin, options);

  if (import.meta.server) {
    nuxt.hooks.hook('app:rendered', () => {
      vueQueryState.value = dehydrate(queryClient);
    });
  }

  if (import.meta.client) {
    nuxt.hooks.hook('app:created', () => {
      hydrate(queryClient, vueQueryState.value);
    });
  }
});
