<script setup lang="ts">
import { getUsdPrice } from '~/utils/cardPrice';
import type { Card } from '~/models/cardModel';
import {
  cardActionStyles,
  findSimilarAction,
  type CardActionMenu,
} from '~/utils/card-actions';
import {
  generateTCGPlayerSearchUrl,
  getAffiliateLink,
} from '~/utils/tcgPlayer';
const props = defineProps<{
  listId: string;
  title: string;
  oracleIds: string[];
  ready: boolean;
  newestSet?: boolean;
  automatic?: boolean;
  acknowledge?: () => Promise<void>;
  savedBudget: number | null;
  budgetReady: boolean;
  budgetSaving: boolean;
  saveBudget: (value: number | null) => Promise<void>;
}>();
const api = useLibraryApi();
const selectedCard = ref<Card | null>(null);
const actionsOpen = ref(false);
const actionTrigger = shallowRef<HTMLButtonElement | null>(null);
function openActions(card: Card, event: MouseEvent) {
  selectedCard.value = card;
  actionTrigger.value = event.currentTarget as HTMLButtonElement;
  actionsOpen.value = true;
}
watch(actionsOpen, async (open) => {
  if (!open) {
    await nextTick();
    if (actionTrigger.value?.isConnected) actionTrigger.value.focus();
  }
});
const cardActions = computed<CardActionMenu>(() => {
  const card = selectedCard.value;
  if (!card) return {};
  const data = card.card_data;
  return {
    addToDeck: {
      label: 'Add to Deck',
      icon: 'i-lucide-plus',
      disabled:
        !!adding.value ||
        props.oracleIds.includes(data.oracle_id) ||
        added.value.has(data.oracle_id),
      onSelect: () => {
        void add(card);
      },
    },
    similar: {
      ...findSimilarAction,
      to: `/search/all/similarity?${new URLSearchParams({ card_name: data.name, searchType: 'similarity' })}`,
    },
    marketplace: {
      label: data.tcgplayer_id ? 'Buy on TCGPlayer' : 'Search on TCGPlayer',
      ...(data.tcgplayer_id
        ? cardActionStyles.buy
        : cardActionStyles.searchMarketplace),
      to: data.tcgplayer_id
        ? getAffiliateLink(data.tcgplayer_id)
        : generateTCGPlayerSearchUrl(data.name),
      target: '_blank',
      rel: 'noopener noreferrer',
    },
  };
});

const section = ref<HTMLElement | null>(null);
const emit = defineEmits<{
  close: [];
  preview: [card: Card];
  cancelPreview: [cardId: string];
}>();
const acknowledging = ref(false);
async function closeSuggestions() {
  if (!props.acknowledge) {
    emit('close');
    return;
  }
  if (acknowledging.value) return;
  acknowledging.value = true;
  error.value = '';
  try {
    await props.acknowledge();
    emit('close');
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    acknowledging.value = false;
  }
}
const { addCardsToListMutation } = useCardLists();
const toast = useToast();
const queue = ref<Card[]>([]),
  added = ref(new Set<string>());
const loading = ref(false),
  error = ref(''),
  adding = ref<string | null>(null);
let sequence = 0;
const remaining = computed(() => {
  const used = new Set([...props.oracleIds, ...added.value]);
  return queue.value.filter((card) => {
    const price = getUsdPrice(card.card_data.prices);
    return (
      !used.has(card.card_data.oracle_id) &&
      (targetBudget.value === undefined ||
        (price != null &&
          Math.round(Number(price) * 100) <=
            Math.round(targetBudget.value * 100)))
    );
  });
});
const { previewCount, expandThreshold } = useDeckSuggestionGrid();
const expanded = ref(false);
const visibleCount = computed(() =>
  expanded.value ? remaining.value.length : previewCount.value,
);
const budgetInput = ref<string | number>('');
const targetBudget = computed(() => props.savedBudget ?? undefined);
watch(
  () => props.savedBudget,
  (value) => {
    budgetInput.value = value ?? '';
  },
  { immediate: true },
);
const setName = ref('');
const visible = computed(() => remaining.value.slice(0, visibleCount.value));
defineExpose({ visible });
async function applyBudget() {
  const value = String(budgetInput.value).trim()
    ? Number(budgetInput.value)
    : undefined;
  if (
    value !== undefined &&
    (!Number.isFinite(value) || value < 0 || value > 1000000)
  ) {
    error.value = 'Enter a budget from $0 to $1,000,000.';
    return;
  }
  error.value = '';
  try {
    await props.saveBudget(value ?? null);
  } catch (cause) {
    error.value = (cause as Error).message;
  }
}
async function load() {
  if (!props.ready || !props.budgetReady || loading.value) return;
  const current = ++sequence;
  loading.value = true;
  error.value = '';
  try {
    const result = await api.request<{
      results: Card[];
      set?: { name: string };
    }>(`/lists/${props.listId}/suggestions`, 'POST', {
      targetBudget: targetBudget.value,
      newestSet: !!props.newestSet,
    });
    if (current === sequence) {
      queue.value = result.results;
      setName.value = result.set?.name ?? '';
    }
  } catch (cause) {
    if (current === sequence) error.value = (cause as Error).message;
  } finally {
    if (current === sequence) loading.value = false;
  }
}
watch(
  [
    api.isPro,
    api.userId,
    () => props.listId,
    () => props.budgetReady,
    () => props.ready,
    targetBudget,
  ],
  () => {
    sequence++;
    actionsOpen.value = false;
    selectedCard.value = null;
    queue.value = [];
    added.value = new Set();
    expanded.value = false;
    loading.value = false;
    error.value = '';
    if (props.ready && props.budgetReady) void load();
  },
  { immediate: true },
);
onBeforeUnmount(() => sequence++);
async function add(card: Card) {
  if (adding.value) return;
  adding.value = card.card_data.oracle_id;
  error.value = '';
  try {
    await addCardsToListMutation.mutateAsync({
      listId: props.listId,
      oracleIds: [card.card_data.oracle_id],
      board: 'Mainboard',
    });
    added.value = new Set([...added.value, card.card_data.oracle_id]);
    toast.add({
      title: 'Card added to deck',
      description: card.card_name,
      color: 'success',
    });
    if (api.isPro.value && !remaining.value.length) await load();
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    adding.value = null;
  }
}
</script>
<template>
  <section
    v-show="!automatic || remaining.length > 0"
    ref="section"
    class="my-6 rounded-lg border border-primary/25 bg-primary/5 p-4"
    :aria-label="title"
  >
    <LazyCardActionsModal
      v-if="selectedCard"
      v-model:open="actionsOpen"
      :card="selectedCard"
      :actions="cardActions"
      :board="newestSet ? 'New-card suggestion' : 'Suggested'"
    />
    <div class="flex items-center justify-between gap-3 mb-3">
      <h2 class="min-w-0 wrap-anywhere font-semibold">
        {{ title }}
        <span v-if="newestSet" class="text-xs text-(--pro-accent)">Pro</span>
      </h2>
      <div class="flex flex-wrap items-center gap-1">
        <UButton
          label="Refresh suggestions"
          icon="i-lucide-refresh-cw"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="!ready || !budgetReady || budgetSaving || !!adding"
          :loading="loading"
          @click="load"
        />
        <UButton
          icon="i-lucide-x"
          :aria-label="
            newestSet ? 'Close new-card suggestions' : 'Close suggested adds'
          "
          variant="ghost"
          size="xs"
          :loading="acknowledging"
          :disabled="newestSet && !!adding"
          @click="closeSuggestions"
        />
      </div>
    </div>
    <p v-if="newestSet" class="text-sm text-muted mb-3">
      Suggestions from {{ setName || 'the newest released expansion' }}. Card
      suggestions will show automatically when there are new cards you should
      know about!
    </p>
    <form
      v-if="api.isPro.value"
      class="flex flex-wrap items-end gap-2 mb-3"
      @submit.prevent="applyBudget"
    >
      <UFormField
        label="Target card budget (USD)"
        :name="newestSet ? 'new-set-budget' : 'suggestion-budget'"
      >
        <UInput
          v-model="budgetInput"
          :disabled="!budgetReady || budgetSaving"
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          placeholder="No limit"
          class="w-40"
        />
      </UFormField>
      <UButton
        type="submit"
        label="Apply budget"
        variant="outline"
        :disabled="!budgetReady || budgetSaving || loading || !!adding"
      />
      <span v-if="targetBudget !== undefined" class="text-sm text-muted"
        >Cards at ${{ targetBudget.toFixed(2) }} or less each. Prices are
        estimates.</span
      >
    </form>
    <div>
      <DeckSuggestionGrid
        v-if="(!budgetReady || loading) && !visible.length"
        :expanded="expanded"
        role="status"
        aria-label="Loading suggestions"
      >
        <USkeleton
          v-for="n in previewCount"
          :key="n"
          class="w-full aspect-[488/680] rounded-[14px]"
        />
      </DeckSuggestionGrid>
      <DeckSuggestionGrid v-else-if="visible.length" :expanded="expanded">
        <button
          v-for="card in visible"
          :key="card.card_data.oracle_id"
          type="button"
          :aria-label="`Options for ${card.card_data.name}`"
          aria-haspopup="dialog"
          :aria-expanded="
            actionsOpen &&
            selectedCard?.card_data.oracle_id === card.card_data.oracle_id
          "
          class="deck-card-surface block min-w-0 w-full overflow-hidden rounded-[14px] focus-visible:outline-2 focus-visible:outline-primary"
          @mouseenter="emit('preview', card)"
          @focus="emit('preview', card)"
          @mouseleave="emit('cancelPreview', card.card_data.id)"
          @click="openActions(card, $event)"
        >
          <CardArtwork :card="card.card_data" />
        </button>
      </DeckSuggestionGrid>
      <p v-else-if="!error" class="text-sm text-muted">
        {{
          !oracleIds.length
            ? 'Add a few cards to get suggestions.'
            : targetBudget !== undefined
              ? 'No more suggestions at this price. Try a higher card budget.'
              : 'No more suggestions right now.'
        }}
      </p>
    </div>
    <UButton
      v-if="expanded || remaining.length > expandThreshold"
      :label="expanded ? 'Show less' : 'Show more'"
      :aria-expanded="expanded"
      variant="outline"
      class="mt-3"
      @click="expanded = !expanded"
    />
    <p v-if="error" role="alert" class="mt-3 text-sm text-error">{{ error }}</p>
  </section>
</template>
