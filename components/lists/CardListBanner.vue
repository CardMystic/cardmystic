<template>
  <!-- Banner Section -->
  <div v-if="list" class="mb-2 relative group" data-testid="deck-banner">
    <!-- Banner Image -->
    <div
      class="deck-banner-surface relative min-h-48 md:min-h-64 rounded-lg overflow-hidden flex flex-col"
    >
      <img
        v-if="bannerImageUrl"
        :src="bannerImageUrl"
        alt=""
        class="deck-banner-backdrop"
        aria-hidden="true"
      />
      <img
        v-if="bannerImageUrl"
        :src="bannerImageUrl"
        alt=""
        :draggable="false"
        decoding="async"
        fetchpriority="high"
        class="deck-banner-art"
      />
      <div
        v-else
        class="absolute inset-0 bg-linear-to-br from-purple-600 to-blue-600"
      ></div>
      <div v-if="bannerImageUrl" class="deck-banner-shade" aria-hidden="true" />

      <!-- Banner Content -->
      <div
        class="relative mt-auto w-full p-4 pt-16 md:max-w-[72%] md:p-6 md:pt-16 xl:max-w-[65%]"
      >
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
          class="text-3xl md:text-4xl font-bold text-white mb-2 transition-opacity break-words"
          :class="{ 'cursor-pointer hover:opacity-80': isOwner }"
        >
          {{ list.name }}
        </h1>

        <!-- Format display + visibility selector -->
        <div class="flex flex-wrap items-center gap-1.5 mb-2">
          <template v-if="isEditingFormat">
            <USelect
              v-model="editedFormat"
              :items="formatOptions"
              aria-label="List format"
              :ui="{
                base: 'text-white ring-white/40',
                trailingIcon: 'text-white/70',
              }"
              size="sm"
              class="w-48 bg-black/50 rounded"
              @blur="updateListFormat"
              @keyup.esc="isEditingFormat = false"
            />
          </template>
          <template v-else>
            <span class="text-gray-300 text-sm font-medium">{{
              list.kind === 'collection'
                ? 'Collection'
                : list.format || 'Commander'
            }}</span>
            <button
              v-if="isOwner && list.kind !== 'collection'"
              type="button"
              aria-label="Edit list format"
              class="inline-flex p-1 text-gray-400 hover:text-white cursor-pointer transition-colors"
              @click="startEditingFormat"
            >
              <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" />
            </button>
          </template>
          <div v-if="list.kind !== 'collection'" class="ml-2">
            <USelect
              v-if="isOwner && isEditingBracket"
              :model-value="list.bracket ?? 0"
              :items="bracketOptions"
              aria-label="Deck bracket"
              size="sm"
              class="w-52"
              :disabled="updateListMutation.isPending.value"
              @update:model-value="updateListBracket"
              @keyup.esc="isEditingBracket = false"
            />
            <DeckBracketBadge
              v-else
              :bracket="list.bracket"
              :editable="isOwner"
              @edit="isEditingBracket = true"
            />
          </div>
          <!-- Visibility selector (owner only) -->
          <USelect
            v-if="isOwner"
            :model-value="list.visibility || 'private'"
            :items="visibilityOptions"
            :loading="updateVisibilityMutation.isPending.value"
            size="xs"
            class="w-28 bg-black/50 rounded ml-2"
            data-testid="visibility-select"
            aria-label="List visibility"
            :ui="{
              base: 'text-white ring-white/40',
              trailingIcon: 'text-white/70',
            }"
            @update:model-value="updateListVisibility"
          />
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
          class="text-gray-200 text-lg transition-opacity break-words"
          :class="{ 'cursor-pointer hover:opacity-80': isOwner }"
        >
          {{ list.description }}
        </p>
        <p
          v-else-if="isOwner"
          @click="startEditingDescription"
          class="text-gray-400 text-lg italic cursor-pointer hover:opacity-80 transition-opacity"
        >
          Click to add description
        </p>

        <slot name="social" />

        <!-- Mana color distribution -->
        <ColorRatioBar
          v-if="list.color_ratios"
          :ratios="list.color_ratios"
          class="mt-3"
        />
      </div>

      <div class="absolute top-4 right-4 flex items-center gap-2">
        <UButton
          v-if="isOwner"
          @click="
            () => {
              isEditBannerModalOpen = true;
            }
          "
          class="transition-opacity cursor-pointer min-h-10 min-w-10 justify-center"
          :class="
            bannerImageUrl
              ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
              : 'opacity-100'
          "
          color="neutral"
          variant="subtle"
          icon="i-lucide-pencil"
          aria-label="Change banner image"
          ><span class="hidden sm:inline">Change Banner Image</span></UButton
        >
        <slot name="actions" />
      </div>
    </div>
  </div>

  <!-- Banner Skeleton -->
  <div v-else class="mb-2">
    <USkeleton class="h-48 md:h-64 rounded-lg" />
  </div>

  <!-- Edit Banner Modal -->
  <UModal
    v-if="isOwner && isEditBannerModalOpen"
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
          <div
            class="deck-banner-surface relative h-32 rounded-lg overflow-hidden"
          >
            <img
              :src="previewBannerUrl"
              alt=""
              class="deck-banner-backdrop"
              :draggable="false"
            />
            <img
              :src="previewBannerUrl"
              alt=""
              class="deck-banner-art"
              :draggable="false"
            />
            <div class="deck-banner-shade" aria-hidden="true" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 justify-end">
          <UButton
            class="cursor-pointer"
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="
              () => {
                isEditBannerModalOpen = false;
              }
            "
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
import { refDebounced } from '~/utils/refDebounced';
import { useCardLists } from '~/composables/useCardLists';
import { useCardNames } from '~/composables/useBulkData';
import { CardListFormatSchema } from '~/models/cardListModel';
import { useToast } from '#imports';
import { bracketOptions } from '~/utils/commanderBrackets';

const props = defineProps<{
  list: any | null | undefined;
  isLoading: boolean;
  isOwner?: boolean;
}>();

const toast = useToast();

const {
  updateListAvatarMutation,
  updateListMutation,
  updateFormatMutation,
  updateVisibilityMutation,
} = useCardLists();

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
const isEditingBracket = ref(false);
async function updateListBracket(value: number) {
  if (!props.isOwner || !props.list) return;
  try {
    await updateListMutation.mutateAsync({
      listId: props.list.id,
      updates: { bracket: value || null },
    });
    isEditingBracket.value = false;
    toast.add({ title: 'Bracket updated', color: 'success' });
  } catch (error) {
    toast.add({
      title: 'Could not update bracket',
      description: (error as Error).message,
      color: 'error',
    });
  }
}
const editedFormat =
  ref<(typeof CardListFormatSchema.options)[number]>('Commander');
const formatOptions = CardListFormatSchema.options;

// Visibility selector options (owner only)
const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Public', value: 'public' },
];

// Only load editing data when the owner opens the banner picker.
const { data: rawCards } = useCardNames(
  () => !!props.isOwner && isEditBannerModalOpen.value,
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
  return scryfallArtCropUrl(cardName);
});

// Preview URL for modal
const previewBannerUrl = computed(() => {
  if (!selectedBannerCard.value) return null;
  return scryfallArtCropUrl(selectedBannerCard.value);
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
  if (props.list && props.isOwner) {
    editedTitle.value = props.list.name;
    isEditingTitle.value = true;
  }
};

const startEditingDescription = () => {
  if (props.list && props.isOwner) {
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

const updateListVisibility = async (visibility: string) => {
  if (visibility !== 'private' && visibility !== 'public') return;
  if (!props.list || visibility === (props.list.visibility || 'private')) {
    return;
  }

  try {
    await updateVisibilityMutation.mutateAsync({
      listId: props.list.id,
      visibility,
    });
    toast.add({
      title: `List is now ${visibility}`,
      icon: 'i-lucide-check',
    });
  } catch (error: any) {
    toast.add({
      title: 'Error updating visibility',
      description: error.message,
      color: 'error',
    });
  }
};
</script>

<style scoped>
.deck-banner-surface {
  background: #111827;
}
.deck-banner-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: left center;
  filter: blur(32px) brightness(0.5);
  transform: scale(1.1);
  pointer-events: none;
}
.deck-banner-art {
  position: absolute;
  inset: 0 0 0 auto;
  width: min(88%, 44rem);
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 45%);
  mask-image: linear-gradient(to right, transparent, #000 45%);
}
.deck-banner-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    to top,
    rgb(17 24 39 / 95%),
    rgb(17 24 39 / 55%) 55%,
    transparent
  );
}
@media (min-width: 768px) {
  .deck-banner-art {
    width: min(62%, 44rem);
  }
  .deck-banner-shade {
    background: linear-gradient(to top, rgb(17 24 39 / 55%), transparent 80%);
  }
}
</style>
