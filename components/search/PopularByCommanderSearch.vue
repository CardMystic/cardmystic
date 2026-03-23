<template>
  <UForm :schema="schema" :state="state" class="grow space-y-4" @submit="onSubmit">
    <!-- Commander autocomplete -->
    <UFormField name="commander" class="mb-2">
      <div class="flex gap-2 items-center">
        <USelectMenu v-model="state.commander" v-model:search-term="commanderSearchTerm" :items="filteredCommanders"
          placeholder="Select a commander..." icon="i-lucide-crown" class="flex-1" :ui="{ base: 'text-base h-10' }" />
        <UButton v-if="state.commander" class="cursor-pointer" color="neutral" variant="link" size="sm"
          icon="i-lucide-circle-x" aria-label="Clear commander" @click="clearCommander" />
      </div>
    </UFormField>

    <!-- Partner commander autocomplete -->
    <UFormField v-if="showPartnerField" name="partnerCommander" class="mb-2">
      <div class="flex gap-2 items-center">
        <USelectMenu v-model="state.partnerCommander" v-model:search-term="partnerSearchTerm" :items="filteredPartners"
          placeholder="Select a partner commander (optional)..." icon="i-lucide-flame" class="flex-1"
          :ui="{ base: 'text-base h-10' }" />
        <UButton v-if="state.partnerCommander" class="cursor-pointer" color="neutral" variant="link" size="sm"
          icon="i-lucide-circle-x" aria-label="Clear partner commander" @click="state.partnerCommander = ''" />
      </div>
    </UFormField>

    <!-- Optional query to re-rank -->
    <UFormField name="query" class="mb-2">
      <div class="flex gap-2">
        <UInput ref="input" v-model="state.query"
          placeholder="Optionally describe cards to re-rank by (e.g. ramp, removal)..." icon="i-lucide-search"
          class="flex-1" :ui="{ trailing: 'pe-1', base: 'text-base h-10' }">
          <template v-if="state.query?.length" #trailing>
            <UButton color="neutral" variant="link" size="sm" icon="i-lucide-circle-x" aria-label="Clear input"
              @click="state.query = ''" />
          </template>
        </UInput>
        <UButton type="submit" class="cursor-pointer h-10" icon="i-lucide-flame" :disabled="!state.commander">
          Search
        </UButton>
      </div>
    </UFormField>

    <Filters v-if="!showFilters" ref="filtersRef" v-model="state.filters" hide-colors hide-formats hide-controls />

    <div v-if="!showFilters" class="flex justify-center">
      <UTooltip text="Filter results by types, rarities, and more">
        <UButton class="cursor-pointer" @click="showFilters = true" variant="ghost" size="sm"
          icon="i-lucide-sliders-horizontal" aria-label="Show advanced search filters">
          Show Advanced Filters
        </UButton>
      </UTooltip>
    </div>

    <UCard v-if="showFilters">
      <UFormField name="filters">
        <Filters ref="filtersRef" v-model="state.filters" hide-colors hide-formats />
      </UFormField>
      <template #footer>
        <div class="flex items-center justify-center">
          <UButton class="cursor-pointer" @click="hideFilters" variant="ghost" size="sm" icon="i-lucide-eye-off"
            color="neutral">
            Hide Advanced Filters
          </UButton>
        </div>
      </template>
    </UCard>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router';
import { refDebounced } from '@vueuse/core';
import type { FormSubmitEvent } from '@nuxt/ui'
import { CardSearchFiltersSchema } from '~/models/searchModel'
import { hasAdvancedFilters } from '~/utils/quickFilters'
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders'
import Filters from '~/components/search/Filters.vue'

const router = useRouter();
const route = useRoute();

const input = ref();
const filtersRef = ref<InstanceType<typeof Filters> | null>(null);

const schema = z.object({
  commander: z.string().min(1, 'Please select a commander'),
  partnerCommander: z.string().optional(),
  query: z.string().optional(),
  filters: CardSearchFiltersSchema.optional(),
})

type Schema = z.output<typeof schema>

const commanderParam = computed(() => String(route.query.commander || ''));
const partnerParam = computed(() => String(route.query.partner || ''));
const queryParam = computed(() => String(route.query.query || ''));

const parsedFilters = computed(() => {
  if (route.query.filters) {
    return CardSearchFiltersSchema.parse(JSON.parse(String(route.query.filters)));
  }
  return {};
});

const showFilters = ref(hasAdvancedFilters(parsedFilters.value));
function hideFilters() {
  showFilters.value = false;
}

const state = reactive<Partial<Schema>>({
  commander: commanderParam.value || '',
  partnerCommander: partnerParam.value || '',
  query: queryParam.value || '',
  filters: parsedFilters.value || {},
})

watch(commanderParam, (newVal) => {
  if (newVal !== state.commander) state.commander = newVal;
});

// Commander autocomplete
const { data: rawCommanders } = useCommanders();
const { data: partnerCommanders } = usePartnerCommanders();

const commanderSearchTerm = ref('');
const debouncedCommanderSearch = refDebounced(commanderSearchTerm, 150);

const filteredCommanders = computed(() => {
  if (!debouncedCommanderSearch.value || debouncedCommanderSearch.value.length < 2) {
    if (state.commander) return [state.commander];
    return [];
  }
  const searchLower = debouncedCommanderSearch.value.toLowerCase();
  const filtered: string[] = [];
  if (state.commander) filtered.push(state.commander);
  const commanders = rawCommanders.value ?? [];
  for (let i = 0; i < commanders.length && filtered.length < 100; i++) {
    const cmd = commanders[i];
    if (cmd.toLowerCase().includes(searchLower) && cmd !== state.commander) {
      filtered.push(cmd);
    }
  }
  return filtered;
});

// Partner commander handling
const partnerSearchTerm = ref('');
const debouncedPartnerSearch = refDebounced(partnerSearchTerm, 150);

const selectedCommanderPartnerType = computed(() => {
  if (!state.commander || !partnerCommanders.value) return null;
  return getPartnerType(state.commander, partnerCommanders.value);
});

const showPartnerField = computed(() => !!selectedCommanderPartnerType.value);

const validPartnerList = computed(() => {
  if (!partnerCommanders.value || !selectedCommanderPartnerType.value) return [];
  return getValidPartners(selectedCommanderPartnerType.value, partnerCommanders.value);
});

const filteredPartners = computed(() => {
  if (!debouncedPartnerSearch.value || debouncedPartnerSearch.value.length < 2) {
    if (state.partnerCommander) return [state.partnerCommander];
    return [];
  }
  const searchLower = debouncedPartnerSearch.value.toLowerCase();
  const filtered: string[] = [];
  if (state.partnerCommander) filtered.push(state.partnerCommander);
  for (const cmd of validPartnerList.value) {
    if (filtered.length >= 100) break;
    if (cmd !== state.commander && cmd !== state.partnerCommander && cmd.toLowerCase().includes(searchLower)) {
      filtered.push(cmd);
    }
  }
  return filtered;
});

function clearCommander() {
  state.commander = '';
  state.partnerCommander = '';
  commanderSearchTerm.value = '';
  partnerSearchTerm.value = '';
}

watch(() => state.commander, () => {
  state.partnerCommander = '';
  partnerSearchTerm.value = '';
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    const requestFilters = { ...event.data.filters }

    Object.keys(requestFilters).forEach(key => {
      const value = requestFilters[key as keyof typeof requestFilters];
      if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        delete requestFilters[key as keyof typeof requestFilters];
      }
    });

    const query: Record<string, any> = {
      commander: event.data.commander,
      partner: event.data.partnerCommander || undefined,
      query: event.data.query || undefined,
      filters: requestFilters && Object.keys(requestFilters).length > 0 ? JSON.stringify(requestFilters) : undefined,
    };

    filtersRef.value?.collapse();
    router.push({ path: '/popular-by-commander/all', query });
  } catch (error) {
    console.error('Form submission error:', error)
  }
}
</script>
