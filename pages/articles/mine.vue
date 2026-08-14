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

    <!-- Authors get a top-level toggle between their own articles and liked. -->
    <div v-if="isAuthor" class="flex flex-wrap gap-2 mb-6">
      <UButton
        :color="view === 'mine' ? 'primary' : 'neutral'"
        :variant="view === 'mine' ? 'solid' : 'outline'"
        icon="i-lucide-newspaper"
        label="View My Articles"
        class="cursor-pointer"
        @click="setView('mine')"
      />
      <UButton
        :color="view === 'liked' ? 'primary' : 'neutral'"
        :variant="view === 'liked' ? 'solid' : 'outline'"
        icon="i-lucide-heart"
        label="View Liked Articles"
        class="cursor-pointer"
        @click="setView('liked')"
      />
    </div>

    <ClientOnly>
      <!-- My Articles view -->
      <template v-if="view === 'mine'">
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

        <div v-if="mineTotalPages > 1" class="mt-6 flex justify-center">
          <UPagination
            v-model:page="minePage"
            :total="mineTotalCount"
            :items-per-page="pageSize"
          />
        </div>
      </template>

      <!-- Liked Articles view -->
      <template v-else>
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

        <div v-if="likedTotalPages > 1" class="mt-6 flex justify-center">
          <UPagination
            v-model:page="likedPage"
            :total="likedTotalCount"
            :items-per-page="pageSize"
          />
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
import { computed, ref, watch } from 'vue';
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
// Non-authors are locked into the Liked view; authors default to their own.
const view = ref<'mine' | 'liked'>('mine');
watch(
  isAuthor,
  (author) => {
    if (!author) view.value = 'liked';
  },
  { immediate: true },
);
const pageHeading = computed(() =>
  view.value === 'mine' ? 'My Articles' : 'Liked Articles',
);

const pageSize = 50;
const minePage = ref(1);
const likedPage = ref(1);
function setView(next: 'mine' | 'liked') {
  view.value = next;
}

const {
  articles: myArticles,
  totalCount: mineTotalCount,
  totalPages: mineTotalPages,
  isLoading: isLoadingMine,
} = useMyArticles(minePage, isAuthor, pageSize);

const {
  articles: likedArticles,
  totalCount: likedTotalCount,
  totalPages: likedTotalPages,
  isLoading: isLoadingLiked,
} = useLikedArticles(likedPage, true, pageSize);

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
