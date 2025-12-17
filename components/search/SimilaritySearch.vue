<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <UFormField name="card_name" class="mb-2">
      <div class="flex gap-2">
        <USelectMenu ref="autoComplete" v-model="state.card_name" v-model:search-term="searchTerm"
          :loading="status === 'pending'" :items="filteredCards" placeholder="Enter a card name..."
          icon="i-lucide-search" class="flex-1 h-10" />
        <UButton :disabled="state.card_name?.length == 0" type="submit" class="h-10 cursor-pointer">
          Submit
        </UButton>
      </div>
    </UFormField>

    <div v-if="!showFilters" class="flex justify-center">
      <UTooltip text="Filter results by colors, types, rarities, and more">
        <UButton @click="showFilters = true" variant="ghost" color="neutral" size="sm"
          icon="i-lucide-sliders-horizontal" aria-label="Show advanced search filters">
          Show Advanced Filters
        </UButton>
      </UTooltip>
    </div>

    <UFormField v-if="showFilters" name="filters">
      <Filters v-model="state.filters" />
    </UFormField>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import { refDebounced } from '@vueuse/core';
import Filters from './Filters.vue'

const autoComplete = ref();
const showFilters = ref(false);
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
const route = useRoute();

const cardNameParam = computed(() => String(route.query.card_name || ''));
const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return { selectedColorFilterOption: 'Contains At Least' as 'Contains At Least' };
});

const state = reactive<Schema>({
  card_name: cardNameParam.value || '',
  filters: parsedFilters.value || { 'selectedColorFilterOption': 'Contains At Least' }
})

const searchTerm = ref("");
// Debounced search term for better performance
const debouncedSearchTerm = refDebounced(searchTerm, 150);

// Raw card data - keep as simple array for performance
const { data: rawCards, status } = await useFetch('/card-names.min.json', {
  key: 'autocomplete-cards',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
});

// Pre-filter cards before passing to USelectMenu
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
  for (let i = 0; i < rawCards.value.length && filtered.length < 100; i++) {
    const card = rawCards.value[i];
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card);
    }
  }

  return filtered;
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const requestFilters = { ...event.data.filters } // shallow copy

    // Only modify the copy, NEVER the form state
    if (!event.data.filters?.selectedColors || event.data.filters?.selectedColors.length === 0) {
      if (requestFilters.selectedColorFilterOption === 'Contains At Least') {
        delete requestFilters.selectedColors
        delete requestFilters.selectedColorFilterOption
      }
    }
    // Construct query parameters
    const query: Record<string, any> = {
      card_name: event.data.card_name,
      filters: requestFilters && Object.keys(requestFilters).length > 0 ? JSON.stringify(requestFilters) : undefined,
      searchType: 'similarity'
    };
    navigateTo({ path: '/search/similarity', query });
  } catch (error) {
    console.error('Form submission error:', error)
  }
}

// If similarity button is clicked on the similarity page, this will update the card name in the search field
watch(cardNameParam, (newVal) => {
  if (newVal !== state.card_name) {
    state.card_name = newVal;
  }
});
</script>

<style></style>