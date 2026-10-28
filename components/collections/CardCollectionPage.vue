<script setup lang="ts">
import { computed } from 'vue';
import { CardSearchFiltersSchema } from '~/models/frontend-specific/filtersModel';
import { WordSearchSchema } from '~/models/searchModel';
import { safeJsonLd } from '~/utils/safeJsonLd';
import {
  collectionLabels,
  collectionPath,
  collectionTitle,
  collectionDescription,
  type CardCollectionKind,
} from '~/utils/card-collections';

const props = defineProps<{ kind: CardCollectionKind; slug: string }>();
const route = useRoute();
const { data, error: catalogError } = await useCardCollections();
if (catalogError.value)
  throw createError({
    statusCode: 503,
    statusMessage: 'Card collections are temporarily unavailable.',
  });
const entry = data.value?.[props.kind].find(
  (entry) => entry.slug === props.slug,
);
if (!entry)
  throw createError({
    statusCode: 404,
    statusMessage: 'Card collection not found.',
  });
const title = collectionTitle(props.kind, entry);
const description = collectionDescription(props.kind, entry);
const query = computed(() => String(route.query.query ?? '').trim());
const parsedFilters = computed(() => {
  try {
    return CardSearchFiltersSchema.safeParse(
      route.query.filters ? JSON.parse(String(route.query.filters)) : {},
    );
  } catch {
    return CardSearchFiltersSchema.safeParse(null);
  }
});
const filters = computed(() =>
  parsedFilters.value.success
    ? parsedFilters.value.data
    : CardSearchFiltersSchema.parse({}),
);
const searchError = computed(() => !parsedFilters.value.success);
const browse = useCollectionCards(
  props.kind,
  props.slug,
  computed(() => !query.value && !searchError.value),
  filters,
);
const params = computed(() =>
  query.value && !searchError.value
    ? WordSearchSchema.parse({
        query: query.value,
        filters: filters.value,
        collection: { kind: props.kind, slug: props.slug },
        useRerank: route.query.useRerank !== 'false',
        limit: 100,
      })
    : undefined,
);
const semantic = useColbertSearch(params);
const results = computed(() =>
  query.value ? semantic.searchResults.value : browse.results.value,
);
const error = computed(() =>
  query.value ? semantic.error.value : browse.error.value,
);
const loading = computed(() =>
  query.value ? semantic.isLoading.value : browse.isLoading.value,
);
const fetching = computed(() =>
  query.value ? semantic.isFetching.value : browse.isFetching.value,
);
const path = collectionPath(props.kind, props.slug);
useCollectionSeo(
  title,
  description,
  path,
  computed(
    () =>
      Object.keys(route.query).length > 0 ||
      !!error.value ||
      !!searchError.value,
  ),
  entry.imageUrl,
);
useHead({
  script: [
    {
      type: 'application/ld+json',
      key: 'collection-page',
      innerHTML: safeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: new URL(path, 'https://cardmystic.com').href,
        image: entry.imageUrl || undefined,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://cardmystic.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: `All ${collectionLabels[props.kind]}`,
              item: new URL(
                collectionPath(props.kind),
                'https://cardmystic.com',
              ).href,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: entry.name,
              item: new URL(path, 'https://cardmystic.com').href,
            },
          ],
        },
      }),
    },
  ],
});
function retry() {
  return query.value ? semantic.refetch() : browse.refetch();
}
</script>

<template>
  <UContainer class="mb-6 px-0 max-w-full text-default">
    <div class="w-full flex flex-col items-center">
      <section
        aria-labelledby="collection-title"
        class="relative isolate w-full overflow-hidden rounded-lg bg-gray-900 flex items-center justify-center px-6 py-6 text-center text-white"
      >
        <img
          v-if="entry.imageUrl"
          :src="entry.imageUrl"
          alt=""
          class="absolute inset-0 -z-20 h-full w-full object-cover object-[center_10%]"
          fetchpriority="high"
          decoding="async"
        />
        <div class="absolute inset-0 -z-10 bg-black/65" />
        <div class="max-w-2xl">
          <h1 id="collection-title" class="text-3xl md:text-4xl font-bold mb-3">
            <SetSymbol
              v-if="kind === 'sets'"
              :code="slug"
              :size="32"
              class="mr-2"
            />
            {{ title }}
          </h1>
          <p class="text-base text-white">{{ description }}</p>
          <UButton
            :to="collectionPath(kind)"
            :label="`Go To All ${collectionLabels[kind]}`"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="outline"
            class="min-h-11 mt-4"
          />
        </div>
      </section>

      <CollectionSearch
        :target-path="path"
        :label-text="`Search cards in ${title}`"
        class="mt-4 w-full max-w-5xl"
      />
      <NuxtLink
        v-if="query || searchError"
        :to="path"
        class="min-h-11 inline-flex items-center underline underline-offset-4 focus-visible:outline-primary"
      >
        {{ kind === 'sets' ? 'Show all cards in this set' : 'Show top cards' }}
      </NuxtLink>
      <p v-if="searchError" role="alert">
        The search filters are invalid. Clear the search to browse this
        collection.
      </p>
      <p
        v-if="!query && browse.total.value !== undefined"
        class="text-sm text-muted my-3"
      >
        {{ browse.results.value?.length ?? 0 }} of
        {{ browse.total.value }} cards loaded
      </p>
      <SearchResults
        v-if="!searchError"
        :search-results="results"
        :is-loading="loading"
        :is-fetching="fetching"
        :error="error"
        :query-param="query || entry.name"
        :reranking-enabled="!!query && route.query.useRerank !== 'false'"
        preserve-result-order
        :hide-progress-bar="!query"
        :hide-thumbs-down-button="true"
        empty-title="No matching cards"
        empty-description="Try another description or clear the search to browse this collection."
        @retry="retry()"
      />
      <div
        v-if="!query && browse.canLoadMore.value"
        class="flex flex-col items-center gap-3 py-4"
      >
        <p v-if="browse.loadMoreError.value" role="alert" class="text-sm">
          More cards could not be loaded. Try again.
        </p>
        <UButton
          color="neutral"
          variant="outline"
          class="min-h-11"
          :loading="browse.isLoadingMore.value"
          :label="
            browse.loadMoreError.value
              ? 'Retry loading more cards'
              : 'Load more cards'
          "
          @click="browse.loadMore()"
        />
      </div>
    </div>
  </UContainer>
  <BackToTop />
</template>
