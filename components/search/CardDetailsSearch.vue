<script setup lang="ts">
import type { CardDetailsSearchState } from '~/models/searchModel';
import { CardSearchFiltersSchema } from '~/models/frontend-specific/filtersModel';
import SearchFilterDrawer from './SearchFilterDrawer.vue';

const props = defineProps<{
  kind: 'recommended' | 'popular' | 'similar' | 'popular-commanders';
  cardName: string;
  loading?: boolean;
}>();
const state = defineModel<CardDetailsSearchState>({ required: true });
const emit = defineEmits<{ submit: [value: CardDetailsSearchState] }>();
const filtersRef = useTemplateRef('filtersRef');
const settings = computed(
  () =>
    ({
      recommended: {
        icon: 'i-lucide-box',
        label: 'Recommend',
        placeholder:
          "Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations.",
      },
      popular: {
        icon: 'i-lucide-flame',
        label: 'Search',
        placeholder:
          'Optionally describe cards to re-rank by (e.g. ramp, removal)...',
      },
      similar: {
        icon: 'i-mdi-cards-outline',
        label: 'Search',
        placeholder: '',
      },
      'popular-commanders': {
        icon: 'i-lucide-search',
        label: 'Search',
        placeholder: 'Optional: describe the commanders you want…',
      },
    })[props.kind],
);
function submit() {
  emit('submit', {
    query: state.value.query.trim(),
    // The parsed copy separates draft filters from the active request.
    filters: CardSearchFiltersSchema.parse(state.value.filters),
  });
  filtersRef.value?.collapse();
}
</script>

<template>
  <form
    class="mx-auto mt-2 mb-4 w-full max-w-5xl space-y-4"
    @submit.prevent="submit"
  >
    <UFormField name="query" class="mb-2">
      <div class="flex flex-wrap gap-2">
        <UInput
          :model-value="cardName"
          readonly
          aria-label="Selected card"
          :icon="settings.icon"
          class="min-w-0"
          :class="kind === 'similar' ? 'flex-1' : 'w-full'"
          :ui="{ base: 'text-base h-10 truncate' }"
        />
        <UInput
          v-if="kind !== 'similar'"
          v-model="state.query"
          :placeholder="settings.placeholder"
          aria-label="Search query"
          icon="i-lucide-search"
          class="min-w-0 flex-1"
          maxlength="1000"
          :ui="{ trailing: 'pe-1', base: 'text-base h-10' }"
        >
          <template v-if="state.query.length" #trailing>
            <UButton
              type="button"
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
          :icon="settings.icon"
          :aria-label="settings.label"
          :loading="loading"
          class="h-10 shrink-0 cursor-pointer"
        >
          <span class="hidden sm:inline">{{ settings.label }}</span>
        </UButton>
      </div>
    </UFormField>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <SearchFilterDrawer
        ref="filtersRef"
        v-model="state.filters"
        :commander-only="kind === 'popular-commanders'"
        :hide-colors="kind === 'popular'"
        :hide-formats="kind === 'recommended' || kind === 'popular'"
        :quick-filters="
          kind === 'recommended' || kind === 'popular'
            ? ['arena', 'mtgo', 'paper']
            : undefined
        "
        :apply-label="settings.label"
        @apply="submit"
      />
      <SearchModeSelect compact class="ml-auto" />
    </div>
  </form>
</template>
