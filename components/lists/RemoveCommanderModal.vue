<template>
  <UModal v-model:open="modelOpen" title="Remove Commander">
    <template #body>
      <p class="text-sm">
        Remove <span class="font-bold">{{ cardName }}</span> as your commander?
      </p>
    </template>
    <template #footer="{ close }">
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
        <UButton label="Remove Commander" color="error" icon="i-lucide-crown" @click="onConfirm(close)" />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  cardName: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', open: boolean): void;
  (e: 'confirm'): void;
}>();

const modelOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});

function onConfirm(close: () => void) {
  emit('confirm');
  close();
}
</script>
