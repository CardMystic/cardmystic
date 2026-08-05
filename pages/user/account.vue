<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'fullscreen',
});

import { useFollows, useAccountStats } from '~/composables/useFollows';
import { useToast } from '#imports';
import { formatShortDate } from '~/utils/dateFormatter';

const toast = useToast();
const { following, isLoadingFollowing, setFollow, isSettingFollow } =
  useFollows();
const { stats, isLoading: isLoadingStats } = useAccountStats();

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
</script>

<template>
  <SpaceBackground class="flex justify-center">
    <div class="w-full space-y-6 py-8 relative z-10">
      <!-- Account Stats -->
      <UCard class="shadow-2xl mt-6">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5" />
          Account Stats
        </h2>
        <ClientOnly>
          <div
            v-if="isLoadingStats"
            class="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <USkeleton v-for="i in 8" :key="i" class="h-16 w-full" />
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          <p v-if="stats?.memberSince" class="text-xs opacity-60 mt-3">
            Member since {{ formatShortDate(stats.memberSince) }}
          </p>
          <template #fallback>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <USkeleton v-for="i in 8" :key="i" class="h-16 w-full" />
            </div>
          </template>
        </ClientOnly>
      </UCard>

      <!-- Following -->
      <UCard class="shadow-2xl">
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-5 h-5" />
          Following
        </h2>
        <ClientOnly>
          <div v-if="isLoadingFollowing" class="space-y-2">
            <USkeleton v-for="i in 3" :key="i" class="h-14 w-full" />
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
          <div v-else class="space-y-2">
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
          </div>
          <template #fallback>
            <div class="space-y-2">
              <USkeleton v-for="i in 3" :key="i" class="h-14 w-full" />
            </div>
          </template>
        </ClientOnly>
      </UCard>

      <!-- Profile settings (avatar, username, email, password, sign out) -->
      <Profile />
    </div>
  </SpaceBackground>
</template>
