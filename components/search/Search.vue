<template>
  <div class="search-container px-0">
    <!-- Search type tabs -->
    <div class="search-tabs-container mb-4">
      <div class="search-tabs-wrapper">
        <button type="button" :class="['search-tab-button', { active: searchType === 'ai' }]"
          @click="setSearchType('ai')">
          <v-icon start size="18">mdi-robot</v-icon>
          AI Search
        </button>
        <button type="button" :class="['search-tab-button', { active: searchType === 'similarity' }]"
          @click="setSearchType('similarity')">
          <v-icon start size="18">mdi-magnify</v-icon>
          Similarity Search
        </button>
      </div>
    </div>

    <form @submit.prevent="onSubmit" class="search-form">
      <div class="search-input-row">
        <!-- Regular search input -->
        <v-text-field v-if="searchType === 'ai'" v-model="query.value.value"
          placeholder="Describe the cards you want..." variant="solo" hide-details="auto"
          :error-messages="query.errorMessage.value" prepend-inner-icon="mdi-magnify" class="flex-grow-1"
          :clearable="!!query.value.value" v-on:click:clear="clearQuery" />

        <!-- Autocomplete search input for similarity search -->
        <!-- TODO: Clean up this autocomplete component to better highlight why a result is shown, and only show suggestions after typing 3+ characters-->
        <v-autocomplete v-else v-model="query.value.value" :items="cardNames" label="Enter a card name..."
          hide-details="auto" variant="solo" elevation="5" prepend-inner-icon="mdi-magnify" class="flex-grow-1"
          :clearable="!!query.value.value"></v-autocomplete>
        <v-btn type="submit" color="primary" class="ml-2 search-btn" size="large">
          Search
        </v-btn>
      </div>

      <div class="filters-section mt-4">
        <Filters v-model="filters.value.value" />
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SearchForm' });
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
const { useField, useForm } = await import('vee-validate');
const { toTypedSchema } = await import('@vee-validate/zod');

import { CardSearchFiltersSchema, WordSearchSchema, type CardSearchFilters } from '~/models/searchModel';
import Filters from './Filters.vue';

// Example queries for animated placeholder
const exampleQueries = [
  "creatures that draw cards",
  "stax pieces",
  "blue cantrips",
  "adventure ramp",
  "orzhov removal",
  "black creatures with flying",
  "etb effects",
  "artifact removal",
  "x spell board wipes",
  "low cost sultai commanders",
  "mono white token finishers",
  "golgari elves that draw",
  "five color dragon commander",
  "red burn",
  "graveyard recursion",
];

// Define props
const props = defineProps<{
  similarity?: boolean;
}>();

const route = useRoute();

const queryParam = computed(() => String(route.query.query || route.query.card_name || ''));
const parsedFilters = computed(() => route.query.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : {});

const cardNames = ref<string[]>([]);
const isLoading = ref(true);

// Initialize search type based on props or route
const { searchType, setSearchType } = useSearchType()

// Set initial search type
if (props.similarity) {
  setSearchType('similarity')
} else {
  setSearchType('ai')
}

// Fetch card names from public directory
onMounted(async () => {
  if (searchType.value === 'similarity') {
    await loadCardNames();
  } else {
    isLoading.value = false;
  }
});

// Watch for search type changes to load card names when needed
watch(searchType, async (newType) => {
  if (newType === 'similarity' && cardNames.value.length === 0) {
    await loadCardNames();
  }
});

// Function to load card names
async function loadCardNames() {
  try {
    const response = await fetch('/card-names.min.json');
    cardNames.value = await response.json();
  } catch (error) {
    console.error('Failed to load card names:', error);
  } finally {
    isLoading.value = false;
  }
}

const formSchema = toTypedSchema(WordSearchSchema);
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    query: queryParam.value || '',
    filters: parsedFilters.value || {}
  }
});

const query = useField<string>('query');
const filters = useField<CardSearchFilters>('filters');

const onSubmit = form.handleSubmit((values) => {
  if (searchType.value === 'similarity') {
    const query: Record<string, any> = {
      card_name: values.query,
      filters: values.filters && Object.keys(values.filters).length > 0 ? JSON.stringify(values.filters) : undefined
    };
    navigateTo({ path: '/search/similarity', query });
  } else {
    const query: Record<string, any> = {
      query: values.query,
      filters: values.filters && Object.keys(values.filters).length > 0 ? JSON.stringify(values.filters) : undefined
    };
    navigateTo({ path: '/search', query });
  }
})

function clearQuery() {
  query.value.value = '';
}

</script>

<style scoped>
.search-container {
  width: 100%;
  max-width: 1096px;
  margin: 0 auto;
}

.search-form {
  width: 100%;
}

.search-input-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.search-tabs-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.search-tabs-wrapper {
  display: flex;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 4px;
  border-radius: 24px;
  backdrop-filter: blur(10px);
}

.search-tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.search-tab-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.search-tab-button.active {
  background: rgb(var(--v-theme-primary));
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.search-btn {
  margin-top: 0;
  align-self: flex-start;
  height: 56px;
  /* Match the height of the v-text-field input */
}

.filters-section {
  width: 100%;
}

@media (max-width: 768px) {
  .search-input-row {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .search-tabs-wrapper {
    gap: 8px;
    padding: 3px;
  }

  .search-tab-button {
    padding: 8px 16px;
    font-size: 13px;
  }

  .search-btn {
    width: 100%;
    margin-left: 0 !important;
    align-self: flex-start;
    height: 56px !important;
    font-size: 18px;
    font-weight: 500;
  }

  .search-container {
    padding: 0 16px;
  }

  /* Ensure the text field container takes full width */
  .search-input-row :deep(.v-text-field) {
    width: 100% !important;
  }
}
</style>