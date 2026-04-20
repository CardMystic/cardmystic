<template>
  <UForm :schema="schema" :state="state" class="grow space-y-4" @submit="onSubmit">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <UFormField name="query" class="mb-2">
      <div class="flex gap-2 w-full">
        <UInputMenu ref="input" v-model="state.query" v-model:search-term="searchTerm" :items="filteredSuggestions"
          placeholder="Search cards by keywords…" icon="i-lucide-whole-word" class="flex-1"
          :ui="{ base: 'text-base h-10' }" />
        <UButton icon="i-lucide-whole-word" :disabled="state.query?.length == 0" type="submit"
          class="h-10 cursor-pointer">
          <span class="hidden sm:inline">Search</span>
        </UButton>
      </div>
    </UFormField>

    <QuickFilters v-model="state.filters" />

    <Filters v-if="!showFilters" ref="filtersRef" v-model="state.filters" hide-controls />

    <div v-if="!showFilters" class="flex justify-center">
      <UTooltip text="Filter results by colors, types, rarities, and more">
        <UButton class="cursor-pointer" @click="showFilters = true" variant="ghost" size="sm"
          icon="i-lucide-sliders-horizontal" aria-label="Show advanced search filters">
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
          <UButton class="cursor-pointer" @click="hideFilters" variant="ghost" size="sm" icon="i-lucide-eye-off"
            color="neutral">
            Hide Advanced Filters
          </UButton>
        </div>
      </template>
    </UCard>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router'

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import type { Platform } from '~/utils/platformConfig'
import { refDebounced } from '@vueuse/core'
import Filters from './Filters.vue'
import { useCardNames } from '~/composables/useBulkData'

const { getPath, getPlatformFromPath } = useSearchType();

const input = ref();
const filtersRef = ref<InstanceType<typeof Filters> | null>(null);

defineShortcuts({
  '/': () => input.value?.inputRef?.focus()
});

const schema = z.object({
  query: z.string().min(1, ""),
  filters: CardSearchFiltersSchema.optional()
})

type Schema = z.output<typeof schema>

const route = useRoute();

const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

const queryParam = computed(() => String(route.query.query || ''));
import { hasAdvancedFilters } from '~/utils/quickFilters'

const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)))
  }
  return { selectedColorFilterOption: 'Match Exactly' as const }
})

const showFilters = ref(hasAdvancedFilters(parsedFilters.value));
function hideFilters() {
  showFilters.value = false;
}

const state = reactive<Partial<Schema>>({
  query: queryParam.value,
  filters: parsedFilters.value
})

watch(queryParam, (newVal) => {
  if (newVal !== state.query) state.query = newVal;
});

const searchTerm = ref("");
// Debounced search term for better performance
const debouncedSearchTerm = refDebounced(searchTerm, 150);

// Raw card data from backend bulk data API
const { data: rawCards, status: cardNamesStatus } = useCardNames();
const status = computed(() => cardNamesStatus.value === 'pending' ? 'pending' : 'success');

// Pre-filter cards before passing to UInputMenu
const filteredSuggestions = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (state.query) {
      return [state.query as string];
    }
    return [];
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase();
  const filtered: string[] = [];

  if (state.query) {
    filtered.push(state.query as string);
  }

  // Only process first 100 matches for performance
  const cards = rawCards.value ?? [];
  for (let i = 0; i < cards.length && filtered.length < 100; i++) {
    const card = cards[i];
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card);
    }
  }

  return filtered;
});

// Honeypot field for bot detection
const honeypot = ref('')

const toast = useToast()
const { saveSearchMutation } = useSearchHistory()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  filtersRef.value?.collapse();
  // Bot detection: if honeypot field is filled, reject the submission
  if (honeypot.value) {
    toast.add({
      title: 'Invalid submission',
      color: 'error'
    });
    return;
  }

  try {
    const requestFilters = { ...event.data.filters } // shallow copy

    // Only modify the copy, NEVER the form state
    if (!event.data.filters?.selectedColors || event.data.filters?.selectedColors.length === 0) {
      delete requestFilters.selectedColors
      delete requestFilters.selectedColorFilterOption
    }

    // Remove undefined/null/empty values from filters
    Object.keys(requestFilters).forEach(key => {
      const value = requestFilters[key as keyof typeof requestFilters];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        delete requestFilters[key as keyof typeof requestFilters];
      }
    });

    // Save to search history
    saveSearchMutation.mutate({ query: event.data.query, searchType: 'keyword', filters: requestFilters })

    const query: Record<string, any> = {
      query: event.data.query,
      filters: Object.keys(requestFilters).length > 0
        ? JSON.stringify(requestFilters)
        : undefined,
      searchType: 'keyword',
      limit: 100
    }

    const targetPlatform = detectPlatformFromFilters(requestFilters, currentPlatform.value as Platform);
    router.push({ path: getPath('keyword', targetPlatform), query })
  } catch (error) {
    console.error('Form submission error:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to submit form',
      color: 'error'
    })
  }
}
</script>
