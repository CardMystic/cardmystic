<template>
  <UContainer class="mb-10 mt-6 max-w-full">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl md:text-4xl font-bold">My Articles</h1>
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
      <!-- Not an author -->
      <div v-if="!isAuthor" class="empty-state">
        <UIcon name="i-lucide-pen-off" class="text-5xl opacity-30 mb-3" />
        <p class="mb-4">
          Only approved authors can write articles. Interested in writing for
          CardMystic? Reach out to us on Discord!
        </p>
        <UButton to="/explore/articles" color="primary" variant="soft">
          Browse Articles
        </UButton>
      </div>

      <div v-else-if="isLoading" class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <USkeleton v-for="i in 6" :key="i" class="article-skeleton" />
      </div>

      <div
        v-else-if="articles.length > 0"
        class="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <ArticleCard
          v-for="article in articles"
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
import { useArticleMutations, useMyArticles } from '~/composables/useArticles';
import { useUserProfile } from '~/composables/useUserProfile';
import { useToast } from '#imports';
import ArticleCard from '~/components/articles/ArticleCard.vue';

definePageMeta({ title: 'My Articles' });

useSeoMeta({
  title: 'My Articles | CardMystic',
  robots: 'noindex, nofollow',
});

const router = useRouter();
const toast = useToast();
const { profileData } = useUserProfile();
const isAuthor = computed(() => !!profileData.value?.is_author);

const { articles, isLoading } = useMyArticles();
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
