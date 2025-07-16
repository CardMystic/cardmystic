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
      })
    : undefined;

  // Modify your Vue Query global settings here
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
