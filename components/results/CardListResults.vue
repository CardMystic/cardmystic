<template>
  <div class="mt-3 w-full">
    <!-- Loading State -->
    <template v-if="isLoading">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        <CardSkeleton v-for="i in skeletonCount" :key="`skeleton-${i}`" :showCardInfo="true" />
      </div>
    </template>

    <!-- Cards display -->
    <template v-else-if="groups && groups.length > 0">
      <!-- Mainboard header -->
      <div v-if="(sideboardGroups && sideboardGroups.length > 0) || (consideringGroups && consideringGroups.length > 0)"
        class="board-divider mb-2">
        <div class="board-divider-line"></div>
        <span class="board-divider-label">Mainboard ({{ mainboardCount }} {{ mainboardCount === 1 ? 'card' : 'cards'
        }}) <span class="board-divider-price">${{ mainboardPrice.toFixed(2) }}</span></span>
        <div class="board-divider-line"></div>
      </div>
      <!-- Commander card(s) at the top (groups with empty label) -->
      <template v-for="(group, index) in ungroupedGroups" :key="'ungrouped-' + index">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-4">
          <div v-for="card in group.cards" :key="card.card_data.id">
            <ListCard :card="card" :is-deck-commander="commanderCardIds?.includes(card.card_data.id) ?? false"
              :is-commander-card="isCommanderCard(card)" :commander-color-identity="commanderColorIdentity"
              :num-copies="listItemsMap?.[card.card_data.id]?.num_copies"
              :board="listItemsMap?.[card.card_data.id]?.board" :format="format"
              @remove="(cardId: string) => emit('removeCard', cardId)"
              @set-commander="(cardName: string) => emit('setCommander', cardName)"
              @clear-commander="(cardId: string) => emit('clearCommander', cardId)"
              @update-num-copies="(cardName: string, n: number) => emit('updateNumCopies', cardName, n)"
              @change-board="(cardName: string, b: 'Mainboard' | 'Sideboard' | 'Considering') => emit('changeBoard', cardName, b)" />
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
          <div :id="groupToId(group.label)"
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-2">
            <div v-for="card in group.cards" :key="card.card_data.id">
              <ListCard :card="card" :is-deck-commander="commanderCardIds?.includes(card.card_data.id) ?? false"
                :is-commander-card="isCommanderCard(card)" :commander-color-identity="commanderColorIdentity"
                :num-copies="listItemsMap?.[card.card_data.id]?.num_copies"
                :board="listItemsMap?.[card.card_data.id]?.board" :format="format"
                @remove="(cardId: string) => emit('removeCard', cardId)"
                @set-commander="(cardName: string) => emit('setCommander', cardName)"
                @clear-commander="(cardId: string) => emit('clearCommander', cardId)"
                @update-num-copies="(cardName: string, n: number) => emit('updateNumCopies', cardName, n)"
                @change-board="(cardName: string, b: 'Mainboard' | 'Sideboard' | 'Considering') => emit('changeBoard', cardName, b)" />
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

    <!-- Sideboard Section -->
    <template v-if="sideboardGroups && sideboardGroups.length > 0">
      <div id="board-sideboard" class="board-divider cursor-pointer" @click="sideboardExpanded = !sideboardExpanded">
        <div class="board-divider-line"></div>
        <span class="board-divider-label">
          <UIcon :name="sideboardExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="w-4 h-4" />
          Sideboard ({{ sideboardCount }} {{ sideboardCount === 1 ? 'card' : 'cards' }}) <span
            class="board-divider-price">${{ sideboardPrice.toFixed(2) }}</span>
        </span>
        <div class="board-divider-line"></div>
      </div>
      <UCard variant="outline" v-show="sideboardExpanded" class="mb-4">
        <!-- Ungrouped sideboard cards -->
        <template v-for="(group, index) in sideboardUngrouped" :key="'sb-ungrouped-' + index">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-4">
            <div v-for="card in group.cards" :key="card.card_data.id">
              <ListCard :card="card" :is-deck-commander="false" :is-commander-card="isCommanderCard(card)"
                :commander-color-identity="commanderColorIdentity"
                :num-copies="listItemsMap?.[card.card_data.id]?.num_copies"
                :board="listItemsMap?.[card.card_data.id]?.board" :format="format"
                @remove="(cardId: string) => emit('removeCard', cardId)"
                @set-commander="(cardName: string) => emit('setCommander', cardName)"
                @clear-commander="(cardId: string) => emit('clearCommander', cardId)"
                @update-num-copies="(cardName: string, n: number) => emit('updateNumCopies', cardName, n)"
                @change-board="(cardName: string, b: 'Mainboard' | 'Sideboard' | 'Considering') => emit('changeBoard', cardName, b)" />
            </div>
          </div>
        </template>
        <!-- Grouped sideboard cards -->
        <UAccordion v-if="sideboardLabeled.length > 0" type="multiple" v-model="openSideboardValues"
          :items="sideboardAccordionItems"
          :ui="{ item: 'w-full mx-auto sm:mx-0', trigger: 'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1' }">
          <template v-for="group in sideboardLabeled" :key="group.label" #[group.label]>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-2">
              <div v-for="card in group.cards" :key="card.card_data.id">
                <ListCard :card="card" :is-deck-commander="false" :is-commander-card="isCommanderCard(card)"
                  :commander-color-identity="commanderColorIdentity"
                  :num-copies="listItemsMap?.[card.card_data.id]?.num_copies"
                  :board="listItemsMap?.[card.card_data.id]?.board" :format="format"
                  @remove="(cardId: string) => emit('removeCard', cardId)"
                  @set-commander="(cardName: string) => emit('setCommander', cardName)"
                  @clear-commander="(cardId: string) => emit('clearCommander', cardId)"
                  @update-num-copies="(cardName: string, n: number) => emit('updateNumCopies', cardName, n)"
                  @change-board="(cardName: string, b: 'Mainboard' | 'Sideboard' | 'Considering') => emit('changeBoard', cardName, b)" />
              </div>
            </div>
          </template>
        </UAccordion>
      </UCard>
    </template>

    <!-- Considering Section -->
    <template v-if="consideringGroups && consideringGroups.length > 0">
      <div id="board-considering" class="board-divider cursor-pointer"
        @click="consideringExpanded = !consideringExpanded">
        <div class="board-divider-line"></div>
        <span class="board-divider-label">
          <UIcon :name="consideringExpanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'" class="w-4 h-4" />
          Considering ({{ consideringCount }} {{ consideringCount === 1 ? 'card' : 'cards' }}) <span
            class="board-divider-price">${{ consideringPrice.toFixed(2) }}</span>
        </span>
        <div class="board-divider-line"></div>
      </div>
      <UCard variant="outline" v-show="consideringExpanded" class="mb-4">
        <!-- Ungrouped considering cards -->
        <template v-for="(group, index) in consideringUngrouped" :key="'con-ungrouped-' + index">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 mb-4">
            <div v-for="card in group.cards" :key="card.card_data.id">
              <ListCard :card="card" :is-deck-commander="false" :is-commander-card="isCommanderCard(card)"
                :commander-color-identity="commanderColorIdentity"
                :num-copies="listItemsMap?.[card.card_data.id]?.num_copies"
                :board="listItemsMap?.[card.card_data.id]?.board" :format="format"
                @remove="(cardId: string) => emit('removeCard', cardId)"
                @set-commander="(cardName: string) => emit('setCommander', cardName)"
                @clear-commander="(cardId: string) => emit('clearCommander', cardId)"
                @update-num-copies="(cardName: string, n: number) => emit('updateNumCopies', cardName, n)"
                @change-board="(cardName: string, b: 'Mainboard' | 'Sideboard' | 'Considering') => emit('changeBoard', cardName, b)" />
            </div>
          </div>
        </template>
        <!-- Grouped considering cards -->
        <UAccordion v-if="consideringLabeled.length > 0" type="multiple" v-model="openConsideringValues"
          :items="consideringAccordionItems"
          :ui="{ item: 'w-full mx-auto sm:mx-0', trigger: 'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1' }">
          <template v-for="group in consideringLabeled" :key="group.label" #[group.label]>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 p-2">
              <div v-for="card in group.cards" :key="card.card_data.id">
                <ListCard :card="card" :is-deck-commander="false" :is-commander-card="isCommanderCard(card)"
                  :commander-color-identity="commanderColorIdentity"
                  :num-copies="listItemsMap?.[card.card_data.id]?.num_copies"
                  :board="listItemsMap?.[card.card_data.id]?.board" :format="format"
                  @remove="(cardId: string) => emit('removeCard', cardId)"
                  @set-commander="(cardName: string) => emit('setCommander', cardName)"
                  @clear-commander="(cardId: string) => emit('clearCommander', cardId)"
                  @update-num-copies="(cardName: string, n: number) => emit('updateNumCopies', cardName, n)"
                  @change-board="(cardName: string, b: 'Mainboard' | 'Sideboard' | 'Considering') => emit('changeBoard', cardName, b)" />
              </div>
            </div>
          </template>
        </UAccordion>
      </UCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { Card } from '~/models/cardModel';
import type { CardGroup } from '~/utils/sort';
import type { AccordionItem } from '@nuxt/ui';
import { useCommandersSet } from '~/composables/useBulkData';

const props = defineProps<{
  isLoading: boolean;
  groups: CardGroup[] | null;
  skeletonCount?: number;
  commanderCardIds?: string[] | null;
  commanderColorIdentity?: string[] | null;
  listItemsMap?: Record<string, { num_copies: number; board: string }>;
  format?: string;
  sideboardGroups?: CardGroup[] | null;
  consideringGroups?: CardGroup[] | null;
}>();

const { data: commandersSet } = useCommandersSet();

function isCommanderCard(card: Card): boolean {
  if (!card?.card_data?.name || !commandersSet.value) return false;
  return commandersSet.value.has(card.card_data.name);
}

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

// Sideboard accordion
const sideboardLabeled = computed(() => {
  if (!props.sideboardGroups) return [];
  return props.sideboardGroups.filter(g => g.label);
});
const sideboardUngrouped = computed(() => {
  if (!props.sideboardGroups) return [];
  return props.sideboardGroups.filter(g => !g.label);
});
const sideboardAccordionItems = computed<AccordionItem[]>(() => {
  return sideboardLabeled.value.map(g => ({ label: g.label, value: g.label, slot: g.label as any }));
});
const sideboardExpanded = ref(false);
const openSideboardValues = ref<string[]>([]);
watch(sideboardLabeled, (groups) => {
  openSideboardValues.value = groups.map(g => g.label);
}, { immediate: true });

// Considering accordion
const consideringLabeled = computed(() => {
  if (!props.consideringGroups) return [];
  return props.consideringGroups.filter(g => g.label);
});
const consideringUngrouped = computed(() => {
  if (!props.consideringGroups) return [];
  return props.consideringGroups.filter(g => !g.label);
});
const consideringAccordionItems = computed<AccordionItem[]>(() => {
  return consideringLabeled.value.map(g => ({ label: g.label, value: g.label, slot: g.label as any }));
});
const consideringExpanded = ref(false);
const openConsideringValues = ref<string[]>([]);
watch(consideringLabeled, (groups) => {
  openConsideringValues.value = groups.map(g => g.label);
}, { immediate: true });

const emit = defineEmits<{
  (e: 'removeCard', cardId: string): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
  (e: 'updateNumCopies', cardName: string, numCopies: number): void;
  (e: 'changeBoard', cardName: string, board: 'Mainboard' | 'Sideboard' | 'Considering'): void;
}>();

function countCards(groups: CardGroup[] | null | undefined): number {
  if (!groups) return 0;
  return groups.reduce((total, g) => total + g.cards.reduce((sum, c) => {
    const copies = props.listItemsMap?.[c.card_data.id]?.num_copies ?? 1;
    return sum + copies;
  }, 0), 0);
}

function sumPrice(groups: CardGroup[] | null | undefined): number {
  if (!groups) return 0;
  return groups.reduce((total, g) => total + g.cards.reduce((sum, c) => {
    const price = c.card_data?.prices?.usd;
    const copies = props.listItemsMap?.[c.card_data.id]?.num_copies ?? 1;
    return sum + (price ? parseFloat(price) * copies : 0);
  }, 0), 0);
}

const mainboardCount = computed(() => countCards(props.groups));
const sideboardCount = computed(() => countCards(props.sideboardGroups));
const consideringCount = computed(() => countCards(props.consideringGroups));

const mainboardPrice = computed(() => sumPrice(props.groups));
const sideboardPrice = computed(() => sumPrice(props.sideboardGroups));
const consideringPrice = computed(() => sumPrice(props.consideringGroups));

function groupToId(label: string): string {
  return 'group-' + label.replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '').toLowerCase();
}

function expandBoard(board: 'Sideboard' | 'Considering') {
  if (board === 'Sideboard') sideboardExpanded.value = true;
  else if (board === 'Considering') consideringExpanded.value = true;
}

defineExpose({ expandBoard });
</script>

<style scoped>
.board-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 12px;
}

.board-divider-line {
  flex: 1;
  height: 1px;
  background: rgba(150, 150, 150, 0.3);
}

.board-divider-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(180, 180, 180, 0.8);
  white-space: nowrap;
  user-select: none;
}

.board-divider-price {
  color: rgba(120, 200, 120, 0.9);
  font-weight: 500;
  margin-left: 2px;
}
</style>
