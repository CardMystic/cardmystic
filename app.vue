<template>
  <UApp
    :toaster="{
      position: 'bottom-center',
      duration: 2200,
      progress: false,
      ui: {
        viewport: 'notification-viewport w-[calc(100%-2rem)] sm:w-80',
      },
    }"
  >
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <Teleport to="body">
        <CookieConsent />
      </Teleport>
      <SearchModeNotice />
    </ClientOnly>
    <VueQueryDevtools v-if="isDev" />
  </UApp>
</template>

<style lang="sass"></style>

<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools';
const isDev = import.meta.env.VITE_IS_DEV === 'true';
const { size: cardSize } = useCardSize();
useHead({ htmlAttrs: { 'data-card-size': cardSize } });
const { toasts } = useToast();
watch(
  toasts,
  (items) => {
    const latest = items.at(-1);
    if (!latest) return;
    const duration =
      latest.duration === 0 ? 2200 : Math.min(latest.duration ?? 2200, 3000);
    if (
      items.length > 1 ||
      (latest.duration !== undefined && latest.duration !== duration)
    )
      toasts.value = [{ ...latest, duration }];
  },
  { flush: 'sync', deep: true },
);
</script>
