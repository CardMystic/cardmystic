<template>
  <div class="search-container px-0">
    <form @submit.prevent="onSubmit" class="search-form">
      <div class="search-input-row">
        <!-- Regular search input -->
        <v-text-field v-if="!props.similarity" v-model="query.value.value" placeholder="Search..." variant="solo"
          hide-details="auto" :error-messages="query.errorMessage.value" prepend-inner-icon="mdi-magnify"
          class="flex-grow-1" :clearable="!!query.value.value" v-on:click:clear="clearQuery" />

        <!-- Autocomplete search input for similarity search -->
        <!-- TODO: Clean up this autocomplete component to better highlight why a result is shown, and only show suggestions after typing 3+ characters-->
        <v-autocomplete v-else v-model="query.value.value" :items="cardNames" label="Search for a card..."
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
import { computed, ref } from 'vue';
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

// Fetch card names from public directory
onMounted(async () => {
  if (props.similarity) {
    try {
      const response = await fetch('/card-names.min.json');
      cardNames.value = await response.json();
    } catch (error) {
      console.error('Failed to load card names:', error);
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
  }
});

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
  if (props.similarity) {
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