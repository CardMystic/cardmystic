<template>
  <div class="search-container">
    <form @submit.prevent="onSubmit" class="search-form">
      <div class="search-input-row">
        <v-text-field v-model="query.value.value" label="Search..." variant="solo" elevation="5" :hide-details="true"
          prepend-inner-icon="mdi-magnify" class="flex-grow-1" :clearable="!!query.value.value" />
        <v-btn type="submit" color="primary" class="ml-2" size="large">
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

import { useField, useForm } from 'vee-validate';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { CardSearchFiltersSchema, WordSearchSchema, type CardSearchFilters } from '~/models/searchModel';
import { toTypedSchema } from '@vee-validate/zod';
import Filters from './Filters.vue';

const route = useRoute();

const queryParam = computed(() => String(route.query.query || ''));
const parsedFilters = computed(() => route.query.filters ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters))) : {});

const formSchema = toTypedSchema(WordSearchSchema);
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    query: queryParam.value || '',
    filters: parsedFilters.value || {}
  }
});

const query = useField('query');
const filters = useField<CardSearchFilters>('filters');

// Watch for route changes and update form fields
watch(queryParam, (newQuery) => {
  query.value.value = newQuery || '';
}, { immediate: true });

watch(parsedFilters, (newFilters) => {
  filters.value.value = newFilters || {};
}, { immediate: true, deep: true });

const onSubmit = form.handleSubmit((values) => {
  // Don't search if there's no query
  if (!values.query || values.query.trim() === '') {
    return;
  }

  const query: Record<string, any> = {
    query: values.query,
    filters: values.filters && Object.keys(values.filters).length > 0 ? JSON.stringify(values.filters) : undefined
  };
  navigateTo({ path: '/search', query });
})
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
  align-items: center;
  gap: 8px;
  width: 100%;
}

.filters-section {
  width: 100%;
}

@media (max-width: 768px) {
  .search-input-row {
    flex-direction: column;
    gap: 12px;
  }

  .search-input-row .v-btn {
    width: 100%;
    margin-left: 0 !important;
  }
}
</style>