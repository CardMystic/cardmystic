<template>
  <UModal v-model:open="isOpen" title="Save Cards to List" description="Choose a list or create a new one">
    <template #content>

      <!-- If not logged in show message -->
      <div v-if="!isLoggedIn" class="p-4 text-center text-red-500">
        Login to create card lists!
      </div>

      <div v-if="isLoggedIn" class="p-4 space-y-4">
        <!-- Existing Lists -->
        <div v-if="lists && lists.length > 0">
          <label class="block text-sm font-medium mb-2">Select Existing List</label>
          <USelect :disabled="newListName.trim() ? true : false" v-model="selectedListId" :items="listOptions"
            placeholder="Choose a list..." class="w-full" />
        </div>

        <div v-if="lists && lists.length > 0" class="flex items-center gap-2 text-sm text-gray-500">
          <div class="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
          <span>or</span>
          <div class="flex-1 border-t border-gray-300 dark:border-gray-700"></div>
        </div>

        <!-- Create New List -->
        <div>
          <label class="block text-sm font-medium mb-2">Create New List</label>
          <UInput v-model="newListName" placeholder="List name..." class="w-full mb-2" />
          <UTextarea v-model="newListDescription" placeholder="Description (optional)..." class="w-full" :rows="3" />
        </div>

        <!-- Card Count Info -->
        <div v-if="newListName.trim() || selectedListId" class="text-sm">
          <span class="text-orange-400 font-medium">
            {{ cardCount }}
          </span>
          card{{ cardCount !== 1 ? 's' : '' }} will be added to
          {{ newListName.trim() ? 'the new list ' : 'the existing list ' }}

          <span class="text-orange-400 font-medium">
            {{
              newListName.trim()
                ? newListName.trim()
                : lists.find(list => list.id === selectedListId)?.name || ''
            }}
          </span>
          .
        </div>


        <!-- Error Message -->
        <div v-if="errorMessage" class="text-sm text-red-500">
          {{ errorMessage }}
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-4">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>

      <div class="flex justify-end gap-2 my-2 mx-2">
        <UButton color="neutral" variant="outline" @click="isOpen = false" :disabled="loading">
          Cancel
        </UButton>
        <UButton v-if="isLoggedIn" color="primary" variant="solid" @click="handleSave"
          :disabled="loading || (!selectedListId && !newListName.trim())">
          Save
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useToast } from '#imports'

// Check if user is logged in
const { userProfile } = useUserProfile();
const isLoggedIn = computed(() => !!userProfile.value);

const props = defineProps<{
  modelValue: boolean
  cardIds: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const toast = useToast()
const { userLists, createListMutation, addCardsToListMutation } = useCardLists()

const lists = computed(() => userLists.value || [])
const selectedListId = ref<string>('')
const newListName = ref('')
const newListDescription = ref('')
const loading = computed(() => createListMutation.isPending.value || addCardsToListMutation.isPending.value)
const errorMessage = ref('')

const cardCount = computed(() => props.cardIds.length)

const listOptions = computed(() => {
  return lists.value.map(list => ({
    value: list.id,
    label: list.name
  }))
})

// Reset form when modal closes
watch(isOpen, (opened) => {
  if (!opened) {
    selectedListId.value = ''
    newListName.value = ''
    newListDescription.value = ''
    errorMessage.value = ''
  }
})

const handleSave = async () => {
  errorMessage.value = ''

  try {
    let listId = selectedListId.value

    // If creating a new list
    if (newListName.value.trim()) {
      const newList = await createListMutation.mutateAsync({
        name: newListName.value,
        description: newListDescription.value
      })
      if (!newList || !newList.id) {
        throw new Error('Failed to create new list')
      }
      listId = newList.id
    }

    // Add cards to the list
    if (listId) {
      await addCardsToListMutation.mutateAsync({
        listId,
        cardIds: props.cardIds
      })

      toast.add({
        title: 'Cards saved to list!',
        icon: 'i-heroicons-check-circle'
      })

      emit('saved')
      isOpen.value = false
    } else {
      errorMessage.value = 'Please select a list or create a new one'
    }
  } catch (error: any) {
    console.error('Error saving cards:', error)
    errorMessage.value = error.message || 'An unexpected error occurred'
  }
}
</script>
