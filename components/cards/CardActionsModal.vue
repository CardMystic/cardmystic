<script setup lang="ts">
import { finishLabels, type Printing, type Finish } from '~/utils/printings';
import { computed } from 'vue';
import { printingEditorKey } from '~/composables/useDeckPrintings';
import type { Card } from '~/models/cardModel';
import { getCardImageUrl } from '~/utils/scryfall';
import { type CardActionMenu, type CardAction } from '~/utils/card-actions';

const props = defineProps<{
  open: boolean;
  card: Card;
  actions: CardActionMenu;
  board: string;
  suggestDecks?: boolean;
  isFlipped?: boolean;
}>();
const emit = defineEmits<{
  'update:open': [value: boolean];
  flip: [];
  viewCard: [];
}>();
const modelOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});
const printingOpen = ref(false);
const cardModalOpen = computed({
  get: () => modelOpen.value && !printingOpen.value,
  set: (value: boolean) => {
    if (!printingOpen.value) modelOpen.value = value;
  },
});
const isFlipped = ref(props.isFlipped ?? false);
useHoldTagGrouping(() => props.open);
const {
  labels: personalLabels,
  isLoading: loadingTags,
  userId,
} = useCardLabels(() =>
  cardModalOpen.value ? [props.card.card_data.oracle_id] : [],
);
const tagNames = computed(
  () => personalLabels.value[props.card.card_data.oracle_id]?.tags ?? [],
);
const { data: collectionLabels, isLoading: loadingLabels } =
  useCollectionLabels(
    computed(() =>
      cardModalOpen.value ? [props.card.card_data.oracle_id] : [],
    ),
    computed(() => false),
  );
const chipGroups = computed(() => {
  const labels = collectionLabels.value?.[props.card.card_data.oracle_id];
  return (['roles', 'themes'] as const)
    .map((kind) => ({
      kind,
      names: labels?.[kind] ?? [],
    }))
    .filter((group) => group.names.length);
});
watch(
  () => props.card.card_data.id,
  () => {
    isFlipped.value = false;
  },
);
const isDualFaced = computed(
  () =>
    (props.card.card_data.card_faces?.length ?? 0) > 1 &&
    ['transform', 'modal_dfc', 'reversible_card'].includes(
      props.card.card_data.layout,
    ),
);
const imageUrl = computed(() =>
  getCardImageUrl(props.card.card_data, isFlipped.value),
);
const selectedLabel = computed(() => {
  const data = props.card.card_data;
  return [
    data.collector_number ? `#${data.collector_number}` : '',
    data.selected_finish ? finishLabels[data.selected_finish] : '',
  ]
    .filter(Boolean)
    .join(' ');
});
const printingEditor = inject(printingEditorKey, null);
const printingEnabled = inject<Ref<boolean>>(
  'printingPickerEnabled',
  ref(false),
);
const printingSelection = computed(() =>
  printingEditor?.selection(props.card.card_data.oracle_id, props.board),
);
async function savePrinting(printing: Printing | null, finish: Finish | null) {
  if (!printingEditor || !printingEnabled.value)
    throw new Error('This deck is read-only.');
  await printingEditor.save(props.card, props.board, printing, finish);
  printingOpen.value = false;
}
function flipCard() {
  isFlipped.value = !isFlipped.value;
  emit('flip');
}
function act(action: CardAction) {
  if (action.disabled) return;
  modelOpen.value = false;
  action.onSelect?.();
}
</script>

<template>
  <UModal
    v-model:open="cardModalOpen"
    :title="card.card_data.name"
    :description="`${board} card options`"
    :ui="{
      header: 'flex-col items-start gap-1 pr-14 sm:pr-16',
      wrapper: 'min-w-0',
      description: 'sr-only',
      content: 'deck-card-modal sm:max-w-2xl',
      body: 'deck-card-modal-body overflow-y-auto pt-2 sm:pt-2',
    }"
  >
    <template #actions>
      <CardDetailsPrintingSelect :card="card.card_data" />
    </template>
    <template #body>
      <div
        class="grid min-w-0 gap-x-5 gap-y-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
      >
        <div class="min-w-0">
          <div
            v-if="imageUrl"
            class="card-modal-image card-finish card-image-wrapper relative mx-auto w-full rounded-xl"
            :data-card-finish="card.card_data.selected_finish"
          >
            <img
              :src="imageUrl"
              :alt="card.card_data.name"
              width="488"
              height="680"
              class="block w-full rounded-xl"
            />
            <CardOverlayButtons
              :card="card"
              :is-dual-faced="isDualFaced"
              show-flip-button
              @flip="flipCard"
            />
          </div>
          <p v-else role="status" class="text-sm">Card preview unavailable.</p>
          <p
            v-if="
              card.card_data.set || card.card_data.set_name || selectedLabel
            "
            class="mt-2 text-sm text-center"
          >
            <NuxtLink
              v-if="card.card_data.set"
              :to="`/sets/${card.card_data.set.toLowerCase()}`"
              class="text-primary hover:underline"
              no-prefetch
              @click="modelOpen = false"
              >{{
                card.card_data.set_name || card.card_data.set.toUpperCase()
              }}</NuxtLink
            ><template v-else>{{ card.card_data.set_name }}</template>
            {{ selectedLabel }}
          </p>
        </div>
        <div
          role="group"
          aria-label="Card actions"
          class="min-w-0 flex flex-col gap-1"
        >
          <CardActionList
            :oracle-id="card.card_data.oracle_id"
            :actions="actions"
            :printing-enabled="!!(printingEnabled && printingSelection)"
            @change-printing="printingOpen = true"
            @view-card="
              modelOpen = false;
              emit('viewCard');
            "
            @select="act"
          />
          <CardDeckMatches
            v-if="modelOpen"
            class="mt-2 border-t border-default pt-3"
            :oracle-id="card.card_data.oracle_id"
            :auto-suggest="suggestDecks"
          />
        </div>
        <div
          v-if="userId || loadingLabels || chipGroups.length"
          class="col-span-full min-w-0 space-y-2 border-t border-default pt-2"
        >
          <div
            v-if="userId && loadingTags && !tagNames.length"
            role="status"
            aria-label="Loading your tags"
          >
            <CardChipRowSkeleton editable />
          </div>
          <CardModalChipRow
            v-else-if="userId"
            :key="card.card_data.oracle_id"
            kind="tags"
            :names="tagNames"
          >
            <CardTagEditButton :oracle-id="card.card_data.oracle_id" />
          </CardModalChipRow>
          <div
            v-if="loadingLabels"
            role="status"
            aria-label="Loading roles and themes"
            class="space-y-2"
          >
            <CardChipRowSkeleton
              v-for="kind in ['roles', 'themes']"
              :key="kind"
            />
          </div>
          <template v-else>
            <CardModalChipRow
              v-for="{ kind, names } in chipGroups"
              :key="card.card_data.oracle_id + kind"
              :kind="kind"
              :names="names"
              @navigate="modelOpen = false"
            />
          </template>
        </div>
      </div>
    </template>
  </UModal>
  <LazyPrintingPicker
    v-if="printingOpen && modelOpen && printingEnabled && printingSelection"
    :oracle-id="card.card_data.oracle_id"
    :name="card.card_data.name"
    :selected-id="printingSelection.printing_id"
    :selected-finish="printingSelection.finish"
    :save="savePrinting"
    @close="printingOpen = false"
  />
</template>

<style>
@media (max-width: 39.999rem) {
  .card-modal-image {
    max-width: clamp(12rem, calc((100dvh - 20rem) * 488 / 680), 20rem);
  }
  .deck-card-modal {
    inset: 0;
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    transform: none;
    translate: none;
  }
  .deck-card-modal-body {
    flex: 1;
    min-height: 0;
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
</style>
