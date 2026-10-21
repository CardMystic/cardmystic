<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'fullscreen',
});

import {
  useFollows,
  useFollowingList,
  useAccountStats,
} from '~/composables/useFollows';
import { useToast } from '#imports';
import { formatShortDate } from '~/utils/dateFormatter';

const toast = useToast();
const { setFollow, isSettingFollow } = useFollows();
const {
  following,
  isLoadingFollowing,
  followingError,
  refetchFollowing,
  isFetchingNextPage,
  fetchNextPage,
  hasNextPage,
} = useFollowingList();
const { stats, isLoading: isLoadingStats } = useAccountStats();
const {
  access,
  pending: membershipPending,
  error: membershipError,
  refresh: refreshMembership,
} = useSearchAccess();

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
      class="w-full max-w-6xl mx-auto px-4 pt-24 pb-10 relative z-10 grid gap-6 lg:grid-cols-5 items-start"
    >
      <section
        aria-label="Account info"
        class="lg:col-span-3 lg:col-start-3 lg:row-start-3 min-w-0"
      >
        <Profile />
      </section>

      <!-- Account Stats strip -->
      <UCard
        class="shadow-2xl lg:col-span-5 lg:row-start-1"
        role="region"
        aria-label="Account stats"
      >
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

      <UCard
        class="shadow-2xl lg:col-span-2 lg:row-start-2 lg:row-span-2 min-w-0"
        role="region"
        aria-label="Following"
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
          <div
            v-else-if="followingError && !following.length"
            class="space-y-3"
          >
            <p>We couldn't load the people you follow.</p>
            <UButton
              label="Retry following"
              color="neutral"
              variant="outline"
              @click="refetchFollowing()"
            />
          </div>
          <p
            v-else-if="following.length === 0"
            class="text-sm opacity-70 italic"
          >
            You aren't following anyone yet. Find users on the
            <NuxtLink to="/explore/users" class="text-primary hover:underline">
              explore page</NuxtLink
            >!
          </p>
          <div
            v-else
            ref="followingScrollRef"
            class="space-y-2 max-h-104 overflow-y-auto pr-1"
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

      <UCard
        role="region"
        aria-label="Your membership"
        class="shadow-2xl lg:col-span-3 lg:col-start-3 lg:row-start-2 min-w-0"
      >
        <h2 class="text-xl font-bold flex items-center gap-2 mb-4">
          <UIcon name="i-lucide-credit-card" class="w-5 h-5" />
          Your membership
        </h2>
        <ClientOnly>
          <div v-if="membershipError" class="space-y-3 mb-4">
            <p>We couldn't check your membership.</p>
            <UButton
              label="Retry membership"
              color="neutral"
              variant="outline"
              @click="refreshMembership()"
            />
          </div>
          <p v-else-if="membershipPending" class="text-muted mb-4">
            Checking your membership…
          </p>
          <p v-else-if="!access?.enabled" class="text-muted mb-4">
            Search memberships are currently unavailable.
          </p>
          <div v-else class="space-y-1 mb-4" aria-live="polite">
            <p class="font-semibold">
              {{ access.tier === 'enhanced' ? 'Enhanced' : 'Normal' }}
            </p>
            <p v-if="access.tier === 'enhanced'">
              Unlimited Enhanced searches.
            </p>
            <p v-else>
              {{ access.enhancedRemaining }} free Enhanced searches left today.
            </p>
            <p v-if="access.enhancedTopUpRemaining > 0" class="text-muted">
              {{ access.enhancedTopUpRemaining }} purchased search credits
              remaining.
            </p>
          </div>
          <template #fallback
            ><p class="text-muted mb-4">Checking your membership…</p></template
          >
        </ClientOnly>
        <UButton to="/memberships" label="Search membership and billing" />
      </UCard>
    </div>
  </SpaceBackground>
</template>
