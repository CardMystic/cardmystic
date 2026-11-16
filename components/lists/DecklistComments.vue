<script setup lang="ts">
const props = defineProps<{ listId: string; isListOwner?: boolean }>();
const thread = useDecklistComments(toRef(props, 'listId'));
</script>

<template>
  <CommentThread
    :key="listId"
    :thread="thread"
    :owner="isListOwner"
    placeholder="Share your thoughts on this deck..."
  />
</template>
