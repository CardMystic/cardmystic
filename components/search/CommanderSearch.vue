<template>
  <UForm :schema="schema" :state="state" class="grow space-y-4" @submit="onSubmit">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <UFormField name="query" class="mb-2">
      <div class="flex gap-2">
        <UInput ref="input" v-model="state.query" placeholder="Describe the commander you want..."
          icon="i-lucide-search" class="flex-1" :ui="{ trailing: 'pe-1', base: 'text-base h-10' }">
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

    <QuickFilters v-model="state.filters" :show="['arena', 'mtgo', 'paper']" />

    <div v-if="!showFilters" class="flex justify-center">
      <UTooltip text="Filter results by types, rarities, stats, and platform">
        <UButton @click="showFilters = true" variant="ghost" size="sm" icon="i-lucide-sliders-horizontal"
          aria-label="Show advanced search filters">
          Show Advanced Filters
        </UButton>
      </UTooltip>
    </div>

    <UFormField v-if="showFilters" name="advancedFilters">
      <Filters ref="filtersRef" v-model="state.filters" hide-colors hide-formats />
    </UFormField>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router';

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import type { Platform } from '~/utils/platformConfig'
import CommanderFilters from '~/components/search/CommanderFilters.vue'
import Filters from './Filters.vue'

const props = defineProps<{
  platform?: 'arena' | 'mtgo' | 'paper'
}>()

const route = useRoute();
const { getPath, getPlatformFromPath } = useSearchType();
const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

const input = ref();
const filtersRef = ref<InstanceType<typeof Filters> | null>(null);
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

const queryParam = computed(() => String(route.query.query || ''));
const showFilters = ref(!!route.query.filters || !!props.platform);
const parsedFilters = computed(() => {
  const base: Record<string, any> = { selectedColorFilterOption: 'Contains At Least' as 'Contains At Least' };
  if (props.platform === 'arena') base.isArena = true;
  if (props.platform === 'mtgo') base.isMTGO = true;
  if (props.platform === 'paper') base.isPaper = true;
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return base;
});

const state = reactive<Partial<Schema>>({
  query: queryParam.value || '',
  filters: parsedFilters.value || { selectedColorFilterOption: 'Contains At Least' }
})

watch(queryParam, (newVal) => {
  if (newVal !== state.query) state.query = newVal;
});

// Honeypot field for bot detection
const honeypot = ref('')

const toast = useToast()
const { saveSearchMutation } = useSearchHistory()

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
      filters: { ...(event.data.filters || {}) }
    };

    // Use state.filters.selectedColors directly for commander color identity
    const selColors = state.filters?.selectedColors;
    if (selColors && selColors.length > 0) {
      formData.filters.selectedColors = [...selColors];
      formData.filters.selectedColorFilterOption = 'Match Exactly';
    } else {
      // Keep other filters but remove color-related ones
      delete formData.filters.selectedColors;
      delete formData.filters.selectedColorFilterOption;
    }

    // For commander search, always set isCommander to true
    formData.filters.isCommander = true;

    // Remove undefined/null/empty values from filters
    Object.keys(formData.filters).forEach(key => {
      const value = formData.filters[key as keyof typeof formData.filters];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        delete formData.filters[key as keyof typeof formData.filters];
      }
    });

    // Save to search history
    saveSearchMutation.mutate({ query: event.data.query, searchType: 'commander', filters: formData.filters })

    // Construct query parameters
    const query: Record<string, any> = {
      query: event.data.query,
      filters: formData.filters && Object.keys(formData.filters).length > 0 ? JSON.stringify(formData.filters) : undefined,
      searchType: 'commander'
    };
    filtersRef.value?.collapse();
    const targetPlatform = detectPlatformFromFilters(formData.filters, currentPlatform.value as Platform);
    router.push({ path: getPath('commander', targetPlatform), query });
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