<template>
  <div
    class="flex flex-wrap items-center gap-2 mb-4 p-3 border border-black-300 dark:border-gray-400 rounded-lg bg-white/60 dark:bg-black/40"
  >
    <!-- Article author link -->
    <NuxtLink
      :to="`/user/${article.user_id}`"
      class="flex items-center gap-3 mr-auto rounded-lg cursor-pointer group min-w-0"
    >
      <img
        v-if="article.avatar_card_name"
        :src="`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(article.avatar_card_name)}&format=image&version=art_crop`"
        :alt="article.username ?? 'User'"
        class="w-10 h-10 rounded-full object-cover"
      />
      <UIcon v-else name="i-lucide-user" class="w-10 h-10 opacity-50" />
      <div class="min-w-0">
        <p
          class="font-semibold truncate group-hover:text-primary transition-colors"
        >
          {{ article.username || 'Anonymous' }}
        </p>
        <p class="text-xs opacity-60">
          {{ formatShortDate(article.published_at ?? article.created_at) }}
        </p>
      </div>
    </NuxtLink>

    <!-- Like toggle (interactive on client only) -->
    <ClientOnly>
      <USkeleton v-if="isLoggedIn && isLoadingSocialState" class="h-8 w-14" />
      <UTooltip
        v-else
        :text="
          isLoggedIn ? (liked ? 'Unlike' : 'Like') : 'Sign in to like articles'
        "
      >
        <UButton
          data-testid="article-like-button"
          icon="i-lucide-heart"
          :color="liked ? 'error' : 'neutral'"
          :variant="liked ? 'solid' : 'outline'"
          size="sm"
          class="cursor-pointer"
          :disabled="!isLoggedIn || isTogglingLike"
          :label="String(article.like_count)"
          @click="handleToggleLike"
        />
      </UTooltip>
      <template #fallback>
        <USkeleton class="h-8 w-14" />
      </template>
    </ClientOnly>

    <!-- Read-only stats -->
    <span class="flex items-center gap-1 text-sm ml-2 opacity-80">
      <UIcon name="i-lucide-message-circle" class="w-4 h-4" />
      {{ article.comment_count }}
      {{ article.comment_count === 1 ? 'comment' : 'comments' }}
    </span>
    <span class="flex items-center gap-1 text-sm opacity-80">
      <UIcon name="i-lucide-eye" class="w-4 h-4" />
      {{ article.view_count }}
      {{ article.view_count === 1 ? 'view' : 'views' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useArticleSocial } from '~/composables/useArticleSocial';
import { formatShortDate } from '~/utils/dateFormatter';
import { useToast } from '#imports';
import type { Article, ArticleSummary } from '~/models/articleModel';

const props = defineProps<{ article: Article | ArticleSummary }>();

const toast = useToast();
const articleIdRef = computed(() => props.article.id);
const { isLoggedIn, liked, isLoadingSocialState, toggleLike, isTogglingLike } =
  useArticleSocial(articleIdRef);

async function handleToggleLike() {
  try {
    await toggleLike(!liked.value);
  } catch {
    toast.add({
      title: 'Failed to update like',
      color: 'error',
      icon: 'i-lucide-circle-x',
    });
  }
}
</script>
