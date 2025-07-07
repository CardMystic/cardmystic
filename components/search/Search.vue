<template>
  <form @submit.prevent="onSubmit">
    <v-text-field v-model="query.value.value" label="Search..." variant="solo" elevation="5"
      prepend-inner-icon="mdi-magnify" class="flex-grow-1" :clearable="!!query.value.value"></v-text-field>
    <v-btn type="submit" color="primary" class="ml-2"> Search</v-btn>
  </form>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SearchForm' });

import { useField, useForm } from 'vee-validate';
import { WordSearchSchema } from '~/models/searchModel';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
// import Filters from './Filters.vue';

const formSchema = toTypedSchema(z.object({
  query: z.string().min(2).max(100),
}))
const form = useForm({
  validationSchema: formSchema,
})

const query = useField('query')

const onSubmit = form.handleSubmit((values) => {
  alert('Form submitted!');
  console.log('Form submitted!', values)
})

// function onSubmit() {
//   const model = {
//     query: query.value,
//     filters: filters.value,
//   };
//   console.log('Search submitted:', model);
//   emit('update:modelValue', model);
//   emit('submit', model);
// }
</script>

<style></style>