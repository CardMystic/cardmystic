<script setup lang="ts">
import type { AlsRecommendRequest } from '~/composables/useAlsRecommend';
import { provideDeckbuilder } from '~/composables/useDeckbuilder';
import ALSSearch from '~/components/search/ALSSearch.vue';

const props = defineProps<{ commander: string }>();
const deckbuilder = provideDeckbuilder();
const route = useRoute();
const active = ref(true);
onActivated(() => {
  active.value = true;
});
onDeactivated(() => {
  active.value = false;
});
const request = shallowRef<AlsRecommendRequest>();
const initializing = ref(true);
const searchedDeckId = ref('');
const { searchResults, isLoading, isFetching, error, refetch } =
  useAlsRecommend(
    computed(() =>
      active.value && request.value
        ? {
            ...request.value,
            useRerank: route.query.useRerank !== 'false',
          }
        : undefined,
    ),
  );

function recommend(value: AlsRecommendRequest) {
  searchedDeckId.value = deckbuilder.selectedDeckId.value;
  request.value = value;
}

const availableRecommendations = computed(() => {
  const included = new Set([
    ...deckbuilder.cardNames.value,
    ...deckbuilder.pendingCards.value,
  ]);
  return searchResults.value?.filter(
    (card) => !included.has(card.card_data.name),
  );
});
const selectedDeckChanged = computed(() => {
  if (
    !searchedDeckId.value ||
    searchedDeckId.value !== deckbuilder.selectedDeckId.value ||
    !deckbuilder.savedDeckReady.value
  )
    return false;
  const names = (values: Iterable<string>) =>
    JSON.stringify([...new Set(values)].sort());
  return (
    names(deckbuilder.cardNames.value) !== names(request.value?.cards ?? [])
  );
});
</script>

<template>
  <div>
    <ALSSearch
      :embedded-commander="props.commander"
      class="mx-auto mt-2 mb-4 w-full max-w-5xl"
      @recommend="recommend"
      @initializing="initializing = $event"
    />
    <div v-if="deckbuilder.selectedDeckId.value" class="mb-4 text-center">
      <UButton
        :to="`/lists/${deckbuilder.selectedDeckId.value}`"
        label="Go to deck"
        icon="i-lucide-arrow-up-right"
        variant="outline"
      />
    </div>
    <UButton
      v-if="selectedDeckChanged"
      class="mx-auto mb-4 flex"
      icon="i-lucide-refresh-cw"
      :disabled="isFetching || deckbuilder.pendingCards.value.length > 0"
      @click="deckbuilder.rerun.value++"
      >Deck has changed: Rerun search</UButton
    >
    <SearchResults
      default-group-by="type"
      :is-loading="initializing || isLoading"
      :is-fetching="isFetching"
      :error="error"
      :search-results="availableRecommendations"
      :reranking-enabled="route.query.useRerank !== 'false'"
      :query-param="props.commander"
      :show-add-to-deckbuilder-button="true"
      :hide-thumbs-down-button="true"
      :hide-group-navigation="!active"
      :empty-title="
        searchResults?.length
          ? 'All recommendations added'
          : 'No matching recommendations'
      "
      :empty-description="
        searchResults?.length
          ? 'Rerun search for more recommendations.'
          : 'Try changing your search or filters.'
      "
      @retry="refetch()"
    />
  </div>
</template>
