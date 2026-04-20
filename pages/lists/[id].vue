<template>
  <div class="container mx-auto px-4 py-8 relative z-10">
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-20 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"></div>
    </div>

    <CardListBanner :list="list" :is-loading="isLoadingLists" />

    <!-- Actions + Add Card -->
    <div v-if="list" class="mb-2">
      <div class="flex flex-wrap items-center justify-between">
        <div class="flex gap-2 mb-2">
          <UTooltip text="Copy card names">
            <UButton icon="i-lucide-copy" color="primary" variant="outline" @click="copyCardNames"
              :disabled="!cards || cards.length === 0" class="cursor-pointer" label="Copy" />
          </UTooltip>
          <UTooltip text="Bulk edit cards">
            <UButton icon="i-lucide-list-plus" color="primary" variant="outline" @click="isBulkEditModalOpen = true"
              class="cursor-pointer" label="Bulk Edit" />
          </UTooltip>
          <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid"
            :label="`Buy ($${totalPrice.toFixed(2)})`" @click="openMassEntry" :disabled="!cards || cards.length === 0"
            class="cursor-pointer" />
        </div>
        <div>
          <UInputMenu v-model="selectedCardToAdd" v-model:search-term="addCardSearchTerm" :loading="addCardLoading"
            :items="filteredAddCards" placeholder="Search for a card to add..." icon="i-lucide-plus"
            class="flex-1 min-w-90 cursor-pointer" @update:model-value="handleAddCard" />
        </div>

      </div>
    </div>

    <!-- Deck Recommender -->
    <div v-if="list && cards && cards.length > 0" class="mb-2">
      <div class="flex gap-2 items-center">
        <UInput v-model="recommendDescription"
          placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations."
          icon="i-lucide-box" class="flex-1" :ui="{ base: 'text-sm h-8' }" size="sm" @keydown.enter="goToRecommend" />
        <UButton icon="i-lucide-box" color="primary" variant="solid" label="Recommend" @click="goToRecommend"
          class="cursor-pointer h-8" size="sm" />
      </div>
    </div>

    <!-- Group By + Sort (centered) -->
    <div v-if="list && cards && cards.length > 0" class="mb-4 flex flex-wrap items-center justify-center gap-2">
      <GroupBy default-value="type" @update:groupBy="handleGroupBy" />
      <Sort default-sort-by="cmc" @sort="handleSort" />
    </div>

    <!-- Cards Results -->
    <ClientOnly>
      <CardListResults ref="cardListResultsRef" class="mb-8" :isLoading="loading" :groups="cardGroups"
        :skeletonCount="20" :commander-card-ids="commanderCardIds" :commander-color-identity="commanderColorIdentity"
        :list-items-map="listItemsMap" :format="list?.format" :sideboard-groups="sideboardGroups"
        :considering-groups="consideringGroups" @removeCard="handleRemoveCard" @setCommander="handleSetCommander"
        @clearCommander="handleClearCommander" @updateNumCopies="handleUpdateNumCopies"
        @changeBoard="handleChangeBoard" />
      <template #fallback>
        <div class="mt-3 w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          <CardSkeleton v-for="i in 20" :key="`skeleton-${i}`" :showCardInfo="true" />
        </div>
      </template>
    </ClientOnly>
  </div>

  <!-- Bulk Edit Modal -->
  <BulkAddCardsModal v-model:open="isBulkEditModalOpen" :list-id="listId" :current-card-names="currentCardNames" />

  <!-- Duplicate Card Confirmation Modal -->
  <UModal v-model:open="showDuplicateModal" title="Card Already in List">
    <template #body>
      <p class="text-sm" v-if="pendingDuplicateCard">
        <span class="font-bold">{{ pendingDuplicateCard.name }}</span> is already in
        <span class="font-bold">{{ pendingDuplicateCard.board }}</span> with
        <span class="font-bold">{{ pendingDuplicateCard.numCopies }}</span>
        {{ pendingDuplicateCard.numCopies === 1 ? 'copy' : 'copies' }}.
        Would you like to add another copy?
      </p>
    </template>
    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
        <UButton label="Yes" color="primary" @click="confirmAddDuplicate" />
      </div>
    </template>
  </UModal>

  <BackToTop />

  <DeckStats :card-count="totalCardCount" :total-price="totalPrice" @buy="openMassEntry" />

  <JumpTo :groups="jumpToGroups" :board-sections="jumpToBoardSections" @jump-board="handleJumpBoard" />


</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { useCardLists } from '~/composables/useCardLists'
import { useCardNames } from '~/composables/useBulkData'
import { useClipboard } from '@vueuse/core'
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer'
import { useToast } from '#imports'
import { refDebounced } from '@vueuse/core'
import { groupAndSortCards } from '~/utils/sort'

const route = useRoute()
const listId = route.params.id as string
const toast = useToast()
const { copy } = useClipboard()

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
} = useCardLists()

const list = computed(() => userLists.value?.find((l: any) => l.id === listId))

// Banner background image URL
const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name
  if (!cardName) return null
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`
})

// Add card state
const selectedCardToAdd = ref('')
const addCardSearchTerm = ref('')
const debouncedAddCardSearchTerm = refDebounced(addCardSearchTerm, 150)
const addCardLoading = ref(false)
const error = ref('')

// Duplicate card confirmation state
const showDuplicateModal = ref(false)
const pendingDuplicateCard = ref<{ name: string; id: string; board: string; numCopies: number } | null>(null)

// Use TanStack Query for list items
const { data: listItems, isLoading: isLoadingItems } = useListItems(listId)

// Computed card IDs from list items - used as dependency for card details query
const cardIds = computed(() => listItems.value?.map((item: any) => item.card_id) || [])

// Map card_id to list item metadata (num_copies, board)
const listItemsMap = computed(() => {
  const map: Record<string, { num_copies: number; board: string }> = {}
  if (listItems.value) {
    for (const item of listItems.value) {
      if (!item.card_id) continue
      map[item.card_id] = {
        num_copies: item.num_copies ?? 1,
        board: item.board ?? 'Mainboard',
      }
    }
  }
  return map
})

const copiesMap = computed(() => {
  const map: Record<string, number> = {}
  for (const [id, item] of Object.entries(listItemsMap.value)) {
    map[id] = item.num_copies
  }
  return map
})

// Use TanStack Query to fetch card details
const { data: cardsData, isLoading: isLoadingCards, isFetching: isFetchingCards } = useListCards(listId, cardIds)

const cards = computed(() => cardsData.value || [])

// Show loading when lists/items are loading, cards query is loading/fetching,
// or items have loaded with card IDs but card data hasn't arrived yet
const loading = computed(() =>
  isLoadingLists.value ||
  isLoadingItems.value ||
  isLoadingCards.value ||
  (cardIds.value.length > 0 && cards.value.length === 0)
)

// Sorting + grouping state
const sortBy = ref<string | undefined>('cmc')
const sortDirection = ref<'asc' | 'desc'>('asc')
const groupBy = ref<string | undefined>('type')

function handleSort(sortOption: string | undefined, direction: 'asc' | 'desc') {
  sortBy.value = sortOption;
  sortDirection.value = direction;
}

function handleGroupBy(value: string | undefined) {
  groupBy.value = value;
}

// Handle removing a card from the list
async function handleRemoveCard(cardId: string) {
  try {
    if (!listId || !cardId) {
      throw new Error('Cannot remove card: missing listId or cardId');
    }
    await removeCardFromListMutation.mutateAsync({ listId, cardId });
    toast.add({
      title: 'Card removed from list',
      icon: 'i-lucide-check'
    });
  } catch (error: any) {
    toast.add({
      title: 'Error removing card',
      description: error.message,
      color: 'error'
    });
  }
}

// Computed grouped + sorted results - commanders always first (outside groups)
const cardGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) {
    return null;
  }

  const ids = commanderCardIds.value
  const mainboardCards = (ids.length > 0
    ? cards.value.filter((c: any) => !ids.includes(c.card_data.id))
    : cards.value
  ).filter((c: any) => (listItemsMap.value[c.card_data.id]?.board ?? 'Mainboard') === 'Mainboard')

  const groups = groupAndSortCards(mainboardCards, groupBy.value, sortBy.value, sortDirection.value, copiesMap.value);

  // Prepend commanders as their own group if present
  const commanderCards = cards.value.filter((c: any) => ids.includes(c.card_data.id))
  if (commanderCards.length > 0) {
    const commanderGroup = { label: '', cards: commanderCards };
    return groups ? [commanderGroup, ...groups] : [commanderGroup];
  }

  return groups;
});

const sideboardGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) return null;
  const sideboardCards = cards.value.filter((c: any) =>
    listItemsMap.value[c.card_data.id]?.board === 'Sideboard'
  )
  if (sideboardCards.length === 0) return null;
  return groupAndSortCards(sideboardCards, groupBy.value, sortBy.value, sortDirection.value, copiesMap.value);
});

const consideringGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) return null;
  const consideringCards = cards.value.filter((c: any) =>
    listItemsMap.value[c.card_data.id]?.board === 'Considering'
  )
  if (consideringCards.length === 0) return null;
  return groupAndSortCards(consideringCards, groupBy.value, sortBy.value, sortDirection.value, copiesMap.value);
});

const jumpToGroups = computed(() => {
  if (!cardGroups.value) return [];
  return cardGroups.value.filter(g => g.label).map(g => g.label);
});

const jumpToBoardSections = computed(() => {
  const sections: string[] = [];
  if (cardGroups.value && cardGroups.value.length > 0) sections.push('Mainboard');
  if (sideboardGroups.value && sideboardGroups.value.length > 0) sections.push('Sideboard');
  if (consideringGroups.value && consideringGroups.value.length > 0) sections.push('Considering');
  return sections;
});

const cardListResultsRef = ref<{ expandBoard: (board: 'Sideboard' | 'Considering') => void } | null>(null);

function handleJumpBoard(board: string) {
  if (board === 'Sideboard' || board === 'Considering') {
    cardListResultsRef.value?.expandBoard(board);
  }
}

// Filter cards for add card autocomplete
const filteredAddCards = computed(() => {
  if (!debouncedAddCardSearchTerm.value || debouncedAddCardSearchTerm.value.length < 2) {
    return []
  }

  const searchLower = debouncedAddCardSearchTerm.value.toLowerCase()
  const filtered: string[] = []

  const cards = rawCards.value ?? []

  for (let i = 0; i < cards.length && filtered.length < 100; i++) {
    const card = cards[i]
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card)
    }
  }

  return filtered
})

// Handle adding a card to the list
async function handleAddCard(cardName: string) {
  if (!cardName || !list.value) return

  addCardLoading.value = true
  try {
    const config = useRuntimeConfig()
    const cardData: any = await $fetch(`${config.public.backendUrl}/cards/name/${encodeURIComponent(cardName)}`)

    if (!cardData?.id) {
      throw new Error('Card not found')
    }

    // Check if card already exists in the list
    const existing = listItemsMap.value[cardData.id]
    if (existing) {
      pendingDuplicateCard.value = {
        name: cardName,
        id: cardData.id,
        board: existing.board,
        numCopies: existing.num_copies,
      }
      showDuplicateModal.value = true
      selectedCardToAdd.value = ''
      addCardSearchTerm.value = ''
      return
    }

    await addCardsToListMutation.mutateAsync({
      listId: list.value.id,
      cardIds: [cardData.id]
    })

    toast.add({
      title: `Added ${cardName} to list`,
      icon: 'i-lucide-check'
    })

    selectedCardToAdd.value = ''
    addCardSearchTerm.value = ''
  } catch (error: any) {
    toast.add({
      title: 'Error adding card',
      description: error.message,
      color: 'error',
    })
    selectedCardToAdd.value = ''
    addCardSearchTerm.value = ''
  } finally {
    addCardLoading.value = false
  }
}

async function confirmAddDuplicate() {
  if (!pendingDuplicateCard.value || !list.value) return
  try {
    await updateNumCopiesMutation.mutateAsync({
      listId: list.value.id,
      cardName: pendingDuplicateCard.value.name,
      numCopies: pendingDuplicateCard.value.numCopies + 1,
    })
    toast.add({
      title: `Added another copy of ${pendingDuplicateCard.value.name}`,
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error adding copy',
      description: error.message,
      color: 'error',
    })
  } finally {
    showDuplicateModal.value = false
    pendingDuplicateCard.value = null
  }
}

// Bulk edit state
const isBulkEditModalOpen = ref(false)
const currentCardNames = computed(() => {
  if (!cards.value || cards.value.length === 0) return []
  const boards = ['Mainboard', 'Sideboard', 'Considering'] as const
  const lines: string[] = []
  for (const board of boards) {
    const boardCards = cards.value.filter((card: any) =>
      (listItemsMap.value[card.card_data.id]?.board ?? 'Mainboard') === board
    )
    if (boardCards.length === 0) continue
    if (board !== 'Mainboard' || lines.length > 0) {
      lines.push(board)
    }
    for (const card of boardCards) {
      const copies = listItemsMap.value[card.card_data.id]?.num_copies ?? 1
      const name = card.card_data.name
      lines.push(copies > 1 ? `${copies} ${name}` : name)
    }
  }
  return lines
})

// Recommend state
const recommendDescription = ref('')
const router = useRouter()
const { saveSearchMutation } = useSearchHistory()

function goToRecommend() {
  if (!cards.value || cards.value.length === 0) return
  const decklist = cards.value.map((card: any) => card.card_data.name).join('\n')
  const query: Record<string, any> = {
    decklist,
    searchType: 'recommend',
  }
  if (recommendDescription.value.trim()) {
    query.description = recommendDescription.value.trim()
  }
  const commanderNamesList = currentCommanderItems.value
    .map((item: any) => {
      const card = cards.value.find((c: any) => c.card_data.id === item.card_id)
      return card?.card_data?.name
    })
    .filter(Boolean)
  if (commanderNamesList.length > 0) {
    query.commander = commanderNamesList[0]
  }
  if (commanderNamesList.length > 1) {
    query.partnerCommander = commanderNamesList[1]
  }

  saveSearchMutation.mutate({
    query: recommendDescription.value.trim() || '',
    searchType: 'recommend',
    filters: {
      commander: commanderNamesList[0] || undefined,
      partnerCommander: commanderNamesList[1] || undefined,
      decklist: decklist || undefined,
    },
  })

  router.push({ path: '/search/all/deckbuilder', query })
}

const { data: rawCards, status: cardsQueryStatus } = useCardNames()
const cardsStatus = computed(() => cardsQueryStatus.value === 'pending' ? 'pending' : 'success')

// Commander autocomplete
const setCommanderLoading = ref(false)

// Find the current commanders from list items (up to 2 for partner)
const currentCommanderItems = computed(() => {
  return listItems.value?.filter((item: any) => item.is_commander === true) || []
})

const commanderCardIds = computed(() => {
  return currentCommanderItems.value.map((item: any) => item.card_id)
})

const currentCommanderName = computed(() => {
  if (currentCommanderItems.value.length === 0 || !cards.value) return null
  const first = currentCommanderItems.value[0]
  const card = cards.value.find((c: any) => c.card_data.id === first.card_id)
  return card?.card_data?.name || null
})

const commanderColorIdentity = computed(() => {
  if (currentCommanderItems.value.length === 0 || !cards.value) return null
  const colors = new Set<string>()
  for (const item of currentCommanderItems.value) {
    const card = cards.value.find((c: any) => c.card_data.id === item.card_id)
    if (card?.card_data?.color_identity) {
      for (const c of card.card_data.color_identity) {
        colors.add(c)
      }
    }
  }
  return colors.size > 0 ? [...colors] : null
})

async function handleSetCommander(commanderName: string) {
  if (!commanderName || !list.value) return

  setCommanderLoading.value = true
  try {
    await setCommanderMutation.mutateAsync({
      listId: list.value.id,
      commanderName,
    })

    // Set the list image to the commander if no image has been set
    if (!list.value.avatar_card_name) {
      await updateListAvatarMutation.mutateAsync({
        listId: list.value.id,
        cardName: commanderName,
      })
    }

    toast.add({
      title: `${commanderName} set as commander`,
      icon: 'i-lucide-crown'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error setting commander',
      description: error.message,
      color: 'error'
    })
  } finally {
    setCommanderLoading.value = false
  }
}

async function handleClearCommander(cardId: string) {
  if (!list.value) return

  setCommanderLoading.value = true
  try {
    await clearCommanderMutation.mutateAsync({ listId: list.value.id, cardId })

    toast.add({
      title: 'Commander cleared',
      icon: 'i-lucide-check'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error clearing commander',
      description: error.message,
      color: 'error'
    })
  } finally {
    setCommanderLoading.value = false
  }
}

async function handleUpdateNumCopies(cardName: string, numCopies: number) {
  if (!list.value) return
  try {
    await updateNumCopiesMutation.mutateAsync({
      listId: list.value.id,
      cardName,
      numCopies,
    })
  } catch (error: any) {
    toast.add({
      title: 'Error updating quantity',
      description: error.message,
      color: 'error',
    })
  }
}

async function handleChangeBoard(cardName: string, board: 'Mainboard' | 'Sideboard' | 'Considering') {
  if (!list.value) return
  try {
    await changeBoardMutation.mutateAsync({
      listId: list.value.id,
      cardName,
      board,
    })
  } catch (error: any) {
    toast.add({
      title: 'Error changing board',
      description: error.message,
      color: 'error',
    })
  }
}

const totalPrice = computed(() => {
  if (!cards.value || cards.value.length === 0) return 0
  return cards.value.reduce((sum: number, card: any) => {
    const price = card.card_data?.prices?.usd
    const copies = listItemsMap.value[card.card_data.id]?.num_copies ?? 1
    return sum + (price ? parseFloat(price) * copies : 0)
  }, 0)
})

const totalCardCount = computed(() => {
  if (!cards.value || cards.value.length === 0) return 0
  return cards.value.reduce((sum: number, card: any) => {
    return sum + (listItemsMap.value[card.card_data.id]?.num_copies ?? 1)
  }, 0)
})

function copyCardNames() {
  if (!cards.value || cards.value.length === 0) return
  const lines = cards.value.map((card: any) => {
    const copies = listItemsMap.value[card.card_data.id]?.num_copies ?? 1
    return copies > 1 ? `${copies} ${card.card_data.name}` : card.card_data.name
  })
  copy(lines.join('\n'))
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check'
  })
}

function openMassEntry() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.flatMap((card: any) => {
    const copies = listItemsMap.value[card.card_data.id]?.num_copies ?? 1
    return Array(copies).fill(card.card_data.name)
  })
  const url = getMassEntryAffiliateLink(names)
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  // Check if list exists after data loads
  watch(list, (newList) => {
    if (!isLoadingLists.value && !newList) {
      error.value = 'List not found'
    }
  }, { immediate: true })
})
</script>
