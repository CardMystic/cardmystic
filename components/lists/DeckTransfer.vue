<script setup lang="ts">
import {
  exportDeck,
  parseDeckImport,
  type TransferCard,
  type DeckExportFormat,
} from '~/utils/deckTransfer';
const props = defineProps<{
  listId: string;
  name: string;
  cards: TransferCard[];
  owner: boolean;
  deckFormat: string;
}>();
const open = defineModel<boolean>('open', { default: false });
const mode = ref<'export' | 'import'>('export');
const format = ref<DeckExportFormat>('text'),
  input = ref(''),
  inputFormat = ref<'text' | 'csv'>('text');
const preview = ref<TransferCard[]>([]),
  error = ref(''),
  message = ref(''),
  busy = ref(false),
  applied = ref(false);
const { addCardsByNameToListMutation, setCommanderMutation } = useCardLists();
const output = computed(() => exportDeck(props.cards, format.value));
const unsupported = computed(() =>
  format.value === 'arena' || format.value === 'mtgo'
    ? props.cards.filter(
        (card) => card[format.value as 'arena' | 'mtgo'] === false,
      ).length
    : 0,
);
function inspect() {
  error.value = '';
  preview.value = [];
  applied.value = false;
  message.value = '';
  try {
    preview.value = parseDeckImport(input.value, inputFormat.value);
    if (props.deckFormat !== 'Commander')
      preview.value = preview.value.map((card) => ({
        ...card,
        commander: false,
      }));
    if (preview.value.filter((card) => card.commander).length > 2) {
      preview.value = [];
      throw new Error('A deck can have at most two commanders.');
    }
  } catch (cause) {
    error.value = (cause as Error).message;
  }
}
watch([input, inputFormat], () => {
  preview.value = [];
  applied.value = false;
});
async function fileChanged(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.size > 5_000_000) {
    error.value = 'Choose a file under 5 MB.';
    return;
  }
  inputFormat.value = /\.csv$/i.test(file.name) ? 'csv' : 'text';
  input.value = await file.text();
  await nextTick();
  inspect();
}
async function apply() {
  if (!props.owner || busy.value || applied.value || !preview.value.length)
    return;
  busy.value = true;
  applied.value = true;
  error.value = '';
  let added = 0;
  try {
    for (const board of ['Mainboard', 'Sideboard', 'Considering'] as const) {
      const cards = preview.value.filter((card) => card.board === board);
      if (!cards.length) continue;
      for (let offset = 0; offset < cards.length; offset += 500) {
        const result = await addCardsByNameToListMutation.mutateAsync({
          listId: props.listId,
          board,
          cardNames: cards
            .slice(offset, offset + 500)
            .map((card) => `${card.quantity} ${card.name}`),
        });
        added += result.addedCount + result.updatedCount;
        if (result.invalidCardNames.length)
          throw new Error(
            `Not found: ${result.invalidCardNames.slice(0, 20).join(', ')}. Other valid cards may already have been added.`,
          );
      }
    }
    for (const commander of preview.value.filter((card) => card.commander))
      await setCommanderMutation.mutateAsync({
        listId: props.listId,
        commanderName: commander.name,
      });
    message.value = `Imported ${added} card entries. Existing cards were kept.`;
  } catch (cause) {
    error.value = `${(cause as Error).message} Check your list before importing again.`;
  } finally {
    busy.value = false;
  }
}
function download() {
  const url = URL.createObjectURL(
    new Blob([output.value], {
      type:
        format.value === 'csv'
          ? 'text/csv;charset=utf-8'
          : 'text/plain;charset=utf-8',
    }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `${props.name.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 80) || 'deck'}.${format.value === 'csv' ? 'csv' : 'txt'}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copy() {
  try {
    await navigator.clipboard.writeText(output.value);
    message.value = 'Copied.';
  } catch {
    error.value = 'Could not copy. Download the file instead.';
  }
}
</script>
<template>
  <UModal
    v-model:open="open"
    title="Import / Export"
    :dismissible="!busy"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="flex gap-2">
          <UButton
            label="Export"
            :variant="mode === 'export' ? 'solid' : 'outline'"
            @click="mode = 'export'"
          /><UButton
            v-if="owner"
            label="Import"
            :variant="mode === 'import' ? 'solid' : 'outline'"
            @click="mode = 'import'"
          />
        </div>
        <template v-if="mode === 'export'">
          <USelect
            v-model="format"
            aria-label="Export format"
            :items="[
              { label: 'Plain text', value: 'text' },
              { label: 'MTG Arena', value: 'arena' },
              { label: 'Magic Online (.txt)', value: 'mtgo' },
              { label: 'CSV', value: 'csv' },
            ]"
            class="w-full"
          />
          <p v-if="unsupported" class="text-warning text-sm">
            {{ unsupported }} entries are not available on
            {{ format === 'arena' ? 'Arena' : 'Magic Online' }}. They are
            included; that client may reject them.
          </p>
          <p
            v-if="format === 'arena' || format === 'mtgo'"
            class="text-sm text-muted"
          >
            Considering cards are excluded. No specific printing is selected.
          </p>
          <UTextarea
            :model-value="output"
            readonly
            :rows="8"
            aria-label="Exported decklist"
            class="w-full"
          />
          <div class="flex gap-2">
            <UButton label="Download" @click="download" /><UButton
              label="Copy"
              variant="outline"
              @click="copy"
            />
          </div>
        </template>
        <template v-else>
          <p class="text-sm">
            Upload CSV or a text export from Arena, Magic Online, Moxfield, or
            Archidekt, or paste below. CSV accepts Name/Card Name,
            Quantity/Count, and optional Board/Commander columns.
          </p>
          <p v-if="deckFormat !== 'Commander'" class="text-sm text-muted">
            Commander markers are imported as normal cards for this list format.
          </p>
          <input
            type="file"
            accept=".csv,.txt,.dec,text/plain,text/csv"
            aria-label="Import file"
            :disabled="busy"
            @change="fileChanged"
          />
          <USelect
            v-model="inputFormat"
            aria-label="Import format"
            :items="[
              { label: 'Text decklist', value: 'text' },
              { label: 'CSV', value: 'csv' },
            ]"
            class="w-full"
          />
          <UTextarea
            v-model="input"
            :disabled="busy"
            :rows="6"
            aria-label="Decklist to import"
            class="w-full"
          />
          <UButton
            label="Preview import"
            :disabled="busy || !input.trim()"
            @click="inspect"
          />
          <template v-if="preview.length">
            <p>
              {{ preview.length }} card entries ·
              {{ preview.reduce((sum, card) => sum + card.quantity, 0) }}
              copies. Adds to your list; nothing is removed.
            </p>
            <ul class="max-h-40 overflow-auto text-sm">
              <li
                v-for="card in preview.slice(0, 100)"
                :key="`${card.board}:${card.name}`"
              >
                {{ card.quantity }} {{ card.name }} —
                {{ card.commander ? 'Commander' : card.board }}
              </li>
            </ul>
            <UButton
              label="Add imported cards"
              :loading="busy"
              :disabled="applied"
              @click="apply"
            />
          </template>
        </template>
        <p v-if="error" role="alert" class="text-error">{{ error }}</p>
        <p v-if="message" role="status">{{ message }}</p>
      </div>
    </template>
  </UModal>
</template>
