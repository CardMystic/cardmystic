<template>
  <UContainer class="mb-10 mt-6 w-full">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-16">
      <USkeleton class="mx-auto h-8 w-64 mb-3" />
      <USkeleton class="mx-auto h-4 w-40" />
    </div>

    <!-- Error / not found -->
    <div v-else-if="error" class="empty-state">
      <UIcon name="i-lucide-user-x" class="text-5xl opacity-30 mb-3" />
      <p class="mb-4">User not found.</p>
      <UButton to="/explore/users" color="primary" variant="soft">
        Find another user
      </UButton>
    </div>

    <!-- Profile -->
    <div v-else-if="profile">
      <div class="relative rounded-lg overflow-hidden mb-6">
        <div
          v-if="bannerImageUrl"
          class="absolute inset-0 bg-cover bg-position-[center_10%] opacity-40 dark:opacity-30"
          :style="{ backgroundImage: `url(${bannerImageUrl})` }"
        ></div>
        <div
          class="absolute inset-0 bg-linear-to-t from-white/80 via-white/50 dark:from-black/80 dark:via-black/50 to-transparent"
        ></div>
        <div class="relative p-6 md:p-10 flex items-center gap-3">
          <UIcon name="i-lucide-user-circle-2" class="text-4xl md:text-5xl" />
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl md:text-4xl font-bold truncate">
              {{ profile.username || 'Anonymous' }}
            </h1>
            <div class="flex items-center gap-2 mt-1">
              <UBadge v-if="profile.is_featured" color="primary" variant="soft">
                Featured
              </UBadge>
              <span class="text-xs md:text-sm opacity-70">
                {{ decklists.length }} public decklist{{
                  decklists.length === 1 ? '' : 's'
                }}
              </span>
              <span class="text-xs md:text-sm opacity-70">
                &middot; {{ profile.follower_count }} follower{{
                  profile.follower_count === 1 ? '' : 's'
                }}
              </span>
            </div>
          </div>
          <FollowButton :user-id="profile.id" class="shrink-0" />
        </div>
      </div>

      <h2 class="text-xl md:text-2xl font-semibold mb-3">Public Decklists</h2>

      <div
        v-if="decklists.length > 0"
        class="grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <CardListLink
          v-for="list in decklists"
          :key="list.id"
          :list="list"
          :showDeleteButton="false"
          :showAuthor="true"
        />
      </div>

      <div v-else class="empty-state">
        <UIcon name="i-lucide-inbox" class="text-5xl opacity-30 mb-3" />
        <p>
          {{ profile.username || 'This user' }} hasn't shared any public
          decklists yet.
        </p>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePublicUserProfile } from '~/composables/useDiscovery';
import { GetUserProfileResponseSchema } from '~/models/userModel';
import CardListLink from '~/components/lists/CardListLink.vue';
import FollowButton from '~/components/user/FollowButton.vue';
import { safeJsonLd } from '~/utils/safeJsonLd';
import { buildUserProfileSeo } from '~/utils/seoMeta';

definePageMeta({ title: 'User Profile' });

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ''));

// SSR-seed vue-query so unfurlers see the real username and avatar art.
await useSsrQuerySeed({
  cacheKey: `user-profile-ssr-${userId.value}`,
  path: `/user/profile/${encodeURIComponent(userId.value)}`,
  schema: GetUserProfileResponseSchema,
  queryKey: ['discovery', 'public-profile', userId.value],
});

const { profile, decklists, isLoading, error } = usePublicUserProfile(userId);

const bannerImageUrl = computed(() => {
  if (!profile.value?.avatar_card_name) return null;
  return scryfallArtCropUrl(profile.value.avatar_card_name);
});

// ---- SEO ----
const canonicalUrl = computed(
  () => `https://cardmystic.com/user/${userId.value}`,
);

const seo = computed(() =>
  buildUserProfileSeo(profile.value ?? null, decklists.value.length),
);

useSeoMeta({
  title: () => seo.value.title,
  description: () => seo.value.description,
  robots: () => seo.value.robots,
  ogTitle: () => seo.value.title,
  ogDescription: () => seo.value.description,
  ogType: 'profile',
  ogUrl: () => canonicalUrl.value,
  ogImage: () => seo.value.image,
  ogImageAlt: () => seo.value.imageAlt,
  ogSiteName: 'CardMystic',
  profileUsername: () => profile.value?.username || undefined,
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
        if (!profile.value?.username) return '';
        return safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: canonicalUrl.value,
          mainEntity: {
            '@type': 'Person',
            name: profile.value.username,
            identifier: profile.value.id,
            image: seo.value.image,
            interactionStatistic: {
              '@type': 'InteractionCounter',
              interactionType: 'https://schema.org/FollowAction',
              userInteractionCount: profile.value.follower_count ?? 0,
            },
          },
          publisher: {
            '@type': 'Organization',
            name: 'CardMystic',
          },
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
