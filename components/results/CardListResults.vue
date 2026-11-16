<template>
  <div class="mt-3 w-full">
    <!-- Loading State -->
    <template v-if="isLoading">
      <CardListResultsSkeleton
        :view="view"
        :commander-count="commanderOracleIds?.length"
      />
    </template>

    <!-- Cards display -->
    <template v-else>
      <div class="results-layout xl:flex xl:items-start xl:gap-6">
        <aside
          v-if="previewCard"
          class="preview-rail hidden xl:block xl:w-[20rem] xl:shrink-0 xl:self-start"
          @mouseenter="clearPendingPreviewCard()"
        >
          <div v-if="isDesktopPreview" class="preview-sticky">
            <HoveredListCardPreview
              :card="previewCard"
              :is-owner="isOwner && hoveredBoard !== 'Suggested'"
              :suggested="hoveredBoard === 'Suggested'"
              :isCommanderOfDecklist="
                hoveredBoard === 'Mainboard' &&
                (commanderOracleIds?.includes(
                  previewCard.card_data.oracle_id,
                ) ??
                  false)
              "
              :canBeACommander="isCommanderCard(previewCard)"
              :num-copies="
                hoveredBoard === 'Suggested'
                  ? undefined
                  : listItemsMap?.[hoveredBoard]?.[
                      previewCard.card_data.oracle_id
                    ]?.num_copies
              "
              :board="hoveredBoard === 'Suggested' ? undefined : hoveredBoard"
              :decklist-card-names="decklistCardNames"
              :is-flipped="flippedCards[previewCard.card_data.id] ?? false"
              @remove="
                (
                  cardId: string,
                  f: 'Mainboard' | 'Sideboard' | 'Considering',
                ) => emit('removeCard', cardId, f)
              "
              @set-commander="
                (cardName: string) => emit('setCommander', cardName)
              "
              @clear-commander="
                (cardId: string) => emit('clearCommander', cardId)
              "
              @update-num-copies="
                (
                  cardName: string,
                  n: number,
                  f: 'Mainboard' | 'Sideboard' | 'Considering',
                ) => emit('updateNumCopies', cardName, n, f)
              "
              @change-board="
                (
                  cardName: string,
                  b: 'Mainboard' | 'Sideboard' | 'Considering',
                  f: 'Mainboard' | 'Sideboard' | 'Considering',
                ) => emit('changeBoard', cardName, b, f)
              "
              @flip="handleCardFlip"
            />
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <slot
            name="before-cards"
            :set-preview-card="setPreviewCard"
            :clear-pending-preview-card="clearPendingPreviewCard"
          />
          <template v-if="groups && groups.length > 0">
            <!-- Mainboard header -->
            <div
              v-if="
                (sideboardGroups && sideboardGroups.length > 0) ||
                (consideringGroups && consideringGroups.length > 0)
              "
              class="board-divider mb-2"
            >
              <div class="board-divider-line"></div>
              <span class="board-divider-label"
                >Mainboard ({{ mainboardCount }}
                {{ mainboardCount === 1 ? 'card' : 'cards' }})
                <span class="board-divider-price"
                  >${{ mainboardPrice.toFixed(2) }}</span
                ></span
              >
              <div class="board-divider-line"></div>
            </div>
            <!-- Commander and mainboard groups start on separate rows of the same grid. -->
            <div v-if="ungroupedGroups.length" :class="cardGridClasses">
              <template
                v-for="(group, index) in ungroupedGroups"
                :key="'ungrouped-' + index"
              >
                <div
                  v-for="(card, cardIndex) in group.cards"
                  :key="card.card_data.oracle_id"
                  :class="{ 'col-start-1': cardIndex === 0 }"
                  @mouseenter="setPreviewCard(card, 'Mainboard')"
                  @focusin="setPreviewCard(card, 'Mainboard')"
                  @mouseleave="clearPendingPreviewCard(card.card_data.id)"
                >
                  <component
                    :is="cardComponent"
                    is-list-card
                    :card="card"
                    :is-flipped="flippedCards[card.card_data.id] ?? false"
                    :is-deck-commander="
                      commanderOracleIds?.includes(card.card_data.oracle_id) ??
                      false
                    "
                    :is-commander-card="isCommanderCard(card)"
                    :commander-color-identity="commanderColorIdentity"
                    :num-copies="
                      listItemsMap?.Mainboard?.[card.card_data.oracle_id]
                        ?.num_copies
                    "
                    :board="'Mainboard'"
                    :legality-quantity="legalityQuantity(card, 'Mainboard')"
                    :format="format"
                    :is-owner="isOwner"
                    :decklist-card-names="decklistCardNames"
                    @remove="
                      (
                        cardId: string,
                        f: 'Mainboard' | 'Sideboard' | 'Considering',
                      ) => emit('removeCard', cardId, f)
                    "
                    @set-commander="
                      (cardName: string) => emit('setCommander', cardName)
                    "
                    @clear-commander="
                      (cardId: string) => emit('clearCommander', cardId)
                    "
                    @update-num-copies="
                      (
                        cardName: string,
                        n: number,
                        f: 'Mainboard' | 'Sideboard' | 'Considering',
                      ) => emit('updateNumCopies', cardName, n, f)
                    "
                    @change-board="
                      (
                        cardName: string,
                        b: 'Mainboard' | 'Sideboard' | 'Considering',
                        f: 'Mainboard' | 'Sideboard' | 'Considering',
                      ) => emit('changeBoard', cardName, b, f)
                    "
                    @flip="handleCardFlip"
                  />
                </div>
              </template>
            </div>

            <!-- Grouped Cards (Accordion) -->
            <div
              v-if="labeledGroups.length > 0"
              class="flex flex-wrap justify-center sm:justify-end gap-1 mb-1"
            >
              <UButton
                class="cursor-pointer"
                icon="i-lucide-chevrons-down"
                label="Expand All"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="expandAllGroups"
              />
              <UButton
                icon="i-lucide-chevrons-up"
                label="Collapse All"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="collapseAllGroups"
              />
            </div>
            <UAccordion
              v-if="labeledGroups.length > 0"
              type="multiple"
              v-model="openAccordionValues"
              :items="accordionItems"
              :ui="{
                item: 'w-full mx-auto sm:mx-0',
                trigger:
                  'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1',
              }"
            >
              <template
                v-for="group in labeledGroups"
                :key="groupKey(group)"
                #[groupKey(group)]
              >
                <div
                  :id="groupToId(group.label)"
                  :class="[cardGridClasses, 'p-2']"
                >
                  <div
                    v-for="card in group.cards"
                    :key="card.card_data.oracle_id"
                    @mouseenter="setPreviewCard(card, 'Mainboard')"
                    @focusin="setPreviewCard(card, 'Mainboard')"
                    @mouseleave="clearPendingPreviewCard(card.card_data.id)"
                  >
                    <component
                      :is="cardComponent"
                      is-list-card
                      :card="card"
                      :is-flipped="flippedCards[card.card_data.id] ?? false"
                      :is-deck-commander="
                        commanderOracleIds?.includes(
                          card.card_data.oracle_id,
                        ) ?? false
                      "
                      :is-commander-card="isCommanderCard(card)"
                      :commander-color-identity="commanderColorIdentity"
                      :num-copies="
                        listItemsMap?.Mainboard?.[card.card_data.oracle_id]
                          ?.num_copies
                      "
                      :board="'Mainboard'"
                      :legality-quantity="legalityQuantity(card, 'Mainboard')"
                      :format="format"
                      :is-owner="isOwner"
                      :decklist-card-names="decklistCardNames"
                      @remove="
                        (
                          cardId: string,
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('removeCard', cardId, f)
                      "
                      @set-commander="
                        (cardName: string) => emit('setCommander', cardName)
                      "
                      @clear-commander="
                        (cardId: string) => emit('clearCommander', cardId)
                      "
                      @update-num-copies="
                        (
                          cardName: string,
                          n: number,
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('updateNumCopies', cardName, n, f)
                      "
                      @change-board="
                        (
                          cardName: string,
                          b: 'Mainboard' | 'Sideboard' | 'Considering',
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('changeBoard', cardName, b, f)
                      "
                      @flip="handleCardFlip"
                    />
                  </div>
                </div>
              </template>
            </UAccordion>
          </template>

          <!-- Sideboard Section -->
          <template v-if="sideboardGroups && sideboardGroups.length > 0">
            <div
              id="board-sideboard"
              class="board-divider cursor-pointer"
              @click="sideboardExpanded = !sideboardExpanded"
            >
              <div class="board-divider-line"></div>
              <span class="board-divider-label">
                <UIcon
                  :name="
                    sideboardExpanded
                      ? 'i-lucide-chevron-down'
                      : 'i-lucide-chevron-right'
                  "
                  class="w-4 h-4"
                />
                Sideboard ({{ sideboardCount }}
                {{ sideboardCount === 1 ? 'card' : 'cards' }})
                <span class="board-divider-price"
                  >${{ sideboardPrice.toFixed(2) }}</span
                >
              </span>
              <div class="board-divider-line"></div>
            </div>
            <UCard variant="outline" v-show="sideboardExpanded" class="mb-4">
              <!-- Ungrouped sideboard cards -->
              <template
                v-for="(group, index) in sideboardUngrouped"
                :key="'sb-ungrouped-' + index"
              >
                <div :class="[cardGridClasses, 'mb-4']">
                  <div
                    v-for="card in group.cards"
                    :key="card.card_data.oracle_id"
                    @mouseenter="setPreviewCard(card, 'Sideboard')"
                    @focusin="setPreviewCard(card, 'Sideboard')"
                    @mouseleave="clearPendingPreviewCard(card.card_data.id)"
                  >
                    <component
                      :is="cardComponent"
                      is-list-card
                      :card="card"
                      :is-flipped="flippedCards[card.card_data.id] ?? false"
                      :is-deck-commander="false"
                      :is-commander-card="isCommanderCard(card)"
                      :commander-color-identity="commanderColorIdentity"
                      :num-copies="
                        listItemsMap?.Sideboard?.[card.card_data.oracle_id]
                          ?.num_copies
                      "
                      :board="'Sideboard'"
                      :legality-quantity="legalityQuantity(card, 'Sideboard')"
                      :format="format"
                      :is-owner="isOwner"
                      @remove="
                        (
                          cardId: string,
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('removeCard', cardId, f)
                      "
                      @set-commander="
                        (cardName: string) => emit('setCommander', cardName)
                      "
                      @clear-commander="
                        (cardId: string) => emit('clearCommander', cardId)
                      "
                      @update-num-copies="
                        (
                          cardName: string,
                          n: number,
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('updateNumCopies', cardName, n, f)
                      "
                      @change-board="
                        (
                          cardName: string,
                          b: 'Mainboard' | 'Sideboard' | 'Considering',
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('changeBoard', cardName, b, f)
                      "
                      @flip="handleCardFlip"
                    />
                  </div>
                </div>
              </template>
              <!-- Grouped sideboard cards -->
              <UAccordion
                v-if="sideboardLabeled.length > 0"
                type="multiple"
                v-model="openSideboardValues"
                :items="sideboardAccordionItems"
                :ui="{
                  item: 'w-full mx-auto sm:mx-0',
                  trigger:
                    'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1',
                }"
              >
                <template
                  v-for="group in sideboardLabeled"
                  :key="groupKey(group)"
                  #[groupKey(group)]
                >
                  <div :class="[cardGridClasses, 'p-2']">
                    <div
                      v-for="card in group.cards"
                      :key="card.card_data.oracle_id"
                      @mouseenter="setPreviewCard(card, 'Sideboard')"
                      @focusin="setPreviewCard(card, 'Sideboard')"
                      @mouseleave="clearPendingPreviewCard(card.card_data.id)"
                    >
                      <component
                        :is="cardComponent"
                        is-list-card
                        :card="card"
                        :is-flipped="flippedCards[card.card_data.id] ?? false"
                        :is-deck-commander="false"
                        :is-commander-card="isCommanderCard(card)"
                        :commander-color-identity="commanderColorIdentity"
                        :num-copies="
                          listItemsMap?.Sideboard?.[card.card_data.oracle_id]
                            ?.num_copies
                        "
                        :board="'Sideboard'"
                        :legality-quantity="legalityQuantity(card, 'Sideboard')"
                        :format="format"
                        :is-owner="isOwner"
                        @remove="
                          (
                            cardId: string,
                            f: 'Mainboard' | 'Sideboard' | 'Considering',
                          ) => emit('removeCard', cardId, f)
                        "
                        @set-commander="
                          (cardName: string) => emit('setCommander', cardName)
                        "
                        @clear-commander="
                          (cardId: string) => emit('clearCommander', cardId)
                        "
                        @update-num-copies="
                          (
                            cardName: string,
                            n: number,
                            f: 'Mainboard' | 'Sideboard' | 'Considering',
                          ) => emit('updateNumCopies', cardName, n, f)
                        "
                        @change-board="
                          (
                            cardName: string,
                            b: 'Mainboard' | 'Sideboard' | 'Considering',
                            f: 'Mainboard' | 'Sideboard' | 'Considering',
                          ) => emit('changeBoard', cardName, b, f)
                        "
                        @flip="handleCardFlip"
                      />
                    </div>
                  </div>
                </template>
              </UAccordion>
            </UCard>
          </template>

          <!-- Considering Section -->
          <template v-if="consideringGroups && consideringGroups.length > 0">
            <div
              id="board-considering"
              class="board-divider cursor-pointer"
              @click="consideringExpanded = !consideringExpanded"
            >
              <div class="board-divider-line"></div>
              <span class="board-divider-label">
                <UIcon
                  :name="
                    consideringExpanded
                      ? 'i-lucide-chevron-down'
                      : 'i-lucide-chevron-right'
                  "
                  class="w-4 h-4"
                />
                Considering ({{ consideringCount }}
                {{ consideringCount === 1 ? 'card' : 'cards' }})
                <span class="board-divider-price"
                  >${{ consideringPrice.toFixed(2) }}</span
                >
              </span>
              <div class="board-divider-line"></div>
            </div>
            <UCard variant="outline" v-show="consideringExpanded" class="mb-4">
              <!-- Ungrouped considering cards -->
              <template
                v-for="(group, index) in consideringUngrouped"
                :key="'con-ungrouped-' + index"
              >
                <div :class="[cardGridClasses, 'mb-4']">
                  <div
                    v-for="card in group.cards"
                    :key="card.card_data.oracle_id"
                    @mouseenter="setPreviewCard(card, 'Considering')"
                    @focusin="setPreviewCard(card, 'Considering')"
                    @mouseleave="clearPendingPreviewCard(card.card_data.id)"
                  >
                    <component
                      :is="cardComponent"
                      is-list-card
                      :card="card"
                      :is-flipped="flippedCards[card.card_data.id] ?? false"
                      :is-deck-commander="false"
                      :is-commander-card="isCommanderCard(card)"
                      :commander-color-identity="commanderColorIdentity"
                      :num-copies="
                        listItemsMap?.Considering?.[card.card_data.oracle_id]
                          ?.num_copies
                      "
                      :board="'Considering'"
                      :legality-quantity="legalityQuantity(card, 'Considering')"
                      :format="format"
                      :is-owner="isOwner"
                      @remove="
                        (
                          cardId: string,
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('removeCard', cardId, f)
                      "
                      @set-commander="
                        (cardName: string) => emit('setCommander', cardName)
                      "
                      @clear-commander="
                        (cardId: string) => emit('clearCommander', cardId)
                      "
                      @update-num-copies="
                        (
                          cardName: string,
                          n: number,
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('updateNumCopies', cardName, n, f)
                      "
                      @change-board="
                        (
                          cardName: string,
                          b: 'Mainboard' | 'Sideboard' | 'Considering',
                          f: 'Mainboard' | 'Sideboard' | 'Considering',
                        ) => emit('changeBoard', cardName, b, f)
                      "
                      @flip="handleCardFlip"
                    />
                  </div>
                </div>
              </template>
              <!-- Grouped considering cards -->
              <UAccordion
                v-if="consideringLabeled.length > 0"
                type="multiple"
                v-model="openConsideringValues"
                :items="consideringAccordionItems"
                :ui="{
                  item: 'w-full mx-auto sm:mx-0',
                  trigger:
                    'cursor-pointer bg-secondary text-white rounded-lg px-4 py-2 mb-1',
                }"
              >
                <template
                  v-for="group in consideringLabeled"
                  :key="groupKey(group)"
                  #[groupKey(group)]
                >
                  <div :class="[cardGridClasses, 'p-2']">
                    <div
                      v-for="card in group.cards"
                      :key="card.card_data.oracle_id"
                      @mouseenter="setPreviewCard(card, 'Considering')"
                      @focusin="setPreviewCard(card, 'Considering')"
                      @mouseleave="clearPendingPreviewCard(card.card_data.id)"
                    >
                      <component
                        :is="cardComponent"
                        is-list-card
                        :card="card"
                        :is-flipped="flippedCards[card.card_data.id] ?? false"
                        :is-deck-commander="false"
                        :is-commander-card="isCommanderCard(card)"
                        :commander-color-identity="commanderColorIdentity"
                        :num-copies="
                          listItemsMap?.Considering?.[card.card_data.oracle_id]
                            ?.num_copies
                        "
                        :board="'Considering'"
                        :legality-quantity="
                          legalityQuantity(card, 'Considering')
                        "
                        :format="format"
                        :is-owner="isOwner"
                        @remove="
                          (
                            cardId: string,
                            f: 'Mainboard' | 'Sideboard' | 'Considering',
                          ) => emit('removeCard', cardId, f)
                        "
                        @set-commander="
                          (cardName: string) => emit('setCommander', cardName)
                        "
                        @clear-commander="
                          (cardId: string) => emit('clearCommander', cardId)
                        "
                        @update-num-copies="
                          (
                            cardName: string,
                            n: number,
                            f: 'Mainboard' | 'Sideboard' | 'Considering',
                          ) => emit('updateNumCopies', cardName, n, f)
                        "
                        @change-board="
                          (
                            cardName: string,
                            b: 'Mainboard' | 'Sideboard' | 'Considering',
                            f: 'Mainboard' | 'Sideboard' | 'Considering',
                          ) => emit('changeBoard', cardName, b, f)
                        "
                        @flip="handleCardFlip"
                      />
                    </div>
                  </div>
                </template>
              </UAccordion>
            </UCard>
          </template>
          <div
            v-if="!hideEmptyState && !hasAnyCards"
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <UIcon
              name="i-lucide-layers"
              class="w-16 h-16 mb-4 text-gray-400"
            />
            <h3
              class="text-xl font-semibold mb-2 text-gray-600 dark:text-gray-300"
            >
              This list is empty!
            </h3>
            <p class="text-gray-500 dark:text-gray-400 max-w-md">
              Use the search dropdown above, or the
              <span class="font-medium">Add to Deck</span> button from the
              clipboard to add cards to this deck.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { deckCardGridClasses } from '~/composables/useDeckCardGrid';
import { getUsdPrice, isBasicLand } from '~/utils/cardPrice';
import type { Card } from '~/models/cardModel';
import type { DeckPreferences } from '~/models/preferencesModel';
import type { CardGroup } from '~/utils/sort';
import {
  cardGroupKey as groupKey,
  useCardGroupExpansion,
} from '~/composables/useCardGroupExpansion';
import type { AccordionItem } from '@nuxt/ui';
import { provideCommandersSet } from '~/composables/useBulkData';
import { provideSearchHistory } from '~/composables/useSearchHistory';
import { useDesktopPreview } from '~/composables/useIsMobile';

provideSearchHistory();
const isDesktopPreview = useDesktopPreview();
import ListCard from '~/components/cards/ListCard.vue';
import CardText from '~/components/cards/CardText.vue';

type CardView = DeckPreferences['deck_view'];

const props = withDefaults(
  defineProps<{
    view?: CardView;
    isLoading: boolean;
    isOwner: boolean;
    groups: CardGroup[] | null;
    suggestions?: Card[];
    commanderOracleIds?: string[] | null;
    commanderColorIdentity?: string[] | null;
    listItemsMap?: Partial<
      Record<
        'Mainboard' | 'Sideboard' | 'Considering',
        Record<string, { num_copies: number }>
      >
    >;
    format?: string;
    collection?: boolean;
    hideEmptyState?: boolean;
    sideboardGroups?: CardGroup[] | null;
    consideringGroups?: CardGroup[] | null;
    decklistCardNames?: string[];
  }>(),
  {
    view: 'grid',
  },
);

// Considering is a workspace for alternatives, not part of the submitted deck.
const deckQuantities = computed(() => {
  const totals: Record<string, number> = {};
  for (const board of ['Mainboard', 'Sideboard'] as const) {
    for (const [id, item] of Object.entries(
      props.listItemsMap?.[board] ?? {},
    )) {
      totals[id] = (totals[id] ?? 0) + item.num_copies;
    }
  }
  return totals;
});
function legalityQuantity(card: Card, board: Board) {
  const id = card.card_data.oracle_id;
  return board === 'Considering'
    ? props.listItemsMap?.Considering?.[id]?.num_copies
    : deckQuantities.value[id];
}

const cardComponent = computed(() =>
  props.view === 'text' ? CardText : ListCard,
);
const cardGridClasses = computed(() =>
  props.view === 'text'
    ? 'grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-0'
    : deckCardGridClasses,
);

const { data: commandersSet } = provideCommandersSet();

function flattenGroups(groups: CardGroup[] | null | undefined): Card[] {
  if (!groups) return [];
  return groups.flatMap((group) => group.cards);
}

function isCommanderCard(card: Card): boolean {
  if (!card?.card_data?.name || !commandersSet.value) return false;
  return commandersSet.value.has(card.card_data.name);
}

const ungroupedGroups = computed(() => {
  if (!props.groups) return [];
  return props.groups.filter((g) => !g.label);
});

const labeledGroups = computed(() => {
  if (!props.groups) return [];
  return props.groups.filter((g) => g.label);
});

const accordionItems = computed<AccordionItem[]>(() => {
  return labeledGroups.value.map((g) => ({
    label: g.label,
    value: groupKey(g),
    slot: groupKey(g),
  }));
});

const {
  openValues: openAccordionValues,
  expandAll: expandAllGroups,
  collapseAll: collapseAllGroups,
} = useCardGroupExpansion(labeledGroups);

// Sideboard accordion
const sideboardLabeled = computed(() => {
  if (!props.sideboardGroups) return [];
  return props.sideboardGroups.filter((g) => g.label);
});
const sideboardUngrouped = computed(() => {
  if (!props.sideboardGroups) return [];
  return props.sideboardGroups.filter((g) => !g.label);
});
const sideboardAccordionItems = computed<AccordionItem[]>(() => {
  return sideboardLabeled.value.map((g) => ({
    label: g.label,
    value: groupKey(g),
    slot: groupKey(g),
  }));
});
const sideboardExpanded = ref(false);
const { openValues: openSideboardValues } =
  useCardGroupExpansion(sideboardLabeled);

// Considering accordion
const consideringLabeled = computed(() => {
  if (!props.consideringGroups) return [];
  return props.consideringGroups.filter((g) => g.label);
});
const consideringUngrouped = computed(() => {
  if (!props.consideringGroups) return [];
  return props.consideringGroups.filter((g) => !g.label);
});
const consideringAccordionItems = computed<AccordionItem[]>(() => {
  return consideringLabeled.value.map((g) => ({
    label: g.label,
    value: groupKey(g),
    slot: groupKey(g),
  }));
});
const consideringExpanded = ref(false);
const { openValues: openConsideringValues } =
  useCardGroupExpansion(consideringLabeled);

const flippedCards = ref<Record<string, boolean>>({});

function handleCardFlip(cardId: string) {
  flippedCards.value = {
    ...flippedCards.value,
    [cardId]: !(flippedCards.value[cardId] ?? false),
  };
}

const hoveredCardId = ref<string | null>(null);
type PreviewGroup = Board | 'Suggested';
const hoveredBoard = ref<PreviewGroup>('Mainboard');

const previewEntries = computed(() => [
  ...flattenGroups(props.groups).map((card) => ({
    card,
    board: 'Mainboard' as Board,
  })),
  ...flattenGroups(props.sideboardGroups).map((card) => ({
    card,
    board: 'Sideboard' as Board,
  })),
  ...flattenGroups(props.consideringGroups).map((card) => ({
    card,
    board: 'Considering' as Board,
  })),
  ...(props.suggestions ?? []).map((card) => ({
    card,
    board: 'Suggested' as const,
  })),
]);
const previewCandidates = computed(() =>
  previewEntries.value.map((entry) => entry.card),
);

const previewCard = computed(() => {
  if (previewCandidates.value.length === 0) return null;
  if (!hoveredCardId.value) return previewCandidates.value[0];
  return (
    previewEntries.value.find(
      ({ card, board }) =>
        card.card_data.id === hoveredCardId.value &&
        board === hoveredBoard.value,
    )?.card ?? previewCandidates.value[0]
  );
});

const hasAnyCards = computed(() => previewCandidates.value.length > 0);

watch(
  previewEntries,
  (entries) => {
    if (entries.length === 0) {
      hoveredCardId.value = null;
      return;
    }

    const stillExists = hoveredCardId.value
      ? entries.some(
          ({ card, board }) =>
            card.card_data.id === hoveredCardId.value &&
            board === hoveredBoard.value,
        )
      : false;

    if (!stillExists) {
      hoveredCardId.value = entries[0].card.card_data.id;
      hoveredBoard.value = entries[0].board;
    }
  },
  { immediate: true },
);

const HOVER_PREVIEW_DELAY_MS = 75;
let _hoverRafId: number | null = null;
let _hoverDelayId: ReturnType<typeof setTimeout> | null = null;
let _pendingPreviewCardId: string | null = null;

function clearPendingPreviewCard(cardId?: string) {
  if (cardId && _pendingPreviewCardId !== cardId) return;

  if (_hoverDelayId !== null) {
    clearTimeout(_hoverDelayId);
    _hoverDelayId = null;
  }
  if (_hoverRafId !== null) {
    cancelAnimationFrame(_hoverRafId);
    _hoverRafId = null;
  }
  _pendingPreviewCardId = null;
}

function setPreviewCard(card: Card, board: PreviewGroup = 'Mainboard') {
  // Touch interactions must not schedule updates for a preview that is hidden.
  if (!isDesktopPreview.value) return;
  const nextCardId = card.card_data.id;
  // Skip entirely if the card hasn't changed — prevents jitter from child mouseenter events
  if (nextCardId === hoveredCardId.value && board === hoveredBoard.value)
    return;

  _pendingPreviewCardId = nextCardId;

  // Keep a short hover-intent delay so moving toward the preview rail doesn't swap cards instantly.
  if (_hoverDelayId !== null) clearTimeout(_hoverDelayId);
  _hoverDelayId = setTimeout(() => {
    if (_pendingPreviewCardId !== nextCardId) return;
    // Coalesce committed updates to one paint frame.
    if (_hoverRafId !== null) cancelAnimationFrame(_hoverRafId);
    _hoverRafId = requestAnimationFrame(() => {
      if (_pendingPreviewCardId !== nextCardId) return;
      if (
        !previewEntries.value.some(
          (entry) =>
            entry.card.card_data.id === nextCardId && entry.board === board,
        )
      ) {
        clearPendingPreviewCard();
        return;
      }
      hoveredCardId.value = nextCardId;
      hoveredBoard.value = board;
      _pendingPreviewCardId = null;
      _hoverRafId = null;
    });
    _hoverDelayId = null;
  }, HOVER_PREVIEW_DELAY_MS);
}

watch(isDesktopPreview, (enabled) => {
  if (!enabled) clearPendingPreviewCard();
});

onUnmounted(() => {
  clearPendingPreviewCard();
});

const emit = defineEmits<{
  (
    e: 'removeCard',
    cardId: string,
    fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
  ): void;
  (e: 'setCommander', cardName: string): void;
  (e: 'clearCommander', cardId: string): void;
  (
    e: 'updateNumCopies',
    cardName: string,
    numCopies: number,
    fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
  ): void;
  (
    e: 'changeBoard',
    cardName: string,
    board: 'Mainboard' | 'Sideboard' | 'Considering',
    fromBoard: 'Mainboard' | 'Sideboard' | 'Considering',
  ): void;
}>();

type Board = 'Mainboard' | 'Sideboard' | 'Considering';

function uniqueGroupCards(groups: CardGroup[] | null | undefined): Card[] {
  return [
    ...new Map(
      (groups ?? [])
        .flatMap((group) => group.cards)
        .map((card) => [card.card_data.oracle_id, card]),
    ).values(),
  ];
}
function countCards(
  groups: CardGroup[] | null | undefined,
  board: Board,
): number {
  return uniqueGroupCards(groups).reduce(
    (total, card) =>
      total +
      (props.listItemsMap?.[board]?.[card.card_data.oracle_id]?.num_copies ??
        1),
    0,
  );
}
function sumPrice(
  groups: CardGroup[] | null | undefined,
  board: Board,
): number {
  return uniqueGroupCards(groups).reduce(
    (total, card) =>
      total +
      (props.collection || !isBasicLand(card.card_data)
        ? parseFloat(getUsdPrice(card.card_data.prices) ?? '0') || 0
        : 0) *
        (props.listItemsMap?.[board]?.[card.card_data.oracle_id]?.num_copies ??
          1),
    0,
  );
}

const mainboardCount = computed(() => countCards(props.groups, 'Mainboard'));
const sideboardCount = computed(() =>
  countCards(props.sideboardGroups, 'Sideboard'),
);
const consideringCount = computed(() =>
  countCards(props.consideringGroups, 'Considering'),
);

const mainboardPrice = computed(() => sumPrice(props.groups, 'Mainboard'));
const sideboardPrice = computed(() =>
  sumPrice(props.sideboardGroups, 'Sideboard'),
);
const consideringPrice = computed(() =>
  sumPrice(props.consideringGroups, 'Considering'),
);

function groupToId(label: string): string {
  return (
    'group-' +
    label
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/-+$/, '')
      .toLowerCase()
  );
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
  font-size: 0.875rem;
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

.preview-sticky {
  width: 100%;
}

.preview-rail {
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
}
</style>
