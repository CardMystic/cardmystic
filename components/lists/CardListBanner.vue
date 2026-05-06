<template>
  <!-- Banner Section -->
  <div v-if="list" class="mb-6 relative group cursor-pointer">
    <!-- Banner Image -->
    <div class="relative h-48 md:h-64 rounded-lg overflow-hidden">
      <div
        v-if="bannerImageUrl"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"
      >
        <div
          class="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent"
        ></div>
      </div>
      <div
        v-else
        class="absolute inset-0 bg-linear-to-br from-purple-600 to-blue-600"
      ></div>

      <!-- Banner Content -->
      <div class="absolute bottom-0 left-0 right-0 p-6">
        <div v-if="isEditingTitle" class="mb-2">
          <input
            v-model="editedTitle"
            @blur="updateListName"
            @keyup.enter="updateListName"
            @keyup.esc="isEditingTitle = false"
            class="text-3xl md:text-4xl font-bold text-white bg-black/50 px-2 py-1 rounded w-full outline-none focus:bg-black/70"
            autofocus
          />
        </div>
        <h1
          v-else
          @click="startEditingTitle"
          class="text-3xl md:text-4xl font-bold text-white mb-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {{ list.name }}
        </h1>

        <!-- Format display -->
        <div class="flex items-center gap-1.5 mb-2">
          <template v-if="isEditingFormat">
            <USelect
              v-model="editedFormat"
              :items="formatOptions"
              size="sm"
              class="w-48 bg-black/50 rounded"
              @blur="updateListFormat"
              @keyup.esc="isEditingFormat = false"
            />
          </template>
          <template v-else>
            <span class="text-gray-300 text-sm font-medium">{{
              list.format || 'Commander'
            }}</span>
            <UIcon
              name="i-lucide-pencil"
              class="w-3.5 h-3.5 text-gray-400 hover:text-white cursor-pointer transition-colors"
              @click="startEditingFormat"
            />
          </template>
        </div>

        <div v-if="isEditingDescription" class="mb-2">
          <textarea
            v-model="editedDescription"
            @blur="updateListDescription"
            @keyup.esc="isEditingDescription = false"
            class="text-gray-200 text-lg bg-black/50 px-2 py-1 rounded w-full outline-none focus:bg-black/70 resize-none"
            rows="2"
            autofocus
          />
        </div>
        <p
          v-else-if="list.description"
          @click="startEditingDescription"
          class="text-gray-200 text-lg cursor-pointer hover:opacity-80 transition-opacity"
        >
          {{ list.description }}
        </p>
        <p
          v-else
          @click="startEditingDescription"
          class="text-gray-400 text-lg italic cursor-pointer hover:opacity-80 transition-opacity"
        >
          Click to add description
        </p>
      </div>

      <!-- Edit Icon (always visible when no banner, hover-reveal when banner set) -->
      <UButton
        @click="isEditBannerModalOpen = true"
        class="absolute top-4 right-4 transition-opacity cursor-pointer"
        :class="
          bannerImageUrl ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
        "
        color="neutral"
        variant="subtle"
        icon="i-lucide-pencil"
        label="Change Banner Image"
        aria-label="Change banner image"
      />
    </div>
  </div>

  <!-- Banner Skeleton -->
  <div v-else class="mb-6">
    <USkeleton class="h-48 md:h-64 rounded-lg" />
  </div>

  <!-- Edit Banner Modal -->
  <UModal
    v-model:open="isEditBannerModalOpen"
    title="Change Banner Image"
    description="Select a card to use as the banner image for this list"
  >
    <template #content>
      <div class="p-4 space-y-4">
        <!-- Card Search and Selection (autocomplete) -->
        <UInputMenu
          v-model="selectedBannerCard"
          v-model:search-term="searchTerm"
          :loading="bannerUpdateLoading"
          :items="filteredBannerCards"
          placeholder="Search for a card..."
          icon="i-lucide-search"
          class="w-full"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Search for an MTG card to use as the banner image
        </p>

        <!-- Preview -->
        <div v-if="previewBannerUrl" class="mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
          <div class="h-32 rounded-lg overflow-hidden">
            <div
              class="h-full bg-cover bg-center"
              :style="{ backgroundImage: `url(${previewBannerUrl})` }"
            ></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton
            class="cursor-pointer"
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="isEditBannerModalOpen = false"
          />
          <UButton
            class="cursor-pointer"
            color="primary"
            variant="solid"
            label="Save"
            :loading="bannerUpdateLoading"
            :disabled="!selectedBannerCard"
            @click="updateBannerImage"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core';
import { useCardLists } from '~/composables/useCardLists';
import { useCardNames } from '~/composables/useBulkData';
import { CardFormat, type CardFormatType } from '~/models/cardModel';
import { useToast } from '#imports';

const props = defineProps<{
  list: any | null | undefined;
  isLoading: boolean;
}>();

const toast = useToast();

const { updateListAvatarMutation, updateListMutation, updateFormatMutation } =
  useCardLists();

// Banner state
const isEditBannerModalOpen = ref(false);
const selectedBannerCard = ref('');
const searchTerm = ref('');
const debouncedSearchTerm = refDebounced(searchTerm, 150);
const bannerUpdateLoading = ref(false);

// Editable title and description state
const isEditingTitle = ref(false);
const isEditingDescription = ref(false);
const editedTitle = ref('');
const editedDescription = ref('');

// Format editing state
const isEditingFormat = ref(false);
const editedFormat = ref<CardFormatType>('Commander');
const formatOptions = CardFormat.options;

// Load card names from backend bulk data API
const { data: rawCards, status: cardsQueryStatus } = useCardNames();
const cardsStatus = computed(() =>
  cardsQueryStatus.value === 'pending' ? 'pending' : 'success',
);

// Filter cards based on search
const filteredBannerCards = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (selectedBannerCard.value) {
      return [selectedBannerCard.value];
    }
    return [];
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase();
  const filtered: string[] = [];

  if (selectedBannerCard.value) {
    filtered.push(selectedBannerCard.value);
  }

  const cards = rawCards.value ?? [];

  for (let i = 0; i < cards.length && filtered.length < 100; i++) {
    const card = cards[i];
    if (card.toLowerCase().includes(searchLower) && !filtered.includes(card)) {
      filtered.push(card);
    }
  }

  return filtered;
});

// Get banner image URL from avatar_card_name only
const bannerImageUrl = computed(() => {
  const cardName = props.list?.avatar_card_name;
  if (!cardName) return null;

  // Scryfall's card image API
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}&format=image&version=art_crop`;
});

// Preview URL for modal
const previewBannerUrl = computed(() => {
  if (!selectedBannerCard.value) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(selectedBannerCard.value)}&format=image&version=art_crop`;
});

const updateBannerImage = async () => {
  if (!selectedBannerCard.value || !props.list) return;

  bannerUpdateLoading.value = true;
  try {
    await updateListAvatarMutation.mutateAsync({
      listId: props.list.id,
      cardName: selectedBannerCard.value,
    });
    toast.add({
      title: 'Banner updated!',
      icon: 'i-lucide-check',
    });
    isEditBannerModalOpen.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error updating banner',
      description: error.message,
      color: 'error',
    });
  } finally {
    bannerUpdateLoading.value = false;
  }
};

const updateListName = async () => {
  if (!props.list || !editedTitle.value.trim()) {
    isEditingTitle.value = false;
    return;
  }

  try {
    if (editedTitle.value.trim() === props.list.name) {
      isEditingTitle.value = false;
      return;
    }
    await updateListMutation.mutateAsync({
      listId: props.list.id,
      updates: { name: editedTitle.value.trim() },
    });
    toast.add({
      title: 'List name updated!',
      icon: 'i-lucide-check',
    });
    isEditingTitle.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error updating list name',
      description: error.message,
      color: 'error',
    });
  }
};

const updateListDescription = async () => {
  if (!props.list) {
    isEditingDescription.value = false;
    return;
  }

  try {
    if (editedDescription.value.trim() === (props.list.description || '')) {
      isEditingDescription.value = false;
      return;
    }
    await updateListMutation.mutateAsync({
      listId: props.list.id,
      updates: { description: editedDescription.value.trim() || undefined },
    });
    toast.add({
      title: 'List description updated!',
      icon: 'i-lucide-check',
    });
    isEditingDescription.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error updating list description',
      description: error.message,
      color: 'error',
    });
  }
};

const startEditingTitle = () => {
  if (props.list) {
    editedTitle.value = props.list.name;
    isEditingTitle.value = true;
  }
};

const startEditingDescription = () => {
  if (props.list) {
    editedDescription.value = props.list.description || '';
    isEditingDescription.value = true;
  }
};

const startEditingFormat = () => {
  if (props.list) {
    editedFormat.value = props.list.format || 'Commander';
    isEditingFormat.value = true;
  }
};

const updateListFormat = async () => {
  if (!props.list) {
    isEditingFormat.value = false;
    return;
  }

  try {
    if (editedFormat.value === (props.list.format || 'Commander')) {
      isEditingFormat.value = false;
      return;
    }
    await updateFormatMutation.mutateAsync({
      listId: props.list.id,
      format: editedFormat.value,
    });
    toast.add({
      title: 'Format updated!',
      icon: 'i-lucide-check',
    });
    isEditingFormat.value = false;
  } catch (error: any) {
    toast.add({
      title: 'Error updating format',
      description: error.message,
      color: 'error',
    });
  }
};
</script>
