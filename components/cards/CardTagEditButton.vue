<script setup lang="ts">
defineProps<{ oracleId: string }>();
const open = ref(false);
</script>

<template>
  <UButton
    icon="i-lucide-pencil"
    color="info"
    variant="ghost"
    size="xs"
    label="Edit"
    aria-label="Edit tags"
    aria-haspopup="dialog"
    :aria-expanded="open"
    @click.stop="open = true"
  />
  <LazyCardTagEditor v-if="open" v-model:open="open" :oracle-id="oracleId" />
</template>
