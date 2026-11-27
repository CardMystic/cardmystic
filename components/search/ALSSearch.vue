<template>
  <UForm
    ref="formRef"
    :schema="schema"
    :state="state"
    class="grow space-y-4"
    @submit="onSubmit"
  >
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input
      v-model="honeypot"
      type="text"
      name="website"
      autocomplete="off"
      tabindex="-1"
      aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px"
    />

    <div class="flex flex-col gap-2">
      <UFormField name="description">
        <div class="flex gap-2 items-start">
          <UInput
            v-model="state.description"
            aria-label="Search query"
            placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations."
            icon="i-lucide-search"
            class="flex-1 min-w-0"
            :ui="{ trailing: 'pe-1', base: 'text-base h-10' }"
          >
            <template v-if="state.description?.length" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Clear input"
                @click="
                  () => {
                    state.description = '';
                  }
                "
              />
            </template>
          </UInput>
          <UButton
            icon="i-lucide-box"
            :disabled="
              (sourceMode === 'select' &&
                !deckbuilderStore.savedDeckReady.value) ||
              (!state.decklist?.trim() && !state.commander?.trim())
            "
            type="submit"
            aria-label="Recommend"
            class="cursor-pointer h-10 shrink-0"
          >
            <span class="hidden sm:inline">Recommend</span>
          </UButton>
        </div>
      </UFormField>

      <div class="flex items-start gap-2">
        <UFormField v-if="sourceMode === 'select'" class="min-w-0 flex-1">
          <USkeleton
            v-if="selectedDeckId && !selectedDeckOption && !deckLoadError"
            class="h-10 w-full rounded-md"
            role="status"
            aria-label="Loading selected deck"
          />
          <AppInputMenu
            v-else
            :model-value="selectedDeckOption?.value"
            @update:model-value="selectSavedDeck($event || '')"
            v-model:search-term="deckSearchTerm"
            :items="deckOptions"
            open-on-click
            value-key="value"
            label-key="label"
            placeholder="Select a decklist..."
            aria-label="Select a decklist"
            class="w-full"
            :ui="{ base: 'text-base h-10' }"
            :loading="decksLoading || deckLoading"
            :ignore-filter="true"
          />
          <p v-if="deckLoadError" class="text-error mt-2">
            Couldn't load this deck. Try selecting it again.
          </p>
        </UFormField>
        <UFormField v-else name="commander" class="min-w-0 flex-1">
          <div class="flex gap-2 items-center">
            <AppInputMenu
              v-model="state.commander"
              @update:model-value="touchSource"
              v-model:search-term="commanderSearchTerm"
              :items="filteredCommanders"
              ignore-filter
              placeholder="Select a commander (optional)..."
              aria-label="Select a commander (optional)"
              icon="i-lucide-crown"
              class="min-w-0 flex-1"
              :ui="{ base: 'text-base h-10' }"
            />
            <UButton
              v-if="state.commander"
              class="cursor-pointer"
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear commander"
              @click="
                () => {
                  state.commander = '';
                  touchSource();
                }
              "
            />
          </div>
        </UFormField>

        <UButton
          v-if="userId"
          type="button"
          variant="link"
          class="h-10 shrink-0 px-1"
          @click="toggleSource"
        >
          {{ sourceMode === 'select' ? 'Manual Entry' : 'Select a Decklist' }}
        </UButton>
      </div>

      <template v-if="sourceMode === 'paste'">
        <UFormField v-if="showPartnerField" name="partnerCommander">
          <div class="flex gap-2 items-center">
            <AppInputMenu
              v-model="state.partnerCommander"
              @update:model-value="touchSource"
              v-model:search-term="partnerSearchTerm"
              :items="filteredPartners"
              ignore-filter
              placeholder="Select a partner commander (optional)..."
              icon="i-lucide-crown"
              class="flex-1"
              :ui="{ base: 'text-base h-10' }"
            />
            <UButton
              v-if="state.partnerCommander"
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear partner commander"
              @click="
                () => {
                  state.partnerCommander = '';
                  touchSource();
                }
              "
            />
          </div>
        </UFormField>

        <UFormField name="decklist">
          <div class="relative">
            <UTextarea
              v-model="state.decklist"
              @update:model-value="touchSource"
              placeholder="Paste your decklist here (one card per line)..."
              :rows="6"
              class="w-full"
              :ui="{ base: 'text-base resize-y min-h-39 max-h-39' }"
              autocomplete="off"
            />
            <UButton
              v-if="onSaveToDeck && hasCards"
              icon="i-lucide-list-plus"
              color="primary"
              variant="soft"
              size="xs"
              :label="`Save ${numCardsInDecklist} cards to Deck`"
              class="absolute bottom-2 right-2 cursor-pointer opacity-80 hover:opacity-100"
              @click="onSaveToDeck"
            />
          </div>
        </UFormField>
      </template>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <SearchFilterDrawer
        ref="filtersRef"
        v-model="state.filters"
        apply-label="Recommend"
        hide-formats
        :quick-filters="['arena', 'mtgo', 'paper']"
        :can-apply="
          (sourceMode !== 'select' || deckbuilderStore.savedDeckReady.value) &&
          !!(state.decklist?.trim() || state.commander?.trim())
        "
        @apply="formRef?.submit()"
      />
      <SearchModeSelect />
    </div>
  </UForm>
</template>

<script lang="ts" setup>
import { colorFilterSettings } from '~/utils/colorFilters';
import { cardNameSuggestions } from '~/utils/cardNameSuggestions';
import * as z from 'zod';
import { useMounted } from '@vueuse/core';
import { useRoute } from 'vue-router';
import { refDebounced } from '~/utils/refDebounced';
import { parseDecklist } from '~/utils/decklist';

const MAX_DECK_SIZE = 200;
import { useCommanders, usePartnerCommanders } from '~/composables/useBulkData';
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import { useSearchPageDefaults } from '~/composables/useSearchPageDefaults';
import type { Platform } from '~/utils/platformConfig';
import { useDeckbuilder } from '~/composables/useDeckbuilder';
import SearchFilterDrawer from './SearchFilterDrawer.vue';
import {
  useMyDecklistsSearch,
  useOwnedDecklist,
  useCardLists,
} from '~/composables/useCardLists';
import { useCardsByOracleIds } from '~/composables/useCards';
import type { ScryfallCard } from '~/models/cardModel';
import type { AlsRecommendRequest } from '~/composables/useAlsRecommend';

const props = defineProps<{
  platform?: 'arena' | 'mtgo' | 'paper';
  embeddedCommander?: string;
}>();
const emit = defineEmits<{
  recommend: [request: AlsRecommendRequest];
  initializing: [value: boolean];
}>();

const deckbuilderStore = useDeckbuilder();

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui';

const { getPath, getPlatformFromPath } = useSearchType();

const formRef = useTemplateRef('formRef');
const filtersRef = ref<InstanceType<typeof SearchFilterDrawer> | null>(null);

const schema = z.object({
  description: z.string().optional(),
  commander: z.string().optional(),
  partnerCommander: z.string().optional(),
  decklist: z
    .string()
    .optional()
    .refine(
      (val) => !val?.trim() || parseDecklist(val).length <= MAX_DECK_SIZE,
      { message: `Decklist exceeds the maximum of ${MAX_DECK_SIZE} cards.` },
    ),
  filters: CardSearchFiltersSchema.optional(),
});

type Schema = z.output<typeof schema>;

const route = useRoute();
const pageDefaults = useSearchPageDefaults();

const isOnDeckbuilderPage = computed(() => route.path.includes('/deckbuilder'));
const onSaveToDeck = computed(() =>
  isOnDeckbuilderPage.value
    ? () => {
        deckbuilderStore.showSaveAllModal.value = true;
      }
    : null,
);

const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

const numCardsInDecklist: Ref<number> = computed(() => {
  if (!state.decklist) return 0;
  try {
    return parseDecklist(state.decklist).length;
  } catch {
    return 0;
  }
});
const decklistParam = computed(() => String(route.query.decklist || ''));
const descriptionParam = computed(() => String(route.query.description || ''));
const commanderParam = computed(() =>
  String(
    props.embeddedCommander ??
      pageDefaults?.query ??
      route.query.commander ??
      '',
  ),
);
const partnerCommanderParam = computed(() =>
  String(route.query.partnerCommander || ''),
);

const parsedFilters = computed(() => {
  const base: Record<string, unknown> = {
    selectedColorFilterOption: 'Contains At Most' as const,
    selectedColorField: 'Color Identity' as const,
  };
  if (props.platform === 'arena') base.isArena = true;
  if (props.platform === 'mtgo') base.isMTGO = true;
  if (props.platform === 'paper') base.isPaper = true;
  if (pageDefaults) {
    return CardSearchFiltersSchema.parse({
      ...base,
      ...pageDefaults.filters.value,
      ...colorFilterSettings(pageDefaults.filters.value),
    });
  }
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(
      JSON.parse(String(route.query.filters)),
    );
  }
  return CardSearchFiltersSchema.parse(base);
});

const state = reactive<Partial<Schema>>({
  description: descriptionParam.value || '',
  commander: commanderParam.value || '',
  partnerCommander: partnerCommanderParam.value || '',
  decklist: decklistParam.value || '',
  filters: parsedFilters.value || {
    selectedColorFilterOption: 'Contains At Most' as const,
    selectedColorField: 'Color Identity' as const,
  },
});

const { userProfile } = useUserProfile();
const mounted = useMounted();
const userId = computed(() =>
  mounted.value ? userProfile.value?.id : undefined,
);
const sourceMode = ref<'select' | 'paste'>(
  !props.embeddedCommander && route.query.deckId ? 'select' : 'paste',
);
const { selectedDeckId } = deckbuilderStore;
selectedDeckId.value = props.embeddedCommander
  ? ''
  : String(route.query.deckId || '');
const latestCommanderDeck = useLatestCommanderDeck(
  () => props.embeddedCommander,
);
if (props.embeddedCommander)
  deckbuilderStore.decklist.value = state.decklist || '';
const sourceTouched = ref(false);
const autoSearchPending = ref(!!props.embeddedCommander);
let defaultApplied = false;
function touchSource() {
  sourceTouched.value = true;
  autoSearchPending.value = false;
}
function selectSavedDeck(id: string) {
  touchSource();
  selectedDeckId.value = id;
}
function toggleSource() {
  touchSource();
  sourceMode.value = sourceMode.value === 'select' ? 'paste' : 'select';
  if (props.embeddedCommander && sourceMode.value === 'paste') {
    state.commander = props.embeddedCommander;
    state.partnerCommander = '';
    state.decklist = '';
  }
}
const deckSearchTerm = ref('');
const { decklists: savedDecks, isLoading: decksLoading } = useMyDecklistsSearch(
  refDebounced(deckSearchTerm, 250),
);
const activeDeckId = computed(() =>
  sourceMode.value === 'select' && userId.value ? selectedDeckId.value : '',
);
const {
  decklist: ownedDeck,
  isLoading: deckLoading,
  error: deckError,
} = useOwnedDecklist(activeDeckId);
const { useListItems } = useCardLists();
const {
  data: deckItems,
  isFetching: itemsLoading,
  error: itemsError,
} = useListItems(
  computed(() =>
    ownedDeck.value?.id === activeDeckId.value ? activeDeckId.value : '',
  ),
);
const deckOracleIds = computed(() =>
  (deckItems.value ?? [])
    .filter((item) => (item.board ?? 'Mainboard') === 'Mainboard')
    .map((item) => item.oracle_id)
    .filter((id): id is string => !!id),
);
const {
  cards: savedCards,
  isLoading: cardsLoading,
  error: cardsError,
} = useCardsByOracleIds(deckOracleIds);
const deckLoadError = computed(
  () =>
    deckError.value ||
    itemsError.value ||
    cardsError.value ||
    (activeDeckId.value && !deckLoading.value && !ownedDeck.value),
);
watch(
  () => autoSearchPending.value && !deckLoadError.value,
  (pending) => emit('initializing', pending),
  { immediate: true },
);
const deckOptions = computed(() => {
  const decks = [...savedDecks.value];
  if (ownedDeck.value && !decks.some((deck) => deck.id === ownedDeck.value?.id))
    decks.unshift(ownedDeck.value);
  return decks.map((deck) => ({
    label: deck.name || 'Untitled deck',
    value: deck.id,
  }));
});
const selectedDeckOption = computed(() =>
  deckOptions.value.find((deck) => deck.value === selectedDeckId.value),
);
watch(
  [
    sourceMode,
    activeDeckId,
    ownedDeck,
    deckItems,
    savedCards,
    itemsLoading,
    cardsLoading,
  ],
  () => {
    deckbuilderStore.savedDeckReady.value = false;
    if (sourceMode.value !== 'select') return;
    state.decklist = '';
    state.commander = '';
    state.partnerCommander = '';
    if (
      !activeDeckId.value ||
      !ownedDeck.value ||
      itemsLoading.value ||
      cardsLoading.value ||
      !deckItems.value ||
      deckLoadError.value
    )
      return;
    const cards = (savedCards.value ?? []) as ScryfallCard[];
    if (
      deckOracleIds.value.some(
        (id) => !cards.some((card) => card.oracle_id === id),
      )
    )
      return;
    state.decklist = cards.map((card) => card.name).join('\n');
    const commanders = deckItems.value
      .filter((item) => item.is_commander)
      .map(
        (item) => cards.find((card) => card.oracle_id === item.oracle_id)?.name,
      )
      .filter(Boolean);
    state.commander = commanders[0] || '';
    state.partnerCommander = commanders[1] || '';
    deckbuilderStore.savedDeckReady.value = true;
  },
  { immediate: true },
);
watch(sourceMode, (mode) => {
  if (mode === 'paste') selectedDeckId.value = '';
});
watch(userId, (id, previous) => {
  if (id === previous) return;
  if (props.embeddedCommander) {
    // A late initial session response must not discard an edited manual source.
    if (!previous && id && sourceTouched.value) return;
    defaultApplied = false;
    sourceTouched.value = false;
    autoSearchPending.value = true;
    selectedDeckId.value = '';
    sourceMode.value = 'paste';
    state.commander = props.embeddedCommander;
    state.partnerCommander = '';
    state.decklist = '';
    return;
  }
  if (id && route.query.deckId) {
    selectedDeckId.value = String(route.query.deckId);
    sourceMode.value = 'select';
    return;
  }
  selectedDeckId.value = '';
  sourceMode.value =
    id && !route.query.decklist && !route.query.commander && !pageDefaults
      ? 'select'
      : 'paste';
});
watch(
  () => route.query.deckId,
  (id) => {
    if (props.embeddedCommander) return;
    selectedDeckId.value = String(id || '');
    sourceMode.value = id ? 'select' : 'paste';
  },
);
watch(deckbuilderStore.rerun, () => {
  if (sourceMode.value !== 'select' || !deckbuilderStore.savedDeckReady.value)
    return;
  const parsed = schema.safeParse(state);
  if (!parsed.success) {
    toast.add({
      title: 'Cannot run recommendations',
      description: parsed.error.issues[0]?.message,
      color: 'error',
    });
    return;
  }
  void onSubmit({ data: parsed.data } as FormSubmitEvent<Schema>);
});

const hasCards = computed(
  () => !!state.decklist?.trim() || !!state.commander?.trim(),
);

// Two-way sync between local textarea state and the deckbuilder store
watch(
  () => deckbuilderStore.decklist.value,
  (newVal) => {
    if (newVal !== state.decklist) state.decklist = newVal;
  },
);
watch(
  () => state.decklist,
  (newVal) => {
    if (newVal !== undefined && newVal !== deckbuilderStore.decklist.value)
      deckbuilderStore.decklist.value = newVal;
  },
);

// Commander autocomplete
const commanderSearchTerm = ref('');
const debouncedCommanderSearch = refDebounced(commanderSearchTerm, 150);

const { data: rawCommanders } = useCommanders();
const { data: partnerCommanders } = usePartnerCommanders();

const filteredCommanders = computed(() =>
  cardNameSuggestions(
    rawCommanders.value ?? [],
    debouncedCommanderSearch.value,
    state.commander,
  ),
);

// Partner commander logic
const partnerSearchTerm = ref('');
const debouncedPartnerSearch = refDebounced(partnerSearchTerm, 150);

const selectedCommanderPartnerType = computed(() => {
  if (!state.commander || !partnerCommanders.value) return null;
  return getPartnerType(state.commander, partnerCommanders.value);
});

const showPartnerField = computed(() => !!selectedCommanderPartnerType.value);

const validPartnerList = computed(() => {
  if (!partnerCommanders.value || !selectedCommanderPartnerType.value)
    return [];
  return getValidPartners(
    selectedCommanderPartnerType.value,
    partnerCommanders.value,
    state.commander,
  );
});

const filteredPartners = computed(() =>
  cardNameSuggestions(
    validPartnerList.value,
    debouncedPartnerSearch.value,
    state.partnerCommander,
    state.commander,
  ),
);

// Clear partner when commander changes
watch(
  () => state.commander,
  () => {
    if (sourceMode.value === 'paste') state.partnerCommander = '';
    partnerSearchTerm.value = '';
  },
);

// Honeypot field for bot detection
const honeypot = ref('');

const toast = useToast();
const { saveSearchMutation } = useSearchHistory();
watch(
  [
    latestCommanderDeck.pending,
    latestCommanderDeck.deck,
    deckbuilderStore.savedDeckReady,
    mounted,
    deckLoadError,
  ],
  () => {
    if (
      !props.embeddedCommander ||
      !mounted.value ||
      latestCommanderDeck.pending.value
    )
      return;
    if (!defaultApplied && !sourceTouched.value) {
      defaultApplied = true;
      if (latestCommanderDeck.deck.value) {
        selectedDeckId.value = latestCommanderDeck.deck.value.id;
        sourceMode.value = 'select';
        return;
      }
    }
    if (
      !autoSearchPending.value ||
      deckLoadError.value ||
      (sourceMode.value === 'select' && !deckbuilderStore.savedDeckReady.value)
    )
      return;
    autoSearchPending.value = false;
    const parsed = schema.safeParse(state);
    if (parsed.success)
      void onSubmit({ data: parsed.data } as FormSubmitEvent<Schema>, true);
  },
  { flush: 'post' },
);

async function onSubmit(event: FormSubmitEvent<Schema>, automatic = false) {
  // Bot detection: if honeypot field is filled, reject the submission
  if (honeypot.value) {
    toast.add({
      title: 'Invalid submission',
      color: 'error',
    });
    return;
  }

  if (sourceMode.value === 'select' && !deckbuilderStore.savedDeckReady.value)
    return;

  try {
    const requestFilters = { ...event.data.filters }; // shallow copy

    // Only modify the copy, NEVER the form state
    if (
      !event.data.filters?.selectedColors ||
      event.data.filters?.selectedColors.length === 0
    ) {
      delete requestFilters.selectedColors;
      delete requestFilters.selectedColorFilterOption;
      delete requestFilters.selectedColorField;
    }

    // Remove undefined/null/empty values from filters
    Object.keys(requestFilters).forEach((key) => {
      const value = requestFilters[key as keyof typeof requestFilters];
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete requestFilters[key as keyof typeof requestFilters];
      }
    });

    if (props.embeddedCommander) {
      if (!automatic) touchSource();
      emit('recommend', {
        cards: parseDecklist(event.data.decklist || ''),
        commanders: [event.data.commander, event.data.partnerCommander].filter(
          (value): value is string => !!value,
        ),
        limit: 200,
        query: event.data.description?.trim() || undefined,
        filters: requestFilters,
        useRerank: route.query.useRerank !== 'false',
      });
      filtersRef.value?.collapse();
      return;
    }

    const query: Record<string, string | number | undefined> = {
      useRerank: String(route.query.useRerank !== 'false'),
      deckId: sourceMode.value === 'select' ? selectedDeckId.value : undefined,
      decklist: event.data.decklist,
      description: event.data.description || undefined,
      commander: event.data.commander || undefined,
      partnerCommander: event.data.partnerCommander || undefined,
      limit: 200,
      filters:
        requestFilters && Object.keys(requestFilters).length > 0
          ? JSON.stringify(requestFilters)
          : undefined,
      searchType: 'recommend',
    };

    saveSearchMutation.mutate({
      query: event.data.description || '',
      searchType: 'recommend',
      filters: {
        ...requestFilters,
        commander: event.data.commander || undefined,
        partnerCommander: event.data.partnerCommander || undefined,
        decklist: event.data.decklist || undefined,
        limit: 200,
      },
    });

    filtersRef.value?.collapse();
    const targetPlatform = detectPlatformFromFilters(
      requestFilters,
      currentPlatform.value as Platform,
    );
    router.push({ path: getPath('recommend', targetPlatform), query });
  } catch (error) {
    console.error('Form submission error:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to submit form',
      color: 'error',
    });
  }
}

// Keep input in sync if navigating back with query params. For example, when user clicks recommend from deck list page
watch(decklistParam, (newVal) => {
  if (newVal !== state.decklist) {
    state.decklist = newVal;
  }
});
watch(descriptionParam, (newVal) => {
  if (newVal !== state.description) {
    state.description = newVal;
  }
});
watch(commanderParam, (newVal) => {
  if (newVal !== state.commander) {
    state.commander = newVal;
  }
});
watch(partnerCommanderParam, (newVal) => {
  if (newVal !== state.partnerCommander) {
    state.partnerCommander = newVal;
  }
});
</script>
