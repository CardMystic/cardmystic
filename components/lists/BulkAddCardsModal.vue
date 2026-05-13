<template>
  <UModal
    v-model:open="isOpen"
    title="Bulk Edit Cards"
    description="Edit each board below. Cards not in the list will be added, removed cards will be deleted. Commanders are preserved. Boards not submitted are left untouched."
  >
    <template #content>
      <div class="p-4 space-y-4">
        <UTabs :items="tabs" class="w-full">
          <template #mainboard>
            <div class="pt-3 space-y-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ boardCardCount(mainboardText) }} card{{
                  boardCardCount(mainboardText) === 1 ? '' : 's'
                }}
              </p>
              <UTextarea
                v-model="mainboardText"
                placeholder="4 Lightning Bolt&#10;2 Counterspell&#10;Sol Ring"
                :rows="10"
                class="w-full"
              />
            </div>
          </template>
          <template #sideboard>
            <div class="pt-3 space-y-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ boardCardCount(sideboardText) }} card{{
                  boardCardCount(sideboardText) === 1 ? '' : 's'
                }}
              </p>
              <UTextarea
                v-model="sideboardText"
                placeholder="2 Negate&#10;1 Pithing Needle"
                :rows="10"
                class="w-full"
              />
            </div>
          </template>
          <template #considering>
            <div class="pt-3 space-y-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ boardCardCount(consideringText) }} card{{
                  boardCardCount(consideringText) === 1 ? '' : 's'
                }}
              </p>
              <UTextarea
                v-model="consideringText"
                placeholder="Ragavan, Nimble Pilferer&#10;Force of Will"
                :rows="10"
                class="w-full"
              />
            </div>
          </template>
        </UTabs>

        <!-- Result feedback -->
        <div v-if="bulkEditResult" class="text-sm">
          <p
            v-if="bulkEditResult.addedCount > 0"
            class="text-green-600 dark:text-green-400"
          >
            ✓ Added {{ bulkEditResult.addedCount }} card{{
              bulkEditResult.addedCount === 1 ? '' : 's'
            }}
          </p>
          <p
            v-if="bulkEditResult.removedCount > 0"
            class="text-red-500 dark:text-red-400"
          >
            ✕ Removed {{ bulkEditResult.removedCount }} card{{
              bulkEditResult.removedCount === 1 ? '' : 's'
            }}
          </p>
          <div
            v-if="bulkEditResult.invalidCardNames.length > 0"
            class="text-amber-600 dark:text-amber-400"
          >
            <p>
              ⚠ {{ bulkEditResult.invalidCardNames.length }} card{{
                bulkEditResult.invalidCardNames.length === 1 ? '' : 's'
              }}
              not found:
            </p>
            <ul
              class="list-disc list-inside ml-2 mt-1 max-h-24 overflow-y-auto"
            >
              <li v-for="name in bulkEditResult.invalidCardNames" :key="name">
                {{ name }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton
            class="cursor-pointer"
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="handleClose"
          />
          <UButton
            class="cursor-pointer"
            color="primary"
            variant="solid"
            label="Update List"
            :loading="bulkEditLoading"
            :disabled="totalCardCount === 0"
            @click="handleBulkEdit"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useCardLists } from '~/composables/useCardLists';
import { useToast } from '#imports';
import type { BulkEditResponse } from '~/models/cardListModel';

const props = defineProps<{
  listId: string;
  mainboardNames?: string[];
  sideboardNames?: string[];
  consideringNames?: string[];
}>();

const isOpen = defineModel<boolean>('open', { default: false });

const toast = useToast();
const { bulkEditListMutation } = useCardLists();

const mainboardText = ref('');
const sideboardText = ref('');
const consideringText = ref('');
const bulkEditLoading = ref(false);
const bulkEditResult = ref<BulkEditResponse | null>(null);

const tabs = [
  { label: 'Mainboard', slot: 'mainboard' as const },
  { label: 'Sideboard', slot: 'sideboard' as const },
  { label: 'Considering', slot: 'considering' as const },
];

// Pre-populate each board textarea when modal opens
watch(isOpen, (open) => {
  if (open) {
    mainboardText.value = props.mainboardNames?.join('\n') ?? '';
    sideboardText.value = props.sideboardNames?.join('\n') ?? '';
    consideringText.value = props.consideringNames?.join('\n') ?? '';
  }
});

/** Parse a textarea value into { name, num_copies } entries, ignoring blank lines. */
function parseBoard(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = line.match(/^(\d+)x?\s+(.+)$/i);
      return match
        ? { name: match[2].trim(), num_copies: parseInt(match[1]) }
        : { name: line, num_copies: 1 };
    });
}

function boardCardCount(text: string): number {
  if (!text.trim()) return 0;
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .reduce((sum, line) => {
      const match = line.match(/^(\d+)x?\s+/i);
      return sum + (match ? parseInt(match[1]) : 1);
    }, 0);
}

const totalCardCount = computed(
  () =>
    boardCardCount(mainboardText.value) +
    boardCardCount(sideboardText.value) +
    boardCardCount(consideringText.value),
);

async function handleBulkEdit() {
  if (totalCardCount.value === 0) return;

  const entries = (
    [
      { board: 'Mainboard', text: mainboardText.value },
      { board: 'Sideboard', text: sideboardText.value },
      { board: 'Considering', text: consideringText.value },
    ] as const
  )
    .map(({ board, text }) => ({ board, cards: parseBoard(text) }))
    .filter((entry) => entry.cards.length > 0);

  bulkEditLoading.value = true;
  bulkEditResult.value = null;

  try {
    const result = await bulkEditListMutation.mutateAsync({
      listId: props.listId,
      entries,
    });

    bulkEditResult.value = result;

    const changes = (result.addedCount || 0) + (result.removedCount || 0);
    if (changes > 0) {
      toast.add({
        title: `List updated: ${result.addedCount} added, ${result.removedCount} removed`,
        icon: 'i-lucide-check',
      });
    } else {
      toast.add({
        title: 'No changes needed',
        icon: 'i-lucide-check',
      });
    }

    if (result.invalidCardNames.length === 0) {
      handleClose();
    }
  } catch (error: any) {
    toast.add({
      title: 'Error updating list',
      description: error.message,
      color: 'error',
    });
  } finally {
    bulkEditLoading.value = false;
  }
}

function handleClose() {
  isOpen.value = false;
  mainboardText.value = '';
  sideboardText.value = '';
  consideringText.value = '';
  bulkEditResult.value = null;
}
</script>
