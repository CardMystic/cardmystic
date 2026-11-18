<script setup lang="ts">
import type { Card } from '~/models/cardModel';
import { captureSuggestionFocus } from '~/utils/suggestionFocus';
import {
  deckSuggestionActions,
  findSimilarAction,
  type CardActionMenu,
} from '~/utils/card-actions';
const props = defineProps<{
  listId: string;
  revision: string;
  oracleIds: string[];
}>();
const emit = defineEmits<{
  preview: [card: Card];
  cancelPreview: [cardId: string];
}>();
const api = useLibraryApi(),
  toast = useToast();
const { removeCardFromListMutation } = useCardLists();
const open = defineModel<boolean>('open', { default: false });
const loading = ref(false),
  error = ref(''),
  removing = ref<string | null>(null);
const results = ref<Card[]>([]),
  removed = ref(new Set<string>());
const expanded = ref(false),
  loadedRevision = ref('');
const section = ref<HTMLElement | null>(null);
const { previewCount, expandThreshold } = useDeckSuggestionGrid();
const remaining = computed(() =>
  results.value.filter(
    (card) =>
      props.oracleIds.includes(card.card_data.oracle_id) &&
      !removed.value.has(card.card_data.oracle_id),
  ),
);
const visible = computed(() =>
  expanded.value
    ? remaining.value
    : remaining.value.slice(0, previewCount.value),
);
const selected = ref<Card | null>(null),
  modalOpen = ref(false);
const actions = computed<CardActionMenu>(() =>
  selected.value
    ? {
        cut: {
          ...deckSuggestionActions.cut,
          label: 'Remove from Deck',
          disabled: !!removing.value,
          onSelect: () => {
            if (selected.value) void cut(selected.value);
          },
        },
        similar: {
          ...findSimilarAction,
          to: `/search/all/similarity?${new URLSearchParams({ card_name: selected.value.card_name, searchType: 'similarity' })}`,
        },
      }
    : {},
);

let sequence = 0;
async function load() {
  loading.value = true;
  error.value = '';
  expanded.value = false;
  const current = ++sequence,
    revision = props.revision;
  try {
    const data = await api.request<{ results: Card[] }>(
      `/lists/${props.listId}/cuts`,
      'POST',
      {},
    );
    if (sequence === current) {
      results.value = data.results;
      removed.value = new Set();
      loadedRevision.value = revision;
    }
  } catch (cause) {
    if (sequence === current) error.value = (cause as Error).message;
  } finally {
    if (sequence === current) loading.value = false;
  }
}
async function cut(card: Card) {
  if (removing.value) return;
  const restoreFocus = captureSuggestionFocus(section.value);
  removing.value = card.card_data.oracle_id;
  error.value = '';
  try {
    await removeCardFromListMutation.mutateAsync({
      listId: props.listId,
      oracleId: card.card_data.oracle_id,
      board: 'Mainboard',
    });
    removed.value = new Set([...removed.value, card.card_data.oracle_id]);
    toast.add({
      title: 'Card removed from deck',
      description: card.card_name,
      color: 'success',
    });
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    removing.value = null;
    await restoreFocus();
  }
}
watch(open, (value) => {
  if (value) void load();
  else {
    sequence++;
    loading.value = false;
  }
});
watch([api.userId, () => props.listId], () => {
  sequence++;
  open.value = false;
  results.value = [];
});
onBeforeUnmount(() => sequence++);
</script>
<template>
  <section
    v-if="open"
    ref="section"
    aria-label="Suggested Cuts"
    tabindex="-1"
    class="my-4 rounded-lg border border-error/30 bg-error/5 p-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h2 class="font-semibold">Suggested Cuts</h2>
      <div class="flex gap-1">
        <UButton
          icon="i-lucide-refresh-cw"
          aria-label="Refresh cuts"
          variant="ghost"
          :disabled="!!removing"
          :loading="loading"
          @click="load"
        /><UButton
          icon="i-lucide-x"
          aria-label="Close suggested cuts"
          variant="ghost"
          @click="open = false"
        />
      </div>
    </div>
    <p class="text-sm text-muted mb-3">
      Cards that fit less closely with the rest of your deck. Click a card to
      review it or remove all copies from the mainboard. Lands and commanders
      are excluded.
    </p>
    <DeckSuggestionGrid
      v-if="loading"
      :expanded="expanded"
      role="status"
      aria-label="Loading suggested cuts"
    >
      <DeckSuggestionSkeleton v-for="n in previewCount" :key="n" />
    </DeckSuggestionGrid>
    <DeckSuggestionGrid v-else :expanded="expanded">
      <div
        v-for="card in visible"
        :key="card.card_data.oracle_id"
        class="min-w-0 flex flex-col gap-2"
      >
        <button
          type="button"
          :aria-label="`Options for ${card.card_name}`"
          aria-haspopup="dialog"
          :aria-expanded="
            modalOpen &&
            selected?.card_data.oracle_id === card.card_data.oracle_id
          "
          class="deck-card-surface block min-w-0 w-full overflow-hidden rounded-[14px] focus-visible:outline-2 focus-visible:outline-primary"
          @mouseenter="emit('preview', card)"
          @focus="emit('preview', card)"
          @mouseleave="emit('cancelPreview', card.card_data.id)"
          @click="
            selected = card;
            modalOpen = true;
          "
        >
          <CardArtwork :card="card.card_data" />
        </button>
        <DeckSuggestionAction
          action="cut"
          :label="`Cut ${card.card_name} from deck`"
          :disabled="!!removing"
          :loading="removing === card.card_data.oracle_id"
          @click="cut(card)"
        />
      </div>
    </DeckSuggestionGrid>
    <p
      v-if="!loading && !remaining.length && !error"
      class="text-sm text-muted"
    >
      No more suggested cuts. Refresh after making changes to check again.
    </p>
    <UButton
      v-if="expanded || remaining.length > expandThreshold"
      :label="expanded ? 'Show less' : 'Show more'"
      :aria-expanded="expanded"
      variant="outline"
      class="mt-3"
      @click="expanded = !expanded"
    />
    <p
      v-if="loadedRevision && loadedRevision !== revision && !loading"
      class="text-xs text-muted mt-3"
    >
      Your deck has changed. Refresh to update the suggestions.
    </p>
    <p v-if="error" role="alert" class="text-error mt-3">{{ error }}</p>
    <LazyCardActionsModal
      v-if="selected && modalOpen"
      v-model:open="modalOpen"
      :card="selected"
      :actions="actions"
      board="Mainboard"
    />
  </section>
</template>
