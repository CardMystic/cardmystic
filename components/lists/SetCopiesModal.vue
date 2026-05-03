<template>
  <UModal v-model:open="modelOpen" title="Set Copies">
    <template #body>
      <p class="text-sm mb-3">How many copies of <span class="font-bold">{{ cardName }}</span>?</p>
      <UInput v-model="copiesInputValue" type="number" min="1" max="100" autofocus @keyup.enter="onConfirm"
        @keyup.escape="modelOpen = false" />
    </template>
    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
        <UButton label="Set Copies" color="primary" icon="i-lucide-hash" @click="onConfirm(close)" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  cardName: string;
  initialCopies?: number;
}>();

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void;
  (e: 'confirm', copies: number): void;
}>();

const modelOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

const copiesInputValue = ref('1');

watch(
  () => [props.open, props.initialCopies] as const,
  ([open, initialCopies]) => {
    if (!open) return;
    copiesInputValue.value = String(initialCopies ?? 1);
  },
  { immediate: true }
);

function onConfirm(close?: () => void) {
  const nextValue = parseInt(copiesInputValue.value, 10);
  if (!Number.isNaN(nextValue) && nextValue >= 1 && nextValue <= 100) {
    emit('confirm', nextValue);
  }
  if (close) {
    close();
    return;
  }
  modelOpen.value = false;
}
</script>
