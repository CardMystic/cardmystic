<script setup lang="ts">
import type { AnalysisCard } from '~/utils/deckAnalysis';
import type { ScryfallCard } from '~/models/cardModel';
import { captureSuggestionFocus } from '~/utils/suggestionFocus';
import {
  gameChangersInDeck,
  replacementColors,
} from '~/utils/gameChangerReplacements';
const props = defineProps<{
  entries: AnalysisCard[];
  listId: string;
  editable: boolean;
}>();
const open = defineModel<boolean>('open', { default: false });
const { addCardsByNameToListMutation, removeCardFromListMutation } =
  useCardLists();
const cardEditToast = useCardEditToast();
const section = ref<HTMLElement | null>(null);
const busy = ref(false);
const error = ref('');
const snapshot = shallowRef<AnalysisCard[]>([]);
const pendingRemoval = shallowRef<{
  source: ScryfallCard;
  replacement: ScryfallCard;
} | null>(null);
const replacingId = ref('');
// Keep the row mounted while the existing mutations update their query caches.
const displayedEntries = computed(() =>
  busy.value ? snapshot.value : props.entries,
);
const gameChangers = computed(() => gameChangersInDeck(displayedEntries.value));
const colors = computed(() => replacementColors(displayedEntries.value));
const oracleIds = computed(() =>
  displayedEntries.value.map(({ card }) => card.oracle_id),
);

function isCommander(card: ScryfallCard) {
  return displayedEntries.value.some(
    (entry) => entry.card.oracle_id === card.oracle_id && entry.commander,
  );
}

async function finishRemoval() {
  const pending = pendingRemoval.value;
  if (!pending) return;
  await removeCardFromListMutation.mutateAsync({
    listId: props.listId,
    oracleId: [pending.source.oracle_id],
    board: 'Mainboard',
  });
  pendingRemoval.value = null;
}

async function replace(source: ScryfallCard, replacement: ScryfallCard) {
  if (
    !props.editable ||
    busy.value ||
    pendingRemoval.value ||
    isCommander(source)
  )
    return;
  const quantity = props.entries
    .filter(({ card }) => card.oracle_id === source.oracle_id)
    .reduce((total, entry) => total + entry.quantity, 0);
  if (!quantity || oracleIds.value.includes(replacement.oracle_id)) return;
  const restoreFocus = captureSuggestionFocus(section.value);
  snapshot.value = [...props.entries];
  busy.value = true;
  replacingId.value = replacement.oracle_id;
  error.value = '';
  cardEditToast.notifyEdit('Card Replaced');
  try {
    const result = await addCardsByNameToListMutation.mutateAsync({
      listId: props.listId,
      cardNames: [`${quantity} ${replacement.name}`],
      board: 'Mainboard',
    });
    if (
      !result ||
      result.invalidCardNames.length ||
      result.addedCount + result.updatedCount < 1
    )
      throw new Error('The replacement could not be added.');
    pendingRemoval.value = { source, replacement };
    await finishRemoval();
  } catch (cause) {
    error.value = pendingRemoval.value
      ? `${replacement.name} was added, but ${source.name} could not be removed. Retry the removal to finish the replacement.`
      : `${source.name} was not cut. ${cause instanceof Error ? cause.message : 'Could not add the replacement.'}`;
  } finally {
    busy.value = false;
    replacingId.value = '';
    await restoreFocus();
  }
}

async function retryRemoval() {
  if (!props.editable || busy.value || !pendingRemoval.value) return;
  const restoreFocus = captureSuggestionFocus(section.value);
  snapshot.value = [...props.entries];
  busy.value = true;
  error.value = '';
  cardEditToast.notify('removed');
  try {
    await finishRemoval();
  } catch {
    error.value =
      'Could not remove the original card. Both cards are still in the deck.';
  } finally {
    busy.value = false;
    await restoreFocus();
  }
}
</script>

<template>
  <section
    v-if="open"
    ref="section"
    aria-label="Replace Gamechangers"
    tabindex="-1"
    class="my-4 rounded-lg border border-primary/25 bg-primary/5 p-4"
  >
    <div class="flex items-start justify-between gap-3 mb-3">
      <h2 class="min-w-0 wrap-anywhere font-semibold">Replace Gamechangers</h2>
      <UButton
        icon="i-lucide-x"
        aria-label="Close game changer replacements"
        variant="ghost"
        class="shrink-0"
        :disabled="busy"
        @click="open = false"
      />
    </div>
    <div class="space-y-6">
      <p v-if="!gameChangers.length" class="text-muted">
        No game changers in this deck.
      </p>
      <GameChangerReplacementRow
        v-for="card in gameChangers"
        :key="card.oracle_id"
        :card="card"
        :colors="colors"
        :deck-oracle-ids="oracleIds"
        :editable="editable"
        :commander="isCommander(card)"
        :busy="busy || !!pendingRemoval"
        :replacing-id="replacingId"
        @replace="replace(card, $event)"
      />
    </div>
    <p v-if="error" role="alert" class="mt-3 text-error">{{ error }}</p>
    <UButton
      v-if="pendingRemoval"
      data-suggestion-action
      class="mt-2"
      label="Retry removal"
      color="error"
      variant="outline"
      :loading="busy"
      :disabled="busy || !editable"
      @click="retryRemoval"
    />
  </section>
</template>
