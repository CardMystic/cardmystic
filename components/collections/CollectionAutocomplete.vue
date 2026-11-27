<script setup lang="ts">
import {
  collectionPath,
  matchingCollections,
  type CardCollectionEntry,
  type CardCollectionKind,
} from '~/utils/card-collections';

const props = defineProps<{
  kind: CardCollectionKind;
  matches?: CardCollectionEntry[];
  label: string;
}>();
const searchTerm = defineModel<string>('searchTerm', { default: '' });
const router = useRouter();
// Directory pages already filter their grid. Navigation loads the catalog when its menu opens.
const catalog = props.matches ? undefined : useCardCollections();
const options = computed(() =>
  (
    props.matches ??
    matchingCollections(
      catalog?.data.value?.[props.kind] ?? [],
      searchTerm.value,
    )
  ).slice(0, 40),
);
</script>

<template>
  <AppInputMenu
    v-model:search-term="searchTerm"
    :items="options"
    label-key="name"
    value-key="slug"
    ignore-filter
    open-on-click
    :reset-search-term-on-blur="false"
    :reset-search-term-on-select="false"
    :aria-label="label"
    :placeholder="kind === 'sets' ? 'Set name or code' : label"
    class="w-full"
    :ui="{ base: 'min-h-11' }"
    @update:model-value="$event && router.push(collectionPath(kind, $event))"
  >
    <template v-if="kind === 'sets'" #item-label="{ item }">
      {{ item.name }}
      <span class="text-muted">({{ item.slug.toUpperCase() }})</span>
    </template>
  </AppInputMenu>
</template>
