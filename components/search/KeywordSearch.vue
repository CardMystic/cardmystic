<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <UFormField name="query" class="mb-2">
      <div class="flex gap-2">
        <UInput ref="input" v-model="state.query" placeholder="Search cards by keywords…" icon="i-lucide-search"
          class="flex-1" :ui="{ trailing: 'pe-1', base: 'h-10' }">
          <template v-if="state.query?.length" #trailing>
            <UButton color="neutral" variant="link" size="sm" icon="i-lucide-circle-x" aria-label="Clear input"
              @click="state.query = ''" />
          </template>
          <template #trailing>
            <UKbd value="/" class="me-1 cursor-default" />
          </template>
        </UInput>

        <UButton :disabled="state.query?.length == 0" type="submit" class="cursor-pointer h-10">
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
import { useRoute } from 'vue-router'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import Filters from './Filters.vue'

const input = ref();

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

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const formData = {
      query: event.data.query,
      filters: event.data.filters || {}
    }

    // If no colors are selected, and the colorFilterOption is Contains At least, remove color filters
    if (!event.data.filters?.selectedColors || event.data.filters?.selectedColors.length == 0) {
      if (event.data.filters?.selectedColorFilterOption == 'Contains At Least') {
        delete formData.filters.selectedColors;
        delete formData.filters.selectedColorFilterOption;
      }
    }
    // Construct URL query parameters for keyword search
    const query: Record<string, any> = {
      query: formData.query,
      filters:
        formData.filters && Object.keys(formData.filters).length > 0
          ? JSON.stringify(formData.filters)
          : undefined,
      searchType: 'keyword',     // <-- KEY UPDATE
      limit: 100                 // optional, backend defaults to 100
    }

    // Navigate to keyword search results page
    navigateTo({ path: '/search/keyword', query })
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
