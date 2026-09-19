<template>
  <UCard class="shadow-2xl">
    <template #header
      ><h2 class="text-xl font-bold">Deck display preferences</h2></template
    >
    <p class="text-sm opacity-70 mb-4">
      Set the default view, grouping, and sorting for your decklists,
      collections, and cubes across devices. Changes made on a deck page apply
      only to that visit and do not change these defaults.
    </p>
    <DeckDisplayControls
      :preferences="preferences"
      :disabled="isLoading || !!error"
      @change="updatePreferences"
    />
    <p v-if="isSaving" class="text-sm opacity-70 mt-3" role="status">
      Saving preferences…
    </p>
    <div v-if="error" class="mt-3 flex items-center gap-2">
      <p class="text-sm text-error" role="alert">
        Could not load your saved preferences.
      </p>
      <UButton
        label="Retry"
        variant="outline"
        @click="
          () => {
            retry();
          }
        "
      />
    </div>
  </UCard>
</template>
<script setup lang="ts">
const { preferences, isLoading, isSaving, error, retry, updatePreferences } =
  useDeckPreferences({ persist: true });
</script>
