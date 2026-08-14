<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'fullscreen',
});

import { useFollows, useAccountStats } from '~/composables/useFollows';
import { useToast } from '#imports';
import { formatShortDate } from '~/utils/dateFormatter';

const toast = useToast();
const route = useRoute();
const router = useRouter();
const {
  following,
  isLoadingFollowing,
  isFetchingNextPage,
  setFollow,
  isSettingFollow,
  fetchNextPage,
  hasNextPage,
} = useFollows();
const { stats, isLoading: isLoadingStats } = useAccountStats();

// Patreon redirects back here with ?patreon=connected|error after the OAuth flow.
onMounted(() => {
  const patreonResult = route.query.patreon;
  if (patreonResult === 'connected') {
    toast.add({ title: 'Patreon account connected!', color: 'success' });
  } else if (patreonResult === 'error') {
    toast.add({
      title: 'Failed to connect Patreon',
      description: 'Please try again.',
      color: 'error',
    });
  }
  if (patreonResult) {
    router.replace({ query: { ...route.query, patreon: undefined } });
  }
});

const statItems = computed(() => {
  if (!stats.value) return [];
  return [
    { label: 'Decks', value: stats.value.deckCount, icon: 'i-lucide-layers' },
    {
      label: 'Public Decks',
      value: stats.value.publicDeckCount,
      icon: 'i-lucide-globe',
    },
    { label: 'Likes', value: stats.value.totalLikes, icon: 'i-lucide-heart' },
    {
      label: 'Saves',
      value: stats.value.totalSaves,
      icon: 'i-lucide-bookmark',
    },
    {
      label: 'Comments',
      value: stats.value.totalComments,
      icon: 'i-lucide-message-circle',
    },
    { label: 'Views', value: stats.value.totalViews, icon: 'i-lucide-eye' },
    {
      label: 'Followers',
      value: stats.value.followerCount,
      icon: 'i-lucide-users',
    },
    {
      label: 'Following',
      value: stats.value.followingCount,
      icon: 'i-lucide-user-plus',
    },
  ];
});

const handleUnfollow = async (userId: string) => {
  try {
    await setFollow(userId, false);
  } catch (error: any) {
    toast.add({
      title: 'Error unfollowing user',
      description: error.message,
      color: 'error',
    });
  }
};

// ---------------------------------------------------------------------------
// Following list: cursor-paginated by the backend. The scroll container has a
// sentinel at the bottom that triggers fetchNextPage when scrolled into view.
// ---------------------------------------------------------------------------
const followingScrollRef = ref<HTMLElement | null>(null);
const followingSentinelRef = ref<HTMLElement | null>(null);
let followingObserver: IntersectionObserver | null = null;

function setupFollowingObserver() {
  followingObserver?.disconnect();
  if (!followingSentinelRef.value) return;
  followingObserver = new IntersectionObserver(
    (entries) => {
      if (
        entries[0]?.isIntersecting &&
        hasNextPage.value &&
        !isFetchingNextPage.value
      ) {
        fetchNextPage();
      }
    },
    { root: followingScrollRef.value, rootMargin: '100px' },
  );
  followingObserver.observe(followingSentinelRef.value);
}

// The sentinel mounts client-side only (inside ClientOnly) and unmounts when
// the list is exhausted, so re-wire the observer whenever the ref changes.
watch(followingSentinelRef, () => setupFollowingObserver());
onBeforeUnmount(() => followingObserver?.disconnect());
</script>

<template>
  <SpaceBackground :full="true">
    <div
      class="w-full max-w-6xl mx-auto px-4 pt-24 pb-10 relative z-10 space-y-6"
    >
      <!-- Account Stats strip -->
      <UCard class="shadow-2xl">
        <div class="flex items-center justify-between gap-2 flex-wrap mb-4">
          <h2 class="text-xl font-bold flex items-center gap-2">
            <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5" />
            Account Stats
          </h2>
          <ClientOnly>
            <p v-if="stats?.memberSince" class="text-xs opacity-60">
              Member since {{ formatShortDate(stats.memberSince) }}
            </p>
          </ClientOnly>
        </div>
        <ClientOnly>
          <div
            v-if="isLoadingStats"
            class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3"
          >
            <USkeleton v-for="i in 8" :key="i" class="h-16 w-full" />
          </div>
          <div
            v-else
            class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3"
          >
            <div
              v-for="item in statItems"
              :key="item.label"
              class="p-3 border border-black-300 dark:border-gray-600 rounded-lg text-center"
            >
              <UIcon :name="item.icon" class="w-4 h-4 opacity-70" />
              <p class="text-lg font-bold">{{ item.value }}</p>
              <p class="text-xs opacity-70">{{ item.label }}</p>
            </div>
          </div>
          <template #fallback>
            <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
              <USkeleton v-for="i in 8" :key="i" class="h-16 w-full" />
            </div>
          </template>
        </ClientOnly>
      </UCard>

      <div class="grid gap-6 lg:grid-cols-5 lg:items-stretch">
        <!-- Following: stretches to match the profile card height on desktop -->
        <UCard
          class="shadow-2xl lg:col-span-2 flex flex-col"
          :ui="{ body: 'flex-1 flex flex-col min-h-0' }"
        >
          <div class="flex items-center justify-between gap-2 mb-4">
            <h2 class="text-xl font-bold flex items-center gap-2">
              <UIcon name="i-lucide-users" class="w-5 h-5" />
              Following
            </h2>
            <ClientOnly>
              <span
                v-if="stats?.followingCount && stats.followingCount > 0"
                class="text-sm opacity-70"
              >
                {{ stats.followingCount }}
              </span>
            </ClientOnly>
          </div>
          <ClientOnly>
            <div v-if="isLoadingFollowing" class="space-y-2">
              <USkeleton v-for="i in 3" :key="i" class="h-14 w-full" />
            </div>
            <p
              v-else-if="following.length === 0"
              class="text-sm opacity-70 italic"
            >
              You aren't following anyone yet. Find users on the
              <NuxtLink
                to="/explore/users"
                class="text-primary hover:underline"
              >
                explore page</NuxtLink
              >!
            </p>
            <div
              v-else
              ref="followingScrollRef"
              class="space-y-2 max-h-104 lg:max-h-none lg:flex-1 min-h-0 overflow-y-auto pr-1"
            >
              <div
                v-for="user in following"
                :key="user.id"
                class="flex items-center gap-2"
              >
                <PublicUserLink :profile="user" class="flex-1 min-w-0" />
                <UButton
                  label="Unfollow"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  class="cursor-pointer shrink-0"
                  :disabled="isSettingFollow"
                  @click="handleUnfollow(user.id)"
                />
              </div>
              <!-- Sentinel: fetches the next page when scrolled into view -->
              <div
                v-if="hasNextPage"
                ref="followingSentinelRef"
                class="flex justify-center py-2"
              >
                <UIcon
                  name="i-lucide-loader-2"
                  class="text-xl animate-spin opacity-60"
                />
              </div>
            </div>
            <template #fallback>
              <div class="space-y-2">
                <USkeleton v-for="i in 3" :key="i" class="h-14 w-full" />
              </div>
            </template>
          </ClientOnly>
        </UCard>

        <!-- Profile settings (avatar, Patreon, username, email, password, sign out) -->
        <Profile class="lg:col-span-3" />
      </div>
    </div>
  </SpaceBackground>
</template>
