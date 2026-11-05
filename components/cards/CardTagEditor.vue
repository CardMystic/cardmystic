<script setup lang="ts">
import type { CardTag } from '~/composables/useLibrary';
const props = defineProps<{ oracleId: string }>();
const { tags, userId, error: loadError, change } = useCardTags();
const { assignments, error: assignmentError } = useCardLabels(() => [
  props.oracleId,
]);
const name = ref('');
const choice = ref<string>();
const menuOpen = ref(false);
const busy = ref(false);
const error = ref('');
const deleting = ref<CardTag | null>(null);
const renaming = ref<CardTag | null>(null);
const renamed = ref('');
const selected = computed(
  () => new Set((assignments.value ?? []).map((row) => row.tag_id)),
);
const applied = computed(() =>
  tags.value.filter((tag) => selected.value.has(tag.id)),
);
async function assign(id: string, remove = false) {
  if (busy.value || (!remove && selected.value.has(id))) return;
  busy.value = true;
  error.value = '';
  try {
    await change(
      `/tags/${id}/cards/${props.oracleId}`,
      remove ? 'DELETE' : 'PUT',
    );
    choice.value = undefined;
    name.value = '';
    menuOpen.value = false;
  } catch (cause) {
    error.value = (cause as Error).message;
  } finally {
    busy.value = false;
  }
}
async function create(value: string) {
  const title = value.trim();
  if (!title || busy.value) return;
  const existing = tags.value.find(
    (tag) => tag.name.toLowerCase() === title.toLowerCase(),
  );
  if (existing) return assign(existing.id);
  busy.value = true;
  error.value = '';
  try {
    const tag = await change<CardTag>('/tags', 'POST', { name: title });
    await change(`/tags/${tag.id}/cards/${props.oracleId}`, 'PUT');
    choice.value = undefined;
    name.value = '';
    menuOpen.value = false;
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
  <section v-if="userId" aria-label="My tags" class="mt-3 space-y-2">
    <div v-if="applied.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in applied"
        :key="tag.id"
        class="inline-flex items-center rounded-full bg-primary/10 pl-2.5 text-xs text-primary"
      >
        {{ tag.name }}
        <UButton
          icon="i-lucide-x"
          :aria-label="`Remove ${tag.name} from this card`"
          color="primary"
          variant="ghost"
          size="xs"
          class="rounded-full"
          :disabled="busy"
          @click="assign(tag.id, true)"
        />
      </span>
    </div>
    <UInputMenu
      v-model:open="menuOpen"
      v-model:search-term="name"
      v-model="choice"
      :items="tags"
      value-key="id"
      label-key="name"
      :filter-fields="['name']"
      :create-item="name.trim().length > 0 && name.trim().length <= 50"
      :disabled="busy"
      :loading="busy"
      open-on-click
      placeholder="Add or create a tag"
      aria-label="Add or create a tag"
      class="w-full"
      @update:model-value="(id) => id && assign(id)"
      @create="create"
    >
      <template #create-item-label="{ item }"
        >Create “{{ item.trim() }}”</template
      >
      <template #item-trailing="{ item }">
        <UIcon
          v-if="selected.has(item.id)"
          name="i-lucide-check"
          class="size-4 text-primary"
        />
        <UButton
          icon="i-lucide-pencil"
          :aria-label="`Rename ${item.name}`"
          color="neutral"
          variant="ghost"
          size="xs"
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
          @pointerdown.stop
          @click.stop.prevent="
            deleting = item;
            menuOpen = false;
          "
        />
      </template>
    </UInputMenu>
    <p class="text-xs text-muted">
      Your tags apply to this card in all your decks.
    </p>
    <p
      v-if="loadError || assignmentError || error"
      role="alert"
      class="text-sm text-error"
    >
      {{ error || loadError?.message || assignmentError?.message }}
    </p>
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
          Delete “{{ deleting?.name }}” permanently? This removes it from every
          card in all your decks and collections.
        </p>
        <p v-if="error" role="alert" class="text-error">{{ error }}</p>
      </template>
      <template #footer>
        <UButton
          label="Delete tag"
          color="error"
          :loading="busy"
          @click="remove"
        />
        <UButton
          label="Cancel"
          color="neutral"
          variant="ghost"
          :disabled="busy"
          @click="deleting = null"
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
  </section>
</template>
