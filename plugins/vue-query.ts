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
 * 2) In-memory caching with a global staleTime of 5 minutes
 *    - Navigating between pages, re-mounting components, or deduplicating
 *      parallel fetches are all handled by the in-memory cache. No browser
 *      storage is used — a page refresh starts fresh, which is appropriate
 *      for a search engine where results are query-specific and ephemeral.
 *
 * Notes:
 * - This plugin does not automatically prefetch queries on the server.
 *   Queries must still be executed during SSR (e.g. via component setup,
 *   layouts, or explicit prefetching) to appear in the dehydrated state.
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

// Nuxt 3 app aliases
import { defineNuxtPlugin, useState } from '#imports';

export default defineNuxtPlugin((nuxt) => {
  const vueQueryState = useState<DehydratedState | null>('vue-query');

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 300000 },
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
