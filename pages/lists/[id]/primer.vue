<template>
  <div class="w-full h-[97vh] flex flex-col mx-auto relative z-10 pt-4">
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-20 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"
      ></div>
    </div>

    <!-- Back button -->
    <div class="mb-4">
      <UButton
        :to="`/lists/${listId}`"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        label="Back to Decklist"
        class="cursor-pointer"
      />
    </div>

    <!-- Primer editor / viewer -->
    <ClientOnly>
      <PrimerEditor
        v-model="primerContent"
        :editable="isCreator"
        :is-saving="isSaving"
        @save="handleSave"
      />
      <template #fallback>
        <USkeleton class="h-[60vh] w-full rounded-md" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { useCardLists } from '~/composables/useCardLists';
import { usePrimer } from '~/composables/usePrimer';
import { useSupabase } from '~/composables/useSupabase';
import { useToast } from '#imports';

const route = useRoute();
const listId = route.params.id as string;
const toast = useToast();
const config = useRuntimeConfig();
const supabase = useSupabase();
const queryClient = useQueryClient();

const { userLists, isLoadingLists } = useCardLists();

const list = computed(
  () => userLists.value?.decklists?.find((l: any) => l.id === listId) ?? null,
);

const isCreator = computed(() => !!list.value);

const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name;
  if (!cardName) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
});

const primerContent = ref('');
const isSaving = ref(false);

// Load primer via the shared query (public primers need no auth). Seed the
// editable ref once so refetches don't clobber in-progress edits.
const { primerText } = usePrimer(ref(listId));
let seeded = false;
watch(
  primerText,
  (text) => {
    if (!seeded && text !== null) {
      primerContent.value = text;
      seeded = true;
    }
  },
  { immediate: true },
);

async function handleSave(value: string) {
  isSaving.value = true;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Not authenticated');
    await $fetch(`${config.public.backendUrl}/supabase/card-lists/primer`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: { listId, text: value },
    });
    toast.add({ title: 'Primer saved', icon: 'i-lucide-check' });
    queryClient.invalidateQueries({ queryKey: ['primer', listId] });
  } catch (e: any) {
    toast.add({
      title: 'Error saving primer',
      description: e?.message,
      color: 'error',
    });
  } finally {
    isSaving.value = false;
  }
}

useSeoMeta({
  title: () => (list.value ? `${list.value.name} — Primer` : 'Primer'),
  robots: 'noindex, nofollow',
});
</script>
