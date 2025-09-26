<template>
  <UPopover>
    <UButton icon="i-lucide-clipboard-list" color="primary" variant="soft"
      :label="'Clipboard ' + '(' + (clipboard.count.value > 0 ? clipboard.count.value + '' : '0') + ')'"></UButton>
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
            <span class="truncate">{{ card.name }}</span>
            <UButton class="cursor-pointer" icon="i-lucide-x" size="xs" color="error" variant="ghost"
              @click.stop="clipboard.remove(card.id)" aria-label="Remove" />
          </li>
        </ul>
        <div class="flex flex-col gap-2 mt-2">
          <UButton class="cursor-pointer" icon="i-lucide-copy" color="primary" variant="solid" size="sm" block
            @click="copyNames" :disabled="clipboard.list.value.length === 0">
            Copy
          </UButton>
          <UButton icon="i-heroicons-shopping-cart" color="success" variant="solid" size="sm" block
            class="cursor-pointer" :disabled="clipboard.list.value.length === 0" @click="openMassEntry">
            Buy (${{ clipboard.totalPrice.value.toFixed(2) }})
          </UButton>
          <UButton class="cursor-pointer" icon="i-lucide-trash" color="error" variant="soft" size="sm" block
            @click="clipboard.clear" :disabled="clipboard.list.value.length === 0">
            Clear
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import { useClipboard as useClipboardStore } from '~/composables/useClipboard'
import { useClipboard as useCopyToClipboard } from '@vueuse/core'
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer'
import { useToast } from '#imports'

const clipboard = useClipboardStore()
const { copy } = useCopyToClipboard()
const toast = useToast()

function copyNames() {
  if (clipboard.list.value.length === 0) return
  const names = clipboard.list.value.map(card => card.name).join('\n')
  copy(names)
  toast.add({
    title: 'Card names copied!',
    icon: 'i-lucide-clipboard-check'
  })
}

function openMassEntry() {
  if (!clipboard.list.value.length) return
  const names = clipboard.list.value.map(c => c.name)
  const bare = getMassEntryAffiliateLink(names)
  const url = bare

  // IMPORTANT: open the raw string; don't rebuild the query anywhere
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>
