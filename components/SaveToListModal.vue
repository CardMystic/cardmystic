<template>
  <UModal v-model:open="isOpen" title="Save Cards to List" description="Choose a list or create a new one">
    <template #content>
      <div class="p-4 space-y-4">
        <!-- Existing Lists -->
        <div v-if="lists && lists.length > 0">
          <label class="block text-sm font-medium mb-2">Select Existing List</label>
          <USelect v-model="selectedListId" :items="listOptions" placeholder="Choose a list..." class="w-full" />
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
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ cardCount }} card{{ cardCount !== 1 ? 's' : '' }} will be added to the list
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
        <UButton color="primary" variant="solid" @click="handleSave"
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
const { fetchUserLists, createList, addCardsToList } = useCardLists()

const lists = ref<any[]>([])
const selectedListId = ref<string>('')
const newListName = ref('')
const newListDescription = ref('')
const loading = ref(false)
const errorMessage = ref('')

const cardCount = computed(() => props.cardIds.length)

const listOptions = computed(() => {
  return lists.value.map(list => ({
    value: list.id,
    label: list.name
  }))
})

// Load user's lists when modal opens
watch(isOpen, async (opened) => {
  if (opened) {
    loading.value = true
    errorMessage.value = ''
    const { data, error } = await fetchUserLists()
    if (error) {
      errorMessage.value = `Failed to load lists: ${error.message}`
      console.error('Error loading lists:', error)
    } else {
      lists.value = data || []
    }
    loading.value = false
  } else {
    // Reset form when closed
    selectedListId.value = ''
    newListName.value = ''
    newListDescription.value = ''
    errorMessage.value = ''
  }
})

const handleSave = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    let listId = selectedListId.value

    // If creating a new list
    if (!listId && newListName.value.trim()) {
      const { data, error } = await createList(newListName.value, newListDescription.value)
      if (error) {
        errorMessage.value = error.message
        loading.value = false
        return
      }
      listId = data!.id
    }

    // Add cards to the list
    if (listId) {
      const { error } = await addCardsToList(listId, props.cardIds)
      if (error) {
        errorMessage.value = error.message
        loading.value = false
        return
      }

      toast.add({
        title: 'Cards saved to list!',
        icon: 'i-heroicons-check-circle'
      })

      emit('saved')
      isOpen.value = false
    } else {
      errorMessage.value = 'Please select a list or create a new one'
    }
  } catch (error) {
    console.error('Error saving cards:', error)
    errorMessage.value = 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>
