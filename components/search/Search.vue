<template>
  <form @submit.prevent="onSubmit">
    <v-text-field v-model="query.value.value" label="Search..." variant="solo" elevation="5"
      prepend-inner-icon="mdi-magnify" class="flex-grow-1" :clearable="!!query.value.value"></v-text-field>
    <v-btn type="submit" color="primary" class="ml-2"> Search</v-btn>
    <Filters v-model="filters.value.value" class="ml-2" />
  </form>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SearchForm' });

import { useField, useForm } from 'vee-validate';
import { WordSearchSchema, type CardSearchFilters } from '~/models/searchModel';
import { toTypedSchema } from '@vee-validate/zod';
import Filters from './Filters.vue';

const formSchema = toTypedSchema(WordSearchSchema);
const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    query: '',
    filters: {}
  }
});

const query = useField('query');

const filters = useField<CardSearchFilters>('filters');

const onSubmit = form.handleSubmit((values) => {
  const query: Record<string, any> = {
    query: values.query,
    limit: '10',
    filters: JSON.stringify(values.filters)
  };
  console.log('Submitting search with query:', query);
  navigateTo({ path: '/search', query });
})
</script>

<style></style>