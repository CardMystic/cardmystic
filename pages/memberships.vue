<script setup lang="ts">
defineOptions({ name: 'MembershipsPage' });
definePageMeta({ layout: 'fullscreen' });
const { userId } = useUserProfile();
useSeoMeta({
  title: 'Memberships | CardMystic',
  description:
    'Get CardMystic Enhanced for $4.99/month with unlimited Enhanced searches, or manage your membership and search top-ups.',
});
</script>

<template>
  <SpaceBackground :full="true">
    <div
      class="w-full max-w-6xl mx-auto px-4 pt-24 pb-10 relative z-10 space-y-6"
    >
      <SearchMembership :key="userId ?? 'guest'" />
    </div>
  </SpaceBackground>
</template>

<style>
.account-service {
  display: grid;
  gap: 1rem;
  align-content: start;
  overflow-wrap: anywhere;
  min-width: 0;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: var(--ui-bg);
  color: var(--ui-text);
}
.account-service h2 {
  font-size: 1.25rem;
  font-weight: 700;
}
.account-service h3 {
  font-weight: 600;
}
.account-service button {
  min-height: 44px;
  max-width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--ui-border-accented);
  border-radius: 6px;
  background: var(--ui-bg);
  color: var(--ui-text);
  font: inherit;
}
.account-service button:not(:disabled):hover {
  background: var(--ui-bg-elevated);
}
.account-service button:disabled {
  opacity: 0.65;
  cursor: wait;
}
.account-service a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  width: fit-content;
  max-width: 100%;
  color: var(--ui-text-highlighted);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.account-service :is(button, a, summary):focus-visible {
  outline: 2px solid var(--ui-text);
  outline-offset: 3px;
}
</style>
