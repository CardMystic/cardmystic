<script setup lang="ts">
import type { DeckFolder } from '~/composables/useLibrary';
const props = defineProps<{
  folder: DeckFolder | null;
  parentId?: string | null;
}>();
const emit = defineEmits<{ deleted: [id: string] }>();
const open = defineModel<boolean>('open', { default: false });
const { folders, refresh, change } = useDeckFolders();
const dialog = ref<'create' | 'rename' | 'delete'>(
  props.folder ? 'rename' : 'create',
);
const target = ref(props.folder);
const name = ref(props.folder?.name ?? '');
const confirmation = ref('');
const error = ref('');
const busy = ref(false);
async function save() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    if (dialog.value === 'create')
      await change('/folders', 'POST', {
        name: name.value,
        parentId: props.parentId ?? null,
      });
    else if (target.value && dialog.value === 'rename')
      await change(`/folders/${target.value.id}`, 'PATCH', {
        name: name.value,
      });
    else if (target.value && dialog.value === 'delete') {
      await change(`/folders/${target.value.id}`, 'DELETE', {
        confirmation: confirmation.value,
      });
      emit('deleted', target.value.id);
    }
    open.value = false;
  } catch (cause) {
    error.value = (cause as Error).message;
    if (dialog.value === 'delete') {
      await refresh();
      target.value =
        folders.value.find((folder) => folder.id === target.value?.id) ??
        target.value;
    }
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <UModal
    v-model:open="open"
    :dismissible="!busy"
    :close="!busy"
    :title="
      dialog === 'delete'
        ? 'Delete folder'
        : dialog === 'rename'
          ? 'Rename folder'
          : 'New folder'
    "
  >
    <template #body>
      <form id="folder-form" class="space-y-4" @submit.prevent="save">
        <fieldset :disabled="busy" class="space-y-4">
          <template v-if="dialog === 'delete'">
            <p>Delete “{{ target?.name }}”?</p>
            <p class="text-error">
              All subfolders, decks and collections inside this folder will also
              be permanently deleted. This cannot be undone.
            </p>
            <UFormField
              v-if="target?.count"
              :label="`Type ${target.name} to confirm`"
            >
              <UInput
                v-model="confirmation"
                aria-label="Confirm folder name"
                class="w-full"
                autocomplete="off"
              />
            </UFormField>
          </template>
          <UFormField v-else label="Folder name">
            <UInput
              v-model="name"
              aria-label="Folder name"
              :maxlength="80"
              required
              class="w-full"
            />
          </UFormField>
          <UButton
            v-if="dialog === 'rename'"
            label="Delete folder"
            color="error"
            variant="outline"
            icon="i-lucide-trash-2"
            @click="
              dialog = 'delete';
              error = '';
            "
          />
          <p v-if="error" role="alert" class="text-error">{{ error }}</p>
        </fieldset>
      </form>
    </template>
    <template #footer>
      <UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        :disabled="busy"
        @click="open = false"
      />
      <UButton
        form="folder-form"
        type="submit"
        :label="
          dialog === 'delete' ? 'Delete folder and contents' : 'Save folder'
        "
        :color="dialog === 'delete' ? 'error' : 'primary'"
        :loading="busy"
        :disabled="
          dialog === 'delete'
            ? !!target?.count && confirmation !== target.name
            : !name.trim()
        "
      />
    </template>
  </UModal>
</template>
