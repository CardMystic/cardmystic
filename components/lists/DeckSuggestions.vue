<script setup lang="ts">
import { useElementSize, useIntersectionObserver } from '@vueuse/core';
import type { Card } from '~/models/cardModel';
import type { CardAction } from '~/utils/card-actions';
import { getCardImageUrl } from '~/utils/scryfall';
import {
  generateTCGPlayerSearchUrl,
  getAffiliateLink,
} from '~/utils/tcgPlayer';
const props = defineProps<{
  listId: string;
  oracleIds: string[];
  ready: boolean;
  newestSet?: boolean;
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
const cardActions = computed<CardAction[][]>(() => {
  const card = selectedCard.value;
  if (!card) return [];
  const data = card.card_data;
  return [
    [
      {
        label: 'View Card Details',
        icon: 'i-lucide-info',
        to: `/card/${data.oracle_id}`,
      },
      {
        label: 'Add to Deck',
        icon: 'i-lucide-plus',
        disabled:
          !!adding.value ||
          !api.isPro.value ||
          props.oracleIds.includes(data.oracle_id) ||
          added.value.has(data.oracle_id),
        onSelect: () => {
          void add(card);
        },
      },
      {
        label: 'Find Similar Cards',
        icon: 'i-mdi-cards-outline',
        to: `/search/all/similarity?${new URLSearchParams({ card_name: data.name, searchType: 'similarity' })}`,
      },
      {
        label: data.tcgplayer_id ? 'Buy on TCGPlayer' : 'Search on TCGPlayer',
        icon: 'i-lucide-shopping-cart',
        to: data.tcgplayer_id
          ? getAffiliateLink(data.tcgplayer_id)
          : generateTCGPlayerSearchUrl(data.name),
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    ],
  ];
});
const section = ref<HTMLElement | null>(null);
const inView = ref(false);
const emit = defineEmits<{ visible: [] }>();
useIntersectionObserver(
  section,
  ([entry]) => {
    inView.value = !!entry?.isIntersecting;
    if (inView.value) emit('visible');
  },
  { rootMargin: '0px' },
);
const { addCardsToListMutation } = useCardLists();
const toast = useToast();
const queue = ref<Card[]>([]),
  added = ref(new Set<string>());
const loading = ref(false),
  error = ref(''),
  adding = ref<string | null>(null),
  loaded = ref(false);
let sequence = 0;
const remaining = computed(() => {
  const used = new Set([...props.oracleIds, ...added.value]);
  return queue.value.filter(
    (card) =>
      !used.has(card.card_data.oracle_id) &&
      (targetBudget.value === undefined ||
        (card.card_data.prices?.usd != null &&
          Math.round(Number(card.card_data.prices.usd) * 100) <=
            Math.round(targetBudget.value * 100))),
  );
});
const grid = ref<HTMLElement | null>(null);
const { width } = useElementSize(grid);
const rowCapacity = computed(() =>
  Math.max(1, Math.floor((width.value + 12) / 108)),
);
const expanded = ref(false);
const visibleCount = computed(() =>
  expanded.value ? remaining.value.length : rowCapacity.value,
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
const title = computed(() =>
  props.newestSet ? 'New Cards for Deck' : 'Suggested cards',
);
const visible = computed(() => remaining.value.slice(0, visibleCount.value));
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
  if (
    !inView.value ||
    !api.isPro.value ||
    !props.ready ||
    !props.budgetReady ||
    loading.value
  )
    return;
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
      loaded.value = true;
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
    targetBudget,
  ],
  () => {
    sequence++;
    actionsOpen.value = false;
    selectedCard.value = null;
    queue.value = [];
    added.value = new Set();
    expanded.value = false;
    loaded.value = false;
    loading.value = false;
    error.value = '';
    if (api.isPro.value && props.ready && props.budgetReady) void load();
  },
  { immediate: true },
);
watch([inView, () => props.ready], () => {
  if (inView.value && props.ready && !loaded.value) void load();
});
onBeforeUnmount(() => sequence++);
async function add(card: Card) {
  if (adding.value || !api.isPro.value) return;
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
    if (!remaining.value.length) await load();
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    adding.value = null;
  }
}
</script>
<template>
  <section
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
      <h2 class="font-semibold">
        {{ title }} <span class="text-xs text-(--pro-accent)">Pro</span>
      </h2>
      <UButton
        v-if="api.isPro.value"
        label="Refresh suggestions"
        icon="i-lucide-refresh-cw"
        size="xs"
        color="neutral"
        variant="ghost"
        :disabled="!ready || !budgetReady || budgetSaving || !!adding"
        :loading="loading"
        @click="load"
      />
    </div>
    <p v-if="newestSet" class="text-sm text-muted mb-3">
      Suggestions from {{ setName || 'the newest released expansion' }}. Refresh
      to check for new cards.
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
    <div ref="grid">
      <NuxtLink
        v-if="!api.isPro.value"
        to="/memberships"
        class="block relative rounded-lg overflow-hidden p-2"
        :aria-label="
          newestSet
            ? 'Subscribe for new-card alerts'
            : 'Subscribe for suggestions'
        "
      >
        <div class="flex gap-3 overflow-hidden" aria-hidden="true">
          <div
            v-for="n in rowCapacity"
            :key="n"
            class="w-24 aspect-[488/680] shrink-0 rounded-lg bg-muted/50"
          />
        </div>
        <div
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-default/65"
        >
          <UIcon name="i-lucide-lock" class="size-5" /><span
            class="font-semibold"
            >Subscribe for suggestions</span
          ><span class="text-sm text-(--pro-accent)">CardMystic Pro</span>
        </div>
      </NuxtLink>
      <div
        v-else-if="(!budgetReady || loading) && !visible.length"
        class="flex gap-3 overflow-hidden"
        role="status"
        aria-label="Loading suggestions"
      >
        <USkeleton
          v-for="n in rowCapacity"
          :key="n"
          class="w-24 aspect-[488/680] shrink-0 rounded-lg"
        />
      </div>
      <div
        v-else-if="visible.length"
        class="grid gap-3 pb-2"
        :style="{ gridTemplateColumns: `repeat(${rowCapacity}, 6rem)` }"
      >
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
          class="block w-24 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
          @click="openActions(card, $event)"
        >
          <img
            :src="getCardImageUrl(card.card_data)"
            :alt="card.card_name"
            width="96"
            height="134"
            loading="lazy"
            class="w-24 aspect-[488/680] rounded-lg object-cover"
          />
        </button>
      </div>
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
      v-if="expanded || remaining.length > visibleCount"
      :label="expanded ? 'Show less' : 'Show more'"
      variant="outline"
      class="mt-3"
      @click="expanded = !expanded"
    />
    <p v-if="error" role="alert" class="mt-3 text-sm text-error">{{ error }}</p>
  </section>
</template>
