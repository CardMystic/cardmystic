<script setup lang="ts">
import type { ScryfallCard } from '~/models/cardModel';
import {
  highlightColors,
  highlightTypes,
  type DeckHighlightMode,
} from '~/utils/deckHighlight';
const props = defineProps<{ cards: ScryfallCard[] }>();
const mode = defineModel<DeckHighlightMode>('mode', { default: 'none' });
const target = defineModel<string>('target', { default: '' });
const targetLabel = computed(() =>
  mode.value === 'color'
    ? 'Color'
    : mode.value === 'type'
      ? 'Card type'
      : 'Mana value',
);
const targets = computed(() => {
  if (mode.value === 'color') return highlightColors;
  if (mode.value === 'type')
    return highlightTypes.map((value) => ({ label: value, value }));
  return [...new Set(props.cards.map((card) => Math.max(0, card.cmc ?? 0)))]
    .sort((a, b) => a - b)
    .map((value) => ({ label: String(value), value: String(value) }));
});
watch(mode, () => {
  target.value = '';
});
const emit = defineEmits<{
  ownership: [quantities: Record<string, number> | null];
}>();
const api = useLibraryApi();
const route = useRoute();
const page = ref(1);
const options = ref({
  kind: 'collection' as const,
  folder: '',
  sort: 'name',
  direction: 'asc',
});
const {
  decklists,
  totalCount,
  totalPages,
  isFetching,
  error: collectionsError,
  refetch,
} = useMyDecklists(
  page,
  50,
  options,
  () => mode.value === 'owned' && !!api.userId.value,
);
const selected = ref('');
const loading = ref(false);
const error = ref('');
const modes = [
  { label: 'None', value: 'none' },
  { label: 'Owned in a collection', value: 'owned' },
  { label: 'Color', value: 'color' },
  { label: 'Mana value', value: 'manaValue' },
  { label: 'Card type', value: 'type' },
];
function selectMode(value: DeckHighlightMode) {
  if (value === 'owned' && !api.userId.value)
    return navigateTo({
      path: '/user/login',
      query: { redirect: route.fullPath },
    });
  mode.value = value;
}
let sequence = 0;
watch([mode, selected, api.userId], async () => {
  const current = ++sequence;
  emit('ownership', null);
  loading.value = false;
  error.value = '';
  if (mode.value !== 'owned') return;
  if (!api.userId.value) {
    mode.value = 'none';
    return;
  }
  if (!selected.value) return;
  loading.value = true;
  try {
    const result = await api.request<{ quantities: Record<string, number> }>(
      `/collections/${selected.value}/ownership`,
    );
    if (current === sequence) emit('ownership', result.quantities);
  } catch (cause) {
    if (current === sequence) error.value = (cause as Error).message;
  } finally {
    if (current === sequence) loading.value = false;
  }
});
watch(api.userId, () => {
  selected.value = '';
  page.value = 1;
});
onBeforeUnmount(() => sequence++);
</script>
<template>
  <UPopover>
    <UButton
      aria-label="Highlight"
      title="Highlight"
      icon="i-lucide-highlighter"
      :color="mode === 'none' ? 'neutral' : 'primary'"
      variant="ghost"
      :aria-pressed="mode !== 'none'"
    />
    <template #content>
      <div class="p-3 space-y-3 w-80 max-w-[calc(100vw-2rem)]">
        <UFormField label="Highlight by">
          <USelect
            :model-value="mode"
            :items="modes"
            aria-label="Highlight by"
            class="w-full"
            @update:model-value="selectMode"
          />
        </UFormField>
        <template v-if="mode === 'owned'">
          <UFormField label="Collection">
            <USelect
              v-model="selected"
              :items="
                decklists.map((list) => ({
                  label: list.name || 'Untitled collection',
                  value: list.id,
                }))
              "
              :loading="isFetching || loading"
              placeholder="Choose a collection"
              aria-label="Ownership collection"
              class="w-full"
            />
          </UFormField>
          <UPagination
            v-if="totalPages > 1"
            v-model:page="page"
            :total="totalCount"
            :items-per-page="50"
            size="xs"
            aria-label="Collection choices"
          />
          <p class="text-xs text-muted">
            Green: own enough copies · Yellow: own some · Red: not owned. This
            does not reserve cards for this deck.
          </p>
          <p
            v-if="!decklists.length && !isFetching && !collectionsError"
            class="text-sm"
          >
            Create a collection on Your Decks to track the cards you own.
          </p>
          <p v-if="collectionsError" role="alert" class="text-sm text-error">
            Could not load your collections.
            <UButton label="Retry" variant="link" @click="refetch()" />
          </p>
          <p v-if="error" role="alert" class="text-error text-sm">
            {{ error }}
          </p>
        </template>
        <template v-else-if="mode !== 'none'">
          <UFormField :label="targetLabel">
            <USelect
              v-model="target"
              :items="targets"
              :aria-label="`Highlight ${targetLabel.toLowerCase()}`"
              :placeholder="`Choose a ${targetLabel.toLowerCase()}`"
              class="w-full"
            />
          </UFormField>
          <p v-if="mode === 'color'" class="text-xs text-muted">
            Includes multicolor cards with that color. Uses the front face for
            double-faced cards.
          </p>
        </template>
        <UButton
          v-if="mode !== 'none'"
          label="Clear highlights"
          color="neutral"
          variant="ghost"
          @click="mode = 'none'"
        />
      </div>
    </template>
  </UPopover>
</template>
