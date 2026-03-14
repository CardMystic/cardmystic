<template>
  <UForm :schema="schema" :state="state" class="grow space-y-4" @submit="onSubmit">
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

    <UFormField v-if="showPartnerField" name="partnerCommander" class="mb-2">
      <div class="flex gap-2 items-center">
        <USelectMenu v-model="state.partnerCommander" v-model:search-term="partnerSearchTerm"
          :loading="!partnerCommanders" :items="filteredPartners" placeholder="Select a partner commander (optional)..."
          icon="i-lucide-crown" class="flex-1" :ui="{ base: 'text-base h-10' }" />
        <UButton v-if="state.partnerCommander" color="neutral" variant="link" size="sm" icon="i-lucide-circle-x"
          aria-label="Clear partner commander" @click="state.partnerCommander = ''" />
      </div>
    </UFormField>

    <UFormField name="limit" class="mb-2">
      <UInput v-model.number="state.limit" type="number" :min="1" :max="1000" placeholder="Results limit (default: 40)"
        icon="i-lucide-hash" class="w-full" :ui="{ base: 'text-base h-10' }" />
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
import { useCommanders, usePartnerCommanders } from '~/composables/useBulkData';
import { getPartnerType, getValidPartners } from '~/utils/partnerCommanders';

const router = useRouter();
import type { FormSubmitEvent } from '@nuxt/ui'

const schema = z.object({
  description: z.string().optional(),
  commander: z.string().optional(),
  partnerCommander: z.string().optional(),
  limit: z.number().min(1).max(500).optional(),
  decklist: z.string().optional(),
})

type Schema = z.output<typeof schema>

const route = useRoute();

const decklistParam = computed(() => String(route.query.decklist || ''));
const descriptionParam = computed(() => String(route.query.description || ''));
const commanderParam = computed(() => String(route.query.commander || ''));
const partnerCommanderParam = computed(() => String(route.query.partnerCommander || ''));
const limitParam = computed(() => route.query.limit ? Number(route.query.limit) : 40);

const state = reactive<Partial<Schema>>({
  description: descriptionParam.value || '',
  commander: commanderParam.value || '',
  partnerCommander: partnerCommanderParam.value || '',
  limit: limitParam.value,
  decklist: decklistParam.value || '',
})

// Commander autocomplete
const commanderSearchTerm = ref('');
const debouncedCommanderSearch = refDebounced(commanderSearchTerm, 150);

const { data: rawCommanders, status: commanderQueryStatus } = useCommanders();
const { data: partnerCommanders } = usePartnerCommanders();
const commanderStatus = computed(() => commanderQueryStatus.value === 'pending' ? 'pending' : 'success');

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
  const commanders = rawCommanders.value ?? [];
  for (let i = 0; i < commanders.length && filtered.length < 100; i++) {
    const cmd = commanders[i];
    if (cmd.toLowerCase().includes(searchLower) && cmd !== state.commander) {
      filtered.push(cmd);
    }
  }
  return filtered;
})

// Partner commander logic
const partnerSearchTerm = ref('');
const debouncedPartnerSearch = refDebounced(partnerSearchTerm, 150);

const selectedCommanderPartnerType = computed(() => {
  if (!state.commander || !partnerCommanders.value) return null
  return getPartnerType(state.commander, partnerCommanders.value)
})

const showPartnerField = computed(() => !!selectedCommanderPartnerType.value)

const validPartnerList = computed(() => {
  if (!partnerCommanders.value || !selectedCommanderPartnerType.value) return []
  return getValidPartners(selectedCommanderPartnerType.value, partnerCommanders.value)
})

const filteredPartners = computed(() => {
  if (!debouncedPartnerSearch.value || debouncedPartnerSearch.value.length < 2) {
    if (state.partnerCommander) return [state.partnerCommander]
    return []
  }
  const searchLower = debouncedPartnerSearch.value.toLowerCase()
  const filtered: string[] = []
  if (state.partnerCommander) filtered.push(state.partnerCommander)
  for (const cmd of validPartnerList.value) {
    if (filtered.length >= 100) break
    if (cmd !== state.commander && cmd !== state.partnerCommander && cmd.toLowerCase().includes(searchLower)) {
      filtered.push(cmd)
    }
  }
  return filtered
})

// Clear partner when commander changes
watch(() => state.commander, () => {
  state.partnerCommander = ''
  partnerSearchTerm.value = ''
})

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
    const query: Record<string, any> = {
      decklist: event.data.decklist,
      description: event.data.description || undefined,
      commander: event.data.commander || undefined,
      partnerCommander: event.data.partnerCommander || undefined,
      limit: event.data.limit || undefined,
      searchType: 'recommend',
    };

    console.log('Submitting form with data:', query);

    saveSearchMutation.mutate({
      query: event.data.description || event.data.decklist?.split('\n').slice(0, 3).join(', ') || '',
      searchType: 'recommend',
      filters: {
        commander: event.data.commander || undefined,
        partnerCommander: event.data.partnerCommander || undefined,
        decklist: event.data.decklist || undefined,
        limit: event.data.limit || undefined,
      },
    });

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
watch(partnerCommanderParam, (newVal) => {
  if (newVal !== state.partnerCommander) {
    state.partnerCommander = newVal;
  }
});
watch(limitParam, (newVal) => {
  if (newVal !== state.limit) {
    state.limit = newVal;
  }
});
</script>
