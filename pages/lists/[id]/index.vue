<template>
  <div
    class="mx-auto pb-8 relative z-10 w-full"
    :class="{ 'pb-24': showStickyFooter }"
  >
    <CardListBanner
      :list="list"
      :is-loading="isLoadingLists"
      :is-owner="isOwner"
    >
      <template #social>
        <DecklistSocialBar
          v-if="list && list.visibility === 'public'"
          :list="list"
          :owner="!isOwner ? decklistOwner : null"
          embedded
        />
      </template>
      <template #actions>
        <DeckBusinessCard
          v-if="list && !isCollection"
          :list="list"
          :is-owner="isOwner"
          :entries="analysisCards"
          :cards-loading="loading"
        />
      </template>
    </CardListBanner>

    <div
      v-if="list"
      class="my-3 flex flex-wrap items-center justify-between gap-3"
    >
      <nav aria-label="Deck actions" class="flex flex-wrap items-center gap-2">
        <UButton
          :to="isOwner || hasPrimer ? `/lists/${listId}/primer` : undefined"
          :disabled="!isOwner && !hasPrimer"
          icon="i-lucide-notebook-text"
          color="info"
          variant="ghost"
          label="Primer"
        />
        <UButton
          v-if="!isCollection"
          label="Recommend"
          icon="i-lucide-box"
          variant="ghost"
          :disabled="loading || !cards?.length"
          @click="goToRecommend"
        />
        <DeckPlaytest
          v-if="!isCollection"
          :entries="analysisCards"
          :format="list.format"
          :name="list.name || 'Deck'"
          :loading="loading"
        />
        <UButton
          icon="i-heroicons-shopping-cart"
          color="success"
          variant="ghost"
          :label="`Buy ($${totalPrice.toFixed(2)})`"
          :disabled="loading || !cards?.length"
          @click="openMassEntry"
        />
        <UButton
          :label="
            isCollection ? 'Search Within Collection' : 'Search Within Deck'
          "
          icon="i-lucide-search"
          variant="ghost"
          :aria-expanded="searchOpen"
          @click="
            proAction(() => {
              searchOpen = !searchOpen;
            })
          "
        />
        <UDropdownMenu :items="moreActions" :content="{ align: 'end' }">
          <UButton
            label="More"
            aria-label="More deck actions"
            icon="i-lucide-ellipsis"
            color="neutral"
            variant="ghost"
          />
        </UDropdownMenu>
      </nav>
      <div class="flex w-full items-center gap-1 lg:w-auto lg:ml-auto">
        <UInputMenu
          v-if="isOwner"
          v-model="selectedCardToAdd"
          v-model:search-term="addCardSearchTerm"
          :aria-busy="isAddCardBusy"
          :disabled="loading || !addCardCatalogReady || addCardLoading"
          :items="filteredAddCards"
          placeholder="Add a card to the deck..."
          icon="i-heroicons-plus"
          class="flex-1 min-w-0 lg:w-64 cursor-pointer"
          @update:model-value="handleAddCard"
        />
        <DeckHighlight
          v-if="list"
          v-model:mode="highlightMode"
          v-model:target="highlightTarget"
          :cards="highlightCards"
          @ownership="ownershipQuantities = $event"
        />
        <UButton
          v-if="isOwner"
          icon="i-lucide-tags"
          aria-label="Multi-tagger"
          title="Tag multiple cards"
          variant="ghost"
          :color="multiTag.active.value ? 'primary' : 'neutral'"
          :aria-pressed="multiTag.active.value"
          :disabled="multiTag.saving.value"
          @click="
            multiTag.active.value
              ? multiTag.close()
              : (multiTag.active.value = true)
          "
        />
        <UPopover>
          <UButton
            icon="i-lucide-settings-2"
            color="neutral"
            variant="ghost"
            aria-label="Display"
            title="Display"
            class="cursor-pointer"
          />
          <template #content>
            <div class="p-3 space-y-3 w-72 max-w-[calc(100vw-2rem)]">
              <DeckDisplayControls
                :preferences="displayPreferences"
                :has-search-scores="searchResult?.mode === 'smart'"
                :disabled="preferencesLoading"
                @change="updateDisplayPreferences"
              />
            </div>
          </template>
        </UPopover>
      </div>
    </div>
    <div
      v-if="isOwner && addCardCatalogError"
      role="alert"
      class="mb-2 flex items-center gap-2 text-sm text-error"
    >
      Could not load the card catalog.
      <UButton
        label="Retry card catalog"
        size="sm"
        variant="link"
        :loading="isAddCardBusy"
        @click="retryCardCatalog"
      />
    </div>

    <DeckMultiTagger
      v-if="multiTag.active.value"
      :oracle-ids="listItems.map((item) => item.oracle_id)"
    />

    <DeckSettingsModal
      v-if="isOwner && list && settingsOpen"
      v-model:open="settingsOpen"
      :list="list"
    />
    <DeckTransfer
      v-if="list"
      v-model:open="transferOpen"
      :list-id="listId"
      :name="list.name || 'Untitled list'"
      :deck-format="list.format"
      :cards="transferCards"
      :owner="isOwner"
    />

    <DeckCuts
      v-if="isOwner && !isCollection"
      v-model:open="cutsOpen"
      :oracle-ids="oracleIds"
      :list-id="listId"
      :revision="listRevision"
    />
    <DeckSearch
      v-if="list"
      v-model:open="searchOpen"
      :list-id="listId"
      :collection="isCollection"
      :revision="listRevision"
      @results="receiveSearchResults($event)"
    />
    <p v-if="isCollection" class="text-sm text-muted mb-3">
      Collection · {{ totalCardCount.toLocaleString() }} copies. Grouping
      applies to the cards on this page.
    </p>

    <p v-if="preferencesError" role="alert" class="text-sm text-error">
      {{ preferencesError }}
    </p>

    <p
      v-if="labelsError && groupBy === 'tags'"
      role="alert"
      class="text-sm text-error"
    >
      Could not load card groups.
      <UButton label="Retry groups" variant="link" @click="retryLabels" />
    </p>
    <UPagination
      v-if="isCollection && filteredOracleIds.length > 100"
      v-model:page="collectionPage"
      :total="filteredOracleIds.length"
      :items-per-page="100"
      class="my-3 justify-start"
      :sibling-count="1"
      :ui="{ first: 'hidden', last: 'hidden' }"
      aria-label="Collection pages top"
    />
    <p
      v-if="searchMatches?.length === 0"
      role="status"
      class="py-6 text-center text-muted"
    >
      No matching cards. Try another search or show all cards.
    </p>
    <!-- Cards Results -->
    <ClientOnly>
      <CardListResults
        v-if="searchMatches?.length !== 0"
        ref="cardListResultsRef"
        class="mb-8"
        :view="view"
        :isLoading="loading"
        :is-owner="isOwner"
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
        <CardListResultsSkeleton :view="view" />
      </template>
    </ClientOnly>

    <UPagination
      v-if="isCollection && filteredOracleIds.length > 100"
      v-model:page="collectionPage"
      :total="filteredOracleIds.length"
      :items-per-page="100"
      :sibling-count="1"
      :ui="{ first: 'hidden', last: 'hidden' }"
      class="my-4 justify-center"
      aria-label="Collection pages bottom"
    />

    <DeckStatsPanel
      ref="statsPanel"
      v-if="list && !isCollection && analysisCards.length"
      :list-id="listId"
      :revision="listRevision"
      :format="list.format"
      :entries="analysisCards"
      :loading="loading"
      :is-owner="isOwner"
    />

    <p
      v-if="isOwner && pro.isPro.value && deckBudget.error.value"
      role="alert"
      class="text-error text-sm my-3"
    >
      Could not load the saved card budget.
      <UButton
        label="Retry budget"
        variant="link"
        @click="deckBudget.retry()"
      />
    </p>
    <DeckSuggestions
      id="deck-suggestions"
      v-if="isOwner && !isCollection && analysisCards.length"
      :list-id="listId"
      :oracle-ids="oracleIds"
      :ready="!loading"
      :saved-budget="deckBudget.budget.value"
      :budget-ready="deckBudget.ready.value"
      :budget-saving="deckBudget.saving.value"
      :save-budget="deckBudget.save"
      @visible="suggestionsSeen = true"
    />
    <DeckSuggestions
      id="deck-new-cards"
      v-if="isOwner && !isCollection && analysisCards.length"
      :list-id="listId"
      :oracle-ids="oracleIds"
      :ready="!loading"
      :saved-budget="deckBudget.budget.value"
      :budget-ready="deckBudget.ready.value"
      :budget-saving="deckBudget.saving.value"
      :save-budget="deckBudget.save"
      @visible="suggestionsSeen = true"
      newest-set
    />
    <!-- Comments (public lists only) -->
    <DecklistComments
      v-if="list && list.visibility === 'public'"
      :list-id="listId"
      :is-list-owner="isOwner"
    />
  </div>

  <!-- Bulk Edit Modal (owner only) -->
  <LazyBulkAddCardsModal
    v-if="isOwner"
    v-model:open="isBulkEditModalOpen"
    :list-id="listId"
    :collection="isCollection"
    :mainboard-names="mainboardNames"
    :sideboard-names="sideboardNames"
    :considering-names="consideringNames"
  />

  <LazyDeckCompareModal
    v-if="isOwner"
    v-model:open="isCompareModalOpen"
    :list-id="listId"
    :cards="cards"
    :items="listItems ?? []"
    :loading="loading"
  />

  <!-- Duplicate Card Confirmation Modal -->
  <UModal v-model:open="showDuplicateModal" title="Card Already in List">
    <template #body>
      <p class="text-sm" v-if="pendingDuplicateCard">
        <span class="font-bold">{{ pendingDuplicateCard.name }}</span> is
        already in
        <span class="font-bold">{{ pendingDuplicateCard.board }}</span> with
        <span class="font-bold">{{ pendingDuplicateCard.numCopies }}</span>
        {{ pendingDuplicateCard.numCopies === 1 ? 'copy' : 'copies' }}. Add
        anyway?
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

  <StickyActionFooter :show="showStickyFooter && !isCompareModalOpen">
    <div
      class="flex max-w-full flex-wrap items-center justify-center gap-1 sm:gap-3"
    >
      <span class="text-xs sm:text-sm whitespace-nowrap"
        >{{ totalCardCount }} cards</span
      >
      <UButton
        icon="i-lucide-shopping-cart"
        color="success"
        variant="ghost"
        size="sm"
        :label="`Buy ($${totalPrice.toFixed(2)})`"
        @click="openMassEntry"
      />
      <template v-if="!isCollection && analysisCards.length">
        <div
          class="items-center gap-1"
          :class="sectionLinks.length > 1 ? 'hidden md:flex' : 'flex'"
        >
          <UButton
            v-for="section in sectionLinks"
            :key="section.label"
            :label="section.label"
            variant="ghost"
            color="neutral"
            size="sm"
            @click="section.onSelect"
          />
        </div>
        <UDropdownMenu
          v-if="sectionLinks.length > 1"
          :items="sectionLinks"
          :modal="false"
          :content="{ side: 'top', align: 'end' }"
          class="md:hidden"
        >
          <UButton
            label="Deck"
            aria-label="Deck sections"
            icon="i-lucide-chart-column"
            variant="ghost"
            color="neutral"
            size="sm"
          />
        </UDropdownMenu>
      </template>
      <JumpTo
        :groups="jumpToGroups"
        :board-sections="jumpToBoardSections"
        @jump-board="handleJumpBoard"
      />
    </div>
  </StickyActionFooter>
</template>

<script setup lang="ts">
import { getUsdPrice } from '~/utils/cardPrice';
import { useCardLists, useOwnedDecklist } from '~/composables/useCardLists';
import { usePublicDecklist } from '~/composables/useDiscovery';
import { useDecklistViewTracker } from '~/composables/useDecklistSocial';
import { usePrimer } from '~/composables/usePrimer';
import { useCardNames, useCardNameToOracleId } from '~/composables/useBulkData';
import { GetPublicDecklistResponseSchema } from '~/models/cardListModel';
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer';
import { useToast } from '#imports';
import { refDebounced } from '~/utils/refDebounced';
import { groupAndSortCards, sortSearchResults } from '~/utils/sort';
import { safeJsonLd } from '~/utils/safeJsonLd';
import { buildDecklistSeo } from '~/utils/seoMeta';
import { fetchDirectArtCropUrl } from '~/utils/scryfall';
import type { Card } from '~/models/cardModel';
import type {
  DeckDisplayPreferences,
  DeckPreferences,
} from '~/models/preferencesModel';
import type { ListSearchResults } from '~/composables/useLibrary';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { DeckHighlightMode } from '~/utils/deckHighlight';
const route = useRoute();
const requestFetch = useRequestFetch();
const listId = route.params.id as string;
const toast = useToast();
const runtimeConfig = useRuntimeConfig();

// SSR-seed vue-query for the public view so unfurlers see the deck name and
// commander art. Private decks 404 here (no auth on SSR); the owned-decklist
// flow handles them on the client.
const ssrPublicList = await useSsrQuerySeed({
  cacheKey: `list-public-ssr-${listId}`,
  path: `/supabase/card-lists/view/${encodeURIComponent(listId)}`,
  schema: GetPublicDecklistResponseSchema,
  queryKey: ['discovery', 'public-decklist', listId],
});

// Resolve the primary card name to a direct `cards.scryfall.io/...` URL for
// og:image. Discord's unfurler does not follow Scryfall's 302 redirect, so
// the redirect URL renders no preview image.
const ssrPrimaryCardName = computed(() => {
  const decklist = ssrPublicList.value?.decklist;
  return decklist?.avatar_card_name || decklist?.commanders?.[0] || null;
});
const { data: ssrOgImageUrl } = await useAsyncData(
  `list-og-image-${listId}`,
  async () => {
    if (!ssrPrimaryCardName.value) return null;
    return fetchDirectArtCropUrl(
      ssrPrimaryCardName.value,
      runtimeConfig.public.backendPath,
      requestFetch,
    );
  },
);

const {
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

const router = useRouter();
const { saveSearchMutation } = useSearchHistory();

// Try to load the list as owned first; the composable returns null on 404
// so we can fall back to the public endpoint cleanly.
const listIdRef = computed(() => listId);
const { decklist: ownedList, isLoading: isLoadingLists } =
  useOwnedDecklist(listIdRef);
const {
  decklist: publicDecklist,
  items: publicItems,
  owner: decklistOwner,
  isLoading: isLoadingPublic,
} = usePublicDecklist(listIdRef);

// Unified list: prefer owned, fall back to public
const list = computed(() => ownedList.value ?? publicDecklist.value);
const isOwner = computed(() => !!ownedList.value);
const isCollection = computed(() => list.value?.kind === 'collection');
const pro = useLibraryApi();
const searchResult = ref<ListSearchResults | null>(null);
const searchMatches = computed(() => searchResult.value?.oracleIds ?? null);
const searchPreferences = ref<DeckDisplayPreferences | null>(null);
const collectionPage = ref(1);
const listRevision = computed(() =>
  JSON.stringify(
    listItems.value.map((item) => [
      item.oracle_id,
      item.board,
      item.num_copies,
    ]),
  ),
);
// Record a view once per visit when the deck resolves as public
useDecklistViewTracker(
  listIdRef,
  computed(() => list.value?.visibility === 'public'),
);

// Primer existence drives the non-owner Primer button state
const { primerText } = usePrimer(listIdRef);
const hasPrimer = computed(() => !!primerText.value?.trim());

// ---- SEO ----
const canonicalUrl = computed(() => `https://cardmystic.com/lists/${listId}`);

const isPublicList = computed(() => list.value?.visibility === 'public');

const seo = computed(() =>
  buildDecklistSeo(
    list.value ?? null,
    decklistOwner.value?.username,
    ssrOgImageUrl.value,
  ),
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description,
  robots: () => seo.value.robots,
  ogTitle: () => seo.value.title,
  ogDescription: () => seo.value.description,
  ogType: 'article',
  ogUrl: () => canonicalUrl.value,
  ogImage: () => seo.value.image,
  ogImageAlt: () => seo.value.imageAlt,
  ogSiteName: 'CardMystic',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterImage: () => seo.value.image,
});

useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => {
        if (!list.value || !isPublicList.value) return '';
        const author =
          (list.value as any).username || decklistOwner.value?.username;
        const authorId = (list.value as any).user_id || decklistOwner.value?.id;
        return safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: list.value.name || 'Untitled deck',
          description: seo.value.description,
          image: seo.value.image,
          url: canonicalUrl.value,
          genre: 'Magic: The Gathering deck',
          dateModified: (list.value as any).updated_at ?? undefined,
          dateCreated: (list.value as any).created_at ?? undefined,
          author: author
            ? {
                '@type': 'Person',
                name: author,
                url: authorId
                  ? `https://cardmystic.com/user/${authorId}`
                  : undefined,
              }
            : undefined,
          about: {
            '@type': 'Game',
            name: 'Magic: The Gathering',
            publisher: {
              '@type': 'Organization',
              name: 'Wizards of the Coast',
            },
          },
          publisher: {
            '@type': 'Organization',
            name: 'CardMystic',
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl.value,
          },
        });
      },
    },
  ],
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
  oracle_id: string;
  board: string;
  numCopies: number;
} | null>(null);

// Use TanStack Query for list items (owner path, requires Supabase auth)
const { data: ownedListItems, isLoading: isLoadingOwnedItems } =
  useListItems(listId);

// Merge items: prefer owned (direct Supabase), fall back to public API items
const listItems = computed(() =>
  isOwner.value ? (ownedListItems.value ?? []) : publicItems.value,
);
const isLoadingItems = computed(() =>
  isOwner.value ? isLoadingOwnedItems.value : isLoadingPublic.value,
);

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

const transferCards = computed(() =>
  listItems.value.flatMap((item) => {
    const card = cardsByOracleId.value[item.oracle_id]?.card_data;
    return card
      ? [
          {
            name: card.name,
            quantity: item.num_copies,
            board: item.board as Board,
            commander: !!item.is_commander,
            arena: card.games?.includes('arena'),
            mtgo: card.games?.includes('mtgo'),
          },
        ]
      : [];
  }),
);
const analysisCards = computed(() =>
  listItems.value
    .filter((item) => item.board === 'Mainboard')
    .flatMap((item) => {
      const card = cardsByOracleId.value[item.oracle_id]?.card_data;
      return card
        ? [{ card, quantity: item.num_copies, commander: !!item.is_commander }]
        : [];
    }),
);
const multiTag = provideMultiTag();
const statsPanel = useTemplateRef<{ open: () => void }>('statsPanel');
async function jumpToSection(id: string) {
  if (id === 'deck-stats') statsPanel.value?.open();
  await nextTick();
  const element = document.getElementById(id);
  if (element)
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY - 100,
      behavior: 'smooth',
    });
}
const sectionLinks = computed(() => [
  { label: 'Deck Stats', onSelect: () => jumpToSection('deck-stats') },
  ...(isOwner.value
    ? [
        {
          label: 'Suggested Cards',
          onSelect: () => jumpToSection('deck-suggestions'),
        },
        {
          label: 'New Cards for Deck',
          onSelect: () => jumpToSection('deck-new-cards'),
        },
      ]
    : []),
]);
const suggestionsSeen = ref(false);
const deckBudget = useDeckBudget(
  listId,
  () =>
    suggestionsSeen.value &&
    analysisCards.value.length > 0 &&
    isOwner.value &&
    !isCollection.value &&
    pro.isPro.value,
);
const ownershipQuantities = ref<Record<string, number> | null>(null);
const highlightMode = ref<DeckHighlightMode>('none');
const highlightTarget = ref('');
const highlightCards = computed(() =>
  cards.value.map((card) => card.card_data),
);
provide('deckHighlight', {
  mode: highlightMode,
  target: highlightTarget,
  quantities: ownershipQuantities,
  required: computed(() => {
    const totals: Record<string, number> = {};
    for (const item of listItems.value) {
      totals[item.oracle_id] = (totals[item.oracle_id] ?? 0) + item.num_copies;
    }
    return totals;
  }),
});

function boardCards(board: Board, onlyVisible = true): Card[] {
  return Object.keys(listItemsMap.value[board])
    .map((oid) => cardsByOracleId.value[oid])
    .filter(
      (card) =>
        card &&
        (!onlyVisible || visibleOracleIds.value.has(card.card_data.oracle_id)),
    )
    .map((card) => (onlyVisible ? withSearchScore(card) : card));
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

// Show loading when data sources are loading, or items have loaded but cards haven't
const loading = computed(
  () =>
    (isLoadingLists.value && isLoadingPublic.value) ||
    !list.value ||
    isLoadingItems.value ||
    isLoadingCards.value ||
    (oracleIds.value.length > 0 && cards.value.length === 0),
);

const {
  preferences,
  isLoading: preferencesLoading,
  error: preferencesError,
  updatePreferences,
} = useDeckPreferences(listId, isCollection);
const displayPreferences = computed(
  () => searchPreferences.value ?? preferences.value,
);
function receiveSearchResults(result: ListSearchResults | null) {
  searchResult.value = result;
  searchPreferences.value = result
    ? {
        ...preferences.value,
        deck_group_by: null,
        deck_sort_by: result.mode === 'smart' ? 'ai_score' : null,
        deck_sort_direction: 'desc',
      }
    : null;
  collectionPage.value = 1;
}
function updateDisplayPreferences(patch: Partial<DeckDisplayPreferences>) {
  if (searchPreferences.value)
    searchPreferences.value = { ...searchPreferences.value, ...patch };
  else if (patch.deck_sort_by !== 'ai_score')
    updatePreferences(patch as Partial<DeckPreferences>);
  collectionPage.value = 1;
}
const sortBy = computed(
  () => displayPreferences.value.deck_sort_by ?? undefined,
);
const sortDirection = computed(
  () => displayPreferences.value.deck_sort_direction,
);
const groupBy = computed(
  () => displayPreferences.value.deck_group_by ?? undefined,
);
const view = computed(() => displayPreferences.value.deck_view);
function withSearchScore(card: Card): Card {
  const score =
    searchResult.value?.mode === 'smart'
      ? searchResult.value.scores?.[card.card_data.oracle_id]
      : undefined;
  return score === undefined ? card : { ...card, ai_rerank_score: score };
}
const filteredOracleIds = computed(() => {
  const ids = searchMatches.value ?? [...new Set(oracleIds.value)];
  if (!isCollection.value || !cards.value.length) return ids;
  const scope = new Set(ids);
  return (
    sortSearchResults(
      cards.value
        .filter((card) => scope.has(card.card_data.oracle_id))
        .map(withSearchScore),
      sortBy.value,
      sortDirection.value,
      true,
    ) ?? []
  ).map((card) => card.card_data.oracle_id);
});
const visibleOracleIds = computed(
  () =>
    new Set(
      isCollection.value
        ? filteredOracleIds.value.slice(
            (collectionPage.value - 1) * 100,
            collectionPage.value * 100,
          )
        : filteredOracleIds.value,
    ),
);
watch(
  () => filteredOracleIds.value.length,
  (length) => {
    collectionPage.value = Math.min(
      collectionPage.value,
      Math.max(1, Math.ceil(length / 100)),
    );
  },
);

const {
  labels: cardLabels,
  error: labelsError,
  retry: retryLabels,
} = useCardLabels(() => [...visibleOracleIds.value]);

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

  const ids = searchResult.value ? [] : commanderOracleIds.value;
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
    undefined,
    false,
    cardLabels.value,
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
    undefined,
    false,
    cardLabels.value,
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
    undefined,
    false,
    cardLabels.value,
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
    // Resolve oracle_id locally from the bulk name→oracle_id map. Avoids a
    // `/cards/name/:name` round-trip that breaks for DFCs like "Wear // Tear"
    // (proxies decode `%2F` in URL paths, mangling the route).
    const oracleId = cardNameToOracleId.value?.[cardName.toLowerCase()];
    if (!oracleId) {
      throw new Error('Card not found');
    }

    // Check if card already exists in any board (uniqueness is per (oracle_id, board) now)
    const existing = findRowAnyBoard(oracleId);
    if (existing) {
      pendingDuplicateCard.value = {
        name: cardName,
        oracle_id: oracleId,
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
      oracleIds: [oracleId],
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

/**
 * Fires when user confirms adding a duplicate card from the modal.
 * We add the duplicate card to mainboard by default regardless of board.
 *   e.g., Add Sol Ring (0 in Mainboard, 1 in Sideboard) -> (1 in Mainboard, 1 in Sideboard)
 *         Add Sol Ring (1 in Mainboard, 0 in Sideboard) -> (2 in Mainboard, 0 in Sideboard)
 */
async function confirmAddDuplicate() {
  if (!pendingDuplicateCard.value || !list.value) return;
  try {
    await addCardsToListMutation.mutateAsync({
      listId: list.value.id,
      oracleIds: [pendingDuplicateCard.value.oracle_id],
      board: 'Mainboard', // Always add duplicates to mainboard by default, user can move them later if desired
    });
    toast.add({
      title: `Added ${pendingDuplicateCard.value.name}`,
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
const isCompareModalOpen = ref(false);
const settingsOpen = ref(false);
const transferOpen = ref(false);
const cutsOpen = ref(false);
const searchOpen = ref(false);
function proAction(action: () => void) {
  if (pro.isPro.value) action();
  else void navigateTo('/memberships');
}
const moreActions = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Import / Export',
      icon: 'i-lucide-arrow-left-right',
      disabled: loading.value,
      onSelect: () => {
        transferOpen.value = true;
      },
    },
  ],
  ...(isOwner.value
    ? [
        [
          {
            label: 'Settings',
            icon: 'i-lucide-settings',
            onSelect: () => {
              settingsOpen.value = true;
            },
          },
          {
            label: 'Compare decks',
            icon: 'i-lucide-scale',
            disabled: loading.value,
            onSelect: () => {
              isCompareModalOpen.value = true;
            },
          },
          {
            label: 'Bulk Edit',
            icon: 'i-lucide-list-plus',
            onSelect: () => {
              isBulkEditModalOpen.value = true;
            },
          },
          {
            label: 'History',
            icon: 'i-lucide-history',
            onSelect: () => {
              void navigateTo(`/lists/${listId}/history`);
            },
          },
          ...(!isCollection.value
            ? [
                {
                  label: 'Suggest cuts · Pro',
                  icon: 'i-lucide-scissors',
                  onSelect: () =>
                    proAction(() => {
                      cutsOpen.value = true;
                    }),
                },
              ]
            : []),
        ],
      ]
    : []),
]);

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

function goToRecommend() {
  if (!cards.value || cards.value.length === 0) return;
  const decklist = boardCards('Mainboard', false)
    .map((card: Card) => card.card_data.name)
    .slice(0, 200)
    .join('\n');
  const query: Record<string, any> = {
    deckId: isOwner.value ? listId : undefined,
    decklist,
    searchType: 'recommend',
  };
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
      query: '',
      searchType: 'recommend',
      filters: {
        commander: commanderNamesList[0] || undefined,
        partnerCommander: commanderNamesList[1] || undefined,
        decklist: decklist || undefined,
      },
    });
  });
}

const {
  data: rawCards,
  isFetching: fetchingCardNames,
  error: cardNamesError,
  refetch: refetchCardNames,
} = useCardNames(isOwner);
const {
  data: cardNameToOracleId,
  isFetching: fetchingOracleMap,
  error: oracleMapError,
  refetch: refetchOracleMap,
} = useCardNameToOracleId(isOwner);
const addCardCatalogReady = computed(
  () => !!rawCards.value && !!cardNameToOracleId.value,
);
const addCardCatalogError = computed(
  () =>
    !addCardCatalogReady.value &&
    !!(cardNamesError.value || oracleMapError.value),
);
// An unsuccessful query is not necessarily still loading (it may have failed).
const isAddCardBusy = computed(
  () =>
    addCardLoading.value || fetchingCardNames.value || fetchingOracleMap.value,
);
async function retryCardCatalog() {
  await Promise.all([refetchCardNames(), refetchOracleMap()]);
}

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
    const price = getUsdPrice(card?.card_data?.prices);
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
  // Check if list exists after both data sources have finished loading
  watch(
    [list, isLoadingLists, isLoadingPublic],
    ([newList, loadingOwned, loadingPublic]) => {
      if (!loadingOwned && !loadingPublic && !newList) {
        error.value = 'List not found';
      }
    },
    { immediate: true },
  );
});
</script>
