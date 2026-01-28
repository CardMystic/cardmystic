<template>
  <div :class="$attrs.class" class="flex items-center">
    <UPopover v-model:open="isOpen">
      <UButton class="cursor-pointer" icon="i-lucide-clipboard-list" color="primary" variant="solid"
        :label="clipboardLabel"></UButton>
      <template #content>
        <div class="p-3 w-72 max-w-xs">
          <div class="font-semibold mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-clipboard-list" class="w-5 h-5" />
            Clipboard
          </div>
          <div v-if="clipboard.list.value.length === 0" class="text-gray-400 text-sm py-4 text-center">
            Clipboard is empty.
          </div>
          <ul v-else class="mb-2 max-h-56 overflow-y-auto">
            <li v-for="card in clipboard.list.value" :key="card.id"
              class="flex items-center justify-between py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <span class="truncate flex-1 cursor-pointer hover:text-primary hover:underline"
                @click="navigateToCard(card.id)">
                {{ card.name }}
              </span>
              <UButton class="cursor-pointer" icon="i-lucide-x" size="xs" color="error" variant="ghost"
                @click.stop="clipboard.remove(card.id)" aria-label="Remove" />
            </li>
          </ul>
          <div class="flex flex-col gap-2 mt-2">
            <UButton class="cursor-pointer" icon="i-lucide-copy" color="primary" variant="solid" size="sm" block
              @click="copyNames" :disabled="clipboard.list.value.length === 0">
              Copy
            </UButton>
            <UButton class="cursor-pointer" icon="i-lucide-save" color="primary" variant="outline" size="sm" block
              @click="openSaveToList" :disabled="clipboard.list.value.length === 0">
              Save to List
            </UButton>
            <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid" size="sm" block
              class="cursor-pointer" :disabled="clipboard.list.value.length === 0" @click="openMassEntry">
              Buy (${{ clipboard.totalPrice.value.toFixed(2) }})
            </UButton>
            <UButton class="cursor-pointer" icon="i-lucide-trash" color="error" variant="soft" size="sm" block
              @click="clear" :disabled="clipboard.list.value.length === 0">
              Clear
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
    <SaveToListModal v-model="isSaveToListOpen" :card-ids="cardIds" @saved="handleSaved" />
  </div>
</template>

<script setup lang="ts">
import { useClipboard as useClipboardStore } from '~/composables/useClipboard'
import { useClipboard as useCopyToClipboard } from '@vueuse/core'
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer'
import { useToast } from '#imports'
import SaveToListModal from '~/components/SaveToListModal.vue'

defineOptions({
  inheritAttrs: false
})

const clipboard = useClipboardStore()
const { copy } = useCopyToClipboard()
const toast = useToast()
const router = useRouter()
const isOpen = ref(false)
const isSaveToListOpen = ref(false)

const clipboardLabel = computed(() => {
  return (clipboard.count.value > 0 ? clipboard.count.value + '' : '0')
})

const cardIds = computed(() => {
  return clipboard.list.value.map(card => card.id)
})

function navigateToCard(cardId: string) {
  isOpen.value = false
  nextTick(() => {
    router.push(`/card/${cardId}`)
  })
}

function copyNames() {
  if (clipboard.list.value.length === 0) return
  const names = clipboard.list.value.map(card => card.name).join('\n')
  copy(names)
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check'
  })
}

function openSaveToList() {
  isSaveToListOpen.value = true
}

function handleSaved() {
  // Clear clipboard after saving
  clipboard.clear()
}

function openMassEntry() {
  if (!clipboard.list.value.length) return
  const names = clipboard.list.value.map(c => c.name)
  const bare = getMassEntryAffiliateLink(names)
  const url = bare

  // IMPORTANT: open the raw string; don't rebuild the query anywhere
  window.open(url, '_blank', 'noopener,noreferrer')
}

function clear() {
  toast.add({
    title: 'Clipboard cleared',
    icon: 'i-lucide-clipboard-x'
  })
  clipboard.clear()
}
</script>
