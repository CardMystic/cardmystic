<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '~/models/cardModel';
import { getCardImageUrl } from '~/utils/scryfall';
import type { ListCardAction } from '~/utils/list-card-actions';

const props = defineProps<{
  open: boolean;
  card: Card;
  actions: ListCardAction[][];
  board: string;
}>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const modelOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});
const imageUrl = computed(() => getCardImageUrl(props.card.card_data));
const selectedLabel = computed(() => {
  const data = props.card.card_data;
  return [
    data.set_name || data.set?.toUpperCase(),
    data.collector_number ? `#${data.collector_number}` : '',
  ]
    .filter(Boolean)
    .join(' ');
});
function act(action: ListCardAction) {
  if (action.disabled) return;
  modelOpen.value = false;
  action.onSelect?.();
}
</script>

<template>
  <UModal
    v-model:open="modelOpen"
    :title="card.card_data.name"
    :description="`${board} card options`"
    :ui="{ content: 'sm:max-w-2xl', body: 'max-h-[75dvh] overflow-y-auto' }"
  >
    <template #body>
      <div
        class="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
      >
        <div class="min-w-0">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="card.card_data.name"
            width="488"
            height="680"
            class="mx-auto w-full max-w-48 rounded-xl sm:max-w-none"
          />
          <p v-else role="status" class="text-sm">Card preview unavailable.</p>
          <p v-if="selectedLabel" class="mt-2 text-sm text-center">
            {{ selectedLabel }}
          </p>
        </div>
        <div class="min-w-0 space-y-4">
          <div
            v-for="(group, index) in actions"
            :key="index"
            :class="{ 'border-t border-default pt-3': index > 0 }"
            class="grid gap-1"
          >
            <UButton
              v-for="action in group"
              :key="action.label"
              :label="action.label"
              :icon="action.icon"
              :to="action.to"
              :target="action.target"
              :rel="action.rel"
              :disabled="action.disabled"
              :color="action.color ?? 'neutral'"
              variant="ghost"
              class="min-h-11 justify-start whitespace-normal text-left"
              @click="act(action)"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
