<template>
  <div
    class="flex flex-wrap items-center gap-2"
    :class="
      embedded
        ? 'mt-3 text-white'
        : 'mb-4 p-3 border border-black-300 dark:border-gray-400 rounded-lg bg-white/60 dark:bg-black/40'
    "
  >
    <!-- Deck author link (shown when viewing someone else's public list) -->
    <NuxtLink
      v-if="owner"
      :to="`/user/${owner.id}`"
      class="flex items-center gap-2 mr-3 rounded-lg cursor-pointer group min-w-0"
    >
      <img
        v-if="owner.avatar_card_name"
        :src="scryfallArtCropUrl(owner.avatar_card_name)"
        :alt="owner.username ?? 'User'"
        class="rounded-full object-cover"
        :class="embedded ? 'size-6' : 'size-10'"
      />
      <UIcon
        v-else
        name="i-lucide-user"
        class="opacity-50"
        :class="embedded ? 'size-6' : 'size-10'"
      />
      <div class="min-w-0">
        <p
          class="font-semibold truncate group-hover:text-primary transition-colors"
        >
          {{ owner.username || 'Anonymous' }}
        </p>
        <p v-if="!embedded" class="text-xs opacity-60">Deck author</p>
      </div>
    </NuxtLink>

    <!-- Like / Save toggles (interactive on client only) -->
    <ClientOnly>
      <template v-if="isLoggedIn && isLoadingSocialState">
        <USkeleton class="h-8 w-14" />
        <USkeleton class="h-8 w-14" />
      </template>
      <template v-else>
        <UTooltip
          :text="
            isLoggedIn ? (liked ? 'Unlike' : 'Like') : 'Sign in to like decks'
          "
        >
          <UButton
            data-testid="decklist-like-button"
            :aria-label="liked ? 'Unlike deck' : 'Like deck'"
            icon="i-lucide-heart"
            :color="liked ? 'error' : 'neutral'"
            :variant="liked ? 'solid' : 'outline'"
            size="sm"
            class="cursor-pointer"
            :class="
              embedded && !liked
                ? 'text-white ring-white/40 bg-black/30 hover:bg-black/40'
                : ''
            "
            :disabled="!isLoggedIn || isTogglingLike"
            :label="String(list.like_count)"
            @click="handleToggleLike"
          />
        </UTooltip>
        <UTooltip
          :text="
            isLoggedIn ? (saved ? 'Unsave' : 'Save') : 'Sign in to save decks'
          "
        >
          <UButton
            data-testid="decklist-save-button"
            :aria-label="saved ? 'Unsave deck' : 'Save deck'"
            icon="i-lucide-bookmark"
            :color="saved ? 'primary' : 'neutral'"
            :variant="saved ? 'solid' : 'outline'"
            size="sm"
            class="cursor-pointer"
            :class="
              embedded && !saved
                ? 'text-white ring-white/40 bg-black/30 hover:bg-black/40'
                : ''
            "
            :disabled="!isLoggedIn || isTogglingSave"
            :label="String(list.save_count)"
            @click="handleToggleSave"
          />
        </UTooltip>
      </template>
      <template #fallback>
        <USkeleton class="h-8 w-14" />
        <USkeleton class="h-8 w-14" />
      </template>
    </ClientOnly>

    <!-- Read-only stats -->
    <span class="flex items-center gap-1 text-sm ml-2 opacity-80">
      <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
      {{ list.comment_count }}
      {{ list.comment_count === 1 ? 'comment' : 'comments' }}
    </span>
    <span class="flex items-center gap-1 text-sm opacity-80">
      <UIcon name="i-lucide-eye" class="w-4 h-4" />
      {{ list.view_count }} {{ list.view_count === 1 ? 'view' : 'views' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useDecklistSocial } from '~/composables/useDecklistSocial';
import { useToast } from '#imports';
import type { DecklistSummary } from '~/models/cardListModel';

interface DecklistOwner {
  id: string;
  username: string | null;
  avatar_card_name: string | null;
}

const props = defineProps({
  embedded: { type: Boolean, default: false },
  list: {
    type: Object as () => DecklistSummary,
    required: true,
  },
  // Deck author link — pass null/omit to hide (e.g. when viewing your own list)
  owner: {
    type: Object as () => DecklistOwner | null,
    default: null,
  },
});

const toast = useToast();
const listIdRef = computed(() => props.list.id);
const {
  isLoggedIn,
  liked,
  saved,
  isLoadingSocialState,
  toggleLike,
  toggleSave,
  isTogglingLike,
  isTogglingSave,
} = useDecklistSocial(listIdRef);

const handleToggleLike = async () => {
  try {
    await toggleLike(!liked.value);
  } catch (error: any) {
    toast.add({
      title: 'Error updating like',
      description: error.message,
      color: 'error',
    });
  }
};

const handleToggleSave = async () => {
  try {
    await toggleSave(!saved.value);
  } catch (error: any) {
    toast.add({
      title: 'Error updating save',
      description: error.message,
      color: 'error',
    });
  }
};
</script>
