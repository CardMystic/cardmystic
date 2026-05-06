<template>
  <UModal
    v-model:open="isOpen"
    title="Save Cards to List"
    description="Choose a list or create a new one"
  >
    <template #content>
      <!-- If not logged in show message -->
      <div v-if="!isLoggedIn" class="p-4 text-center text-red-500">
        Login to create decklists!
      </div>

      <div v-if="isLoggedIn" class="p-4 space-y-4">
        <!-- Existing Lists -->
        <div v-if="lists && lists.length > 0">
          <label class="block text-sm font-medium mb-2"
            >Select Existing List</label
          >
          <USelect
            :disabled="!!newListName.trim()"
            v-model="selectedListId"
            :items="listOptions"
            placeholder="Choose a list..."
            class="w-full"
          />
        </div>

        <div
          v-if="lists && lists.length > 0"
          class="flex items-center gap-2 text-sm text-gray-500"
        >
          <div
            class="flex-1 border-t border-gray-300 dark:border-gray-700"
          ></div>
          <span>or</span>
          <div
            class="flex-1 border-t border-gray-300 dark:border-gray-700"
          ></div>
        </div>

        <!-- Create New List -->
        <div>
          <label class="block text-sm font-medium mb-2">Create New List</label>
          <UInput
            v-model="newListName"
            placeholder="List name..."
            class="w-full mb-2"
          />
          <UTextarea
            v-model="newListDescription"
            placeholder="Description (optional)..."
            class="w-full"
            :rows="2"
          />
        </div>

        <!-- Commanders (editable, only shown if provided) -->
        <div v-if="editableCommanders.length > 0">
          <label class="block text-sm font-medium mb-2">Commanders</label>
          <div
            v-for="(_, index) in editableCommanders"
            :key="index"
            class="flex items-center gap-2 mb-1"
          >
            <UInput v-model="editableCommanders[index]" class="flex-1" />
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="editableCommanders.splice(index, 1)"
            />
          </div>
        </div>

        <!-- Cards (editable) -->
        <div>
          <label class="block text-sm font-medium mb-2"
            >Cards ({{ editableCardNames.length }})</label
          >
          <UTextarea
            v-model="cardNamesText"
            placeholder="One card name per line..."
            class="w-full"
            :rows="6"
            :ui="{ base: 'text-sm resize-y min-h-24 max-h-60' }"
          />
        </div>

        <!-- Card Count Info -->
        <div v-if="newListName.trim() || selectedListId" class="text-sm">
          <span class="text-orange-400 font-medium">{{
            editableCardNames.length
          }}</span>
          card{{ editableCardNames.length !== 1 ? 's' : '' }}
          <span v-if="editableCommanders.length > 0">
            and
            <span class="text-orange-400 font-medium">{{
              editableCommanders.length
            }}</span>
            commander{{ editableCommanders.length !== 1 ? 's' : '' }}
          </span>
          will be added to
          {{ newListName.trim() ? 'the new list ' : 'the existing list ' }}
          <span class="text-orange-400 font-medium">
            {{
              newListName.trim()
                ? newListName.trim()
                : lists.find((list) => list.id === selectedListId)?.name || ''
            }} </span
          >.
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="text-sm text-red-500">
          {{ errorMessage }}
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-4">
          <UIcon
            name="i-heroicons-arrow-path"
            class="w-6 h-6 animate-spin text-primary"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 my-2 mx-2">
        <UButton
          color="neutral"
          variant="outline"
          @click="isOpen = false"
          :disabled="loading"
        >
          Cancel
        </UButton>
        <UButton
          v-if="isLoggedIn"
          color="primary"
          variant="solid"
          @click="handleSave"
          :disabled="
            loading ||
            (!selectedListId && !newListName.trim()) ||
            editableCardNames.length === 0
          "
        >
          Save
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists';
import { useToast } from '#imports';

const { userProfile } = useUserProfile();
const isLoggedIn = computed(() => !!userProfile.value);

const props = defineProps<{
  modelValue: boolean;
  cardNames: string[];
  commanders?: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const toast = useToast();
const { userLists, createListMutation, addCardsByNameToListMutation } =
  useCardLists();

const lists = computed(() => userLists.value || []);
const selectedListId = ref<string>('');
const newListName = ref('');
const newListDescription = ref('');
const loading = computed(
  () =>
    createListMutation.isPending.value ||
    addCardsByNameToListMutation.isPending.value,
);
const errorMessage = ref('');

// Editable commander names (initialized from prop)
const editableCommanders = ref<string[]>([]);

// Editable card names as single text (one per line)
const cardNamesText = ref('');

// Parsed non-empty card names from the textarea
const editableCardNames = computed(() =>
  cardNamesText.value
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean),
);

const listOptions = computed(() => {
  return lists.value.map((list) => ({
    value: list.id,
    label: list.name || '',
  }));
});

// Initialize editable state when modal opens
watch(isOpen, (opened) => {
  if (opened) {
    editableCommanders.value = [...(props.commanders || [])];
    cardNamesText.value = props.cardNames.join('\n');
  } else {
    selectedListId.value = '';
    newListName.value = '';
    newListDescription.value = '';
    errorMessage.value = '';
  }
});

const handleSave = async () => {
  errorMessage.value = '';

  try {
    let listId = selectedListId.value;

    if (newListName.value.trim()) {
      const commanders = editableCommanders.value.filter((c) => c.trim());
      const newList = await createListMutation.mutateAsync({
        name: newListName.value,
        description: newListDescription.value,
        commanders: commanders.length > 0 ? commanders : undefined,
      });
      if (!newList || !newList.id) {
        throw new Error('Failed to create new list');
      }
      listId = newList.id;
    }

    if (!listId) {
      errorMessage.value = 'Please select a list or create a new one';
      return;
    }

    const result = await addCardsByNameToListMutation.mutateAsync({
      listId,
      cardNames: editableCardNames.value,
    });

    const messages: string[] = [];
    if (result.addedCount > 0)
      messages.push(
        `Added ${result.addedCount} card${result.addedCount === 1 ? '' : 's'}`,
      );
    if (result.updatedCount > 0)
      messages.push(
        `${result.updatedCount} card${result.updatedCount === 1 ? '' : 's'} updated`,
      );
    if (result.invalidCardNames?.length > 0)
      messages.push(
        `${result.invalidCardNames.length} not found: ${result.invalidCardNames.join(', ')}`,
      );

    toast.add({
      title: messages.join('. ') || 'Cards saved to list!',
      icon: 'i-heroicons-check-circle',
    });

    emit('saved');
    isOpen.value = false;
  } catch (error: any) {
    console.error('Error saving cards:', error);
    errorMessage.value = error.message || 'An unexpected error occurred';
  }
};
</script>
