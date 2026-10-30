<template>
  <UForm
    ref="formRef"
    :schema="schema"
    :state="state"
    class="grow space-y-4"
    @submit="onSubmit"
  >
    <UFormField name="query" class="mb-2">
      <div class="flex gap-2">
        <UInput
          ref="input"
          v-model="state.query"
          placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for all popular commander cards."
          icon="i-lucide-chart-no-axes-combined"
          class="flex-1"
          :ui="{ trailing: 'pe-1', base: 'text-base h-10' }"
        >
          <template v-if="state.query?.length" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear input"
              @click="
                () => {
                  state.query = '';
                }
              "
            />
          </template>
        </UInput>
        <UButton
          type="submit"
          class="cursor-pointer h-10"
          icon="i-lucide-chart-no-axes-combined"
          aria-label="Search"
        >
          <span class="hidden sm:inline">Search</span>
        </UButton>
      </div>
    </UFormField>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <SearchFilterDrawer
        ref="filtersRef"
        v-model="state.filters"
        commander-colors
        hide-formats
        :quick-filters="['arena', 'mtgo', 'paper']"
        @apply="formRef?.submit()"
      />
      <SearchModeSelect />
    </div>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod';
import { useRoute } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui';
import { CardSearchFiltersSchema } from '@/models/frontend-specific/filtersModel';
import {
  detectPlatformFromFilters,
  type Platform,
} from '~/utils/platformConfig';
import SearchFilterDrawer from './SearchFilterDrawer.vue';

const props = defineProps<{
  platform?: 'arena' | 'mtgo' | 'paper';
}>();

const router = useRouter();
const route = useRoute();

const currentPlatform = computed(() => {
  if (route.params.platform) return String(route.params.platform);
  return 'all';
});

const input = ref();
const formRef = useTemplateRef('formRef');
const filtersRef = ref<InstanceType<typeof SearchFilterDrawer> | null>(null);
defineShortcuts({
  '/': () => {
    input.value?.inputRef?.focus();
  },
});

const schema = z.object({
  query: z.string().optional(),
  filters: CardSearchFiltersSchema.optional(),
});

type Schema = z.output<typeof schema>;

const queryParam = computed(() => String(route.query.query || ''));

const parsedFilters = computed(() => {
  const base: Record<string, any> = {
    selectedColorFilterOption: 'Color Identity' as 'Color Identity',
  };
  if (props.platform === 'arena') base.isArena = true;
  if (props.platform === 'mtgo') base.isMTGO = true;
  if (props.platform === 'paper') base.isPaper = true;
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(
      JSON.parse(String(route.query.filters)),
    );
  }
  return CardSearchFiltersSchema.parse(base);
});

const state = reactive<Partial<Schema>>({
  query: queryParam.value || '',
  filters: parsedFilters.value,
});

watch(queryParam, (newVal) => {
  if (newVal !== state.query) state.query = newVal;
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const requestFilters = { ...event.data.filters };

    if (
      !event.data.filters?.selectedColors ||
      event.data.filters?.selectedColors.length === 0
    ) {
      delete requestFilters.selectedColors;
      delete requestFilters.selectedColorFilterOption;
    } else {
      requestFilters.selectedColorFilterOption = 'Color Identity';
    }

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

    const query: Record<string, any> = {
      useRerank: String(route.query.useRerank !== 'false'),
      query: event.data.query || undefined,
      filters:
        requestFilters && Object.keys(requestFilters).length > 0
          ? JSON.stringify(requestFilters)
          : undefined,
    };

    filtersRef.value?.collapse();
    const { saveSearchQuery } = useSearchType();
    saveSearchQuery('popular-cards', query);
    const targetPlatform = detectPlatformFromFilters(
      requestFilters,
      currentPlatform.value as Platform,
    );
    router.push({ path: `/popular-cards/${targetPlatform}`, query });
  } catch (error) {
    console.error('Form submission error:', error);
  }
}
</script>
