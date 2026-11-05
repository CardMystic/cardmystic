<script setup lang="ts">
const selection = useMultiTag();
if (!selection) throw new Error('Multi-tagger requires a list.');
const library = useCardTags();
const selectedTag = ref<string>();
const error = ref('');
const toast = useToast();
const options = computed(() =>
  library.tags.value.map((tag) => ({ label: tag.name, value: tag.id })),
);
async function save() {
  if (
    !selection ||
    !selectedTag.value ||
    !selection.selected.value.size ||
    selection.saving.value
  )
    return;
  selection.saving.value = true;
  error.value = '';
  const ids = [...selection.selected.value];
  try {
    // Each request is one atomic, duplicate-safe insert, including on retry.
    for (let start = 0; start < ids.length; start += 500) {
      await library.change(`/tags/${selectedTag.value}/cards`, 'PUT', {
        oracleIds: ids.slice(start, start + 500),
      });
    }
    toast.add({ title: `Tag added to ${ids.length} cards`, color: 'success' });
    selection.saving.value = false;
    selection.close();
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    selection.saving.value = false;
  }
}
</script>
<template>
  <section
    class="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-3"
    aria-label="Multi-tagger"
  >
    <div class="flex flex-wrap items-center gap-3">
      <USelectMenu
        v-model="selectedTag"
        :items="options"
        value-key="value"
        placeholder="Choose a tag"
        aria-label="Tag to apply"
        class="w-52"
        :disabled="selection.saving.value"
        :loading="library.pending.value"
      />
      <span class="text-sm">{{ selection.selected.value.size }} selected</span>
      <UButton
        label="Save tags"
        :loading="selection.saving.value"
        :disabled="!selectedTag || !selection.selected.value.size"
        @click="save"
      />
      <UButton
        label="Cancel"
        variant="ghost"
        color="neutral"
        :disabled="selection.saving.value"
        @click="selection.close"
      />
    </div>
    <p class="mt-2 text-sm text-muted">
      Select the cards to tag. Tags apply to that card across all your decks and
      collections.
    </p>
    <p v-if="!library.pending.value && !options.length" class="mt-2 text-sm">
      Create a tag from a card’s menu first.
    </p>
    <p
      v-if="error || library.error.value"
      role="alert"
      class="mt-2 text-sm text-error"
    >
      {{ error || 'Could not load tags. Please try again.' }}
    </p>
  </section>
</template>
