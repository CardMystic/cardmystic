<script setup lang="ts">
import { cardLabelColors } from '~/utils/deckHighlight';
const props = defineProps<{ oracleId: string }>();
const { labels, isLoading, error, retry, userId } = useCardLabels(() => [
  props.oracleId,
]);
const tags = computed(() => labels.value[props.oracleId]?.tags ?? []);
const expanded = ref(false);
const limit = 5;
watch(
  () => props.oracleId,
  () => {
    expanded.value = false;
  },
);
</script>
<template>
  <div
    v-if="isLoading && !tags.length && !error"
    role="status"
    aria-label="Loading your tags"
    class="py-2"
  >
    <CardChipRowSkeleton editable />
  </div>
  <section
    v-else-if="userId"
    class="flex min-w-0 flex-wrap items-center gap-2 py-2"
    aria-label="Your Tags"
  >
    <strong class="text-sm px-4">Your Tags:</strong>
    <CardTagEditButton :oracle-id="oracleId" />
    <UBadge
      v-for="tag in expanded ? tags : tags.slice(0, limit)"
      :key="tag"
      :color="cardLabelColors.tags"
      variant="subtle"
      class="max-w-full whitespace-normal wrap-anywhere"
      >{{ tag }}</UBadge
    >
    <UButton
      v-if="tags.length > limit"
      size="xs"
      variant="link"
      :aria-expanded="expanded"
      :label="expanded ? 'Show less' : 'Show more'"
      @click="expanded = !expanded"
    />
    <UButton
      v-if="error"
      size="xs"
      variant="link"
      label="Retry loading tags"
      @click="retry"
    />
  </section>
</template>
