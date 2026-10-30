<template>
  <div class="flex flex-wrap items-center gap-3">
    <USlideover
      v-model:open="open"
      title="Search filters"
      description="Choose filters, then search to update results. Closing keeps your choices."
      :ui="{
        content: 'w-full max-w-md h-dvh',
        header: 'shrink-0',
        body: 'min-h-0 overflow-y-auto overscroll-contain',
        footer:
          'shrink-0 flex gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]',
      }"
    >
      <UButton
        type="button"
        color="primary"
        variant="outline"
        icon="i-lucide-sliders-horizontal"
        class="min-h-11 cursor-pointer"
        :aria-label="
          filterCount ? `Filters (${filterCount} selected)` : 'Filters'
        "
      >
        Filters
        <span v-if="filterCount" aria-hidden="true">({{ filterCount }})</span>
      </UButton>
      <template #close>
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          aria-label="Close filters"
          class="min-h-11 min-w-11"
        />
      </template>
      <template #body>
        <div v-if="open" class="space-y-5">
          <QuickFilters v-model="filters" :show="quickFilters" />
          <section
            v-if="commanderColors"
            aria-label="Commander color identity"
            class="space-y-2"
          >
            <h3 class="text-sm font-semibold">Color identity</h3>
            <CommanderFilters v-model="filters" />
          </section>
          <LazyFilters
            embedded
            v-model="filters"
            :hide-colors="hideColors || commanderColors"
            :hide-formats="hideFormats"
          />
        </div>
      </template>
      <template #footer>
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          class="min-h-11 flex-1 justify-center"
          @click="open = false"
        >
          Done
        </UButton>
        <UButton
          type="button"
          class="min-h-11 flex-1 justify-center"
          :disabled="!canApply"
          @click="emit('apply')"
        >
          {{ applyLabel }}
        </UButton>
      </template>
    </USlideover>
    <span v-if="pendingChanges" class="text-sm text-muted" role="status">
      Search to apply filter changes
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CardSearchFilters } from '~/models/frontend-specific/filtersModel';

withDefaults(
  defineProps<{
    hideColors?: boolean;
    hideFormats?: boolean;
    commanderColors?: boolean;
    quickFilters?: string[];
    canApply?: boolean;
    applyLabel?: string;
  }>(),
  { canApply: true, applyLabel: 'Search', quickFilters: undefined },
);

const filters = defineModel<CardSearchFilters>();
const emit = defineEmits<{ apply: [] }>();
const open = ref(false);
const appliedFilters = ref(JSON.stringify(filters.value));
const pendingChanges = computed(
  () => JSON.stringify(filters.value) !== appliedFilters.value,
);
const filterCount = computed(() => {
  const value = filters.value;
  if (!value) return 0;
  return (
    (value.selectedCardTypes?.length ?? 0) +
    (value.selectedColors?.length ? 1 : 0) +
    (value.selectedRarities?.length ?? 0) +
    (value.selectedCardFormats?.filter(
      (format) => format.format || format.status,
    ).length ?? 0) +
    [value.selectedCMC, value.selectedPower, value.selectedToughness].filter(
      (number) => number !== undefined && number !== '',
    ).length +
    [value.isMTGO, value.isArena, value.isPaper, value.isGameChanger].filter(
      Boolean,
    ).length
  );
});

function collapse() {
  open.value = false;
  appliedFilters.value = JSON.stringify(filters.value);
}

defineExpose({ collapse });
</script>
