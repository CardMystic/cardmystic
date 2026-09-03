<template>
  <div class="w-80 p-3">
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search Magic symbols…"
      size="sm"
      class="w-full"
      @update:model-value="emit('update:search', String($event))"
    />
    <div class="mt-2 max-h-72 overflow-y-auto pr-1">
      <section
        v-for="group in groupedSymbols"
        :key="group.category"
        class="mb-3"
      >
        <p class="mb-1 text-xs font-medium text-muted">{{ group.category }}</p>
        <div
          class="grid grid-cols-8 gap-1"
          role="group"
          :aria-label="group.category"
        >
          <button
            v-for="entry in group.symbols"
            :key="entry.token"
            type="button"
            :title="`{${entry.token}} — ${entry.label}`"
            :aria-label="`Insert ${entry.label}`"
            class="flex h-8 items-center justify-center rounded text-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            @click="emit('select', entry.token)"
          >
            <span
              :class="['magic-symbol-picker-icon', entry.iconClass]"
              aria-hidden="true"
            />
          </button>
        </div>
      </section>
      <p
        v-if="groupedSymbols.length === 0"
        class="text-center text-xs text-gray-500 dark:text-gray-400 py-4"
      >
        No Magic symbols match "{{ search }}"
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MagicSymbol } from '~/utils/magicSymbols';

const props = defineProps<{
  search: string;
  symbols: MagicSymbol[];
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'select', token: string): void;
}>();

const groupedSymbols = computed(() => {
  const term = props.search.trim().toLowerCase();
  const matches = term
    ? props.symbols.filter(
        (entry) =>
          entry.token.toLowerCase().includes(term) ||
          entry.label.toLowerCase().includes(term) ||
          entry.category.toLowerCase().includes(term),
      )
    : props.symbols;

  const groups = new Map<string, MagicSymbol[]>();
  for (const entry of matches) {
    const entries = groups.get(entry.category) ?? [];
    entries.push(entry);
    groups.set(entry.category, entries);
  }
  return [...groups].map(([category, symbols]) => ({ category, symbols }));
});
</script>

<style scoped>
.magic-symbol-picker-icon {
  margin-inline-start: 0 !important;
}
</style>
