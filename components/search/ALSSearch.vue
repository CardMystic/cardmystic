<template>
  <UForm :schema="schema" :state="state" class="flex-grow-1 space-y-4" @submit="onSubmit">
    <!-- Honeypot field - hidden from users but visible to bots -->
    <input v-model="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px;" />

    <UFormField name="description" class="mb-2">
      <UInput v-model="state.description"
        placeholder="Describe the cards you're looking for (i.e. artifact removal). Leave blank for general recommendations."
        icon="i-lucide-search" class="w-full" :ui="{ trailing: 'pe-1', base: 'text-base h-10' }">
        <template v-if="state.description?.length" #trailing>
          <UButton color="neutral" variant="link" size="sm" icon="i-lucide-circle-x" aria-label="Clear input"
            @click="state.description = ''" />
        </template>
      </UInput>
    </UFormField>

    <UFormField name="commander" class="mb-2">
      <div class="flex gap-2 items-center">
        <USelectMenu v-model="state.commander" v-model:search-term="commanderSearchTerm"
          :loading="commanderStatus === 'pending'" :items="filteredCommanders"
          placeholder="Select a commander (optional)..." icon="i-lucide-crown" class="flex-1"
          :ui="{ base: 'text-base h-10' }" />
        <UButton v-if="state.commander" color="neutral" variant="link" size="sm" icon="i-lucide-circle-x"
          aria-label="Clear commander" @click="state.commander = ''" />
      </div>
    </UFormField>

    <UFormField name="limit" class="mb-2">
      <UInput v-model.number="state.limit" type="number" :min="1" :max="1000"
        placeholder="Number of results (default: 40)" icon="i-lucide-hash" class="w-full"
        :ui="{ base: 'text-base h-10' }" />
    </UFormField>

    <UFormField name="decklist">
      <UTextarea v-model="state.decklist" placeholder="Paste your decklist here (one card per line)..." :rows="6"
        autoresize class="w-full" :ui="{ base: 'text-base resize-y min-h-39 max-h-39' }" />
    </UFormField>

    <div class="flex justify-center">
      <UButton icon="i-lucide-box" :disabled="!state.decklist?.trim() && !state.commander?.trim()" type="submit"
        class="cursor-pointer h-10">
        Recommend
      </UButton>
    </div>
  </UForm>
</template>

<script lang="ts" setup>
import * as z from 'zod'
import { useRoute } from 'vue-router';
import { refDebounced } from '@vueuse/core';

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  description: z.string().optional(),
  commander: z.string().optional(),
  limit: z.number().min(1).max(1000).optional(),
  decklist: z.string().optional(),
})

type Schema = z.output<typeof schema>

const route = useRoute();

const decklistParam = computed(() => String(route.query.decklist || ''));
const descriptionParam = computed(() => String(route.query.description || ''));
const commanderParam = computed(() => String(route.query.commander || ''));
const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : undefined);

const state = reactive<Partial<Schema>>({
  description: descriptionParam.value || '',
  commander: commanderParam.value || '',
  limit: limitParam.value,
  decklist: decklistParam.value || '',
})

// Commander autocomplete
const commanderSearchTerm = ref('');
const debouncedCommanderSearch = refDebounced(commanderSearchTerm, 150);

const { data: rawCommanders, status: commanderStatus } = useFetch('/commanders.min.json', {
  key: 'autocomplete-commanders',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
});

const filteredCommanders = computed(() => {
  if (!debouncedCommanderSearch.value || debouncedCommanderSearch.value.length < 2) {
    if (state.commander) {
      return [state.commander];
    }
    return [];
  }
  const searchLower = debouncedCommanderSearch.value.toLowerCase();
  const filtered: string[] = [];
  if (state.commander) {
    filtered.push(state.commander);
  }
  for (let i = 0; i < rawCommanders.value.length && filtered.length < 100; i++) {
    const cmd = rawCommanders.value[i];
    if (cmd.toLowerCase().includes(searchLower) && cmd !== state.commander) {
      filtered.push(cmd);
    }
  }
  return filtered;
})

// Honeypot field for bot detection
const honeypot = ref('')

const toast = useToast()

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
    const query: Record<string, any> = {
      decklist: event.data.decklist,
      description: event.data.description || undefined,
      commander: event.data.commander || undefined,
      limit: event.data.limit || undefined,
      searchType: 'recommend',
    };

    console.log('Submitting form with data:', query);

    router.push({ path: '/search/recommend', query });
  } catch (error) {
    console.error('Form submission error:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to submit form',
      color: 'error'
    })
  }
}

// Keep input in sync if navigating back with query params. For example, when user clicks recommend from deck list page
watch(decklistParam, (newVal) => {
  if (newVal !== state.decklist) {
    state.decklist = newVal;
  }
});
watch(descriptionParam, (newVal) => {
  if (newVal !== state.description) {
    state.description = newVal;
  }
});
watch(commanderParam, (newVal) => {
  if (newVal !== state.commander) {
    state.commander = newVal;
  }
});
watch(limitParam, (newVal) => {
  if (newVal !== state.limit) {
    state.limit = newVal;
  }
});
</script>
