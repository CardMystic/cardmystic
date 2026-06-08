<template>
  <div
    class="mx-auto py-8 relative z-10"
    :class="{ 'pb-24': showStickyFooter }"
  >
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-20 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"
      ></div>
    </div>

    <CardListBanner :list="list" :is-loading="isLoadingLists" />

    <!-- Actions + Add Card -->
    <div v-if="list" class="mb-2">
      <div class="flex flex-wrap items-center justify-between">
        <div class="flex gap-2 mb-2">
          <UTooltip text="Copy card names">
            <UButton
              icon="i-lucide-copy"
              color="primary"
              variant="outline"
              @click="copyCardNames"
              :disabled="!cards || cards.length === 0"
              class="cursor-pointer"
              label="Copy"
            />
          </UTooltip>
          <UTooltip text="Bulk edit cards">
            <UButton
              icon="i-lucide-list-plus"
              color="primary"
              variant="outline"
              @click="isBulkEditModalOpen = true"
              class="cursor-pointer"
              label="Bulk Edit"
            />
          </UTooltip>
          <UButton
            icon="i-heroicons-shopping-cart"
            color="success"
            variant="solid"
            :label="`Buy ($${totalPrice.toFixed(2)})`"
            @click="openMassEntry"
            :disabled="!cards || cards.length === 0"
            class="cursor-pointer"
          />
        </div>
        <div>
          <UInputMenu
            v-model="selectedCardToAdd"
            v-model:search-term="addCardSearchTerm"
            :loading="addCardLoading"
            :items="filteredAddCards"
            placeholder="Search for a card to add..."
            icon="i-lucide-plus"
            class="flex-1 min-w-90 cursor-pointer"
            @update:model-value="handleAddCard"
          />
        </div>
      </div>
    </div>

    <!-- Deck Recommender -->
    <div v-if="list && cards && cards.length > 0" class="mb-2">
      <div class="flex gap-2 items-center">
        <UInput
          v-model="recommendDescription"
          placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations."
          icon="i-lucide-box"
          class="flex-1"
          :ui="{ base: 'text-sm h-8' }"
          size="sm"
          @keydown.enter="goToRecommend"
        />
        <UButton
          icon="i-lucide-box"
          color="primary"
          variant="solid"
          label="Recommend"
          @click="goToRecommend"
          class="cursor-pointer h-8"
          size="sm"
        />
      </div>
    </div>

    <!-- Group By + Sort (centered) -->
    <div
      v-if="list && cards && cards.length > 0"
      class="mb-4 flex flex-wrap items-center justify-center gap-2"
    >
      <GroupBy default-value="type" @update:groupBy="handleGroupBy" />
      <Sort default-sort-by="cmc" @sort="handleSort" />
    </div>

    <!-- Cards Results -->
    <ClientOnly>
      <CardListResults
        ref="cardListResultsRef"
        class="mb-8"
        :isLoading="loading"
        :groups="cardGroups"
        :commander-oracle-ids="commanderOracleIds"
        :commander-color-identity="commanderColorIdentity"
        :list-items-map="listItemsMap"
        :format="list?.format"
        :sideboard-groups="sideboardGroups"
        :considering-groups="consideringGroups"
        :decklist-card-names="decklistCardNames"
        @removeCard="handleRemoveCard"
        @setCommander="handleSetCommander"
        @clearCommander="handleClearCommander"
        @updateNumCopies="handleUpdateNumCopies"
        @changeBoard="handleChangeBoard"
      />
      <template #fallback>
        <CardListResultsSkeleton />
      </template>
    </ClientOnly>
  </div>

  <!-- Bulk Edit Modal -->
  <BulkAddCardsModal
    v-model:open="isBulkEditModalOpen"
    :list-id="listId"
    :mainboard-names="mainboardNames"
    :sideboard-names="sideboardNames"
    :considering-names="consideringNames"
  />

  <!-- Duplicate Card Confirmation Modal -->
  <UModal v-model:open="showDuplicateModal" title="Card Already in List">
    <template #body>
      <p class="text-sm" v-if="pendingDuplicateCard">
        <span class="font-bold">{{ pendingDuplicateCard.name }}</span> is
        already in
        <span class="font-bold">{{ pendingDuplicateCard.board }}</span> with
        <span class="font-bold">{{ pendingDuplicateCard.numCopies }}</span>
        {{ pendingDuplicateCard.numCopies === 1 ? 'copy' : 'copies' }}. Would
        you like to add another copy?
      </p>
    </template>
    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="close"
        />
        <UButton label="Yes" color="primary" @click="confirmAddDuplicate" />
      </div>
    </template>
  </UModal>

  <BackToTop />

  <StickyActionFooter :show="showStickyFooter">
    <template #left>
      <DeckStats
        :card-count="mainDeckCardCount"
        :total-price="totalPrice"
        @buy="openMassEntry"
      />
    </template>
    <template #right>
      <JumpTo
        :groups="jumpToGroups"
        :board-sections="jumpToBoardSections"
        @jump-board="handleJumpBoard"
      />
    </template>
  </StickyActionFooter>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

import { useCardLists } from '~/composables/useCardLists';
import { useCardNames } from '~/composables/useBulkData';
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer';
import { useToast } from '#imports';
import { refDebounced } from '~/utils/refDebounced';
import { groupAndSortCards } from '~/utils/sort';

const route = useRoute();
const listId = route.params.id as string;
const toast = useToast();

const {
  userLists,
  isLoadingLists,
  useListItems,
  useListCards,
  removeCardFromListMutation,
  addCardsToListMutation,
  setCommanderMutation,
  clearCommanderMutation,
  updateListAvatarMutation,
  updateNumCopiesMutation,
  changeBoardMutation,
} = useCardLists();

const list = computed(() => userLists.value?.find((l: any) => l.id === listId));

// Banner background image URL
const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name;
  if (!cardName) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
});

// Add card state
const selectedCardToAdd = ref('');
const addCardSearchTerm = ref('');
const debouncedAddCardSearchTerm = refDebounced(addCardSearchTerm, 150);
const addCardLoading = ref(false);
const error = ref('');

// Duplicate card confirmation state
const showDuplicateModal = ref(false);
const pendingDuplicateCard = ref<{
  name: string;
  id: string;
  board: string;
  numCopies: number;
} | null>(null);

// Use TanStack Query for list items
const { data: listItems, isLoading: isLoadingItems } = useListItems(listId);

// Computed oracle IDs from list items — used as dependency for card details query.
// The `card_id` column on `card_list_items` stores oracle_id post-cutover.
const oracleIds = computed(
  () => listItems.value?.map((item: any) => item.oracle_id) || [],
);

type Board = 'Mainboard' | 'Sideboard' | 'Considering';
type RowInfo = { num_copies: number };

// Nested by board so the same oracle_id can appear in multiple boards.
const listItemsMap = computed<Record<Board, Record<string, RowInfo>>>(() => {
  const map: Record<Board, Record<string, RowInfo>> = {
    Mainboard: {},
    Sideboard: {},
    Considering: {},
  };
  if (listItems.value) {
    for (const item of listItems.value) {
      if (!item.oracle_id) continue;
      const board = (item.board ?? 'Mainboard') as Board;
      map[board][item.oracle_id] = { num_copies: item.num_copies ?? 1 };
    }
  }
  return map;
});

// Use TanStack Query to fetch card details
const {
  data: cardsData,
  isLoading: isLoadingCards,
  isFetching: isFetchingCards,
} = useListCards(listId, oracleIds);

const cards = computed(() => cardsData.value || []);

// Fast lookup: oracle_id → representative card object (one per oracle, reused across boards).
const cardsByOracleId = computed(() => {
  const m: Record<string, any> = {};
  for (const c of cards.value) m[c.card_data.oracle_id] = c;
  return m;
});

function boardCards(board: Board): any[] {
  return Object.keys(listItemsMap.value[board])
    .map((oid) => cardsByOracleId.value[oid])
    .filter(Boolean);
}

function boardCopiesMap(board: Board): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [oid, r] of Object.entries(listItemsMap.value[board])) {
    out[oid] = r.num_copies;
  }
  return out;
}

function findRowAnyBoard(
  oracleId: string,
): { board: Board; row: RowInfo } | null {
  for (const board of ['Mainboard', 'Sideboard', 'Considering'] as Board[]) {
    const row = listItemsMap.value[board][oracleId];
    if (row) return { board, row };
  }
  return null;
}
const decklistCardNames = computed(() =>
  cards.value.map((c: any) => c.card_data.name),
);

// Show loading when lists/items are loading, cards query is loading/fetching,
// or items have loaded with card IDs but card data hasn't arrived yet
const loading = computed(
  () =>
    isLoadingLists.value ||
    isLoadingItems.value ||
    isLoadingCards.value ||
    (oracleIds.value.length > 0 && cards.value.length === 0),
);

// Sorting + grouping state
const sortBy = ref<string | undefined>('cmc');
const sortDirection = ref<'asc' | 'desc'>('asc');
const groupBy = ref<string | undefined>('type');

function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

function handleGroupBy(value: string | undefined) {
  groupBy.value = value;
}

// Handle removing a card from the list
async function handleRemoveCard(
  oracleId: string,
  fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
) {
  try {
    if (!listId || !oracleId) {
      throw new Error('Cannot remove card: missing listId or oracleId');
    }
    await removeCardFromListMutation.mutateAsync({
      listId,
      oracleId,
      board: fromBoard,
    });
    toast.add({
      title: 'Card removed from list',
      icon: 'i-lucide-check',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error removing card',
      description: error.message,
      color: 'error',
    });
  }
}

// Computed grouped + sorted results - commanders always first (outside groups)
const cardGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) {
    return null;
  }

  const ids = commanderOracleIds.value;
  const allMainboard = boardCards('Mainboard');
  const mainboardCards =
    ids.length > 0
      ? allMainboard.filter((c: any) => !ids.includes(c.card_data.oracle_id))
      : allMainboard;

  const groups = groupAndSortCards(
    mainboardCards,
    groupBy.value,
    sortBy.value,
    sortDirection.value,
    boardCopiesMap('Mainboard'),
  );

  // Prepend commanders as their own group if present
  const commanderCards = allMainboard.filter((c: any) =>
    ids.includes(c.card_data.oracle_id),
  );
  if (commanderCards.length > 0) {
    const commanderGroup = { label: '', cards: commanderCards };
    return groups ? [commanderGroup, ...groups] : [commanderGroup];
  }

  return groups;
});

const sideboardGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) return null;
  const sideboardCards = boardCards('Sideboard');
  if (sideboardCards.length === 0) return null;
  return groupAndSortCards(
    sideboardCards,
    groupBy.value,
    sortBy.value,
    sortDirection.value,
    boardCopiesMap('Sideboard'),
  );
});

const consideringGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) return null;
  const consideringCards = boardCards('Considering');
  if (consideringCards.length === 0) return null;
  return groupAndSortCards(
    consideringCards,
    groupBy.value,
    sortBy.value,
    sortDirection.value,
    boardCopiesMap('Considering'),
  );
});

const jumpToGroups = computed(() => {
  if (!cardGroups.value) return [];
  return cardGroups.value.filter((g) => g.label).map((g) => g.label);
});

const jumpToBoardSections = computed(() => {
  const sections: string[] = [];
  if (cardGroups.value && cardGroups.value.length > 0)
    sections.push('Mainboard');
  if (sideboardGroups.value && sideboardGroups.value.length > 0)
    sections.push('Sideboard');
  if (consideringGroups.value && consideringGroups.value.length > 0)
    sections.push('Considering');
  return sections;
});

const showStickyFooter = computed(() => {
  return (
    totalCardCount.value > 0 ||
    jumpToGroups.value.length > 0 ||
    jumpToBoardSections.value.length > 1
  );
});

const cardListResultsRef = ref<{
  expandBoard: (board: 'Sideboard' | 'Considering') => void;
} | null>(null);

function handleJumpBoard(board: string) {
  if (board === 'Sideboard' || board === 'Considering') {
    cardListResultsRef.value?.expandBoard(board);
  }
}

// Filter cards for add card autocomplete
const filteredAddCards = computed(() => {
  if (
    !debouncedAddCardSearchTerm.value ||
    debouncedAddCardSearchTerm.value.length < 2
  ) {
    return [];
  }

  const searchLower = debouncedAddCardSearchTerm.value.toLowerCase();
  const filtered: string[] = [];

  const cards = rawCards.value ?? [];

  for (let i = 0; i < cards.length && filtered.length < 100; i++) {
    const card = cards[i];
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card);
    }
  }

  return filtered;
});

// Handle adding a card to the list
async function handleAddCard(cardName: string) {
  if (!cardName || !list.value) return;

  addCardLoading.value = true;
  try {
    const config = useRuntimeConfig();
    const cardData: any = await $fetch(
      `${config.public.backendUrl}/cards/name/${encodeURIComponent(cardName)}`,
    );

    if (!cardData?.id) {
      throw new Error('Card not found');
    }

    // Check if card already exists in any board (uniqueness is per (oracle_id, board) now)
    const existing = findRowAnyBoard(cardData.oracle_id);
    if (existing) {
      pendingDuplicateCard.value = {
        name: cardName,
        id: cardData.oracle_id,
        board: existing.board,
        numCopies: existing.row.num_copies,
      };
      showDuplicateModal.value = true;
      selectedCardToAdd.value = '';
      addCardSearchTerm.value = '';
      return;
    }

    await addCardsToListMutation.mutateAsync({
      listId: list.value.id,
      cardIds: [cardData.id],
    });

    toast.add({
      title: `Added ${cardName} to list`,
      icon: 'i-lucide-check',
    });

    selectedCardToAdd.value = '';
    addCardSearchTerm.value = '';
  } catch (error: any) {
    toast.add({
      title: 'Error adding card',
      description: error.message,
      color: 'error',
    });
    selectedCardToAdd.value = '';
    addCardSearchTerm.value = '';
  } finally {
    addCardLoading.value = false;
  }
}

async function confirmAddDuplicate() {
  if (!pendingDuplicateCard.value || !list.value) return;
  try {
    await updateNumCopiesMutation.mutateAsync({
      listId: list.value.id,
      cardName: pendingDuplicateCard.value.name,
      numCopies: pendingDuplicateCard.value.numCopies + 1,
      fromBoard: pendingDuplicateCard.value.board as
        | 'Mainboard'
        | 'Sideboard'
        | 'Considering',
    });
    toast.add({
      title: `Added another copy of ${pendingDuplicateCard.value.name}`,
      icon: 'i-lucide-check',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error adding copy',
      description: error.message,
      color: 'error',
    });
  } finally {
    showDuplicateModal.value = false;
    pendingDuplicateCard.value = null;
  }
}

// Bulk edit state
const isBulkEditModalOpen = ref(false);

function boardLines(board: 'Mainboard' | 'Sideboard' | 'Considering') {
  if (!listItems.value || listItems.value.length === 0) return [];
  const lines: string[] = [];
  for (const item of listItems.value) {
    if (!item.oracle_id) continue;
    if ((item.board ?? 'Mainboard') !== board) continue;
    const card = cardsByOracleId.value[item.oracle_id];
    if (!card) continue;
    const copies = item.num_copies ?? 1;
    const name = card.card_data.name;
    lines.push(copies > 1 ? `${copies} ${name}` : name);
  }
  return lines;
}

const mainboardNames = computed(() => boardLines('Mainboard'));
const sideboardNames = computed(() => boardLines('Sideboard'));
const consideringNames = computed(() => boardLines('Considering'));

// Recommend state
const recommendDescription = ref('');
const router = useRouter();
const { saveSearchMutation } = useSearchHistory();

function goToRecommend() {
  if (!cards.value || cards.value.length === 0) return;
  const decklist = cards.value
    .map((card: any) => card.card_data.name)
    .join('\n');
  const query: Record<string, any> = {
    decklist,
    searchType: 'recommend',
  };
  if (recommendDescription.value.trim()) {
    query.description = recommendDescription.value.trim();
  }
  const commanderNamesList = currentCommanderItems.value
    .map((item: any) => {
      const card = cards.value.find(
        (c: any) => c.card_data.oracle_id === item.oracle_id,
      );
      return card?.card_data?.name;
    })
    .filter(Boolean);
  if (commanderNamesList.length > 0) {
    query.commander = commanderNamesList[0];
  }
  if (commanderNamesList.length > 1) {
    query.partnerCommander = commanderNamesList[1];
  }

  router.push({ path: '/search/all/deckbuilder', query });
  queueMicrotask(() => {
    saveSearchMutation.mutate({
      query: recommendDescription.value.trim() || '',
      searchType: 'recommend',
      filters: {
        commander: commanderNamesList[0] || undefined,
        partnerCommander: commanderNamesList[1] || undefined,
        decklist: decklist || undefined,
      },
    });
  });
}

const { data: rawCards, status: cardsQueryStatus } = useCardNames();
const cardsStatus = computed(() =>
  cardsQueryStatus.value === 'pending' ? 'pending' : 'success',
);

// Commander autocomplete
const setCommanderLoading = ref(false);

// Find the current commanders from list items (up to 2 for partner)
const currentCommanderItems = computed(() => {
  return (
    listItems.value?.filter((item: any) => item.is_commander === true) || []
  );
});

const commanderOracleIds = computed(() => {
  return currentCommanderItems.value.map((item: any) => item.oracle_id);
});

const currentCommanderName = computed(() => {
  if (currentCommanderItems.value.length === 0 || !cards.value) return null;
  const first = currentCommanderItems.value[0];
  const card = cards.value.find(
    (c: any) => c.card_data.oracle_id === first.oracle_id,
  );
  return card?.card_data?.name || null;
});

const commanderColorIdentity = computed(() => {
  if (currentCommanderItems.value.length === 0 || !cards.value) return null;
  const colors = new Set<string>();
  for (const item of currentCommanderItems.value) {
    const card = cards.value.find(
      (c: any) => c.card_data.oracle_id === item.oracle_id,
    );
    if (card?.card_data?.color_identity) {
      for (const c of card.card_data.color_identity) {
        colors.add(c);
      }
    }
  }
  return colors.size > 0 ? [...colors] : null;
});

async function handleSetCommander(commanderName: string) {
  if (!commanderName || !list.value) return;

  setCommanderLoading.value = true;
  try {
    await setCommanderMutation.mutateAsync({
      listId: list.value.id,
      commanderName,
    });

    // Set the list image to the commander if no image has been set
    if (!list.value.avatar_card_name) {
      await updateListAvatarMutation.mutateAsync({
        listId: list.value.id,
        cardName: commanderName,
      });
    }

    toast.add({
      title: `${commanderName} set as commander`,
      icon: 'i-lucide-crown',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error setting commander',
      description: error.message,
      color: 'error',
    });
  } finally {
    setCommanderLoading.value = false;
  }
}

async function handleClearCommander(oracleId: string) {
  if (!list.value) return;

  setCommanderLoading.value = true;
  try {
    await clearCommanderMutation.mutateAsync({
      listId: list.value.id,
      oracleId,
    });

    toast.add({
      title: 'Commander cleared',
      icon: 'i-lucide-check',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error clearing commander',
      description: error.message,
      color: 'error',
    });
  } finally {
    setCommanderLoading.value = false;
  }
}

async function handleUpdateNumCopies(
  cardName: string,
  numCopies: number,
  fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
) {
  if (!list.value) return;
  try {
    await updateNumCopiesMutation.mutateAsync({
      listId: list.value.id,
      cardName,
      numCopies,
      fromBoard,
    });
  } catch (error: any) {
    toast.add({
      title: 'Error updating quantity',
      description: error.message,
      color: 'error',
    });
  }
}

async function handleChangeBoard(
  cardName: string,
  board: 'Mainboard' | 'Sideboard' | 'Considering',
  fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
) {
  if (!list.value) return;
  try {
    const response = await changeBoardMutation.mutateAsync({
      listId: list.value.id,
      cardName,
      board,
      fromBoard,
    });
    const merged = response?.message?.toLowerCase().includes('merged') ?? false;
    toast.add({
      title: response?.message ?? `Moved ${cardName} to ${board}`,
      icon: merged ? 'i-lucide-merge' : 'i-lucide-check',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error changing board',
      description: error.message,
      color: 'error',
    });
  }
}

const totalPrice = computed(() => {
  if (!listItems.value || listItems.value.length === 0) return 0;
  let sum = 0;
  for (const item of listItems.value) {
    if (!item.oracle_id) continue;
    const card = cardsByOracleId.value[item.oracle_id];
    const price = card?.card_data?.prices?.usd;
    if (price) sum += parseFloat(price) * (item.num_copies ?? 1);
  }
  return sum;
});

const totalCardCount = computed(() => {
  if (!listItems.value || listItems.value.length === 0) return 0;
  return listItems.value.reduce(
    (sum: number, item: any) => sum + (item.num_copies ?? 1),
    0,
  );
});

const mainDeckCardCount = computed(() => {
  if (!listItems.value || listItems.value.length === 0) return 0;
  return listItems.value.reduce((sum: number, item: any) => {
    const board = item.board ?? 'Mainboard';
    return board === 'Mainboard' ? sum + (item.num_copies ?? 1) : sum;
  }, 0);
});

function copyCardNames() {
  if (!listItems.value || listItems.value.length === 0) return;
  const lines: string[] = [];
  for (const item of listItems.value) {
    if (!item.oracle_id) continue;
    const card = cardsByOracleId.value[item.oracle_id];
    if (!card) continue;
    const copies = item.num_copies ?? 1;
    lines.push(
      copies > 1 ? `${copies} ${card.card_data.name}` : card.card_data.name,
    );
  }
  navigator.clipboard?.writeText(lines.join('\n'));
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check',
  });
}
function openMassEntry() {
  if (!listItems.value || listItems.value.length === 0) return;
  const names: string[] = [];
  for (const item of listItems.value) {
    if (!item.oracle_id) continue;
    const card = cardsByOracleId.value[item.oracle_id];
    if (!card) continue;
    const copies = item.num_copies ?? 1;
    for (let i = 0; i < copies; i++) names.push(card.card_data.name);
  }
  const url = getMassEntryAffiliateLink(names);
  window.open(url, '_blank', 'noopener,noreferrer');
}

onMounted(() => {
  // Check if list exists after data loads
  watch(
    list,
    (newList) => {
      if (!isLoadingLists.value && !newList) {
        error.value = 'List not found';
      }
    },
    { immediate: true },
  );
});
</script>
