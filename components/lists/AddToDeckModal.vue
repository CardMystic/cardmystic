<template>
  <UModal
    v-model:open="isOpen"
    :title="modalTitle"
    description="Pick a recently edited deck or search your decks by name."
  >
    <template #content>
      <div v-if="!isLoggedIn" class="p-4 space-y-3 text-center">
        <p class="text-lg">Login To Create Decks!</p>
        <UButton to="/login" color="primary" variant="solid">Log In</UButton>
      </div>

      <div v-else class="p-4 space-y-4">
        <div v-if="recentLists.length > 0" class="space-y-2">
          <div class="text-sm font-medium">Recently Edited Decks</div>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="list in recentLists"
              :key="list.id"
              color="primary"
              :variant="selectedListId === list.id ? 'solid' : 'outline'"
              size="sm"
              class="cursor-pointer"
              @click="selectRecentList(list.id)"
            >
              <span class="flex flex-col items-start leading-tight">
                <span>{{ listName(list) }}</span>
                <span class="text-xs opacity-70">{{
                  [listFormat(list), listDate(list)].filter(Boolean).join(' · ')
                }}</span>
              </span>
            </UButton>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">Search Decks</div>
          <UInputMenu
            v-model="selectedListItem"
            v-model:search-term="deckSearchTerm"
            :items="filteredDeckLabels"
            placeholder="Find a deck..."
            icon="i-lucide-search"
            class="w-full"
            @update:model-value="handleSelectDeck"
          >
            <template #item="{ item }">
              <div class="flex flex-col leading-tight py-0.5">
                <span>{{ item.label }}</span>
                <span v-if="item.description" class="text-xs text-muted/70">{{
                  item.description
                }}</span>
              </div>
            </template>
          </UInputMenu>
        </div>

        <UAlert
          v-if="hasDuplicates"
          color="warning"
          icon="i-lucide-triangle-alert"
          :title="`${effectiveDuplicateCount} of ${cardCount} card${cardCount === 1 ? '' : 's'} already in this deck`"
          description="Choose whether to add only the new cards or add all cards (increasing copies of duplicates)."
        />

        <span class="text-orange-400 font-medium">{{ cardCount }}</span> card{{
          cardCount === 1 ? '' : 's'
        }}
        will be added to the deck.

        <div v-if="errorMessage" class="text-sm text-red-400">
          {{ errorMessage }}
        </div>
      </div>

      <div class="mx-2 my-2 flex justify-end gap-2" v-if="isLoggedIn">
        <button
          :disabled="loading"
          class="text-sm text-muted underline hover:text-default disabled:opacity-50 cursor-pointer"
          @click="showCreateDeckModal = true"
        >
          Create Deck Instead
        </button>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="isOpen = false"
        >
          Cancel
        </UButton>
        <template v-if="hasDuplicates && effectiveNewCount > 0">
          <UButton
            color="warning"
            variant="outline"
            :loading="loading"
            :disabled="!selectedListId"
            @click="handleAddToDeck(true)"
          >
            Add New Only ({{ effectiveNewCount }})
          </UButton>
          <UButton
            color="primary"
            variant="solid"
            :loading="loading"
            :disabled="!selectedListId"
            @click="handleAddToDeck(false)"
          >
            Add All ({{ cardCount }})
          </UButton>
        </template>
        <UButton
          v-else
          color="primary"
          variant="solid"
          :loading="loading"
          :disabled="!selectedListId"
          @click="handleAddToDeck(false)"
        >
          {{ hasDuplicates ? `Add All (${cardIds.length})` : 'Add to Deck' }}
        </UButton>
      </div>
    </template>
  </UModal>

  <LazyCreateDeckModal
    v-if="showCreateDeckModal"
    v-model:open="showCreateDeckModal"
    :card-ids="props.cardIds"
    :card-names="props.cardNames"
    @success="
      () => {
        showCreateDeckModal = false;
        isOpen = false;
        emit('success');
      }
    "
  />
</template>

<script setup lang="ts">
import type { Database } from '~/database.types';
import { useToast } from '#imports';
import { formatRelativeTimeShort } from '~/utils/dateFormatter';

import { useCardLists } from '~/composables/useCardLists';
import { useCardsByIds } from '~/composables/useCards';

const props = defineProps<{
  open: boolean;
  cardIds?: string[];
  cardNames?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

type CardListRow = Database['public']['Tables']['card_lists']['Row'];

const { userProfile } = useUserProfile();
const {
  userLists,
  addCardsToListMutation,
  addCardsByNameToListMutation,
  useListItems,
} = useCardLists();
const toast = useToast();

const cardIds = computed(() => props.cardIds ?? []);
const cardNames = computed(() => props.cardNames ?? []);
const cardCount = computed(
  () => cardIds.value.length || cardNames.value.length,
);

const modalTitle = computed(() => {
  const count = cardCount.value;
  return count === 1 ? 'Add 1 Card to Deck' : `Add ${count} Cards to Deck`;
});

const isLoggedIn = computed(() => Boolean(userProfile.value));
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const selectedListId = ref('');
const selectedListItem = ref<
  { label: string; value: string; description: string } | undefined
>(undefined);
const deckSearchTerm = ref('');
const errorMessage = ref('');
const showCreateDeckModal = ref(false);

const recentLists = computed(() => {
  if (!userLists.value) return [];
  return [...userLists.value].slice(0, 4);
});

function listName(list: CardListRow): string {
  return list.name?.trim() || 'Untitled Deck';
}

function listFormat(list: CardListRow): string {
  return list.format?.trim() || '';
}

function listDate(list: CardListRow): string {
  const date = list.updated_at || list.created_at;
  return date ? formatRelativeTimeShort(date) : '';
}

function listLabel(list: CardListRow): string {
  const name = list.name?.trim() || 'Untitled Deck';
  const format = list.format?.trim();
  return format ? `${name} · ${format}` : name;
}

const filteredDeckLabels = computed(() => {
  const searchLower = deckSearchTerm.value.trim().toLowerCase();
  const lists = userLists.value || [];
  return lists
    .filter((list) => {
      if (!searchLower) return true;
      return listLabel(list).toLowerCase().includes(searchLower);
    })
    .slice(0, 50)
    .map((list) => ({
      label: listName(list),
      value: list.id,
      description: [listFormat(list), listDate(list)]
        .filter(Boolean)
        .join(' · '),
    }));
});

function syncSelectedLabel() {
  const selected = (userLists.value || []).find(
    (list) => list.id === selectedListId.value,
  );
  selectedListItem.value = selected
    ? {
        label: listName(selected),
        value: selected.id,
        description: [listFormat(selected), listDate(selected)]
          .filter(Boolean)
          .join(' · '),
      }
    : undefined;
}

function handleSelectDeck(item: { label: string; value: string } | string) {
  selectedListId.value = typeof item === 'string' ? item : item.value;
  syncSelectedLabel();
}

function selectRecentList(listId: string) {
  selectedListId.value = listId;
  syncSelectedLabel();
}

const selectedList = computed(() =>
  (userLists.value || []).find((list) => list.id === selectedListId.value),
);

const selectedListIdRef = computed(() => selectedListId.value);
const { data: selectedListItems } = useListItems(selectedListIdRef);

const existingCardIdSet = computed(() => {
  if (!selectedListItems.value?.length) return new Set<string>();
  return new Set(selectedListItems.value.map((item) => item.card_id));
});

const duplicateCardIds = computed(() =>
  cardIds.value.filter((id) => existingCardIdSet.value.has(id)),
);

const newCardIds = computed(() =>
  cardIds.value.filter((id) => !existingCardIdSet.value.has(id)),
);

// Name-based duplicate detection (used when modal receives cardNames instead of cardIds)
const existingCardIds = computed(() =>
  (selectedListItems.value ?? [])
    .map((item) => item.card_id)
    .filter((id): id is string => !!id),
);
const { cards: existingListCards } = useCardsByIds(
  existingCardIds,
  'add-to-deck-names',
);
const existingCardNameSet = computed(() => {
  const cards = Array.isArray(existingListCards.value)
    ? existingListCards.value
    : [];
  if (!cards.length) return new Set<string>();
  return new Set((cards as any[]).map((c) => c.name as string));
});
const duplicateCardNames = computed(() =>
  cardNames.value.filter((name) => existingCardNameSet.value.has(name)),
);
const newCardNames = computed(() =>
  cardNames.value.filter((name) => !existingCardNameSet.value.has(name)),
);

// Unified counts that work for both ID-based and name-based adds
const effectiveDuplicateCount = computed(() =>
  cardNames.value.length > 0
    ? duplicateCardNames.value.length
    : duplicateCardIds.value.length,
);
const effectiveNewCount = computed(() =>
  cardNames.value.length > 0
    ? newCardNames.value.length
    : newCardIds.value.length,
);

const hasDuplicates = computed(() => effectiveDuplicateCount.value > 0);

const loading = computed(
  () =>
    addCardsToListMutation.isPending.value ||
    addCardsByNameToListMutation.isPending.value,
);

watch(isOpen, (opened) => {
  if (opened) {
    errorMessage.value = '';
    selectedListId.value = '';
    selectedListItem.value = undefined;
    deckSearchTerm.value = '';
    return;
  }

  errorMessage.value = '';
});

async function handleAddToDeck(onlyNew = false) {
  errorMessage.value = '';

  if (!selectedListId.value) {
    errorMessage.value = 'Pick a deck first.';
    return;
  }

  try {
    const deckName = selectedList.value?.name || 'deck';

    if (cardNames.value.length > 0) {
      const namesToAdd = onlyNew ? newCardNames.value : cardNames.value;
      const result = await addCardsByNameToListMutation.mutateAsync({
        listId: selectedListId.value,
        cardNames: namesToAdd,
      });
      const messages: string[] = [];
      if (result.addedCount > 0)
        messages.push(
          `Added ${result.addedCount} card${result.addedCount === 1 ? '' : 's'}`,
        );
      if (result.updatedCount > 0)
        messages.push(`${result.updatedCount} updated`);
      if (result.invalidCardNames?.length > 0)
        messages.push(`${result.invalidCardNames.length} not found`);
      toast.add({
        title: messages.join('. ') || `Cards added to ${deckName}`,
        icon: 'i-lucide-check',
      });
    } else {
      const idsToAdd = onlyNew ? newCardIds.value : cardIds.value;
      const result = await addCardsToListMutation.mutateAsync({
        listId: selectedListId.value,
        cardIds: idsToAdd,
      });
      const messages: string[] = [];
      if (result?.addedCount)
        messages.push(
          `Added ${result.addedCount} card${result.addedCount === 1 ? '' : 's'}`,
        );
      if (result?.updatedCount) messages.push(`${result.updatedCount} updated`);
      if (result?.invalidCardIds?.length)
        messages.push(`${result.invalidCardIds.length} not found`);
      toast.add({
        title: messages.join('. ') || `Cards added to ${deckName}`,
        icon: 'i-lucide-check',
      });
    }

    emit('success');
    isOpen.value = false;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add card to deck.';
    errorMessage.value = message;
  }
}
</script>
