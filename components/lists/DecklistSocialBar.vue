<template>
  <div
    class="flex flex-wrap items-center gap-2 mb-4 p-3 border border-black-300 dark:border-gray-400 rounded-lg bg-white/60 dark:bg-black/40"
  >
    <!-- Deck author link (shown when viewing someone else's public list) -->
    <NuxtLink
      v-if="owner"
      :to="`/user/${owner.id}`"
      class="flex items-center gap-3 mr-auto rounded-lg cursor-pointer group min-w-0"
    >
      <img
        v-if="owner.avatar_card_name"
        :src="`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(owner.avatar_card_name)}&format=image&version=art_crop`"
        :alt="owner.username ?? 'User'"
        class="w-10 h-10 rounded-full object-cover"
      />
      <UIcon v-else name="i-lucide-user" class="w-10 h-10 opacity-50" />
      <div class="min-w-0">
        <p
          class="font-semibold truncate group-hover:text-primary transition-colors"
        >
          {{ owner.username || 'Anonymous' }}
        </p>
        <p class="text-xs opacity-60">Deck author</p>
      </div>
    </NuxtLink>

    <!-- Like / Save toggles (interactive on client only) -->
    <ClientOnly>
      <UTooltip
        :text="
          isLoggedIn ? (liked ? 'Unlike' : 'Like') : 'Sign in to like decks'
        "
      >
        <UButton
          :icon="liked ? 'i-lucide-heart' : 'i-lucide-heart'"
          :color="liked ? 'error' : 'neutral'"
          :variant="liked ? 'solid' : 'outline'"
          size="sm"
          class="cursor-pointer"
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
          icon="i-lucide-bookmark"
          :color="saved ? 'primary' : 'neutral'"
          :variant="saved ? 'solid' : 'outline'"
          size="sm"
          class="cursor-pointer"
          :disabled="!isLoggedIn || isTogglingSave"
          :label="String(list.save_count)"
          @click="handleToggleSave"
        />
      </UTooltip>
      <template #fallback>
        <span class="flex items-center gap-1 text-sm">
          <UIcon name="i-lucide-heart" class="w-4 h-4" />
          {{ list.like_count }}
        </span>
        <span class="flex items-center gap-1 text-sm">
          <UIcon name="i-lucide-bookmark" class="w-4 h-4" />
          {{ list.save_count }}
        </span>
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
