<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <UFormField name="query" class="mb-2">
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
        <UButton :disabled="state.query?.length == 0" type="submit" class="cursor-pointer h-10">
          Submit
        </UButton>
      </div>
    </UFormField>
    <CommanderFilters v-model="state.filters" />
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
  query: z.string().min(1, ""),
  filters: CardSearchFiltersSchema.optional(),
})

type Schema = z.output<typeof schema>

const route = useRoute();

const queryParam = computed(() => String(route.query.query || ''));
const parsedFilters = computed(() => {
  if (route.query.filters) {
    const filters = CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
    return filters;
  }
  return { selectedColorFilterOption: 'Contains At Least' as 'Contains At Least' };
});

const state = reactive<Partial<Schema>>({
  query: queryParam.value || '',
  filters: parsedFilters.value || { selectedColorFilterOption: 'Contains At Least' }
})

// Honeypot field for bot detection
const honeypot = ref('')

const toast = useToast()
const { saveSearch } = useSearchHistory()

async function onSubmit(event: FormSubmitEvent<Schema>) {
  // Bot detection: if honeypot field is filled, reject the submission
  if (honeypot.value) {
    toast.add({
      title: 'Invalid submission',
      color: 'error'
    });
    return;
  }

  try {
    const formData = {
      query: event.data.query,
      filters: event.data.filters || {}
    };

    // Use state.filters.selectedColors directly
    const selColors = state.filters?.selectedColors;
    if (selColors && selColors.length > 0) {
      formData.filters.selectedColors = [...selColors];
      formData.filters.selectedColorFilterOption = 'Match Exactly';
    } else {
      formData.filters = {};
    }

    // For commander search, always set isCommander to true
    formData.filters.isCommander = true;

    // Save to search history
    await saveSearch(event.data.query, 'commander', formData.filters)

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