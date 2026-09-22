<template>
  <section
    v-if="ready && (!consent || settingsOpen)"
    aria-label="Cookie preferences"
    class="fixed bottom-3 inset-x-3 z-[100] mx-auto max-w-xl rounded-xl border border-default bg-elevated p-3 shadow-xl max-h-[85vh] overflow-y-auto"
  >
    <h2 class="text-lg font-semibold">Your privacy choices</h2>
    <p class="mt-2 text-sm text-muted">
      With your permission, we track site analytics and advertising conversions.
    </p>
    <div v-if="customizing || settingsOpen" class="my-4 space-y-3">
      <UCheckbox v-model="analytics" label="Analytics (PostHog)" />
      <UCheckbox
        v-model="advertising"
        label="Advertising measurement (Google Ads)"
      />
    </div>
    <div class="mt-4 flex flex-wrap gap-2">
      <UButton
        label="Accept all"
        color="neutral"
        variant="outline"
        @click="save({ analytics: true, advertising: true })"
      />
      <UButton
        label="Reject all"
        color="neutral"
        variant="outline"
        @click="save({ analytics: false, advertising: false })"
      />
      <UButton
        v-if="customizing || settingsOpen"
        label="Save preferences"
        @click="save({ analytics, advertising })"
      />
      <UButton
        v-else
        label="Customize"
        color="neutral"
        variant="outline"
        @click="
          () => {
            customizing = true;
          }
        "
      />
      <UButton
        v-if="consent"
        label="Close"
        color="neutral"
        variant="ghost"
        @click="
          () => {
            settingsOpen = false;
          }
        "
      />
    </div>
  </section>
  <p
    v-if="storageError"
    role="alert"
    class="fixed bottom-3 inset-x-3 z-[101] mx-auto max-w-xl rounded-lg bg-elevated p-3 shadow"
  >
    Your choice applies to this visit, but could not be saved in this browser.
  </p>
</template>

<script setup lang="ts">
const { consent, ready, settingsOpen, storageError, save } = useCookieConsent();
const customizing = ref(false);
const analytics = ref(false);
const advertising = ref(false);
watch(settingsOpen, (open) => {
  if (open) {
    analytics.value = consent.value?.analytics ?? false;
    advertising.value = consent.value?.advertising ?? false;
  }
});
</script>
