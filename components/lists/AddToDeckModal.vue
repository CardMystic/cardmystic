<template>
  <UModal
    v-model:open="dialogOpen"
    :title="modalTitle"
    description="Pick a recently edited deck or search your decks by name."
  >
    <template #content>
      <div v-if="!isLoggedIn" class="p-4 space-y-3 text-center">
        <p class="text-lg">Add to your browser draft</p>
        <p class="text-sm text-muted">
          Build a deck without an account. Sign in when you're ready to save it.
        </p>
        <USelect
          v-if="guestDraftOptions.length > 1"
          v-model="guestActiveIndex"
          :items="guestDraftOptions"
          :disabled="!guestReady || addingToDraft"
          aria-label="Browser draft"
          class="w-full"
        />
        <p v-if="errorMessage" role="alert" class="text-error">
          {{ errorMessage }}
        </p>
        <p v-if="guestStorageError" role="alert" class="text-warning">
          {{ guestStorageError }}
        </p>
        <div class="flex flex-wrap justify-center gap-2">
          <UButton
            :loading="addingToDraft"
            :disabled="!guestReady"
            @click="addToDraft"
            >Add to browser draft</UButton
          >
          <UButton to="/build" variant="outline" @click="isOpen = false"
            >Open draft</UButton
          >
        </div>
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
          <AppInputMenu
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
          </AppInputMenu>
        </div>

        <UAlert
          v-if="hasDuplicates"
          color="warning"
          icon="i-lucide-triangle-alert"
          :title="`${effectiveDuplicateCount} of ${cardCount} card${cardCount === 1 ? '' : 's'} already in this deck`"
          description="Choose whether to add only the new cards or add all cards."
        />

        <span class="text-highlighted font-medium">{{ cardCount }}</span> card{{
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
          @click="
            () => {
              isOpen = false;
            }
          "
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
          {{ hasDuplicates ? `Add All (${cardCount})` : 'Add to Deck' }}
        </UButton>
      </div>
    </template>
  </UModal>

  <LazyCreateDeckModal
    v-if="showCreateDeckModal"
    v-model:open="showCreateDeckModal"
    :oracle-ids="props.oracleIds"
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
import type { DecklistSummary } from '~/models/cardListModel';
import { useToast } from '#imports';
import { formatRelativeTimeShort } from '~/utils/dateFormatter';

import { useCardLists, useMyDecklistsSearch } from '~/composables/useCardLists';
import { useCardsByOracleIds } from '~/composables/useCards';
import { refDebounced } from '~/utils/refDebounced';

const props = defineProps<{
  open: boolean;
  oracleIds?: string[];
  cardNames?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

type CardListRow = DecklistSummary;

const { userProfile } = useUserProfile();
const { addCardsToListMutation, addCardsByNameToListMutation, useListItems } =
  useCardLists();
const deckSearchTerm = ref('');
const debouncedDeckSearch = refDebounced(deckSearchTerm, 300);
const { decklists: searchedDecklists } =
  useMyDecklistsSearch(debouncedDeckSearch);
const { decklists: recentlyEditedDecklists } = useMyDecklistsSearch(ref(''));
const toast = useToast();
const cardEditToast = useCardEditToast();
const {
  addNames: addGuestNames,
  ready: guestReady,
  storageError: guestStorageError,
  activeIndex: guestActiveIndex,
  draftOptions: guestDraftOptions,
} = useGuestDeck();
const addingToDraft = ref(false);
const guestConfig = useRuntimeConfig();
async function addToDraft() {
  addingToDraft.value = true;
  errorMessage.value = '';
  try {
    let names = cardNames.value;
    if (oracleIds.value.length) {
      const resolved = await $fetch<{ name: string; oracle_id: string }[]>(
        `${guestConfig.public.backendPath}/cards/cards-by-oracle-ids`,
        { method: 'POST', body: { oracleIds: oracleIds.value } },
      );
      if (
        new Set(resolved.map((card) => card.oracle_id)).size !==
        new Set(oracleIds.value).size
      )
        throw new Error('Some cards could not be loaded. Please try again.');
      names = resolved.map((card) => card.name);
    }
    if (!names.length) throw new Error('No cards selected.');
    cardEditToast.notify('added', names.length);
    await addGuestNames(names);
    if (!guestStorageError.value) isOpen.value = false;
    emit('success');
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not add cards to draft.';
    toast.add({
      title: 'Could not add card',
      description: errorMessage.value,
      color: 'error',
    });
  } finally {
    addingToDraft.value = false;
  }
}

const oracleIds = computed(() => props.oracleIds ?? []);
const cardNames = computed(() => props.cardNames ?? []);
const cardCount = computed(
  () => oracleIds.value.length || cardNames.value.length,
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
// Hide immediately, but keep the component alive until the save settles so
// confirmed-success callbacks (such as clearing the clipboard) still run.
const submitted = ref(false);
const dialogOpen = computed({
  get: () => isOpen.value && !submitted.value,
  set: (value: boolean) => {
    isOpen.value = value;
  },
});

const selectedListId = ref('');
const selectedListItem = ref<
  { label: string; value: string; description: string } | undefined
>(undefined);
const errorMessage = ref('');
const showCreateDeckModal = ref(false);

// Keep quick picks independent of the search, including its selected label.
const recentLists = computed(() => recentlyEditedDecklists.value.slice(0, 4));

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

const filteredDeckLabels = computed(() =>
  searchedDecklists.value.map((list) => ({
    label: listName(list),
    value: list.id,
    description: [listFormat(list), listDate(list)].filter(Boolean).join(' · '),
  })),
);

function syncSelectedLabel() {
  const selected = [...searchedDecklists.value, ...recentLists.value].find(
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

const selectedListIdRef = computed(() => selectedListId.value);
const { data: selectedListItems } = useListItems(selectedListIdRef);

const existingOracleIdSet = computed(() => {
  if (!selectedListItems.value?.length) return new Set<string>();
  return new Set(
    selectedListItems.value
      .map((item) => item.oracle_id)
      .filter((id): id is string => !!id),
  );
});

const duplicateOracleIds = computed(() =>
  oracleIds.value.filter((id) => existingOracleIdSet.value.has(id)),
);

const newOracleIds = computed(() =>
  oracleIds.value.filter((id) => !existingOracleIdSet.value.has(id)),
);

// Name-based duplicate detection (used when modal receives cardNames instead of cardIds)
const existingOracleIds = computed(() =>
  (selectedListItems.value ?? [])
    .map((item) => item.oracle_id)
    .filter((id): id is string => !!id),
);
const { cards: existingListCards } = useCardsByOracleIds(
  existingOracleIds,
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
    : duplicateOracleIds.value.length,
);
const effectiveNewCount = computed(() =>
  cardNames.value.length > 0
    ? newCardNames.value.length
    : newOracleIds.value.length,
);

const hasDuplicates = computed(
  () => !submitted.value && effectiveDuplicateCount.value > 0,
);

const loading = computed(
  () =>
    addCardsToListMutation.isPending.value ||
    addCardsByNameToListMutation.isPending.value,
);

watch(isOpen, (opened) => {
  if (opened) {
    submitted.value = false;
    errorMessage.value = '';
    selectedListId.value = '';
    selectedListItem.value = undefined;
    deckSearchTerm.value = '';
    return;
  }

  errorMessage.value = '';
});

async function handleAddToDeck(onlyNew = false) {
  if (loading.value || submitted.value) return;
  errorMessage.value = '';

  if (!selectedListId.value) {
    errorMessage.value = 'Pick a deck first.';
    return;
  }

  const listId = selectedListId.value;
  const namesToAdd = [...(onlyNew ? newCardNames.value : cardNames.value)];
  const idsToAdd = [...(onlyNew ? newOracleIds.value : oracleIds.value)];
  const useNames = cardNames.value.length > 0;
  submitted.value = true;
  cardEditToast.notify('added', useNames ? namesToAdd.length : idsToAdd.length);

  try {
    if (useNames) {
      const result = await addCardsByNameToListMutation.mutateAsync({
        listId,
        cardNames: namesToAdd,
      });
      if (result.invalidCardNames?.length)
        throw new Error(`Could not add: ${result.invalidCardNames.join(', ')}`);
    } else {
      const result = await addCardsToListMutation.mutateAsync({
        listId,
        oracleIds: idsToAdd,
      });
      if (result?.invalidOracleIds?.length)
        throw new Error('Some cards could not be added. Please try again.');
    }

    emit('success');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to add card to deck.';
    errorMessage.value = message;
    toast.add({
      title: 'Could not add card',
      description: message,
      color: 'error',
    });
  } finally {
    isOpen.value = false;
  }
}
</script>
