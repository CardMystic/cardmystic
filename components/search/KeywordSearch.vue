<template>
  <UForm
    ref="formRef"
    :schema="schema"
    :state="state"
    class="grow space-y-4"
    @submit="onSubmit"
  >
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input
      v-model="honeypot"
      type="text"
      name="website"
      autocomplete="off"
      tabindex="-1"
      aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px"
    />

    <UFormField name="query" class="mb-2">
      <div class="flex gap-2 w-full">
        <UInput
          ref="input"
          v-model="state.query"
          placeholder="Search cards by keywords…"
          icon="i-lucide-whole-word"
          class="flex-1"
          :ui="{ base: 'text-base h-10' }"
        />
        <UButton
          icon="i-lucide-whole-word"
          :disabled="state.query?.length == 0"
          type="submit"
          class="h-10 cursor-pointer"
          aria-label="Search"
        >
          <span class="hidden sm:inline">Search</span>
        </UButton>
      </div>
    </UFormField>

    <SearchFilterDrawer
      ref="filtersRef"
      v-model="state.filters"
      :can-apply="!!state.query?.trim()"
      @apply="formRef?.submit()"
    />
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod';
import { useRoute } from 'vue-router';

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import { useSearchPageDefaults } from '~/composables/useSearchPageDefaults';
import type { Platform } from '~/utils/platformConfig';
import SearchFilterDrawer from './SearchFilterDrawer.vue';

const { getPath, getPlatformFromPath } = useSearchType();

const input = ref();
const formRef = useTemplateRef('formRef');
const filtersRef = ref<InstanceType<typeof SearchFilterDrawer> | null>(null);

defineShortcuts({
  '/': () => input.value?.inputRef?.focus(),
});

const schema = z.object({
  query: z.string().min(1, ''),
  filters: CardSearchFiltersSchema.optional(),
});

type Schema = z.output<typeof schema>;

const route = useRoute();
const pageDefaults = useSearchPageDefaults();

const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return getPlatformFromPath(route.path);
});

const queryParam = computed(() =>
  String(pageDefaults?.query ?? route.query.query ?? ''),
);

const parsedFilters = computed(() => {
  if (pageDefaults) {
    return CardSearchFiltersSchema.parse({
      selectedColorFilterOption: 'Match Exactly',
      ...pageDefaults.filters.value,
    });
  }
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(
      JSON.parse(String(route.query.filters)),
    );
  }
  return CardSearchFiltersSchema.parse({
    selectedColorFilterOption: 'Match Exactly',
  });
});

const state = reactive<Partial<Schema>>({
  query: queryParam.value,
  filters: parsedFilters.value,
});

watch(queryParam, (newVal) => {
  if (newVal !== state.query) state.query = newVal;
});

// Honeypot field for bot detection
const honeypot = ref('');

const toast = useToast();
const { saveSearchMutation } = useSearchHistory();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  filtersRef.value?.collapse();
  // Bot detection: if honeypot field is filled, reject the submission
  if (honeypot.value) {
    toast.add({
      title: 'Invalid submission',
      color: 'error',
    });
    return;
  }

  try {
    const requestFilters = { ...event.data.filters }; // shallow copy

    // Only modify the copy, NEVER the form state
    if (
      !event.data.filters?.selectedColors ||
      event.data.filters?.selectedColors.length === 0
    ) {
      delete requestFilters.selectedColors;
      delete requestFilters.selectedColorFilterOption;
    }

    // Remove undefined/null/empty values from filters
    Object.keys(requestFilters).forEach((key) => {
      const value = requestFilters[key as keyof typeof requestFilters];
      if (
        value === undefined ||
        value === null ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete requestFilters[key as keyof typeof requestFilters];
      }
    });

    // Save to search history
    saveSearchMutation.mutate({
      query: event.data.query,
      searchType: 'keyword',
      filters: requestFilters,
    });

    const query: Record<string, any> = {
      query: event.data.query,
      filters:
        Object.keys(requestFilters).length > 0
          ? JSON.stringify(requestFilters)
          : undefined,
      searchType: 'keyword',
      limit: 100,
    };

    const targetPlatform = detectPlatformFromFilters(
      requestFilters,
      currentPlatform.value as Platform,
    );
    router.push({ path: getPath('keyword', targetPlatform), query });
  } catch (error) {
    console.error('Form submission error:', error);
    toast.add({
      title: 'Error',
      description: 'Failed to submit form',
      color: 'error',
    });
  }
}
</script>
