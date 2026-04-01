<template>
  <UModal v-model:open="isOpen" title="Bulk Edit Cards"
    description="Edit the decklist below. Cards not in the list will be added, and cards removed from the list will be deleted. Commanders are preserved.">
    <template #content>
      <div class="p-4 space-y-4">
        <UTextarea v-model="bulkEditCardNames"
          placeholder="Enter card names, one per line...&#10;&#10;Example:&#10;Lightning Bolt&#10;Counterspell&#10;Sol Ring"
          :rows="10" class="w-full" autofocus />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ bulkEditCardCount }} card{{ bulkEditCardCount === 1 ? '' : 's' }} in list
        </p>

        <!-- Result feedback -->
        <div v-if="bulkEditResult" class="text-sm">
          <p v-if="bulkEditResult.addedCount > 0" class="text-green-600 dark:text-green-400">
            ✓ Added {{ bulkEditResult.addedCount }} card{{ bulkEditResult.addedCount === 1 ? '' : 's' }}
          </p>
          <p v-if="bulkEditResult.removedCount > 0" class="text-red-500 dark:text-red-400">
            ✕ Removed {{ bulkEditResult.removedCount }} card{{ bulkEditResult.removedCount === 1 ? '' : 's' }}
          </p>
          <div v-if="bulkEditResult.invalidCardNames.length > 0" class="text-amber-600 dark:text-amber-400">
            <p>⚠ {{ bulkEditResult.invalidCardNames.length }} card{{ bulkEditResult.invalidCardNames.length === 1 ? '' :
              's' }} not found:</p>
            <ul class="list-disc list-inside ml-2 mt-1 max-h-24 overflow-y-auto">
              <li v-for="name in bulkEditResult.invalidCardNames" :key="name">{{ name }}</li>
            </ul>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton class="cursor-pointer" color="neutral" variant="ghost" label="Cancel" @click="handleClose" />
          <UButton class="cursor-pointer" color="primary" variant="solid" label="Update List" :loading="bulkEditLoading"
            :disabled="bulkEditCardCount === 0" @click="handleBulkEdit" />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists'
import { useToast } from '#imports'
import { parseDecklist } from '~/utils/decklist'

const props = defineProps<{
  listId: string
  currentCardNames?: string[]
}>()

const isOpen = defineModel<boolean>('open', { default: false })

const toast = useToast()
const { bulkEditListMutation } = useCardLists()

const bulkEditCardNames = ref('')
const bulkEditLoading = ref(false)
const bulkEditResult = ref<{ addedCount: number; removedCount: number; invalidCardNames: string[] } | null>(null)

// Pre-populate with current card names when modal opens
watch(isOpen, (open) => {
  if (open && props.currentCardNames?.length) {
    bulkEditCardNames.value = props.currentCardNames.join('\n')
  }
})

const bulkEditCardCount = computed(() => {
  if (!bulkEditCardNames.value.trim()) return 0
  return parseDecklist(bulkEditCardNames.value).length
})

async function handleBulkEdit() {
  if (bulkEditCardCount.value === 0) return

  const cardNames = parseDecklist(bulkEditCardNames.value)

  bulkEditLoading.value = true
  bulkEditResult.value = null

  try {
    const result = await bulkEditListMutation.mutateAsync({
      listId: props.listId,
      cardNames
    })

    bulkEditResult.value = result

    const changes = (result.addedCount || 0) + (result.removedCount || 0)
    if (changes > 0) {
      toast.add({
        title: `List updated: ${result.addedCount} added, ${result.removedCount} removed`,
        icon: 'i-lucide-check'
      })
    } else {
      toast.add({
        title: 'No changes needed',
        icon: 'i-lucide-check'
      })
    }

    if (result.invalidCardNames.length === 0) {
      handleClose()
    }
  } catch (error: unknown) {
    toast.add({
      title: 'Error updating list',
      description: (error as Error).message,
      color: 'error'
    })
  } finally {
    bulkEditLoading.value = false
  }
}

function handleClose() {
  isOpen.value = false
  bulkEditCardNames.value = ''
  bulkEditResult.value = null
}
</script>
