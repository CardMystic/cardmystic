<template>
  <UContainer class="mb-10 mt-6 max-w-full">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl md:text-4xl font-bold">{{ pageHeading }}</h1>
      <UButton
        v-if="isAuthor"
        icon="i-lucide-plus"
        color="primary"
        label="New Article"
        class="cursor-pointer"
        :loading="isCreating"
        @click="handleCreate"
      />
    </div>

    <ClientOnly>
      <!-- Non-authors: liked articles are the entire page. -->
      <template v-if="!isAuthor">
        <div
          v-if="isLoadingLiked"
          class="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <USkeleton v-for="i in 6" :key="i" class="article-skeleton" />
        </div>

        <div
          v-else-if="likedArticles.length > 0"
          class="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <ArticleCard
            v-for="article in likedArticles"
            :key="article.id"
            :article="article"
          />
        </div>

        <div v-else class="empty-state">
          <UIcon name="i-lucide-heart-off" class="text-5xl opacity-30 mb-3" />
          <p class="mb-4">You haven't liked any articles yet.</p>
          <UButton to="/explore/articles" color="primary" variant="soft">
            Browse Articles
          </UButton>
        </div>
      </template>

      <!-- Authors: their own articles first, then a collapsible liked section. -->
      <template v-else>
        <div v-if="isLoadingMine" class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <USkeleton v-for="i in 6" :key="i" class="article-skeleton" />
        </div>

        <div
          v-else-if="myArticles.length > 0"
          class="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <ArticleCard
            v-for="article in myArticles"
            :key="article.id"
            :article="article"
          />
        </div>

        <div v-else class="empty-state">
          <UIcon name="i-lucide-newspaper" class="text-5xl opacity-30 mb-3" />
          <p class="mb-4">You haven't written any articles yet.</p>
          <UButton
            color="primary"
            variant="soft"
            class="cursor-pointer"
            :loading="isCreating"
            @click="handleCreate"
          >
            Write Your First Article
          </UButton>
        </div>

        <div v-if="!isLoadingMine" class="mt-10 space-y-4">
          <USkeleton v-if="isLoadingLiked" class="h-8 w-full" />

          <UCollapsible v-else-if="likedArticles.length > 0">
            <UButton
              :label="`Liked Articles (${likedArticles.length})`"
              icon="i-lucide-heart"
              trailing-icon="i-lucide-chevron-down"
              color="neutral"
              variant="outline"
              class="cursor-pointer"
              block
            />
            <template #content>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                <ArticleCard
                  v-for="article in likedArticles"
                  :key="article.id"
                  :article="article"
                />
              </div>
            </template>
          </UCollapsible>
        </div>
      </template>

      <template #fallback>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <USkeleton v-for="i in 6" :key="i" class="article-skeleton" />
        </div>
      </template>
    </ClientOnly>
  </UContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  useArticleMutations,
  useLikedArticles,
  useMyArticles,
} from '~/composables/useArticles';
import { useUserProfile } from '~/composables/useUserProfile';
import { useToast } from '#imports';
import ArticleCard from '~/components/articles/ArticleCard.vue';

definePageMeta({
  title: 'My Articles',
  middleware: 'auth',
});

useSeoMeta({
  title: 'My Articles | CardMystic',
  robots: 'noindex, nofollow',
});

const router = useRouter();
const toast = useToast();
const { profileData } = useUserProfile();
const isAuthor = computed(() => !!profileData.value?.is_author);
const pageHeading = computed(() =>
  isAuthor.value ? 'My Articles' : 'Liked Articles',
);

// Author-only: their own articles (drafts included).
const { articles: myArticles, isLoading: isLoadingMine } =
  useMyArticles(isAuthor);
// Everyone (logged-in): articles the user has liked.
const { articles: likedArticles, isLoading: isLoadingLiked } =
  useLikedArticles();
const { createArticle, isCreating } = useArticleMutations();

// Creates an untitled draft and jumps straight into the editor.
async function handleCreate() {
  try {
    const { article } = await createArticle({
      title: 'Untitled article',
      description: '',
      content: '',
      imageUrl: null,
      isPublished: false,
    });
    router.push(`/articles/${article.id}/edit`);
  } catch (e: any) {
    toast.add({
      title: 'Error creating article',
      description: e?.message,
      color: 'error',
    });
  }
}
</script>

<style scoped lang="sass">
.article-skeleton
  height: 300px
  border-radius: 0.5rem

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
