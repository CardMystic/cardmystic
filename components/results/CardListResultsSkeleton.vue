<template>
  <div
    class="results-layout xl:flex xl:items-start xl:gap-6"
    role="status"
    aria-label="Loading cards"
    aria-busy="true"
  >
    <aside
      class="preview-rail hidden xl:block xl:w-[20rem] xl:shrink-0 xl:self-start"
    >
      <div class="preview-sticky">
        <HoveredPreviewSkeleton />
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <div v-if="view !== 'text'" :class="deckCardGridClasses">
        <div
          v-for="i in skeletonCount"
          :key="`skeleton-${i}`"
          :class="{ 'col-start-1': i === commanderCount + 1 }"
        >
          <ListCardSkeleton />
          <DeckCardMetadata />
          <CardChipRowSkeleton
            v-for="kind in visibleLabels"
            :editable="kind === 'tags'"
            :key="kind"
            class="my-1"
          />
        </div>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-0"
      >
        <div
          v-for="i in skeletonCount"
          :key="`text-skeleton-${i}`"
          :class="{ 'col-start-1': i === commanderCount + 1 }"
          class="min-w-0 px-1.5 border-b border-default"
        >
          <div class="h-9 flex items-center gap-2">
            <USkeleton class="h-3.5 w-5 shrink-0" />
            <USkeleton
              class="h-3.5"
              :class="i % 3 === 0 ? 'w-2/3' : i % 2 === 0 ? 'w-1/2' : 'w-3/4'"
            />
            <USkeleton class="h-4 w-10 ml-auto shrink-0" />
          </div>
          <DeckCardMetadata text-view />
          <CardChipRowSkeleton
            v-for="kind in visibleLabels"
            :editable="kind === 'tags'"
            :key="kind"
            class="my-1"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeckPreferences } from '~/models/preferencesModel';
import ListCardSkeleton from '~/components/cards/ListCardSkeleton.vue';
import { deckCardGridClasses } from '~/composables/useDeckCardGrid';
import { deckCardLabelsKey } from '~/composables/useDeckHighlight';

const visibleLabels = inject(deckCardLabelsKey, undefined)?.visible;

withDefaults(
  defineProps<{
    skeletonCount?: number;
    commanderCount?: number;
    view?: DeckPreferences['deck_view'];
  }>(),
  {
    skeletonCount: 40,
    commanderCount: 0,
    view: 'grid',
  },
);
</script>

<style scoped>
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
