<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <UFormField name="query">
      <div class="flex gap-2">
        <UInput ref="input" v-model="state.query" placeholder="Describe the commander you want..."
          icon="i-lucide-search" class="flex-1" :ui="{ trailing: 'pe-1', base: 'h-10' }">
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
    <CommanderFilters :colors="selectedColors" @update:colors="selectedColors = $event" class="mt-4" />
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import CommanderFilters from '~/components/search/CommanderFilters.vue'

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
const parsedFilters = computed(() => {
  if (route.query.filters) {
    const filters = CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
    // Set selectedColors if present
    if (filters?.selectedColors && Array.isArray(filters.selectedColors)) {
      selectedColors.value = [...filters.selectedColors];
    } else {
      selectedColors.value = [];
    }
    return filters;
  }
  selectedColors.value = [];
  return { selectedColorFilterOption: 'Contains At Least' as 'Contains At Least' };
  // Set selected pairing if colors are present
});

const selectedColors = ref<("White" | "Blue" | "Black" | "Red" | "Green" | "Colorless")[]>([]);

const state = reactive<Partial<Schema>>({
  query: queryParam.value || '',
  filters: parsedFilters.value || { 'selectedColorFilterOption': 'Contains At Least' }
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const formData = {
      query: event.data.query,
      filters: event.data.filters || {}
    };

    // Use selectedColors directly
    if (selectedColors.value.length > 0) {
      formData.filters.selectedColors = [...selectedColors.value];
      formData.filters.selectedColorFilterOption = 'Match Exactly';
    } else {
      formData.filters = {};
    }

    // For commander search, always set isCommander to true
    formData.filters.isCommander = true;

    // Construct query parameters
    const query: Record<string, any> = {
      query: event.data.query,
      filters: formData.filters && Object.keys(formData.filters).length > 0 ? JSON.stringify(formData.filters) : undefined,
      searchType: 'commander'
    };
    navigateTo({ path: '/search/commander', query });
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