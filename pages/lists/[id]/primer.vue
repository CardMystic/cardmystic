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
import { useToast } from '#imports';

definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const listId = route.params.id as string;
const toast = useToast();

const { userLists, isLoadingLists } = useCardLists();

const list = computed(
  () => userLists.value?.find((l: any) => l.id === listId) ?? null,
);

// Current user owns this list if it appears in their userLists.
// Sharing/non-creator viewers will be supported once the primer DB schema exists.
const isCreator = computed(() => !!list.value);

const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name;
  if (!cardName) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
});

// Local-only persistence until a primer table exists on the backend.
const storageKey = computed(() => `primer:${listId}`);
const primerContent = ref('');

onMounted(() => {
  try {
    primerContent.value = localStorage.getItem(storageKey.value) ?? '';
  } catch {
    primerContent.value = '';
  }
});

function handleSave(value: string) {
  try {
    localStorage.setItem(storageKey.value, value);
    toast.add({
      title: 'Primer saved',
      icon: 'i-lucide-check',
    });
  } catch (e: any) {
    toast.add({
      title: 'Error saving primer',
      description: e?.message,
      color: 'error',
    });
  }
}

useSeoMeta({
  title: () => (list.value ? `${list.value.name} — Primer` : 'Primer'),
  robots: 'noindex, nofollow',
});
</script>
