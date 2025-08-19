<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <UFormField name="query">
      <div class="flex gap-2">
        <UInput ref="input" v-model="state.query" placeholder="Describe the cards you want..." icon="i-lucide-search"
          class="flex-1" :ui="{ trailing: 'pe-1', base: 'h-10' }">
          <template v-if="state.query?.length" #trailing>
            <UButton color="neutral" variant="link" size="sm" icon="i-lucide-circle-x" aria-label="Clear input"
              @click="state.query = ''" />
          </template>
          <template #trailing>
            <UKbd value="/" class="me-1 cursor-default" />
          </template>
        </UInput>
        <UButton type="submit" class="cursor-pointer h-10">
          Submit
        </UButton>
      </div>
    </UFormField>

    <UFormField name="filters">
      <Filters v-model="state.filters" />
    </UFormField>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import Filters from './Filters.vue'

const input = ref();
defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus();
  }
});
const schema = z.object({
  query: z.string().min(1, "Must enter a search term"),
  filters: CardSearchFiltersSchema.optional(),
})

type Schema = z.output<typeof schema>

const route = useRoute();

const queryParam = computed(() => String(route.query.query || ''));
const parsedFilters = computed(() =>
  route.query.filters
    ? CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)))
    : { selectedColorFilterOption: 'Contains At Least' as 'Contains At Least' }
);

const state = reactive<Partial<Schema>>({
  query: queryParam.value || '',
  filters: parsedFilters.value || { 'selectedColorFilterOption': 'Contains At Least' }
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const query: Record<string, any> = {
      query: event.data.query,
      filters: event.data.filters && Object.keys(event.data.filters).length > 0 ? JSON.stringify(event.data.filters) : undefined
    };
    navigateTo({ path: '/search', query });
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

<style></style>