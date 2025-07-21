<template>
  <div class="search-container px-0">
    <!-- Search type tabs -->
    <div class="search-tabs-container mb-4">
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'ai' }]"
        @click="setSearchType('ai')">
        <v-icon start size="18">mdi-magnify</v-icon>
        AI Search
      </button>
      <button type="button" :class="['search-tab-button-new', { active: searchType === 'similarity' }]"
        @click="setSearchType('similarity')">
        <v-icon start size="18">mdi-cards-outline</v-icon>
        Similarity Search
      </button>
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

// Watch for search type changes to load card names, clear query, and remove results only if on a search page
watch(searchType, async (newType) => {
  const isOnSearchPage = route.path.startsWith('/search');
  if (isOnSearchPage) {
    // Clear the query box
    query.value.value = '';
    // Remove results by navigating to the base search page for each type
    if (newType === 'similarity') {
      if (cardNames.value.length === 0) {
        await loadCardNames();
      }
      navigateTo({ path: '/search/similarity' });
    } else {
      navigateTo({ path: '/search' });
    }
  } else {
    // Only load card names if needed, but don't clear or navigate
    if (newType === 'similarity' && cardNames.value.length === 0) {
      await loadCardNames();
    }
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
  align-items: center;
  gap: 14px;
  width: 100%;
  margin-bottom: 18px;
}


.search-tab-button-new {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 7px 18px;
  border: none;
  border-radius: 18px;
  font-weight: 500;
  font-size: 0.98rem;
  cursor: pointer;
  white-space: nowrap;
  color: #e6e6fa;
  background: #23223a;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.13), 0 1px 0 rgba(255, 255, 255, 0.06) inset;
  border: 1.2px solid rgba(147, 114, 255, 0.22);
  backdrop-filter: blur(10px) saturate(160%);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, border 0.18s, transform 0.18s;
  position: relative;
  z-index: 1;
  outline: none;
  line-height: 1.2;
}

.search-tab-button-new .v-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15em !important;
  vertical-align: middle;
  margin-bottom: 0 !important;
  margin-top: 0 !important;
}

.search-tab-button-new.active {
  background: #a37aff;
  color: #fff;
  border-color: #a37aff;
  box-shadow: 0 6px 24px 0 rgba(147, 114, 255, 0.22), 0 2px 8px rgba(0, 0, 0, 0.18);
  transform: translateY(-2px) scale(1.07);
}

.search-tab-button-new:hover:not(.active),
.search-tab-button-new:focus-visible:not(.active) {
  background: #3d375a;
  color: #fff;
  border-color: #a37aff;
  box-shadow: 0 6px 20px rgba(147, 114, 255, 0.13), 0 2px 8px rgba(0, 0, 0, 0.13);
  transform: translateY(-1px) scale(1.03);
}

@media (max-width: 768px) {
  .search-tabs-container {
    gap: 7px;
    margin-bottom: 10px;
  }

  .search-tab-button-new {
    padding: 6px 10px;
    font-size: 0.92rem;
  }
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