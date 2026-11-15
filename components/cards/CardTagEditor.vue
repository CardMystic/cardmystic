<script setup lang="ts">
import type { CardTag } from '~/composables/useLibrary';
const props = defineProps<{ oracleId: string }>();
const open = defineModel<boolean>('open', { required: true });
useHoldTagGrouping(() => open.value);
const { tags, error: loadError, change } = useCardTags();
const {
  assignments,
  isLoading,
  error: assignmentError,
  retry,
} = useCardLabels(() => [props.oracleId]);
const name = ref('');
const menuOpen = ref(false);
const busy = ref(false);
const error = ref('');
const deleting = ref<CardTag | null>(null);
const renaming = ref<CardTag | null>(null);
const renamed = ref('');
// Keep other options interactive while an individual assignment is saving.
const pending = reactive(new Map<string, boolean>());
const selected = computed(() => {
  const ids = new Set((assignments.value ?? []).map((row) => row.tag_id));
  for (const [id, assigned] of pending) {
    if (assigned) ids.add(id);
    else ids.delete(id);
  }
  return [...ids];
});
const options = computed(() =>
  tags.value.map((tag) => ({
    ...tag,
    disabled: pending.has(tag.id),
  })),
);
const saving = computed(() => busy.value || pending.size > 0);
async function setAssigned(id: string, assigned: boolean) {
  pending.set(id, assigned);
  try {
    await change(
      `/tags/${id}/cards/${props.oracleId}`,
      assigned ? 'PUT' : 'DELETE',
    );
  } finally {
    pending.delete(id);
  }
}
async function select(next: string[]) {
  const previous = selected.value;
  const id =
    next.find((id) => !previous.includes(id)) ??
    previous.find((id) => !next.includes(id));
  if (!id || pending.has(id)) return;
  error.value = '';
  try {
    await setAssigned(id, next.includes(id));
  } catch (cause) {
    error.value = (cause as Error).message;
  }
}
async function create() {
  const title = name.value.trim();
  if (!title || saving.value) return;
  busy.value = true;
  error.value = '';
  try {
    const existing = tags.value.find(
      (tag) => tag.name.toLowerCase() === title.toLowerCase(),
    );
    const tag =
      existing ?? (await change<CardTag>('/tags', 'POST', { name: title }));
    if (!selected.value.includes(tag.id)) await setAssigned(tag.id, true);
    name.value = '';
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    busy.value = false;
  }
}
async function remove() {
  if (!deleting.value || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await change(`/tags/${deleting.value.id}`, 'DELETE');
    deleting.value = null;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    busy.value = false;
  }
}
async function rename() {
  if (!renaming.value || !renamed.value.trim() || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await change(`/tags/${renaming.value.id}`, 'PATCH', {
      name: renamed.value.trim(),
    });
    renaming.value = null;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <UModal
    v-model:open="open"
    title="Edit tags"
    description="Tags are global across all your decks"
    :dismissible="!saving"
    :close="{ disabled: saving }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Tags">
          <USelectMenu
            v-model:open="menuOpen"
            :model-value="selected"
            :items="options"
            multiple
            value-key="id"
            label-key="name"
            color="info"
            :reset-search-term-on-select="false"
            :disabled="busy || isLoading || !!assignmentError"
            :loading="isLoading"
            placeholder="Select tags"
            aria-label="Select tags"
            class="w-full"
            @update:model-value="select"
          >
            <template #item-trailing="{ item }">
              <UButton
                icon="i-lucide-pencil"
                :aria-label="`Rename ${item.name}`"
                color="neutral"
                variant="ghost"
                size="xs"
                :disabled="saving"
                @pointerdown.stop
                @click.stop.prevent="
                  renaming = item;
                  renamed = item.name;
                  menuOpen = false;
                "
              />
              <UButton
                icon="i-lucide-trash-2"
                :aria-label="`Delete ${item.name} everywhere`"
                color="error"
                variant="ghost"
                size="xs"
                :disabled="saving"
                @pointerdown.stop
                @click.stop.prevent="
                  deleting = item;
                  menuOpen = false;
                "
              />
            </template>
          </USelectMenu>
        </UFormField>
        <form @submit.prevent="create">
          <UFormField label="New tag">
            <div class="flex items-center gap-2">
              <UInput
                v-model="name"
                aria-label="New tag"
                :maxlength="50"
                class="min-w-0 flex-1"
              />
              <UButton
                type="submit"
                label="Add tag"
                icon="i-lucide-plus"
                color="info"
                :disabled="
                  !name.trim() || saving || isLoading || !!assignmentError
                "
              />
            </div>
          </UFormField>
        </form>
        <p
          v-if="loadError || assignmentError || error"
          role="alert"
          class="text-sm text-error"
        >
          {{ error || loadError?.message || assignmentError?.message }}
          <UButton
            v-if="loadError || assignmentError"
            label="Retry"
            variant="link"
            @click="retry"
          />
        </p>
      </div>
      <UModal
        :open="!!deleting"
        title="Delete tag everywhere?"
        :dismissible="!busy"
        @update:open="
          (open) => {
            if (!open) deleting = null;
          }
        "
      >
        <template #body>
          <p>
            Delete “{{ deleting?.name }}” permanently? This removes it from
            every card in all your decks and collections.
          </p>
          <p v-if="error" role="alert" class="text-error">{{ error }}</p>
        </template>
        <template #footer>
          <UButton
            label="Cancel"
            color="neutral"
            variant="ghost"
            :disabled="busy"
            @click="deleting = null"
          />
          <UButton
            label="Delete tag"
            color="error"
            :loading="busy"
            @click="remove"
          />
        </template>
      </UModal>
      <UModal
        :open="!!renaming"
        title="Rename tag"
        :dismissible="!busy"
        @update:open="
          (open) => {
            if (!open) renaming = null;
          }
        "
      >
        <template #body>
          <form class="space-y-3" @submit.prevent="rename">
            <UInput
              v-model="renamed"
              aria-label="Tag name"
              :maxlength="50"
              class="w-full"
            />
            <p v-if="error" role="alert" class="text-error">{{ error }}</p>
            <UButton
              type="submit"
              label="Save"
              :loading="busy"
              :disabled="!renamed.trim()"
            />
          </form>
        </template>
      </UModal>
    </template>
  </UModal>
</template>
