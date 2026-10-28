<template>
  <UForm
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

    <UFormField name="query" class="mb-2">
      <div class="flex gap-2">
        <div class="relative flex-1 min-w-0">
          <UInput
            ref="input"
            v-model="state.query"
            placeholder="Describe the cards you want..."
            icon="i-lucide-brain"
            class="w-full"
            role="combobox"
            aria-label="Smart search"
            aria-autocomplete="list"
            :aria-expanded="suggestionsOpen"
            :aria-controls="suggestionListId"
            :aria-activedescendant="
              activeSuggestion >= 0 && suggestionsOpen
                ? `${suggestionListId}-${activeSuggestion}`
                : undefined
            "
            autocomplete="off"
            @focus="suggestionsFocused = true"
            @blur="closeSuggestions"
            @keydown="onSuggestionKeydown"
            :ui="{ trailing: 'pe-1', base: 'text-base h-10' }"
          >
            <template v-if="state.query?.length" #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Clear input"
                @click="
                  () => {
                    state.query = '';
                  }
                "
              />
            </template>
          </UInput>
          <ul
            v-if="suggestionsOpen"
            :id="suggestionListId"
            role="listbox"
            aria-label="Popular search suggestions"
            class="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-default bg-default p-1 shadow-lg"
          >
            <li
              v-for="(suggestion, index) in suggestions"
              :key="suggestion"
              role="presentation"
            >
              <button
                :id="`${suggestionListId}-${index}`"
                type="button"
                role="option"
                tabindex="-1"
                :aria-selected="activeSuggestion === index"
                :class="[
                  'block w-full rounded px-3 py-2 text-left text-sm text-default hover:bg-elevated',
                  { 'bg-elevated': activeSuggestion === index },
                ]"
                @mousedown.prevent
                @click="selectSuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </li>
          </ul>
        </div>
        <UButton
          icon="i-lucide-brain"
          :disabled="state.query?.length == 0"
          type="submit"
          class="cursor-pointer h-10"
          aria-label="Search"
        >
          <span class="hidden sm:inline">Search</span>
        </UButton>
      </div>
    </UFormField>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <QuickFilters v-model="state.filters" />
      <SearchModeSelect />
    </div>

    <SuggestedSearches v-if="showSuggestedSearches" />

    <Filters
      v-if="!showFilters"
      ref="filtersRef"
      v-model="state.filters"
      hide-controls
    />

    <div v-if="!showFilters" class="flex justify-center">
      <UTooltip text="Filter results by colors, types, rarities, and more">
        <UButton
          class="cursor-pointer"
          @click="
            () => {
              showFilters = true;
            }
          "
          variant="ghost"
          size="sm"
          icon="i-lucide-sliders-horizontal"
          aria-label="Show advanced search filters"
        >
          Show Advanced Filters
        </UButton>
      </UTooltip>
    </div>

    <UCard v-if="showFilters">
      <UFormField name="filters">
        <Filters ref="filtersRef" v-model="state.filters" />
      </UFormField>
      <template #footer>
        <div class="flex items-center justify-center">
          <UButton
            class="cursor-pointer"
            @click="hideFilters"
            variant="ghost"
            size="sm"
            icon="i-lucide-eye-off"
            color="neutral"
          >
            Hide Advanced Filters
          </UButton>
        </div>
      </template>
    </UCard>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod';
import { searchSuggestions } from '~/utils/searchSuggestions';
import { usePopularQueries } from '~/composables/usePopularQueries';
import { useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const pageDefaults = useSearchPageDefaults();
import type { FormSubmitEvent } from '@nuxt/ui';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import { useSearchPageDefaults } from '~/composables/useSearchPageDefaults';
import type { Platform } from '~/utils/platformConfig';
import Filters from './Filters.vue';

const props = defineProps<{
  platform?: 'arena' | 'mtgo' | 'paper';
  /** Show the curated "Suggested Searches" pills (home hero only). */
  showSuggestedSearches?: boolean;
}>();

const { getPath, getPlatformFromPath } = useSearchType();
const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

const input = ref();
const filtersRef = ref<InstanceType<typeof Filters> | null>(null);
defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus();
  },
});
const schema = z.object({
  query: z.string().min(1, ''),
  filters: CardSearchFiltersSchema.optional(),
});
// Honeypot field for bot detection
const honeypot = ref('');

const toast = useToast();
const { saveSearchMutation } = useSearchHistory();

type Schema = z.output<typeof schema>;

const queryParam = computed(() =>
  String(pageDefaults?.query ?? route.query.query ?? ''),
);
import { hasAdvancedFilters } from '~/utils/quickFilters';

const parsedFilters = computed(() => {
  const base: Record<string, unknown> = {
    selectedColorFilterOption: 'Match Exactly' as const,
  };
  if (props.platform === 'arena') base.isArena = true;
  if (props.platform === 'mtgo') base.isMTGO = true;
  if (props.platform === 'paper') base.isPaper = true;
  if (pageDefaults) {
    return CardSearchFiltersSchema.parse({
      ...base,
      ...pageDefaults.filters.value,
    });
  }
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(
      JSON.parse(String(route.query.filters)),
    );
  }
  return CardSearchFiltersSchema.parse(base);
});

const showFilters = ref(hasAdvancedFilters(parsedFilters.value));
function hideFilters() {
  showFilters.value = false;
}

const state = reactive<Partial<Schema>>({
  query: queryParam.value || '',
  filters: parsedFilters.value || {
    selectedColorFilterOption: 'Match Exactly',
  },
});

const { popularQueries } = usePopularQueries();
const suggestionListId = `smart-suggestions-${useId()}`;
const suggestionsFocused = ref(false);
const suggestionsDismissed = ref(false);
const activeSuggestion = ref(-1);
const suggestions = computed(() =>
  searchSuggestions(popularQueries.value ?? [], state.query ?? ''),
);
const suggestionsOpen = computed(
  () =>
    suggestionsFocused.value &&
    !suggestionsDismissed.value &&
    suggestions.value.length > 0,
);
watch(
  () => state.query,
  () => {
    activeSuggestion.value = -1;
    suggestionsDismissed.value = false;
  },
  { flush: 'sync' },
);
function closeSuggestions() {
  suggestionsFocused.value = false;
  activeSuggestion.value = -1;
}
function selectSuggestion(query: string) {
  state.query = query;
  suggestionsDismissed.value = true;
  activeSuggestion.value = -1;
}
function onSuggestionKeydown(event: KeyboardEvent) {
  if (event.isComposing) return;
  if (event.key === 'Escape') {
    suggestionsDismissed.value = true;
    activeSuggestion.value = -1;
    return;
  }
  if (!suggestionsOpen.value) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    activeSuggestion.value =
      activeSuggestion.value < 0
        ? direction === 1
          ? 0
          : suggestions.value.length - 1
        : (activeSuggestion.value + direction + suggestions.value.length) %
          suggestions.value.length;
  } else if (event.key === 'Enter' && activeSuggestion.value >= 0) {
    event.preventDefault();
    selectSuggestion(suggestions.value[activeSuggestion.value]);
  }
}

watch(queryParam, (newVal) => {
  if (newVal !== state.query) state.query = newVal;
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Bot detection: if honeypot field is filled, reject the submission
  if (honeypot.value) {
    toast.add({
      title: 'Invalid submission',
      color: 'error',
    });
    return;
  }

  try {
    const requestFilters = { ...event.data.filters }; // shallow copy

    // Only modify the copy, NEVER the form state
    if (
      !event.data.filters?.selectedColors ||
      event.data.filters?.selectedColors.length === 0
    ) {
      delete requestFilters.selectedColors;
      delete requestFilters.selectedColorFilterOption;
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

    // Save to search history
    saveSearchMutation.mutate({
      query: event.data.query,
      searchType: 'smart',
      filters: requestFilters,
    });

    // Construct query parameters
    const query: Record<string, string | undefined> = {
      query: event.data.query,
      filters:
        requestFilters && Object.keys(requestFilters).length > 0
          ? JSON.stringify(requestFilters)
          : undefined,
      searchType: 'smart',
      useRerank: String(route.query.useRerank !== 'false'),
    };
    filtersRef.value?.collapse();
    const targetPlatform = detectPlatformFromFilters(
      requestFilters,
      currentPlatform.value as Platform,
    );
    router.push({ path: getPath('smart', targetPlatform), query });
  } catch (error) {
    console.error('Form submission error:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to submit form',
      color: 'error',
    });
  }
}
</script>

<style></style>
