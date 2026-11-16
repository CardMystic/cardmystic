<template>
  <div :class="$attrs.class" class="flex items-center">
    <UPopover v-model:open="isOpen">
      <UButton
        class="min-h-11 min-w-11 justify-center cursor-pointer"
        icon="i-lucide-clipboard-list"
        color="primary"
        variant="solid"
        :label="clipboardLabel"
        :aria-label="`Clipboard: ${clipboardLabel} ${clipboard.count.value === 1 ? 'card' : 'cards'}`"
      ></UButton>
      <template #content>
        <div
          class="w-72 max-w-[calc(100vw-1rem)] max-h-[var(--reka-popover-content-available-height)] overflow-y-auto p-3"
        >
          <div class="font-semibold mb-2 flex items-center gap-2">
            <UIcon name="i-lucide-clipboard-list" class="w-5 h-5" />
            Clipboard
          </div>
          <div
            v-if="clipboard.list.value.length === 0"
            class="text-toned text-sm py-4 text-center"
          >
            Clipboard is empty.
          </div>
          <ul v-else class="mb-2 max-h-56 overflow-y-auto">
            <li
              v-for="card in clipboard.list.value"
              :key="card.id"
              class="flex items-center justify-between py-1 px-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <NuxtLink
                :to="`/card/${card.oracleId ?? card.id}`"
                class="min-w-0 flex-1 truncate rounded hover:text-primary hover:underline focus-visible:outline-primary"
                @click="isOpen = false"
              >
                {{ card.name }}
              </NuxtLink>
              <UButton
                class="cursor-pointer"
                icon="i-lucide-x"
                size="xs"
                color="error"
                variant="ghost"
                @click.stop="clipboard.remove(card.id)"
                :aria-label="`Remove ${card.name} from clipboard`"
              />
            </li>
          </ul>
          <div class="flex flex-col gap-2 mt-2">
            <UButton
              class="cursor-pointer"
              icon="i-lucide-copy"
              color="primary"
              variant="solid"
              size="sm"
              block
              @click="copyNames"
              :disabled="clipboard.list.value.length === 0"
            >
              Copy
            </UButton>
            <UButton
              class="cursor-pointer"
              icon="i-lucide-save"
              color="primary"
              variant="outline"
              size="sm"
              block
              @click="openSaveToList"
              :disabled="clipboard.list.value.length === 0"
            >
              Add to Deck
            </UButton>
            <UButton
              v-bind="cardActionStyles.buy"
              variant="solid"
              size="sm"
              block
              class="cursor-pointer"
              :disabled="clipboard.list.value.length === 0"
              @click="openMassEntry"
            >
              Buy (${{ clipboard.totalPrice.value.toFixed(2) }})
            </UButton>
            <UButton
              class="cursor-pointer"
              icon="i-lucide-trash"
              color="error"
              variant="soft"
              size="sm"
              block
              @click="clear"
              :disabled="clipboard.list.value.length === 0"
            >
              Clear
            </UButton>
          </div>
        </div>
      </template>
    </UPopover>
    <LazyAddToDeckModal
      v-if="isAddToDeckOpen"
      v-model:open="isAddToDeckOpen"
      :oracle-ids="clipboardOracleIds"
      @update:open="
        (v) => {
          isAddToDeckOpen = v;
        }
      "
      @success="
        () => {
          clipboard.clear();
          isOpen = false;
        }
      "
    />
  </div>
</template>

<script setup lang="ts">
import { cardActionStyles } from '~/utils/card-actions';
import { useClipboard as useClipboardStore } from '~/composables/useClipboard';
import { getMassEntryAffiliateLink } from '~/utils/tcgPlayer';
import { useToast } from '#imports';

defineOptions({
  inheritAttrs: false,
});

const clipboard = useClipboardStore();
const toast = useToast();
const isOpen = ref(false);
const isAddToDeckOpen = ref(false);

const clipboardOracleIds = computed(() =>
  clipboard.list.value
    .map((card) => card.oracleId)
    .filter((id): id is string => !!id),
);

const clipboardLabel = computed(() => {
  return clipboard.count.value > 0 ? clipboard.count.value + '' : '0';
});

async function copyNames() {
  if (clipboard.list.value.length === 0) return;
  const names = clipboard.list.value.map((card) => card.name).join('\n');
  try {
    await navigator.clipboard.writeText(names);
    toast.add({
      title: 'Card names copied!',
      icon: 'i-lucide-clipboard-check',
    });
  } catch {
    toast.add({
      title: 'Failed to copy card names',
      description: 'Clipboard access is unavailable in this context.',
      color: 'error',
    });
  }
}

function openSaveToList() {
  isAddToDeckOpen.value = true;
}

function openMassEntry() {
  if (!clipboard.list.value.length) return;
  const names = clipboard.list.value.map((c) => c.name);
  const bare = getMassEntryAffiliateLink(names);
  const url = bare;

  // IMPORTANT: open the raw string; don't rebuild the query anywhere
  window.open(url, '_blank', 'noopener,noreferrer');
}

function clear() {
  toast.add({
    title: 'Clipboard cleared',
    icon: 'i-lucide-clipboard-x',
  });
  clipboard.clear();
}
</script>
