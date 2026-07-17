<template>
  <NuxtLink
    :to="`/user/${profile.id}`"
    class="relative block border border-black-300 dark:border-gray-400 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group"
  >
    <div
      v-if="bannerImageUrl"
      class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 dark:opacity-50 dark:group-hover:opacity-80 transition-opacity"
      :style="{ backgroundImage: `url(${bannerImageUrl})` }"
    ></div>
    <div
      class="absolute inset-0 bg-linear-to-t from-white/80 via-white/40 dark:from-black/80 dark:via-black/40 to-transparent"
    ></div>

    <div class="relative p-3 md:p-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 min-w-0">
        <UIcon name="i-lucide-user" class="w-5 h-5 shrink-0" />
        <span class="font-semibold truncate">
          {{ profile.username || 'Anonymous' }}
        </span>
        <UBadge
          v-if="profile.is_featured"
          color="primary"
          variant="soft"
          size="xs"
        >
          Featured
        </UBadge>
      </div>
      <UIcon name="i-lucide-chevron-right" class="w-4 h-4 shrink-0" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PublicProfile } from '~/models/userModel';

const props = defineProps<{ profile: PublicProfile }>();

const bannerImageUrl = computed(() => {
  if (!props.profile.avatar_card_name) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(props.profile.avatar_card_name)}&format=image&version=art_crop`;
});
</script>
