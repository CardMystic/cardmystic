<script setup lang="ts">
const props = defineProps<{
  title: string;
  description: string;
  path: string;
}>();

useSeoMeta({
  title: () => `${props.title} | CardMystic`,
  description: () => props.description,
  ogTitle: () => `${props.title} | CardMystic`,
  ogDescription: () => props.description,
  ogUrl: () => `https://cardmystic.com${props.path}`,
  twitterCard: 'summary',
});
useHead(() => ({
  link: [{ rel: 'canonical', href: `https://cardmystic.com${props.path}` }],
}));
</script>

<template>
  <article
    class="policy-page w-full max-w-3xl mx-auto my-6 rounded-xl border border-default bg-default p-5 sm:p-8 text-base leading-relaxed"
  >
    <header class="mb-8 space-y-3">
      <h1 class="text-3xl font-bold text-highlighted">{{ title }}</h1>
      <p class="text-sm text-muted">
        Last updated: <time datetime="2026-10-29">October 29, 2026</time>
      </p>
      <p>{{ description }}</p>
    </header>
    <div class="policy-content space-y-7">
      <slot />
    </div>
  </article>
</template>

<style scoped>
.policy-content :deep(h2) {
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ui-text-highlighted);
}
.policy-content :deep(p + p),
.policy-content :deep(ul),
.policy-content :deep(ol),
.policy-content :deep(ul + p),
.policy-content :deep(ol + p) {
  margin-top: 0.75rem;
}
.policy-content :deep(ul) {
  list-style: disc;
  padding-left: 1.5rem;
}
.policy-content :deep(ol) {
  list-style: decimal;
  padding-left: 1.5rem;
}
.policy-content :deep(li + li) {
  margin-top: 0.5rem;
}
.policy-content :deep(a) {
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
  overflow-wrap: anywhere;
}
.policy-content :deep(a:focus-visible) {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
</style>
