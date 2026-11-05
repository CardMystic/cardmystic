<script setup lang="ts">
const props = defineProps<{ oracleId: string; name: string }>();
const selection = useMultiTag();
const checked = computed({
  get: () => selection?.selected.value.has(props.oracleId) ?? false,
  set: (value: boolean) => {
    if (!selection || selection.saving.value) return;
    const next = new Set(selection.selected.value);
    if (value) next.add(props.oracleId);
    else next.delete(props.oracleId);
    selection.selected.value = next;
  },
});
</script>
<template>
  <div v-if="selection?.active.value" @click.stop>
    <UCheckbox
      v-model="checked"
      :disabled="selection.saving.value"
      :aria-label="`Tag ${name}`"
    />
  </div>
</template>
