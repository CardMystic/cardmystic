<template>
  <NuxtLink
    :to="`/articles/${article.id}`"
    class="flex flex-col border border-black-300 dark:border-gray-400 rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group bg-white/60 dark:bg-black/40"
  >
    <!-- Cover image (top half) -->
    <div class="relative h-40 shrink-0 overflow-hidden">
      <img
        v-if="article.image_url"
        :src="article.image_url"
        :alt="article.title"
        loading="lazy"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-primary/10"
      >
        <UIcon name="i-lucide-newspaper" class="text-5xl opacity-30" />
      </div>
      <UBadge
        v-if="!article.is_published"
        color="warning"
        variant="solid"
        class="absolute top-2 right-2"
        label="Draft"
      />
    </div>

    <!-- Title / description (bottom half) -->
    <div class="flex flex-col grow p-3 md:p-4">
      <h3 class="text-base md:text-lg font-bold mb-1 line-clamp-2">
        {{ article.title }}
      </h3>
      <p
        v-if="article.description"
        class="text-xs md:text-sm opacity-80 line-clamp-2 mb-3"
      >
        {{ article.description }}
      </p>

      <!-- Author + date at the bottom -->
      <div class="mt-auto flex items-center gap-2 min-w-0">
        <img
          v-if="article.avatar_card_name"
          :src="avatarImageUrl"
          :alt="article.username ?? 'Author'"
          class="w-6 h-6 rounded-full object-cover shrink-0"
        />
        <UIcon
          v-else
          name="i-lucide-user"
          class="w-6 h-6 opacity-50 shrink-0"
        />
        <span class="text-xs md:text-sm font-medium truncate">
          {{ article.username || 'Anonymous' }}
        </span>
        <span class="text-xs opacity-60 ml-auto shrink-0">
          {{ formatShortDate(article.published_at ?? article.created_at) }}
        </span>
      </div>

      <!-- Social counts -->
      <div class="flex items-center gap-3 mt-2 text-xs opacity-70">
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-heart" class="w-3.5 h-3.5" />
          {{ article.like_count }}
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-message-circle" class="w-3.5 h-3.5" />
          {{ article.comment_count }}
        </span>
        <span class="flex items-center gap-1">
          <UIcon name="i-lucide-eye" class="w-3.5 h-3.5" />
          {{ article.view_count }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatShortDate } from '~/utils/dateFormatter';
import type { ArticleSummary } from '~/models/articleModel';

const props = defineProps<{ article: ArticleSummary }>();

const avatarImageUrl = computed(() => {
  if (!props.article.avatar_card_name) return undefined;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(props.article.avatar_card_name)}&format=image&version=art_crop`;
});
</script>
