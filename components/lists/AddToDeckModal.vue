<template>
  <UModal v-model:open="isOpen" :title="`Add ${cardName} to Deck`"
    description="Pick a recently edited deck or search your decks by name.">
    <template #content>
      <div v-if="!isLoggedIn" class="p-4 space-y-3 text-center">
        <p class="text-lg">Login To Create Decks!</p>
        <UButton to="/login" color="primary" variant="solid">Log In</UButton>
      </div>

      <div v-else class="p-4 space-y-4">
        <div v-if="recentLists.length > 0" class="space-y-2">
          <div class="text-sm font-medium">Recently Edited Decks</div>
          <div class="flex flex-wrap gap-2">
            <UButton v-for="list in recentLists" :key="list.id" color="primary"
              :variant="selectedListId === list.id ? 'solid' : 'outline'" size="sm" class="cursor-pointer"
              @click="selectRecentList(list.id)">
              <span class="flex flex-col items-start leading-tight">
                <span>{{ listName(list) }}</span>
                <span class="text-xs opacity-70">{{ [listFormat(list), listDate(list)].filter(Boolean).join(' · ') }}</span>
              </span>
            </UButton>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium">Search Decks</div>
          <UInputMenu v-model="selectedListItem" v-model:search-term="deckSearchTerm" :items="filteredDeckLabels"
            placeholder="Find a deck..." icon="i-lucide-search" class="w-full" @update:model-value="handleSelectDeck">
            <template #item="{ item }">
              <div class="flex flex-col leading-tight py-0.5">
                <span>{{ item.label }}</span>
                <span v-if="item.description" class="text-xs text-muted/70">{{ item.description }}</span>
              </div>
            </template>
          </UInputMenu>
        </div>

        <div v-if="selectedList" class="rounded-lg border border-secondary/40 bg-elevated/40 px-3 py-2 text-sm">
          <div class="font-medium">Selected Deck</div>
          <div class="text-muted">{{ listName(selectedList) }}</div>
          <div class="text-xs text-muted/70">{{ [listFormat(selectedList), listDate(selectedList)].filter(Boolean).join(' · ') }}</div>
        </div>

        <UAlert v-if="alreadyInSelectedDeck" color="warning" icon="i-lucide-triangle-alert"
          title="Card already in this deck" description="Adding it again will increase the copies in that deck." />

        <div v-if="errorMessage" class="text-sm text-red-400">
          {{ errorMessage }}
        </div>
      </div>

      <div class="mx-2 my-2 flex justify-end gap-2" v-if="isLoggedIn">
        <UButton color="neutral" variant="outline" :disabled="loading" @click="isOpen = false">
          Cancel
        </UButton>
        <UButton color="primary" variant="solid" :loading="loading" :disabled="!selectedListId"
          @click="handleAddToDeck">
          Add to Deck
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Database } from '~/database.types';
import { useToast } from '#imports';
import { formatRelativeTimeShort } from '~/utils/dateFormatter';

import { useCardLists } from '~/composables/useCardLists';

const props = defineProps<{
  open: boolean;
  cardId: string;
  cardName: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

type CardListRow = Database['public']['Tables']['card_lists']['Row'];

const { userProfile } = useUserProfile();
const { userLists, addCardsToListMutation, useListItems } = useCardLists();
const toast = useToast();

const isLoggedIn = computed(() => Boolean(userProfile.value));
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const selectedListId = ref('');
const selectedListItem = ref<{ label: string; value: string; description: string } | undefined>(undefined);
const deckSearchTerm = ref('');
const errorMessage = ref('');

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
      description: [listFormat(list), listDate(list)].filter(Boolean).join(' · '),
    }));
});

function syncSelectedLabel() {
  const selected = (userLists.value || []).find((list) => list.id === selectedListId.value);
  selectedListItem.value = selected
    ? {
        label: listName(selected),
        value: selected.id,
        description: [listFormat(selected), listDate(selected)].filter(Boolean).join(' · '),
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
  (userLists.value || []).find((list) => list.id === selectedListId.value)
);

const selectedListIdRef = computed(() => selectedListId.value);
const { data: selectedListItems } = useListItems(selectedListIdRef);

const alreadyInSelectedDeck = computed(() => {
  if (!selectedListItems.value?.length) return false;
  return selectedListItems.value.some((item) => item.card_id === props.cardId);
});

const loading = computed(() => addCardsToListMutation.isPending.value);

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

async function handleAddToDeck() {
  errorMessage.value = '';

  if (!selectedListId.value) {
    errorMessage.value = 'Pick a deck first.';
    return;
  }

  try {
    const result = await addCardsToListMutation.mutateAsync({
      listId: selectedListId.value,
      cardIds: [props.cardId],
    });

    const title = alreadyInSelectedDeck.value
      ? `${props.cardName} count updated in ${selectedList.value?.name || 'deck'}`
      : `${props.cardName} added to ${selectedList.value?.name || 'deck'}`;

    toast.add({
      title,
      icon: 'i-lucide-check',
    });

    void result;
    isOpen.value = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add card to deck.';
    errorMessage.value = message;
  }
}
</script>
