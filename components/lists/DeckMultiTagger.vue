<script setup lang="ts">
const props = defineProps<{ oracleIds: string[] }>();
const selection = useMultiTag();
if (!selection) throw new Error('Multi-tagger requires a list.');
const library = useCardTags();
const selectedTag = ref<string>();
const error = ref('');
const labels = useCardLabels(() => props.oracleIds);
const original = ref(new Set<string>());
const initialized = ref(false);
watch(selectedTag, () => {
  initialized.value = false;
  selection.selected.value = new Set();
});
watch(
  [selectedTag, labels.assignments],
  ([tag, assignments]) => {
    if (!tag || !assignments || initialized.value) return;
    original.value = new Set(
      assignments.filter((a) => a.tag_id === tag).map((a) => a.oracle_id),
    );
    selection.selected.value = new Set(original.value);
    initialized.value = true;
  },
  { immediate: true },
);
const toast = useToast();
const options = computed(() =>
  library.tags.value.map((tag) => ({ label: tag.name, value: tag.id })),
);
async function save() {
  if (
    !selection ||
    !selectedTag.value ||
    !initialized.value ||
    selection.saving.value
  )
    return;
  selection.saving.value = true;
  error.value = '';
  const tag = selectedTag.value;
  const additions = [...selection.selected.value].filter(
    (id) => !original.value.has(id),
  );
  const removals = [...original.value].filter(
    (id) => !selection.selected.value.has(id),
  );
  try {
    for (const [ids, method] of [
      [additions, 'PUT'],
      [removals, 'DELETE'],
    ] as const) {
      for (let start = 0; start < ids.length; start += 500) {
        await library.change(`/tags/${tag}/cards`, method, {
          oracleIds: ids.slice(start, start + 500),
        });
      }
    }
    toast.add({ title: 'Tags updated', color: 'success' });
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
        :disabled="!selectedTag || !initialized"
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
      Checked cards have this tag. Uncheck a card to remove it. Tags apply
      across all your decks and collections.
    </p>
    <p v-if="!library.pending.value && !options.length" class="mt-2 text-sm">
      Create a tag from a card’s menu first.
    </p>
    <p
      v-if="error || library.error.value || labels.error.value"
      role="alert"
      class="mt-2 text-sm text-error"
    >
      {{ error || 'Could not load tags. Please try again.' }}
    </p>
  </section>
</template>
