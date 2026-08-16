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
        class="mb-6 flex justify-center overflow-hidden rounded-lg"
      >
        <img
          :src="article.image_url"
          :alt="article.title"
          class="max-h-96 max-w-full w-auto h-auto rounded-lg"
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
import { ArticleResponseSchema } from '~/models/articleModel';
import ArticleSocialBar from '~/components/articles/ArticleSocialBar.vue';
import ArticleComments from '~/components/articles/ArticleComments.vue';
import MarkdownEditor from '~/components/lists/MarkdownEditor.vue';
import { safeJsonLd } from '~/utils/safeJsonLd';
import { buildArticleSeo } from '~/utils/seoMeta';

const route = useRoute();
const articleId = computed(() => String(route.params.id));

// SSR-seed vue-query so link unfurlers see the real title/cover in the HTML.
await useSsrQuerySeed({
  cacheKey: `article-ssr-${articleId.value}`,
  path: `/articles/view/${encodeURIComponent(articleId.value)}`,
  schema: ArticleResponseSchema,
  queryKey: ['articles', 'view', articleId.value],
});

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

const canonicalUrl = computed(
  () => `https://cardmystic.com/articles/${articleId.value}`,
);

const seo = computed(() => buildArticleSeo(article.value));

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description,
  robots: () => seo.value.robots,
  ogTitle: () => seo.value.title,
  ogDescription: () => seo.value.description,
  ogType: 'article',
  ogUrl: () => canonicalUrl.value,
  ogImage: () => seo.value.image,
  ogImageAlt: () => seo.value.imageAlt,
  ogSiteName: 'CardMystic',
  articleAuthor: () =>
    article.value?.username ? [article.value.username] : undefined,
  articlePublishedTime: () => article.value?.published_at || undefined,
  articleModifiedTime: () =>
    article.value?.updated_at || article.value?.published_at || undefined,
  articleSection: 'Magic: The Gathering',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterImage: () => seo.value.image,
});

useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: () => {
        if (!article.value || !article.value.is_published) return '';
        const authorUrl = article.value.user_id
          ? `https://cardmystic.com/user/${article.value.user_id}`
          : undefined;
        return safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: article.value.title,
          description: seo.value.description,
          image: seo.value.image,
          url: canonicalUrl.value,
          datePublished: article.value.published_at ?? undefined,
          dateModified:
            article.value.updated_at ?? article.value.published_at ?? undefined,
          author: article.value.username
            ? {
                '@type': 'Person',
                name: article.value.username,
                url: authorUrl,
              }
            : undefined,
          publisher: {
            '@type': 'Organization',
            name: 'CardMystic',
            logo: {
              '@type': 'ImageObject',
              url: 'https://cardmystic.com/wizard.webp',
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': canonicalUrl.value,
          },
          articleSection: 'Magic: The Gathering',
          interactionStatistic: [
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/LikeAction',
              userInteractionCount: article.value.like_count,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/CommentAction',
              userInteractionCount: article.value.comment_count,
            },
            {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/ViewAction',
              userInteractionCount: article.value.view_count,
            },
          ],
        });
      },
    },
  ],
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
