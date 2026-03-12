<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl relative z-10">
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-10 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"></div>
    </div>

    <CardListBanner :list="list" :is-loading="isLoadingLists" />

    <!-- Actions + Add Card + Commander (single row) -->
    <div v-if="list" class="mb-2">
      <div class="flex flex-wrap items-center justify-between">
        <div class="flex gap-2 mb-2">
          <UTooltip text="Copy card names">
            <UButton icon="i-lucide-copy" color="primary" variant="outline" @click="copyCardNames"
              :disabled="!cards || cards.length === 0" class="cursor-pointer" label="Copy" />
          </UTooltip>
          <UTooltip text="Bulk add cards">
            <UButton icon="i-lucide-list-plus" color="primary" variant="outline" @click="isBulkAddModalOpen = true"
              class="cursor-pointer" label="Bulk Add" />
          </UTooltip>
          <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid"
            :label="`Buy ($${totalPrice.toFixed(2)})`" @click="openMassEntry" :disabled="!cards || cards.length === 0"
            class="cursor-pointer" />
        </div>
        <div>
          <USelectMenu v-model="selectedCardToAdd" v-model:search-term="addCardSearchTerm"
            :loading="(!!addCardSearchTerm && cardsStatus === 'pending') || addCardLoading" :items="filteredAddCards"
            placeholder="Search for a card to add..." icon="i-lucide-plus" class="flex-1 min-w-90 cursor-pointer"
            @update:model-value="handleAddCard" />
        </div>

      </div>
    </div>

    <!-- Deck Recommender -->
    <div v-if="list && cards && cards.length > 0" class="mb-2">
      <div class="flex gap-2 items-center">
        <UInput v-model="recommendDescription"
          placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations."
          icon="i-lucide-box" class="flex-1" :ui="{ base: 'text-sm h-8' }" size="sm" />
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
      <CardListResults :isLoading="loading" :groups="cardGroups" :skeletonCount="20"
        :commander-card-id="currentCommanderItem?.card_id" :commander-color-identity="commanderColorIdentity"
        @removeCard="handleRemoveCard" @setCommander="handleSetCommander" @clearCommander="handleClearCommander" />
      <template #fallback>
        <div class="mt-3 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <CardSkeleton v-for="i in 20" :key="`skeleton-${i}`" :showCardInfo="true" />
        </div>
      </template>
    </ClientOnly>
  </div>

  <!-- Bulk Add Modal -->
  <BulkAddCardsModal v-model:open="isBulkAddModalOpen" :list-id="listId" />

  <BackToTop />

  <JumpTo :groups="jumpToGroups" />


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

// Use TanStack Query for list items
const { data: listItems, isLoading: isLoadingItems } = useListItems(listId)

// Computed card IDs from list items - used as dependency for card details query
const cardIds = computed(() => listItems.value?.map((item: any) => item.card_id) || [])

// Use TanStack Query to fetch card details
const { data: cardsData, isLoading: isLoadingCards, isFetching: isFetchingCards } = useListCards(listId, cardIds)

const cards = computed(() => cardsData.value || [])

// Show loading when lists/items are loading, cards query is loading/fetching,
// or items have loaded with card IDs but card data hasn't arrived yet
const loading = computed(() =>
  isLoadingLists.value ||
  isLoadingItems.value ||
  isLoadingCards.value ||
  isFetchingCards.value ||
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

// Computed grouped + sorted results - commander always first (outside groups)
const cardGroups = computed(() => {
  if (!cards.value || cards.value.length === 0) {
    return null;
  }

  const commanderCardId = currentCommanderItem.value?.card_id
  const cardsToGroup = commanderCardId
    ? cards.value.filter((c: any) => c.card_data.id !== commanderCardId)
    : cards.value

  const groups = groupAndSortCards(cardsToGroup, groupBy.value, sortBy.value, sortDirection.value);

  // Prepend commander as its own group if present
  if (commanderCardId) {
    const commander = cards.value.find((c: any) => c.card_data.id === commanderCardId)
    if (commander) {
      const commanderGroup = { label: '', cards: [commander] };
      return groups ? [commanderGroup, ...groups] : [commanderGroup];
    }
  }

  return groups;
});

const jumpToGroups = computed(() => {
  if (!cardGroups.value) return [];
  return cardGroups.value.filter(g => g.label).map(g => g.label);
});

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

    await addCardsToListMutation.mutateAsync({
      listId: list.value.id,
      cardIds: [cardData.id]
    })

    toast.add({
      title: `Added ${cardName} to list`,
      icon: 'i-lucide-check'
    })

    // Clear the selection
    selectedCardToAdd.value = ''
    addCardSearchTerm.value = ''
  } catch (error: any) {
    toast.add({
      title: 'Error adding card',
      description: error.message,
      color: 'error'
    })
  } finally {
    addCardLoading.value = false
  }
}

// Bulk add state
const isBulkAddModalOpen = ref(false)

// Recommend state
const recommendDescription = ref('')
const router = useRouter()

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
  if (currentCommanderName.value) {
    query.commander = currentCommanderName.value
  }
  router.push({ path: '/search/recommend', query })
}

const { data: rawCards, status: cardsQueryStatus } = useCardNames()
const cardsStatus = computed(() => cardsQueryStatus.value === 'pending' ? 'pending' : 'success')

// Commander autocomplete
const setCommanderLoading = ref(false)

// Find the current commander from list items
const currentCommanderItem = computed(() => {
  return listItems.value?.find((item: any) => item.is_commander === true)
})

const currentCommanderName = computed(() => {
  if (!currentCommanderItem.value || !cards.value) return null
  const commanderItem = currentCommanderItem.value
  const card = cards.value.find((c: any) => c.card_data.id === commanderItem.card_id)
  return card?.card_data?.name || null
})

const commanderColorIdentity = computed(() => {
  if (!currentCommanderItem.value || !cards.value) return null
  const commanderItem = currentCommanderItem.value
  const card = cards.value.find((c: any) => c.card_data.id === commanderItem.card_id)
  return card?.card_data?.color_identity || null
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

async function handleClearCommander() {
  if (!list.value) return

  setCommanderLoading.value = true
  try {
    await clearCommanderMutation.mutateAsync(list.value.id)

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

const totalPrice = computed(() => {
  if (!cards.value || cards.value.length === 0) return 0
  return cards.value.reduce((sum: number, card: any) => {
    const price = card.card_data?.prices?.usd
    return sum + (price ? parseFloat(price) : 0)
  }, 0)
})

function copyCardNames() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.map((card: any) => card.card_data.name).join('\n')
  copy(names)
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check'
  })
}

function openMassEntry() {
  if (!cards.value || cards.value.length === 0) return
  const names = cards.value.map((card: any) => card.card_data.name)
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
