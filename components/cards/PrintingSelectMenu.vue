<script setup lang="ts">
import {
  finishLabels,
  printingFinishes,
  printingImages,
  printingPrice,
  type PrintingChoice,
} from '~/utils/printings';

const props = defineProps<{
  oracleId: string;
  modelValue: string;
  label: string;
  finishes?: boolean;
  allowDefault?: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{ select: [choice: PrintingChoice] }>();
const search = ref('');
const query = useCardPrintings(
  computed(() => props.oracleId),
  search,
);
const options = computed<PrintingChoice[]>(() => [
  ...(props.allowDefault
    ? [
        {
          value: 'default',
          label: 'Default printing',
          printing: null,
          finish: null,
        },
      ]
    : []),
  ...query.printings.value.flatMap((printing) =>
    (props.finishes ? printingFinishes(printing) : [null]).map((finish) => ({
      value: finish ? `${printing.id}:${finish}` : printing.id,
      label: `${printing.card_printing_sets?.name ?? printing.set_code.toUpperCase()} #${printing.collector_number}${finish ? ` · ${finishLabels[finish]}` : ''}${printing.lang !== 'en' ? ` · ${printing.lang.toUpperCase()}` : ''}${printing.flavor_name ? ` · ${printing.flavor_name}` : ''}`,
      printing,
      finish,
    })),
  ),
]);
const currentLabel = computed(
  () =>
    options.value.find((option) => option.value === props.modelValue)?.label ??
    props.label,
);
function choose(value: string) {
  const choice = options.value.find((option) => option.value === value);
  if (choice && !props.busy && value !== props.modelValue)
    emit('select', choice);
}
</script>

<template>
  <div class="space-y-2">
    <USelectMenu
      :model-value="modelValue"
      v-model:search-term="search"
      :items="options"
      value-key="value"
      aria-label="Select printing"
      :search-input="{ placeholder: 'Filter by set name' }"
      :ignore-filter="true"
      :loading="query.isFetching.value || busy"
      :disabled="busy"
      :ui="{
        content: 'min-w-72 max-w-[calc(100vw-2rem)]',
        itemLabel: 'whitespace-normal',
      }"
      class="w-full"
      @update:model-value="choose"
    >
      <span class="truncate">{{ currentLabel }}</span>
      <template #item="{ item }">
        <div class="flex w-full min-w-0 items-center gap-3 py-1">
          <span
            v-if="item.printing?.image_paths[0]"
            class="card-finish block h-[50px] w-9 shrink-0 rounded"
            :data-card-finish="item.finish"
          >
            <img
              :src="printingImages(item.printing.image_paths[0]).small"
              alt=""
              width="36"
              height="50"
              loading="lazy"
              class="h-[50px] w-9 shrink-0 rounded object-contain shadow"
            />
          </span>
          <div class="min-w-0 flex-1">
            <span class="font-semibold whitespace-normal">{{
              item.label
            }}</span>
            <div v-if="item.printing" class="text-xs text-muted">
              {{ item.printing.released_at?.slice(0, 4) }}
            </div>
          </div>
          <span
            v-if="item.printing && item.finish"
            class="text-xs text-muted tabular-nums whitespace-nowrap"
          >
            {{
              printingPrice(item.printing, item.finish) == null
                ? '—'
                : `$${printingPrice(item.printing, item.finish)}`
            }}
          </span>
        </div>
      </template>
      <template #content-bottom>
        <UButton
          v-if="query.hasNextPage.value"
          label="Load more printings"
          variant="ghost"
          :loading="query.isFetchingNextPage.value"
          class="m-1"
          @click.stop="
            () => {
              void query.fetchNextPage();
            }
          "
        />
      </template>
    </USelectMenu>
    <p v-if="query.isPending.value" role="status" class="text-xs text-muted">
      Loading printings…
    </p>
    <p
      v-else-if="!query.error.value && !query.printings.value.length"
      class="text-xs text-muted"
    >
      No printings found.
    </p>
    <div v-if="query.error.value" class="space-y-1">
      <p role="alert" class="text-sm text-error">Could not load printings.</p>
      <UButton
        label="Retry"
        variant="ghost"
        size="xs"
        @click="
          () => {
            void query.refetch();
          }
        "
      />
    </div>
  </div>
</template>
