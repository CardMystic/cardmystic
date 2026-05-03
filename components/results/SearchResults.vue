<template>
  <!-- Results -->
  <div class="mt-3 w-full" :class="{ 'pb-24': jumpToGroups.length > 0 }">
    <template v-if="isLoading">
      <div style="height: 32px"></div> <!-- Sort spacer to prevent layout shift -->
      <div v-if="defaultGroupBy" style="height: 26px"></div> <!-- Spacer for expand all/collapse all buttons -->
      <div class="results-layout xl:flex xl:items-start xl:gap-6">
        <aside class="preview-rail hidden xl:block xl:w-[20rem] xl:shrink-0 xl:self-start">
          <div class="preview-sticky">
            <HoveredPreviewSkeleton />
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="searchResults && searchResults.length">
      <div class="flex flex-wrap items-center justify-center gap-4 mb-3">
        <GroupBy :default-value="defaultGroupBy" @update:groupBy="handleGroupBy" />
        <SortComponent :has-als-score="hasAlsScore" :has-ai-score="hasAiScore" :has-popularity="hasPopularity"
          @sort="handleSort" />
      </div>

      <div class="results-layout xl:flex xl:items-start xl:gap-6">
        <aside v-if="previewCard" class="preview-rail hidden xl:block xl:w-[20rem] xl:shrink-0 xl:self-start"
          @mouseenter="clearPendingPreviewCard()">
          <div class="preview-sticky">
            <HoveredSearchResultPreview :card="previewCard" :query-param="queryParam"
              :is-commander="previewCardIsCommander" :is-searched="previewIsSearched"
              :hide-progress-bar="hideProgressBar" :hide-thumbs-down-button="hideThumbsDownButton"
              :show-add-to-deckbuilder-button="showAddToDeckbuilderButton"
              :is-flipped="flippedCards[previewCard.card_data.id] ?? false" :partner-index="previewPartnerIndex"
              @flip="handleCardFlip" />
          </div>
        </aside>

        <div class="min-w-0 flex-1">

          <!-- Searched card pinned at top when grouped (similarity search) -->
          <div v-if="searchedCard && groupedResults && groupedResults.length > 0 && groupedResults[0].label"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 mb-3">
            <div @mouseenter="setPreviewCard(searchedCard)" @focusin="setPreviewCard(searchedCard)"
              @mouseleave="clearPendingPreviewCard(searchedCard.card_data.id)">
              <Card :card="searchedCard" :showCardInfo="true" :is-searched="true" :hide-progress-bar="false"
                :hide-thumbs-down-button="true" :is-commander="checkIsCommander(searchedCard)"
                :is-flipped="flippedCards[searchedCard.card_data.id] ?? false" @flip="handleCardFlip"
                @partner-hover="handlePartnerHover" />
            </div>
          </div>

          <!-- Grouped results (accordion) -->
          <template v-if="groupedResults && groupedResults.length > 0 && groupedResults[0].label">
            <div class="flex justify-center sm:justify-end gap-1 mb-1">
              <UButton class="cursor-pointer" icon="i-lucide-chevrons-down" label="Expand All" size="xs" color="neutral"
                variant="ghost" @click="openAccordionValues = accordionItems.map(i => i.value as string)" />
              <UButton class="cursor-pointer" icon="i-lucide-chevrons-up" label="Collapse All" size="xs" color="neutral"
                variant="ghost" @click="openAccordionValues = []" />
            </div>
            <UAccordion type="multiple" v-model="openAccordionValues" :items="accordionItems"
              :ui="{ item: 'w-full mx-auto sm:mx-0', trigger: 'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1' }">
              <template v-for="group in groupedResults" :key="group.label" #[group.label]>
                <div :id="groupToId(group.label)"
                  class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-4">
                  <div v-for="result in group.cards" :key="result.card_data.id" @mouseenter="setPreviewCard(result)"
                    @focusin="setPreviewCard(result)" @mouseleave="clearPendingPreviewCard(result.card_data.id)">
                    <Card :card="result" :showCardInfo="true" :is-searched="false" :hide-progress-bar="hideProgressBar"
                      :hide-thumbs-down-button="hideThumbsDownButton"
                      :show-add-to-deckbuilder-button="showAddToDeckbuilderButton"
                      :is-commander="checkIsCommander(result)" :is-flipped="flippedCards[result.card_data.id] ?? false"
                      @flip="handleCardFlip" @partner-hover="handlePartnerHover" />
                  </div>
                </div>
              </template>
            </UAccordion>
          </template>

          <!-- Flat results (no grouping) -->
          <template v-else>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              <div v-for="(result, index) in sortedResults" :key="result.card_data.id"
                @mouseenter="setPreviewCard(result)" @focusin="setPreviewCard(result)"
                @mouseleave="clearPendingPreviewCard(result.card_data.id)">
                <Card :card="result" :showCardInfo="true" :is-searched="isSimilaritySearch && index === 0"
                  :hide-progress-bar="hideProgressBar" :hide-thumbs-down-button="hideThumbsDownButton"
                  :show-add-to-deckbuilder-button="showAddToDeckbuilderButton" :is-commander="checkIsCommander(result)"
                  :is-flipped="flippedCards[result.card_data.id] ?? false" @flip="handleCardFlip"
                  @partner-hover="handlePartnerHover" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <template v-else-if="!queryParam">
      <div>
        <UAlert color="info" icon="i-lucide-info" title="Enter a search query"
          :description="props.helpText || 'Please enter a search above.'" class="mb-4" />
      </div>
    </template>

    <template v-else>
      <UContainer>
        <div class="flex flex-col items-center">
          <UIcon name="i-lucide-search-x" class="text-5xl text-primary mb-4" />
          <div class="font-bold text-2xl mb-2">No results found</div>
          <div v-if="errorMessage" class="subtitle2 mb-2 text-center text-red-400">
            {{ errorMessage }}
          </div>
          <div class="subtitle2 mb-4">
            Try adjusting your search terms or filters.<br>
            If you think this is a mistake, <NuxtLink :to="searchFeedbackUrl(getPageInfo())" target="_blank"
              class="important-text underline">let us know</NuxtLink>.
          </div>
        </div>
      </UContainer>
    </template>
  </div>

  <LazyStickyActionFooter :show="jumpToGroups.length > 0">
    <template #right>
      <LazyJumpTo :groups="jumpToGroups" />
    </template>
  </LazyStickyActionFooter>
</template>

<script lang="ts" setup>
import type { Card } from '~/models/cardModel';
import type { CardGroup } from '~/utils/sort';
import type { AccordionItem } from '@nuxt/ui';
import SortComponent from '~/components/search/Sort.vue';
const GroupBy = defineAsyncComponent(() => import('~/components/search/GroupBy.vue'));
import searchFeedbackUrl from '~/utils/searchFeedbackUrl';
import { sortSearchResults, groupAndSortCards } from '~/utils/sort';
import { useCommandersSet } from '~/composables/useBulkData';

const { getPageInfo } = usePageInfo();

// Hoisted commander detection — single subscription shared by all Card children
const { data: commandersSet } = useCommandersSet();
function checkIsCommander(card: Card): boolean {
  if (!card?.card_data?.name || !commandersSet.value) return false;
  return commandersSet.value.has(card.card_data.name);
}

const props = withDefaults(defineProps<{
  isLoading: boolean;
  searchResults: undefined | Card[];
  queryParam: string | null;
  skeletonCount?: number;
  helpText?: string;
  errorMessage?: string;
  isSimilaritySearch?: boolean;
  hideProgressBar?: boolean;
  showAddToDeckbuilderButton?: boolean;
  hideSearchedCard?: boolean;
  hideThumbsDownButton?: boolean;
  defaultGroupBy?: string;
}>(), {
  skeletonCount: 40,
});

// Flip state — tracks flipped cards by ID so grid card and preview stay in sync
const flippedCards = ref<Record<string, boolean>>({});

function handleCardFlip(cardId: string) {
  flippedCards.value = { ...flippedCards.value, [cardId]: !(flippedCards.value[cardId] ?? false) };
}

// Partner hover — tracks which partner (0 = primary, 1 = partner) is being hovered
const previewPartnerIndex = ref<0 | 1>(0);

function handlePartnerHover(index: 0 | 1) {
  previewPartnerIndex.value = index;
}

// Sorting state
const sortBy = ref<string | undefined>(undefined);
const sortDirection = ref<'asc' | 'desc'>('asc');

// Grouping state
const groupBy = ref<string | undefined>(props.defaultGroupBy);

function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

function handleGroupBy(value: string | undefined) {
  groupBy.value = value;
}

// Detect which score types are available in the current results
const hasAlsScore = computed(() =>
  !!props.searchResults?.some(c => c.als_score !== undefined)
);
const hasAiScore = computed(() =>
  !!props.searchResults?.some(c => c.ai_normalized_score !== undefined)
);
const hasPopularity = computed(() =>
  !!props.searchResults?.some(c => c.popularity !== undefined && c.popularity > 0)
);

// Computed sorted results for flat display (no grouping, or similarity search)
const sortedResults = computed(() => {
  if (!props.searchResults || props.searchResults.length === 0) {
    return props.searchResults;
  }

  // For similarity search, keep the first card (the searched card) separate
  if (props.isSimilaritySearch && !props.hideSearchedCard) {
    const [firstCard, ...restCards] = props.searchResults;
    const sortedRest = sortSearchResults(restCards, sortBy.value, sortDirection.value);
    return sortedRest ? [firstCard, ...sortedRest] : [firstCard];
  }

  return sortSearchResults(props.searchResults, sortBy.value, sortDirection.value);
});

// The searched card for similarity search (first result)
const searchedCard = computed(() => {
  if (!props.isSimilaritySearch || props.hideSearchedCard || !props.searchResults || props.searchResults.length === 0) {
    return undefined;
  }
  return props.searchResults[0];
});

// Computed grouped results
const groupedResults = computed<CardGroup[] | null>(() => {
  if (!groupBy.value || !props.searchResults || props.searchResults.length === 0) {
    return null;
  }

  // For similarity search, keep first card out of groups
  if (props.isSimilaritySearch && !props.hideSearchedCard) {
    const [, ...restCards] = props.searchResults;
    return groupAndSortCards(restCards, groupBy.value, sortBy.value, sortDirection.value);
  }

  return groupAndSortCards(props.searchResults, groupBy.value, sortBy.value, sortDirection.value);
});

const jumpToGroups = computed(() =>
  (groupedResults.value || []).filter(group => group.label).map(group => group.label)
);

const accordionItems = computed<AccordionItem[]>(() => {
  if (!groupedResults.value) return [];
  return groupedResults.value
    .filter(g => g.label)
    .map(g => ({
      label: g.label,
      value: g.label,
      slot: g.label,
    }));
});

const openAccordionValues = ref<string[]>([]);
const hoveredCardId = ref<string | null>(null);

const previewCard = computed(() => {
  if (!props.searchResults?.length) return undefined;

  const hoveredCard = hoveredCardId.value
    ? props.searchResults.find(card => card.card_data.id === hoveredCardId.value)
    : undefined;

  if (hoveredCard) return hoveredCard;
  return searchedCard.value ?? sortedResults.value?.[0] ?? props.searchResults[0];
});

const previewIsSearched = computed(() => {
  if (!previewCard.value || !props.isSimilaritySearch || props.hideSearchedCard) return false;
  return previewCard.value.card_data.id === searchedCard.value?.card_data.id;
});

const previewCardIsCommander = computed(() =>
  previewCard.value ? checkIsCommander(previewCard.value) : false
);

// Reset partner index when the previewed card changes
watch(() => previewCard.value?.card_data.id, () => {
  previewPartnerIndex.value = 0;
});

const HOVER_PREVIEW_DELAY_MS = 200;
let _hoverRafId: number | null = null;
let _hoverDelayId: ReturnType<typeof setTimeout> | null = null;
let _pendingPreviewCardId: string | null = null;

function clearPendingPreviewCard(cardId?: string) {
  if (cardId && _pendingPreviewCardId !== cardId) return;

  if (_hoverDelayId !== null) {
    clearTimeout(_hoverDelayId);
    _hoverDelayId = null;
  }
  if (_hoverRafId !== null) {
    cancelAnimationFrame(_hoverRafId);
    _hoverRafId = null;
  }
  _pendingPreviewCardId = null;
}

function setPreviewCard(card: Card) {
  const nextCardId = card.card_data.id;
  // Skip entirely if the card hasn't changed — prevents jitter from child mouseenter events
  if (nextCardId === hoveredCardId.value) return;

  _pendingPreviewCardId = nextCardId;

  // Keep a short hover-intent delay so moving toward the preview rail doesn't swap cards instantly.
  if (_hoverDelayId !== null) clearTimeout(_hoverDelayId);
  _hoverDelayId = setTimeout(() => {
    if (_pendingPreviewCardId !== nextCardId) return;
    // Coalesce committed updates to one paint frame.
    if (_hoverRafId !== null) cancelAnimationFrame(_hoverRafId);
    _hoverRafId = requestAnimationFrame(() => {
      if (_pendingPreviewCardId !== nextCardId) return;
      hoveredCardId.value = nextCardId;
      _pendingPreviewCardId = null;
      _hoverRafId = null;
    });
    _hoverDelayId = null;
  }, HOVER_PREVIEW_DELAY_MS);
}

onUnmounted(() => {
  clearPendingPreviewCard();
});

watch(accordionItems, (items) => {
  openAccordionValues.value = items.map(i => i.value as string);
}, { immediate: true });

function groupToId(label: string): string {
  return 'group-' + label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase();
}

</script>

<style lang="scss" scoped>
.subtitle2 {
  font-size: 1.01rem;
  position: relative;
  top: -14px;
}

.preview-sticky {
  width: 100%;
}

.preview-rail {
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
}
</style>
