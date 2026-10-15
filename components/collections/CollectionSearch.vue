<script setup lang="ts">
import { z } from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import { CardSearchFiltersSchema } from '~/models/frontend-specific/filtersModel';
const props = defineProps<{ targetPath: string; labelText: string }>();
const route = useRoute();
const router = useRouter();
const schema = z.object({
  query: z.string(),
  filters: CardSearchFiltersSchema,
});
const state = reactive({
  query: '',
  filters: CardSearchFiltersSchema.parse({}),
});
const form = useTemplateRef('form');
const drawer = useTemplateRef('drawer');
const honeypot = ref('');
watch(
  () => route.fullPath,
  () => {
    state.query = String(route.query.query ?? '');
    try {
      state.filters = CardSearchFiltersSchema.parse(
        route.query.filters ? JSON.parse(String(route.query.filters)) : {},
      );
    } catch {
      state.filters = CardSearchFiltersSchema.parse({});
    }
    nextTick(() => drawer.value?.collapse());
  },
  { immediate: true },
);
async function submit(event: FormSubmitEvent<z.output<typeof schema>>) {
  if (honeypot.value) return;
  drawer.value?.collapse();
  await router.push({
    path: props.targetPath,
    query: {
      query: event.data.query.trim() || undefined,
      filters: JSON.stringify(event.data.filters),
      useRerank: String(route.query.useRerank !== 'false'),
    },
  });
}
</script>

<template>
  <UForm
    id="a-i-search-form"
    ref="form"
    :schema="schema"
    :state="state"
    class="grow space-y-4"
    @submit="submit"
  >
    <input
      v-model="honeypot"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      class="hidden"
    />
    <UFormField name="query" :label="labelText" class="mb-2">
      <div class="flex gap-2">
        <UInput
          v-model="state.query"
          :aria-label="labelText"
          :placeholder="labelText"
          icon="i-lucide-brain"
          class="flex-1 min-w-0"
          :ui="{ trailing: 'pe-1', base: 'text-base h-10' }"
        >
          <template v-if="state.query.length" #trailing
            ><UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-circle-x"
              aria-label="Clear input"
              @click="state.query = ''"
          /></template>
        </UInput>
        <UButton
          type="submit"
          icon="i-lucide-brain"
          aria-label="Search"
          class="h-10 cursor-pointer"
          ><span class="hidden sm:inline">Search</span></UButton
        >
      </div>
    </UFormField>
    <SearchModeSelect compact />
    <CollectionFilterDrawer
      ref="drawer"
      v-model="state.filters"
      @apply="form?.submit()"
    />
  </UForm>
</template>
