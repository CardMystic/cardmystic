<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { z } from 'zod';
import {
  GetRecentArticlesResponseSchema,
  type ArticleSummary,
} from '~/models/articleModel';
import {
  DecklistSummarySchema,
  type DecklistSummary,
} from '~/models/cardListModel';

const props = defineProps<{
  sourceId: string;
  kind: 'article' | 'deck' | 'primer';
}>();
const config = useRuntimeConfig();
const { userProfile } = useUserProfile();
const supabase = import.meta.client ? useSupabase() : null;
const requestFetch = useRequestFetch();

const deckResponse = z.object({
  decklists: z.array(DecklistSummarySchema),
  primerPreviews: z.record(z.string(), z.string()),
});
const query = useQuery({
  queryKey: computed(() => [
    'related-content',
    props.kind,
    props.sourceId,
    userProfile.value?.id ?? null,
  ]),
  queryFn: async ({
    signal,
  }): Promise<{
    articles: ArticleSummary[];
    decklists: DecklistSummary[];
    primerPreviews: Record<string, string>;
  }> => {
    const headers: Record<string, string> = {};
    if (props.kind !== 'article' && supabase) {
      const { data: session } = await supabase.auth.getSession();
      if (session.session)
        headers.Authorization = `Bearer ${session.session.access_token}`;
    }
    const id = encodeURIComponent(props.sourceId);
    const path =
      props.kind === 'article'
        ? `/articles/related/${id}`
        : `/supabase/card-lists/related/${id}?type=${props.kind === 'primer' ? 'primers' : 'decks'}`;
    const body = await requestFetch(`${config.public.backendPath}${path}`, {
      headers,
      signal,
      timeout: 5000,
    });
    return props.kind === 'article'
      ? {
          ...GetRecentArticlesResponseSchema.parse(body),
          decklists: [],
          primerPreviews: {},
        }
      : { ...deckResponse.parse(body), articles: [] };
  },
  staleTime: 5 * 60 * 1000,
  retry: false,
  refetchOnWindowFocus: false,
});
const { data, isPending } = query;
const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});
// Public recommendations should be discoverable without scrolling or clicking.
// A failed recommendation request must never prevent the main page rendering.
onServerPrefetch(() => query.suspense().catch(() => {}));
</script>

<template>
  <div class="min-h-px" data-testid="related-content">
    <section
      v-if="
        (mounted && isPending) ||
        (data && (data.articles.length || data.decklists.length))
      "
      aria-label="You May Also Like"
      :aria-busy="isPending"
      class="mt-16 mb-8 md:mt-24"
    >
      <h2 class="mb-4 text-2xl font-bold">You May Also Like</h2>
      <div
        v-if="isPending"
        class="grid grid-cols-1 gap-4 md:grid-cols-3"
        role="status"
        aria-label="Loading recommendations"
      >
        <template v-if="kind === 'article'">
          <div
            v-for="n in 3"
            :key="n"
            class="overflow-hidden rounded-lg border border-default bg-elevated"
            aria-hidden="true"
          >
            <USkeleton class="h-40 w-full rounded-none" />
            <div class="p-3 md:p-4">
              <USkeleton class="mb-1 h-6 w-3/4" />
              <USkeleton class="mb-3 h-8 w-full" />
              <div class="flex items-center gap-2">
                <USkeleton class="size-6 rounded-full" />
                <USkeleton class="h-4 w-24" />
                <USkeleton class="ml-auto h-3 w-16" />
              </div>
              <USkeleton class="mt-2 h-4 w-28" />
            </div>
          </div>
        </template>
        <template v-else>
          <CardListLinkSkeleton
            v-for="n in 3"
            :key="n"
            :primer="kind === 'primer'"
          />
        </template>
      </div>
      <div v-else-if="data" class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ArticleCard
          v-for="article in data.articles"
          :key="article.id"
          :article="article"
        />
        <CardListLink
          v-for="deck in data.decklists"
          :key="deck.id"
          :list="deck"
          :primer-preview="
            kind === 'primer' ? data.primerPreviews[deck.id] : undefined
          "
          show-author
        />
      </div>
    </section>
  </div>
</template>
