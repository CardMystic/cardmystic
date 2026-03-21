<template>
  <div class="mt-3 w-full">
    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </template>

    <!-- Cards display -->
    <template v-else-if="groups && groups.length > 0">
      <!-- Commander card(s) at the top (groups with empty label) -->
      <template v-for="(group, index) in ungroupedGroups" :key="'ungrouped-' + index">
        <!-- Commander cards: centered flex -->
        <div v-if="group.cards.every(c => commanderCardIds?.includes(c.card_data.id))"
          class="flex flex-wrap justify-center gap-2 mb-4">
          <div v-for="card in group.cards" :key="card.card_data.id" class="max-w-75">
            <ListCard :card="card" :is-commander="commanderCardIds?.includes(card.card_data.id) ?? false"
              :commander-color-identity="commanderColorIdentity"
              @remove="(cardId: string) => emit('removeCard', cardId)"
              @set-commander="(cardName: string) => emit('setCommander', cardName)"
              @clear-commander="(cardId: string) => emit('clearCommander', cardId)" />
          </div>
        </div>
        <!-- Ungrouped cards: grid layout -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          <div v-for="card in group.cards" :key="card.card_data.id">
            <ListCard :card="card" :is-commander="commanderCardIds?.includes(card.card_data.id) ?? false"
              :commander-color-identity="commanderColorIdentity"
              @remove="(cardId: string) => emit('removeCard', cardId)"
              @set-commander="(cardName: string) => emit('setCommander', cardName)"
              @clear-commander="(cardId: string) => emit('clearCommander', cardId)" />
          </div>
        </div>
      </template>

      <!-- Grouped Cards (Accordion) -->
      <div v-if="labeledGroups.length > 0" class="flex justify-center sm:justify-end gap-1 mb-1">
        <UButton class="cursor-pointer" icon="i-lucide-chevrons-down" label="Expand All" size="xs" color="neutral"
          variant="ghost" @click="openAccordionValues = labeledGroups.map(g => g.label)" />
        <UButton icon="i-lucide-chevrons-up" label="Collapse All" size="xs" color="neutral" variant="ghost"
          @click="openAccordionValues = []" />
      </div>
      <UAccordion v-if="labeledGroups.length > 0" type="multiple" v-model="openAccordionValues" :items="accordionItems"
        :ui="{ item: 'w-full mx-auto sm:mx-0', trigger: 'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1' }">
        <template v-for="group in labeledGroups" :key="group.label" #[group.label]>
          <div :id="groupToId(group.label)" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
            <div v-for="card in group.cards" :key="card.card_data.id">
              <ListCard :card="card" :is-commander="commanderCardIds?.includes(card.card_data.id) ?? false"
                :commander-color-identity="commanderColorIdentity"
                @remove="(cardId: string) => emit('removeCard', cardId)"
                @set-commander="(cardName: string) => emit('setCommander', cardName)"
                @clear-commander="(cardId: string) => emit('clearCommander', cardId)" />
            </div>
          </div>
        </template>
      </UAccordion>
    </template>

    <!-- Empty State -->
    <template v-else>
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <UIcon name="i-lucide-layers" class="w-16 h-16 mb-4 text-gray-400" />
        <h3 class="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-300">This list is empty!</h3>
        <p class="text-gray-500 dark:text-gray-400 max-w-md">
          Use the search dropdown above, or the <span class="font-medium">Save To List</span> button from the clipboard
          to add cards to this list.
        </p>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { Card } from '~/models/cardModel';
import type { CardGroup } from '~/utils/sort';
import type { AccordionItem } from '@nuxt/ui';

const props = defineProps<{
  isLoading: boolean;
  groups: CardGroup[] | null;
  skeletonCount?: number;
  commanderCardIds?: string[] | null;
  commanderColorIdentity?: string[] | null;
}>();

const ungroupedGroups = computed(() => {
  if (!props.groups) return [];
  return props.groups.filter(g => !g.label);
});

const labeledGroups = computed(() => {
  if (!props.groups) return [];
  return props.groups.filter(g => g.label);
});

const accordionItems = computed<AccordionItem[]>(() => {
  return labeledGroups.value.map(g => ({
    label: g.label,
    value: g.label,
    slot: g.label as any,
  }));
});

const openAccordionValues = ref<string[]>([]);

watch(labeledGroups, (groups) => {
  openAccordionValues.value = groups.map(g => g.label);
}, { immediate: true });

const emit = defineEmits<{
  (e: 'removeCard', cardId: string): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
}>();

function groupToId(label: string): string {
  return 'group-' + label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase();
}
</script>
