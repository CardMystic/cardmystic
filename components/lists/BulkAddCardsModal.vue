<template>
  <UModal v-model:open="isOpen" title="Bulk Add Cards" description="Paste a list of card names, one per line">
    <template #content>
      <div class="p-4 space-y-4">
        <UTextarea v-model="bulkAddCardNames"
          placeholder="Enter card names, one per line...&#10;&#10;Example:&#10;Lightning Bolt&#10;Counterspell&#10;Sol Ring"
          :rows="10" class="w-full" autofocus />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ bulkAddCardCount }} card{{ bulkAddCardCount === 1 ? '' : 's' }} to add
        </p>

        <!-- Result feedback -->
        <div v-if="bulkAddResult" class="text-sm">
          <p v-if="bulkAddResult.addedCount > 0" class="text-green-600 dark:text-green-400">
            ✓ Added {{ bulkAddResult.addedCount }} card{{ bulkAddResult.addedCount === 1 ? '' : 's' }}
          </p>
          <p v-if="bulkAddResult.duplicatesSkipped > 0" class="text-gray-500 dark:text-gray-400">
            ↷ Skipped {{ bulkAddResult.duplicatesSkipped }} duplicate{{ bulkAddResult.duplicatesSkipped === 1 ? '' : 's'
            }}
          </p>
          <div v-if="bulkAddResult.invalidCardNames.length > 0" class="text-amber-600 dark:text-amber-400">
            <p>⚠ {{ bulkAddResult.invalidCardNames.length }} card{{ bulkAddResult.invalidCardNames.length === 1 ? '' :
              's' }} not found:</p>
            <ul class="list-disc list-inside ml-2 mt-1 max-h-24 overflow-y-auto">
              <li v-for="name in bulkAddResult.invalidCardNames" :key="name">{{ name }}</li>
            </ul>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton class="cursor-pointer" color="neutral" variant="ghost" label="Cancel" @click="handleClose" />
          <UButton class="cursor-pointer" color="primary" variant="solid" label="Add Cards" :loading="bulkAddLoading"
            :disabled="bulkAddCardCount === 0" @click="handleBulkAdd" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useToast } from '#imports'

const props = defineProps<{
  listId: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const toast = useToast()
const { addCardsByNameToListMutation } = useCardLists()

const bulkAddCardNames = ref('')
const bulkAddLoading = ref(false)
const bulkAddResult = ref<{ addedCount: number; duplicatesSkipped: number; invalidCardNames: string[] } | null>(null)

const bulkAddCardCount = computed(() => {
  if (!bulkAddCardNames.value.trim()) return 0
  return bulkAddCardNames.value.split('\n').filter(name => name.trim()).length
})

async function handleBulkAdd() {
  if (bulkAddCardCount.value === 0) return

  const cardNames = bulkAddCardNames.value
    .split('\n')
    .map(name => name.trim())
    .filter(name => name)

  bulkAddLoading.value = true
  bulkAddResult.value = null

  try {
    const result = await addCardsByNameToListMutation.mutateAsync({
      listId: props.listId,
      cardNames
    })

    bulkAddResult.value = result

    if (result.addedCount > 0) {
      toast.add({
        title: `Added ${result.addedCount} card${result.addedCount === 1 ? '' : 's'} to list`,
        icon: 'i-lucide-check'
      })
    }

    if (result.invalidCardNames.length === 0) {
      // All cards added successfully, close the modal
      handleClose()
    }
  } catch (error: any) {
    toast.add({
      title: 'Error adding cards',
      description: error.message,
      color: 'error'
    })
  } finally {
    bulkAddLoading.value = false
  }
}

function handleClose() {
  isOpen.value = false
  bulkAddCardNames.value = ''
  bulkAddResult.value = null
}
</script>
