<script setup lang="ts">
const props = defineProps<{ articleId: string; isArticleOwner?: boolean }>();
const thread = useArticleComments(toRef(props, 'articleId'));
</script>

<template>
  <CommentThread
    :key="articleId"
    :thread="thread"
    :owner="isArticleOwner"
    placeholder="Share your thoughts on this article..."
  />
</template>
