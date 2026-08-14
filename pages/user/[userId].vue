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
import CardListLink from '~/components/lists/CardListLink.vue';
import FollowButton from '~/components/user/FollowButton.vue';
import { safeJsonLd } from '~/utils/safeJsonLd';

definePageMeta({ title: 'User Profile' });

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ''));

const { profile, decklists, isLoading, error } = usePublicUserProfile(userId);

const bannerImageUrl = computed(() => {
  if (!profile.value?.avatar_card_name) return null;
  return scryfallArtCropUrl(profile.value.avatar_card_name);
});

// ---- SEO ----
const FALLBACK_OG_IMAGE = 'https://cardmystic.com/cardmystic_cards.png';

const canonicalUrl = computed(
  () => `https://cardmystic.com/user/${userId.value}`,
);

const seoTitle = computed(() =>
  profile.value?.username
    ? `${profile.value.username} | MTG Decklists | CardMystic`
    : 'User Profile | CardMystic',
);

const seoDescription = computed(() => {
  if (!profile.value) {
    return 'Explore Magic: The Gathering decklists shared by the CardMystic community.';
  }
  const name = profile.value.username || 'This user';
  const deckCount = decklists.value.length;
  const followerCount = profile.value.follower_count ?? 0;
  const deckPart =
    deckCount > 0
      ? `${deckCount} public MTG decklist${deckCount === 1 ? '' : 's'}`
      : 'Magic: The Gathering community member';
  const followerPart =
    followerCount > 0
      ? `${followerCount} follower${followerCount === 1 ? '' : 's'}.`
      : '';
  return `${name} on CardMystic — ${deckPart}. ${followerPart}`.trim();
});

const seoImage = computed(() => bannerImageUrl.value || FALLBACK_OG_IMAGE);

// Profiles that exist and have a username are indexable so search engines
// can surface community authors. Anonymous / missing profiles stay out.
const seoRobots = computed(() =>
  profile.value?.username ? 'index, follow' : 'noindex, follow',
);

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  robots: () => seoRobots.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: 'profile',
  ogUrl: () => canonicalUrl.value,
  ogImage: () => seoImage.value,
  ogImageAlt: () =>
    profile.value?.username
      ? `${profile.value.username}'s profile art on CardMystic`
      : 'CardMystic user profile',
  ogSiteName: 'CardMystic',
  profileUsername: () => profile.value?.username || undefined,
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => seoImage.value,
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
            image: seoImage.value,
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
