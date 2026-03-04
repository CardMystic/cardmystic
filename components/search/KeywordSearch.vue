<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <UFormField name="query" class="mb-2">
      <div class="flex gap-2 w-full">
        <div ref="autocompleteContainer" class="flex-1 relative">
          <UInput ref="input" v-model="state.query" @input="handleInput" @focus="showDropdown = true"
            @keydown="handleKeydown" placeholder="Search cards by keywords…" icon="i-lucide-search"
            :ui="{ trailing: 'pe-1', base: 'text-base h-10' }" class="w-full" />
          <div v-if="showDropdown && searchTerm.length >= 2 && filteredSuggestions.length > 0"
            class="text-left absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
            <div v-for="(suggestion, index) in filteredSuggestions" :key="suggestion"
              @click="selectSuggestion(suggestion)"
              :class="['text-base px-3 py-2 cursor-pointer', index === selectedIndex ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800']">
              {{ suggestion }}
            </div>
          </div>
        </div>
        <UButton :disabled="state.query?.length == 0" type="submit" class="h-10 cursor-pointer">
          Submit
        </UButton>
      </div>
    </UFormField>

    <div v-if="!showFilters" class="flex justify-center">
      <UTooltip text="Filter results by colors, types, rarities, and more">
        <UButton @click="showFilters = true" variant="ghost" size="sm" icon="i-lucide-sliders-horizontal"
          aria-label="Show advanced search filters">
          Show Advanced Filters
        </UButton>
      </UTooltip>
    </div>

    <UFormField v-if="showFilters" name="filters">
      <Filters ref="filtersRef" v-model="state.filters" />
    </UFormField>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router'

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import { refDebounced } from '@vueuse/core'
import Filters from './Filters.vue'

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

const queryParam = computed(() => String(route.query.query || ''));
const showFilters = ref(route.query.filters ? true : false); // We show filters automatically if there are filters in the URL
const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)))
  }
  return { selectedColorFilterOption: 'Contains At Least' as const }
})

const state = reactive<Partial<Schema>>({
  query: queryParam.value,
  filters: parsedFilters.value
})

const searchTerm = ref("");
const showDropdown = ref(false);
const selectedIndex = ref(-1);
const autocompleteContainer = ref<HTMLElement | null>(null);
// Debounced search term for better performance
const debouncedSearchTerm = refDebounced(searchTerm, 150);

// Raw card data - keep as simple array for performance
const { data: rawCards, status } = await useFetch('/card-names.min.json', {
  key: 'autocomplete-cards-keyword',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
});

// Pre-filter cards before passing to USelectMenu
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
  for (let i = 0; i < rawCards.value.length && filtered.length < 100; i++) {
    const card = rawCards.value[i];
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

function handleInput(event: Event) {
  searchTerm.value = (event.target as HTMLInputElement).value;
  showDropdown.value = true;
  selectedIndex.value = -1;
}

function selectSuggestion(suggestion: string) {
  state.query = suggestion;
  searchTerm.value = suggestion;
  showDropdown.value = false;
  selectedIndex.value = -1;
}

function handleKeydown(event: KeyboardEvent) {
  if (!showDropdown.value || filteredSuggestions.value.length === 0) {
    if (event.key === 'ArrowDown') {
      showDropdown.value = true;
    }
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredSuggestions.value.length - 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case 'Enter':
      if (selectedIndex.value >= 0 && selectedIndex.value < filteredSuggestions.value.length) {
        event.preventDefault();
        selectSuggestion(filteredSuggestions.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      event.preventDefault();
      showDropdown.value = false;
      selectedIndex.value = -1;
      break;
  }
}

// Click outside to close dropdown
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (autocompleteContainer.value && !autocompleteContainer.value.contains(event.target as Node)) {
      showDropdown.value = false;
      selectedIndex.value = -1;
    }
  };
  document.addEventListener('click', handleClickOutside);
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});

// Watch selected index and scroll into view
watch(selectedIndex, (newIndex) => {
  if (newIndex >= 0 && autocompleteContainer.value) {
    const dropdown = autocompleteContainer.value.querySelector('.overflow-y-auto');
    const selectedItem = dropdown?.children[newIndex] as HTMLElement;
    if (selectedItem && dropdown) {
      const dropdownRect = dropdown.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      if (itemRect.bottom > dropdownRect.bottom) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (itemRect.top < dropdownRect.top) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  showDropdown.value = false;
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
      if (requestFilters.selectedColorFilterOption === 'Contains At Least') {
        delete requestFilters.selectedColors
        delete requestFilters.selectedColorFilterOption
      }
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

    router.push({ path: '/search/keyword', query })
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
