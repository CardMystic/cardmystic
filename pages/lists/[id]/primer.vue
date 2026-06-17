<template>
  <div class="w-full h-[97vh] flex flex-col mx-auto relative z-10 pt-4">
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-20 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"
      ></div>
    </div>

    <CardListBanner :list="list" :is-loading="isLoadingLists" />

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
import { useCardLists } from '~/composables/useCardLists';
import { useSupabase } from '~/composables/useSupabase';
import { useToast } from '#imports';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const listId = route.params.id as string;
const toast = useToast();
const config = useRuntimeConfig();
const supabase = useSupabase();

const { userLists, isLoadingLists } = useCardLists();

const list = computed(
  () => userLists.value?.find((l: any) => l.id === listId) ?? null,
);

const isCreator = computed(() => !!list.value);

const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name;
  if (!cardName) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
});

const primerContent = ref('');
const isSaving = ref(false);

// Load primer from backend on mount.
onMounted(async () => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return;
    const data = await $fetch<{ listId: string; text: string | null }>(
      `${config.public.backendUrl}/supabase/card-lists/primer/${listId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    primerContent.value = data.text ?? '';
  } catch (e: any) {
    // Non-fatal: primer may not exist yet
    primerContent.value = '';
  }
});

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
