<script setup lang="ts">
import {
  printingFinishes,
  printingImages,
  printingPrice,
  finishLabels,
  type Finish,
  type Printing,
} from '~/utils/printings';
const props = withDefaults(
  defineProps<{
    oracleId: string;
    name: string;
    description?: string;
    saveLabel?: string;
    resetLabel?: string;
    showReset?: boolean | null;
    selectedId?: string | null;
    selectedFinish?: string | null;
    save: (printing: Printing | null, finish: Finish | null) => Promise<void>;
  }>(),
  { showReset: null, saveLabel: 'Use printing' },
);
const emit = defineEmits<{ close: [] }>();
const open = computed({
  get: () => true,
  set: (value) => {
    if (!value) emit('close');
  },
});
const search = ref('');
const selected = ref<Printing | null>(null);
const finish = ref<Finish>('nonfoil');
const saving = ref(false);
const message = ref('');
const query = useCardPrintings(
  computed(() => props.oracleId),
  search,
);
const printings = query.printings;
function choose(printing: Printing) {
  selected.value = printing;
  const finishes = printingFinishes(printing);
  finish.value =
    printing.id === props.selectedId &&
    finishes.includes(props.selectedFinish as Finish)
      ? (props.selectedFinish as Finish)
      : finishes[0]!;
}
async function submit(reset = false) {
  if (saving.value || (!reset && !selected.value)) return;
  saving.value = true;
  message.value = '';
  try {
    await props.save(
      reset ? null : selected.value,
      reset ? null : finish.value,
    );
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Could not save this printing.';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <UModal
    v-model:open="open"
    :title="`Choose printing: ${name}`"
    :description="description"
    :ui="{ content: 'sm:max-w-3xl', body: 'max-h-[65dvh] overflow-y-auto' }"
    :dismissible="!saving"
  >
    <template #body>
      <UInput
        v-model="search"
        placeholder="Filter by set name"
        aria-label="Filter printings by set name"
        class="mb-4 w-full"
        icon="i-lucide-search"
      />
      <PrintingPickerSkeleton v-if="query.isPending.value" />
      <UAlert
        v-else-if="query.error.value"
        color="error"
        title="Could not load printings"
        :actions="[
          {
            label: 'Retry',
            onClick: () => {
              void query.refetch();
            },
          },
        ]"
      />
      <p v-else-if="!printings.length">No printings found.</p>
      <div
        v-if="!query.isPending.value && printings.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <button
          v-for="printing in printings"
          :key="printing.id"
          type="button"
          :aria-label="`${printing.card_printing_sets?.name} #${printing.collector_number}`"
          :aria-pressed="selected?.id === printing.id"
          :disabled="saving"
          class="rounded-lg border-2 p-2 text-left transition-colors hover:border-primary"
          :class="
            selected?.id === printing.id
              ? 'border-primary bg-primary/10'
              : 'border-transparent'
          "
          @click="choose(printing)"
        >
          <span
            v-if="printing.image_paths[0]"
            class="card-finish block rounded-lg"
            :data-card-finish="
              selected?.id === printing.id
                ? finish
                : printing.id === selectedId
                  ? selectedFinish
                  : undefined
            "
          >
            <img
              :src="printingImages(printing.image_paths[0]).small"
              :alt="printing.flavor_name || name"
              width="146"
              height="204"
              loading="lazy"
              class="mx-auto aspect-[146/204] w-full rounded-lg"
            />
          </span>
          <p class="mt-2 text-sm font-medium">
            {{ printing.card_printing_sets?.name }}
          </p>
          <p class="text-xs text-muted">
            #{{ printing.collector_number }} · {{ printing.lang.toUpperCase()
            }}<span v-if="printing.id === selectedId"> · Current</span>
          </p>
          <p v-if="printing.flavor_name" class="text-xs">
            {{ printing.flavor_name }}
          </p>
        </button>
      </div>
      <PrintingPickerSkeleton
        v-if="query.isFetchingNextPage.value"
        class="mt-3"
      />
      <UButton
        v-if="query.hasNextPage.value"
        label="Load more printings"
        variant="outline"
        class="mt-4"
        :loading="query.isFetchingNextPage.value"
        @click="
          () => {
            void query.fetchNextPage();
          }
        "
      />
    </template>
    <template #footer>
      <div class="w-full space-y-3">
        <p v-if="message" role="alert" class="text-sm text-error">
          {{ message }}
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <template v-if="selected">
            <USelect
              v-model="finish"
              aria-label="Printing finish"
              :disabled="saving"
              :items="
                printingFinishes(selected).map((value) => ({
                  value,
                  label: finishLabels[value],
                }))
              "
            />
            <span class="text-sm">{{
              printingPrice(selected, finish) == null
                ? 'Price unavailable'
                : `$${printingPrice(selected, finish)}`
            }}</span>
          </template>
          <UButton
            v-if="showReset ?? selectedId"
            :label="resetLabel || 'Use default printing'"
            color="neutral"
            variant="ghost"
            :disabled="saving"
            @click="submit(true)"
          />
          <UButton
            :label="saveLabel"
            class="ml-auto"
            :loading="saving"
            :disabled="!selected"
            @click="submit()"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
