<template>
  <UForm :schema="schema" :state="state" class="grow space-y-4" @submit="onSubmit">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <UFormField name="card_name" class="mb-2">
      <div class="flex gap-2">
        <UInputMenu ref="autoComplete" v-model="state.card_name" v-model:search-term="searchTerm" :items="filteredCards"
          placeholder="Enter a card name..." icon="i-mdi-cards-outline" class="flex-1 min-w-0"
          :ui="{ base: 'text-base h-10 truncate' }" @update:model-value="handleCardSelected" />
        <UButton icon="i-mdi-cards-outline" :disabled="state.card_name?.length == 0" type="submit"
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
import { useRoute } from 'vue-router';

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import type { Platform } from '~/utils/platformConfig'
import { refDebounced } from '@vueuse/core';
import Filters from './Filters.vue'
import { useSearchHistory } from '~/composables/useSearchHistory';
import { useCardNames } from '~/composables/useBulkData';

const props = defineProps<{
  platform?: 'arena' | 'mtgo' | 'paper'
}>()

const route = useRoute();
const { getPath, getPlatformFromPath } = useSearchType();
const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

const autoComplete = ref();
const filtersRef = ref<InstanceType<typeof Filters> | null>(null);
defineShortcuts({
  '/': () => {
    autoComplete.value?.inputRef?.focus();
  }
});

const schema = z.object({
  card_name: z.string().min(1, ""),
  filters: CardSearchFiltersSchema.optional(),
})

type Schema = z.output<typeof schema>

const cardNameParam = computed(() => String(route.query.card_name || ''));
import { hasAdvancedFilters } from '~/utils/quickFilters'

const parsedFilters = computed(() => {
  const base: Record<string, any> = { selectedColorFilterOption: 'Match Exactly' as 'Match Exactly' };
  if (props.platform === 'arena') base.isArena = true;
  if (props.platform === 'mtgo') base.isMTGO = true;
  if (props.platform === 'paper') base.isPaper = true;
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return base;
});

const showFilters = ref(hasAdvancedFilters(parsedFilters.value));
function hideFilters() {
  showFilters.value = false;
}

const state = reactive<Schema>({
  card_name: cardNameParam.value || '',
  filters: parsedFilters.value || { 'selectedColorFilterOption': 'Match Exactly' }
})

const searchTerm = ref("");
// Debounced search term for better performance
const debouncedSearchTerm = refDebounced(searchTerm, 150);

// Raw card data from backend bulk data API
const { data: rawCards, status: cardNamesStatus } = useCardNames();
const status = computed(() => cardNamesStatus.value === 'pending' ? 'pending' : 'success');

// Pre-filter cards before passing to UInputMenu
const filteredCards = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (state.card_name) {
      return [state.card_name];
    }
    return [];
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase();
  const filtered = [state.card_name];

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

async function performSearch(cardName: string, filters: Schema['filters']) {
  try {
    filtersRef.value?.collapse();
    const requestFilters = { ...filters } // shallow copy

    // Only modify the copy, NEVER the form state
    if (!filters?.selectedColors || filters?.selectedColors.length === 0) {
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
    saveSearchMutation.mutate({ query: cardName, searchType: 'similarity', filters: requestFilters })

    // Construct query parameters
    const query: Record<string, any> = {
      card_name: cardName,
      filters: requestFilters && Object.keys(requestFilters).length > 0 ? JSON.stringify(requestFilters) : undefined,
      searchType: 'similarity'
    };
    const targetPlatform = detectPlatformFromFilters(requestFilters, currentPlatform.value as Platform);
    router.push({ path: getPath('similarity', targetPlatform), query });
  } catch (error) {
    console.error('Form submission error:', error)
  }
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Bot detection: if honeypot field is filled, reject the submission
  if (honeypot.value) {
    toast.add({
      title: 'Invalid submission',
      color: 'error'
    });
    return;
  }
  await performSearch(event.data.card_name, event.data.filters);
}

function handleCardSelected(value: string) {
  if (!value) return;
  nextTick(() => performSearch(state.card_name, state.filters));
}

// If similarity button is clicked on the similarity page, this will update the card name in the search field
watch(cardNameParam, (newVal) => {
  if (newVal !== state.card_name) {
    state.card_name = newVal;
  }
});
</script>

<style></style>