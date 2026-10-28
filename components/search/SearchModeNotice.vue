<script setup lang="ts">
const notice = useSearchModeNotice();
</script>

<template>
  <UModal
    v-model:open="notice.open"
    title="Search mode switched to Normal"
    :description="notice.description"
    :ui="{ footer: 'flex flex-wrap justify-end gap-3' }"
  >
    <template #close="{ ui }">
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        aria-label="Continue on Normal and close"
        :class="ui.close()"
      />
    </template>
    <template #footer="{ close }">
      <UButton
        label="Continue on Normal"
        color="neutral"
        variant="outline"
        class="min-h-11"
        @click="close"
      />
      <UButton
        label="Upgrade"
        to="/memberships"
        class="min-h-11"
        @click="close"
      />
    </template>
  </UModal>
</template>
