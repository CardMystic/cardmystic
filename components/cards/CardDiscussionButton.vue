<script setup lang="ts">
import type { ScryfallCard } from '~/models/cardModel';

defineOptions({ inheritAttrs: false });
defineProps<{ card: ScryfallCard }>();
const triggerId = useId();
function restoreFocus(event: Event) {
  event.preventDefault();
  document.getElementById(triggerId)?.focus({ preventScroll: true });
}
</script>

<template>
  <UModal
    :title="`Discussing ${card.name}`"
    :ui="{ content: 'sm:max-w-2xl' }"
    :content="{ onCloseAutoFocus: restoreFocus }"
  >
    <UButton
      :id="triggerId"
      v-bind="$attrs"
      icon="i-lucide-message-circle"
      label="Discuss Card"
      variant="outline"
      block
    />
    <template #body>
      <LazyCardDiscussionComments
        :key="card.oracle_id"
        :oracle-id="card.oracle_id"
      />
    </template>
  </UModal>
</template>
