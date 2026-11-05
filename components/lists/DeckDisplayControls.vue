<template>
  <div class="grid gap-3">
    <label
      class="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 text-sm"
    >
      View
      <USelect
        v-model="view"
        :items="deckViewOptions"
        :disabled="disabled"
        aria-label="Deck view"
        class="w-full min-w-0"
        size="sm"
      />
    </label>
    <label
      class="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 text-sm"
    >
      Group
      <USelect
        v-model="group"
        :items="deckGroupOptions"
        :disabled="disabled"
        aria-label="Deck grouping"
        class="w-full min-w-0"
        size="sm"
      />
    </label>
    <label
      class="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 text-sm"
    >
      Sort
      <USelect
        v-model="sort"
        :items="sortOptions"
        :disabled="disabled"
        aria-label="Deck sorting"
        class="w-full min-w-0"
        size="sm"
      />
    </label>
    <UButton
      :icon="
        preferences.deck_sort_direction === 'asc'
          ? 'i-lucide-arrow-up'
          : 'i-lucide-arrow-down'
      "
      :label="
        preferences.deck_sort_direction === 'asc' ? 'Ascending' : 'Descending'
      "
      :disabled="disabled || !preferences.deck_sort_by"
      color="neutral"
      variant="ghost"
      size="sm"
      @click="
        emit('change', {
          deck_sort_direction:
            preferences.deck_sort_direction === 'asc' ? 'desc' : 'asc',
        })
      "
    />
  </div>
</template>
<script setup lang="ts">
import {
  deckViewOptions,
  deckGroupOptions,
  deckSortOptions,
  type DeckDisplayPreferences,
} from '~/models/preferencesModel';
const props = defineProps<{
  preferences: DeckDisplayPreferences;
  disabled?: boolean;
  hasSearchScores?: boolean;
}>();
const emit = defineEmits<{
  change: [patch: Partial<DeckDisplayPreferences>];
}>();
const sortOptions = computed(() =>
  props.hasSearchScores
    ? [{ value: 'ai_score', label: 'Smart Search %' }, ...deckSortOptions]
    : deckSortOptions,
);
const view = computed({
  get: () => props.preferences.deck_view,
  set: (value: DeckDisplayPreferences['deck_view']) =>
    emit('change', { deck_view: value }),
});
const group = computed({
  get: () => props.preferences.deck_group_by ?? 'none',
  set: (value: NonNullable<DeckDisplayPreferences['deck_group_by']> | 'none') =>
    emit('change', { deck_group_by: value === 'none' ? null : value }),
});
const sort = computed({
  get: () => props.preferences.deck_sort_by ?? 'none',
  set: (value: NonNullable<DeckDisplayPreferences['deck_sort_by']> | 'none') =>
    emit('change', {
      deck_sort_by: value === 'none' ? null : value,
      ...(value === 'ai_score' ? { deck_sort_direction: 'desc' } : {}),
    }),
});
</script>
