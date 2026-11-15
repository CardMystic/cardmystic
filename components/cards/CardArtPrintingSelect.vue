<script setup lang="ts">
import type { PrintingChoice } from '~/utils/printings';

const props = defineProps<{ cardName: string; busy?: boolean }>();
const printingId = defineModel<string | null>({ default: null });
const names = computed(() => (props.cardName ? [props.cardName] : []));
const { cards, error, isLoading, refetch } = useCardsByName(names);
const card = computed(() =>
  cards.value?.find(
    (entry) =>
      entry.card_data.name.toLowerCase() === props.cardName.toLowerCase(),
  ),
);
function select(choice: PrintingChoice) {
  printingId.value = choice.printing?.id ?? null;
}
</script>

<template>
  <div v-if="cardName" class="mt-3">
    <PrintingSelectMenu
      v-if="card"
      :key="card.card_data.oracle_id"
      :oracle-id="card.card_data.oracle_id"
      :model-value="printingId ?? 'default'"
      :label="printingId ? 'Selected printing' : 'Default printing'"
      :allow-default="true"
      :busy="busy"
      @select="select"
    />
    <div v-else-if="error || !isLoading" class="text-sm text-error">
      Could not load printings.
      <UButton label="Retry" variant="link" @click="() => refetch()" />
    </div>
    <USkeleton v-else class="h-10 w-full" />
  </div>
</template>
