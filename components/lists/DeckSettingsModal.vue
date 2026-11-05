<script setup lang="ts">
import { bracketOptions } from '~/utils/commanderBrackets';
import { folderTrail } from '~/utils/deckFolders';
import {
  CardListFormatSchema,
  type DecklistSummary,
} from '~/models/cardListModel';
const props = defineProps<{ list: DecklistSummary }>();
const open = defineModel<boolean>('open', { default: false });
const {
  updateListMutation,
  updateFormatMutation,
  updateVisibilityMutation,
  deleteListMutation,
  duplicateDeckMutation,
} = useCardLists();
const {
  folders,
  pending: foldersLoading,
  error: foldersError,
  change,
} = useDeckFolders();
const noun = computed(() =>
  props.list.kind === 'collection' ? 'collection' : 'deck',
);
// This modal is mounted for one selection. Background refetches must not overwrite edits.
const saved = reactive({
  bracket: props.list.bracket ?? null,
  name: props.list.name ?? '',
  description: props.list.description ?? '',
  format: CardListFormatSchema.safeParse(props.list.format).data ?? 'Any',
  visibility:
    props.list.visibility === 'public'
      ? ('public' as const)
      : ('private' as const),
});
const bracket = ref(saved.bracket ?? 0);
const name = ref(saved.name);
const description = ref(saved.description);
const format = ref(saved.format);
const visibility = ref(saved.visibility);
const destination = ref(props.list.folder_id || 'none');
const currentFolder = ref(destination.value);
const deleting = ref(false);
const duplicating = ref(false);
const toast = useToast();
const busy = ref(false);
const error = ref('');
const folderOptions = computed(() => [
  { label: 'Not in a folder', value: 'none' },
  ...folders.value.map((folder) => ({
    label: folderTrail(folders.value, folder.id)
      .map((item) => item.name)
      .join(' / '),
    value: folder.id,
  })),
]);
const changed = computed(
  () =>
    (bracket.value || null) !== saved.bracket ||
    name.value.trim() !== saved.name ||
    description.value !== saved.description ||
    format.value !== saved.format ||
    visibility.value !== saved.visibility,
);
const clearsCommanders = computed(
  () =>
    format.value !== saved.format &&
    format.value !== 'Commander' &&
    !!props.list.commanders?.length,
);
async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await action();
    open.value = false;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    busy.value = false;
  }
}
async function save() {
  if (!name.value.trim() || !changed.value) return;
  await run(async () => {
    // Track successful edits so retrying a later failed operation doesn't repeat them.
    if (
      (bracket.value || null) !== saved.bracket ||
      name.value.trim() !== saved.name ||
      description.value !== saved.description
    ) {
      await updateListMutation.mutateAsync({
        listId: props.list.id,
        updates: {
          name: name.value.trim(),
          description: description.value,
          ...(noun.value === 'deck' ? { bracket: bracket.value || null } : {}),
        },
      });
      saved.bracket = bracket.value || null;
      saved.name = name.value.trim();
      saved.description = description.value;
    }
    if (format.value !== saved.format) {
      await updateFormatMutation.mutateAsync({
        listId: props.list.id,
        format: format.value,
      });
      saved.format = format.value;
    }
    if (visibility.value !== saved.visibility) {
      await updateVisibilityMutation.mutateAsync({
        listId: props.list.id,
        visibility: visibility.value,
      });
      saved.visibility = visibility.value;
    }
  });
}
async function duplicate() {
  if (busy.value || changed.value) return;
  duplicating.value = true;
  await run(async () => {
    try {
      const copy = await duplicateDeckMutation.mutateAsync(props.list.id);
      toast.add({
        title: 'Deck duplicated',
        description: copy.name,
        color: 'success',
      });
      await navigateTo(`/lists/${copy.id}`);
    } catch (cause) {
      const message = (cause as { data?: { message?: string } }).data?.message;
      throw new Error(
        message || 'Could not duplicate the deck. Please try again.',
      );
    }
  });
  duplicating.value = false;
}
async function move() {
  if (destination.value === currentFolder.value) return;
  await run(async () => {
    await change(`/lists/${props.list.id}/folder`, 'PATCH', {
      folderId: destination.value === 'none' ? null : destination.value,
    });
    currentFolder.value = destination.value;
  });
}
</script>
<template>
  <UModal
    v-model:open="open"
    :dismissible="!busy"
    :close="!busy"
    :title="
      deleting
        ? `Delete ${noun}`
        : `${noun === 'deck' ? 'Deck' : 'Collection'} settings`
    "
    :description="saved.name"
  >
    <template #body>
      <p v-if="deleting">
        Delete “{{ saved.name }}”? All cards in this {{ noun }} will be removed.
        This cannot be undone.
      </p>
      <div v-else class="space-y-5">
        <form id="deck-settings-form" @submit.prevent="save">
          <fieldset :disabled="busy" class="space-y-4">
            <UFormField label="Name"
              ><UInput
                v-model="name"
                aria-label="Name"
                required
                :maxlength="200"
                class="w-full"
            /></UFormField>
            <UFormField label="Description"
              ><UTextarea
                v-model="description"
                aria-label="Description"
                :maxlength="1000"
                :rows="3"
                class="w-full"
            /></UFormField>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField v-if="list.kind !== 'collection'" label="Format"
                ><USelect
                  v-model="format"
                  :items="CardListFormatSchema.options"
                  aria-label="Format"
                  class="w-full"
              /></UFormField>
              <UFormField
                v-if="list.kind !== 'collection'"
                label="Commander bracket"
              >
                <USelect
                  v-model="bracket"
                  :items="bracketOptions"
                  aria-label="Deck bracket"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Visibility"
                ><USelect
                  v-model="visibility"
                  :items="[
                    { label: 'Private', value: 'private' },
                    { label: 'Public', value: 'public' },
                  ]"
                  aria-label="Visibility"
                  class="w-full"
              /></UFormField>
            </div>
            <p v-if="clearsCommanders" class="text-sm text-warning">
              Changing to this format will remove the commander designation. The
              cards stay in your deck.
            </p>
          </fieldset>
        </form>
        <div class="border-t border-default pt-4 space-y-2">
          <UFormField label="Move to a folder">
            <div class="flex items-center gap-2">
              <USelect
                v-model="destination"
                :items="folderOptions"
                aria-label="Move to a folder"
                :disabled="busy || foldersLoading || !!foldersError"
                class="flex-1 min-w-0"
              />
              <UButton
                label="Move"
                :disabled="
                  busy ||
                  changed ||
                  foldersLoading ||
                  !!foldersError ||
                  destination === currentFolder
                "
                @click="move"
              />
            </div>
          </UFormField>
          <p v-if="changed" class="text-xs text-muted">
            Save your edits before
            {{ noun === 'deck' ? 'moving or duplicating' : 'moving' }} this
            {{ noun }}.
          </p>
          <p v-if="foldersError" class="text-sm text-error" role="alert">
            {{ foldersError.message }}
          </p>
        </div>
        <UButton
          v-if="noun === 'deck'"
          label="Duplicate Deck"
          class="mr-2"
          icon="i-lucide-copy"
          color="neutral"
          variant="outline"
          :disabled="busy || changed"
          :loading="duplicating"
          @click="duplicate"
        />
        <UButton
          :label="`Delete ${noun}`"
          icon="i-lucide-trash-2"
          color="error"
          variant="outline"
          :disabled="busy"
          @click="
            deleting = true;
            error = '';
          "
        />
      </div>
      <p v-if="error" role="alert" class="text-error mt-4">{{ error }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          :disabled="busy"
          @click="deleting ? (deleting = false) : (open = false)"
        />
        <UButton
          v-if="deleting"
          :label="`Delete ${noun}`"
          color="error"
          :loading="busy"
          @click="
            run(async () => {
              await deleteListMutation.mutateAsync(list.id);
            })
          "
        />
        <UButton
          v-else
          label="Save changes"
          type="submit"
          form="deck-settings-form"
          :loading="busy && !duplicating"
          :disabled="!name.trim() || !changed"
        />
      </div>
    </template>
  </UModal>
</template>
