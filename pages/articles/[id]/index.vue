<template>
  <UContainer class="mb-10 mt-6 w-full">
    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <USkeleton class="h-64 w-full rounded-lg" />
      <USkeleton class="h-10 w-2/3" />
      <USkeleton class="h-40 w-full" />
    </div>

    <!-- Not found -->
    <div v-else-if="!article" class="empty-state">
      <UIcon name="i-lucide-file-x" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">This article doesn't exist or isn't published.</p>
      <UButton to="/explore/articles" color="primary" variant="soft">
        Browse Articles
      </UButton>
    </div>

    <template v-else>
      <!-- Cover image banner -->
      <div
        v-if="article.image_url"
        class="w-full h-48 md:h-72 rounded-lg overflow-hidden mb-6"
      >
        <img
          :src="article.image_url"
          :alt="article.title"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Title / description -->
      <div class="mb-4">
        <div class="flex items-start justify-between gap-3">
          <h1 class="text-3xl md:text-4xl font-bold mb-2">
            {{ article.title }}
          </h1>
          <div class="flex items-center gap-2 shrink-0">
            <UBadge
              v-if="!article.is_published"
              color="warning"
              variant="solid"
              label="Draft"
            />
            <UButton
              v-if="isOwner"
              :to="`/articles/${article.id}/edit`"
              icon="i-lucide-pencil"
              color="primary"
              variant="outline"
              label="Edit"
              class="cursor-pointer"
            />
          </div>
        </div>
        <p v-if="article.description" class="text-base opacity-80">
          {{ article.description }}
        </p>
      </div>

      <!-- Social bar (author, likes, comments, views) -->
      <ArticleSocialBar :article="article" />

      <!-- Markdown content -->
      <ClientOnly>
        <MarkdownEditor
          :model-value="article.content"
          :editable="false"
          :has-background="false"
          empty-message="This article has no content yet."
        />
        <template #fallback>
          <USkeleton class="h-96 w-full rounded-md" />
        </template>
      </ClientOnly>

      <!-- Comments -->
      <ArticleComments
        v-if="article.is_published"
        :article-id="article.id"
        :is-article-owner="isOwner"
      />
    </template>
  </UContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useArticle, useArticleViewTracker } from '~/composables/useArticles';
import { useUserProfile } from '~/composables/useUserProfile';
import ArticleSocialBar from '~/components/articles/ArticleSocialBar.vue';
import ArticleComments from '~/components/articles/ArticleComments.vue';
import MarkdownEditor from '~/components/lists/MarkdownEditor.vue';

const route = useRoute();
const articleId = computed(() => String(route.params.id));

const { article, isLoading } = useArticle(articleId);
const { userProfile } = useUserProfile();

const isOwner = computed(
  () => !!article.value && article.value.user_id === userProfile.value?.id,
);

// Record a view once the article resolves as published
useArticleViewTracker(
  articleId,
  computed(() => article.value?.is_published ?? false),
);

useSeoMeta({
  title: () =>
    article.value ? `${article.value.title} | CardMystic` : 'Article',
  description: () => article.value?.description || undefined,
});
</script>

<style scoped lang="sass">
.empty-state
  text-align: center
  padding: 3rem 1.5rem
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-radius: 1rem
  border: 1px dashed rgba(147, 114, 255, 0.3)
  background: rgba(147, 114, 255, 0.02)
</style>
