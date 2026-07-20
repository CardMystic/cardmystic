<template>
  <UContainer class="mb-10 mt-6 max-w-4xl">
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
          class="absolute inset-0 bg-cover bg-center opacity-40 dark:opacity-30"
          :style="{ backgroundImage: `url(${bannerImageUrl})` }"
        ></div>
        <div
          class="absolute inset-0 bg-linear-to-t from-white/80 via-white/50 dark:from-black/80 dark:via-black/50 to-transparent"
        ></div>
        <div class="relative p-6 md:p-10 flex items-center gap-3">
          <UIcon name="i-lucide-user-circle-2" class="text-4xl md:text-5xl" />
          <div class="min-w-0">
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
            </div>
          </div>
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

definePageMeta({ title: 'User Profile' });

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ''));

const { profile, decklists, isLoading, error } = usePublicUserProfile(userId);

const bannerImageUrl = computed(() => {
  if (!profile.value?.avatar_card_name) return null;
  return `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(profile.value.avatar_card_name)}&format=image&version=art_crop`;
});

useSeoMeta({
  title: () =>
    profile.value?.username
      ? `${profile.value.username} | CardMystic`
      : 'User Profile | CardMystic',
  description: () =>
    profile.value?.username
      ? `Public decklists shared by ${profile.value.username} on CardMystic.`
      : 'Public CardMystic user profile.',
  robots: 'noindex, follow',
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
