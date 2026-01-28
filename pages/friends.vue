<template>
  <UContainer class="py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Friends</h1>

      <!-- Search Section -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Find Friends</h2>
        </template>

        <div class="space-y-4">
          <div class="flex space-x-2">
            <UInput
              v-model="searchQuery"
              placeholder="Search by username..."
              class="flex-1"
              @keyup.enter="handleSearch"
            />
            <UButton
              color="primary"
              @click="handleSearch"
              :loading="isSearching"
            >
              Search
            </UButton>
          </div>

          <!-- Search Results -->
          <div v-if="searchResults.length > 0" class="space-y-2 mt-4">
            <h3 class="text-sm font-semibold text-gray-600">Search Results</h3>
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img
                    v-if="user.profile_image"
                    :src="user.profile_image"
                    :alt="user.username"
                    class="w-full h-full object-cover"
                  />
                  <UIcon v-else name="i-heroicons-user" class="w-6 h-6 text-gray-400" />
                </div>
                <span class="font-medium">{{ user.username }}</span>
              </div>
              <UButton
                v-if="!user.is_following"
                color="primary"
                @click="handleFollow(user.id)"
                :loading="isFollowing"
              >
                Follow
              </UButton>
              <UButton
                v-else
                color="gray"
                variant="outline"
                @click="handleUnfollow(user.id)"
                :loading="isUnfollowing"
              >
                Unfollow
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Following Section -->
      <UCard class="mb-6">
        <template #header>
          <h2 class="text-xl font-semibold">Following ({{ following?.length || 0 }})</h2>
        </template>

        <div v-if="isLoadingFollowing" class="space-y-3">
          <USkeleton class="h-16" v-for="i in 3" :key="i" />
        </div>

        <div v-else-if="!following || following.length === 0" class="text-center py-8 text-gray-500">
          You're not following anyone yet
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="user in following"
            :key="user.id"
            class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <div class="font-medium">{{ user.following_username }}</div>
                <div class="text-sm text-gray-500">
                  Following since {{ formatDate(user.created_at) }}
                </div>
              </div>
            </div>
            <UButton
              color="gray"
              variant="outline"
              @click="handleUnfollow(user.following_id)"
              :loading="isUnfollowing"
            >
              Unfollow
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Followers Section -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Followers ({{ followers?.length || 0 }})</h2>
        </template>

        <div v-if="isLoadingFollowers" class="space-y-3">
          <USkeleton class="h-16" v-for="i in 3" :key="i" />
        </div>

        <div v-else-if="!followers || followers.length === 0" class="text-center py-8 text-gray-500">
          No followers yet
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="user in followers"
            :key="user.id"
            class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <div class="font-medium">{{ user.following_username }}</div>
                <div class="text-sm text-gray-500">
                  Following you since {{ formatDate(user.created_at) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserFollow } from '~/composables/useUserFollow';
import type { UserSearchResult } from '~/models/userModel';

definePageMeta({
  title: 'Friends',
});

useSeoMeta({
  title: 'Friends | CardMystic',
  description: 'Find and follow friends on CardMystic',
  robots: 'noindex, nofollow',
});

const {
  following,
  followers,
  isLoadingFollowing,
  isLoadingFollowers,
  searchUsers,
  follow,
  unfollow,
  isFollowing,
  isUnfollowing,
} = useUserFollow();

const searchQuery = ref('');
const searchResults = ref<UserSearchResult[]>([]);
const isSearching = ref(false);

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;
  
  isSearching.value = true;
  try {
    searchResults.value = await searchUsers(searchQuery.value);
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    isSearching.value = false;
  }
};

const handleFollow = (userId: string) => {
  follow(userId);
  // Update search results to reflect the new following status
  searchResults.value = searchResults.value.map(user =>
    user.id === userId ? { ...user, is_following: true } : user
  );
};

const handleUnfollow = (userId: string) => {
  unfollow(userId);
  // Update search results to reflect the new following status
  searchResults.value = searchResults.value.map(user =>
    user.id === userId ? { ...user, is_following: false } : user
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>
