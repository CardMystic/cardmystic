<script setup lang="ts">
import SortComponent from '~/components/search/Sort.vue';
const GroupBy = defineAsyncComponent(
  () => import('~/components/search/GroupBy.vue'),
);
defineProps<{
  view: 'grid' | 'text';
  groupBy?: string;
  sortBy?: string;
  sortDirection: 'asc' | 'desc';
  collectionOrder?: boolean;
  rerankingEnabled?: boolean;
  hasAlsScore: boolean;
  hasAiScore: boolean;
  hasPopularity: boolean;
  footer?: boolean;
}>();
const emit = defineEmits<{
  view: [value: string | undefined];
  groupBy: [value: string | undefined];
  sort: [field: string | undefined, direction: 'asc' | 'desc'];
}>();
</script>

<template>
  <UPopover :content="{ side: footer ? 'top' : 'bottom', align: 'end' }">
    <UButton
      icon="i-lucide-settings-2"
      color="neutral"
      :variant="footer ? 'ghost' : 'outline'"
      label="Display"
      :aria-label="footer ? 'Display results' : undefined"
      :size="footer ? 'sm' : 'md'"
      class="min-h-11 cursor-pointer whitespace-normal text-left"
      :ui="{ label: 'whitespace-normal' }"
    />
    <template #content>
      <div class="display-menu p-3 space-y-3 w-72 max-w-[calc(100vw-2rem)]">
        <View :default-value="view" @update:view="emit('view', $event)" />
        <GroupBy
          :default-value="groupBy"
          @update:groupBy="emit('groupBy', $event)"
        />
        <SortComponent
          :key="rerankingEnabled ? 'reranked' : 'original'"
          :default-sort-by="sortBy"
          :collection-order="collectionOrder"
          :default-direction="sortDirection"
          :has-als-score="hasAlsScore"
          :has-ai-score="hasAiScore"
          :has-popularity="hasPopularity"
          @sort="(field, direction) => emit('sort', field, direction)"
        />
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.display-menu {
  container: result-display / inline-size;
  max-height: var(--reka-popover-content-available-height);
  overflow-y: auto;
}
@container result-display (max-width: 14rem) {
  :deep(.display-control-row) {
    flex-wrap: wrap;
  }
  :deep(.display-control-row [role='combobox']) {
    flex-basis: 100%;
  }
}
</style>
