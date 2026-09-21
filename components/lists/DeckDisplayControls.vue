<template>
  <div class="flex flex-wrap items-center gap-3">
    <label class="flex items-center gap-2 text-sm">
      View
      <USelect
        v-model="view"
        :items="deckViewOptions"
        :disabled="disabled"
        aria-label="Deck view"
        class="w-40"
        size="sm"
      />
    </label>
    <label class="flex items-center gap-2 text-sm">
      Group
      <USelect
        v-model="group"
        :items="deckGroupOptions"
        :disabled="disabled"
        aria-label="Deck grouping"
        class="w-36"
        size="sm"
      />
    </label>
    <label class="flex items-center gap-2 text-sm">
      Sort
      <USelect
        v-model="sort"
        :items="deckSortOptions"
        :disabled="disabled"
        aria-label="Deck sorting"
        class="w-36"
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
  type DeckPreferences,
} from '~/models/preferencesModel';
const props = defineProps<{
  preferences: DeckPreferences;
  disabled?: boolean;
}>();
const emit = defineEmits<{ change: [patch: Partial<DeckPreferences>] }>();
const view = computed({
  get: () => props.preferences.deck_view,
  set: (value: DeckPreferences['deck_view']) =>
    emit('change', { deck_view: value }),
});
const group = computed({
  get: () => props.preferences.deck_group_by ?? 'none',
  set: (value: NonNullable<DeckPreferences['deck_group_by']> | 'none') =>
    emit('change', { deck_group_by: value === 'none' ? null : value }),
});
const sort = computed({
  get: () => props.preferences.deck_sort_by ?? 'none',
  set: (value: NonNullable<DeckPreferences['deck_sort_by']> | 'none') =>
    emit('change', { deck_sort_by: value === 'none' ? null : value }),
});
</script>
