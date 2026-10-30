<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { safeJsonLd } from '~/utils/safeJsonLd';
import {
  collectionLabels,
  collectionDescriptions,
  collectionPath,
  type CardCollectionKind,
} from '~/utils/card-collections';

const props = defineProps<{ kind: CardCollectionKind }>();
const route = useRoute();
const router = useRouter();
const origin = 'https://cardmystic.com';
const { data, status, error, refresh } = await useCardCollections();
if (import.meta.server && error.value) {
  const event = useRequestEvent();
  if (event) setResponseStatus(event, 503);
}
const filter = shallowRef('');
const pageSize = 40;
const entries = computed(() =>
  (data.value?.[props.kind] ?? []).filter((entry) =>
    `${entry.name} ${entry.slug}`
      .toLowerCase()
      .includes(filter.value.trim().toLowerCase()),
  ),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(entries.value.length / pageSize)),
);
const page = computed(() => {
  const requested = Number(route.query.page);
  return Number.isSafeInteger(requested) && requested > 0
    ? Math.min(requested, pageCount.value)
    : 1;
});
const pageEntries = computed(() =>
  entries.value.slice((page.value - 1) * pageSize, page.value * pageSize),
);
function pageTo(value: number) {
  return {
    path: route.path,
    query: { ...route.query, page: value === 1 ? undefined : String(value) },
  };
}
watch(filter, () => {
  if (route.query.page) void router.replace(pageTo(1));
});
useCollectionSeo(
  `MTG ${collectionLabels[props.kind]}`,
  collectionDescriptions[props.kind],
  collectionPath(props.kind),
  computed(() => !!error.value || Object.keys(route.query).length > 0),
);
useHead({
  script: [
    {
      type: 'application/ld+json',
      key: 'collection-page',
      innerHTML: () =>
        safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: `MTG ${collectionLabels[props.kind]}`,
          description: collectionDescriptions[props.kind],
          url: new URL(collectionPath(props.kind), origin).href,
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
              {
                '@type': 'ListItem',
                position: 2,
                name: collectionLabels[props.kind],
                item: new URL(collectionPath(props.kind), origin).href,
              },
            ],
          },
        }),
    },
  ],
});
</script>

<template>
  <UContainer class="mb-10 px-0 max-w-full text-default">
    <div class="flex flex-col items-center">
      <SearchSEOTitleAndDescription
        :fallback-title="`MTG ${collectionLabels[kind]}`"
        :fallback-description="collectionDescriptions[kind]"
      />
      <nav
        aria-label="Browse cards"
        class="flex flex-wrap justify-center gap-3 mb-6"
      >
        <UButton
          v-for="(label, category) in collectionLabels"
          :key="category"
          :to="collectionPath(category)"
          :label="`Go To ${label}`"
          color="neutral"
          :variant="category === kind ? 'soft' : 'outline'"
          class="min-h-11"
          :aria-current="category === kind ? 'page' : undefined"
        />
      </nav>
      <UFormField
        :label="`Filter ${collectionLabels[kind].toLowerCase()}`"
        class="w-full max-w-xl mb-6"
      >
        <UInput
          v-model="filter"
          type="search"
          :aria-label="`Filter ${collectionLabels[kind].toLowerCase()}`"
          :placeholder="kind === 'sets' ? 'Set name or code' : 'Name'"
          class="w-full"
          :ui="{ base: 'min-h-11' }"
        />
      </UFormField>
    </div>
    <div v-if="error" role="alert" class="text-center space-y-3 py-8">
      <p>{{ collectionLabels[kind] }} could not be loaded.</p>
      <UButton
        color="neutral"
        label="Retry"
        class="min-h-11"
        @click="refresh()"
      />
    </div>
    <div
      v-else-if="status === 'pending'"
      role="status"
      :aria-label="`Loading ${collectionLabels[kind].toLowerCase()}`"
      aria-busy="true"
    >
      <USkeleton class="mx-auto mb-4 h-20 w-64" aria-hidden="true" />
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        aria-hidden="true"
      >
        <div
          v-for="i in 8"
          :key="i"
          class="overflow-hidden rounded-lg border border-default"
        >
          <USkeleton class="aspect-[16/10] w-full rounded-none" />
          <div class="space-y-3 p-4">
            <USkeleton class="h-6 w-2/3" />
            <USkeleton class="h-5 w-1/3" />
          </div>
        </div>
      </div>
    </div>
    <template v-else-if="entries.length">
      <CardCollectionPagination
        :kind="kind"
        :page="page"
        :page-count="pageCount"
        :total="entries.length"
        :page-size="pageSize"
        :to="pageTo"
        position="top"
        class="mb-4"
      />
      <ul
        data-testid="collection-grid"
        class="grid auto-rows-fr grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
      >
        <li
          v-for="(entry, index) in pageEntries"
          :key="entry.slug"
          class="min-w-0 h-full"
        >
          <CardCollectionTile :kind="kind" :entry="entry" :eager="index < 4" />
        </li>
      </ul>
      <CardCollectionPagination
        v-if="pageCount > 1"
        :kind="kind"
        :page="page"
        :page-count="pageCount"
        :total="entries.length"
        :page-size="pageSize"
        :to="pageTo"
        position="bottom"
        class="mt-6"
      />
    </template>
    <p v-else role="status" class="text-center py-8">
      {{
        filter
          ? 'No matching names. Try a shorter filter.'
          : 'No collections are available in the current card catalog.'
      }}
    </p>
  </UContainer>
</template>
