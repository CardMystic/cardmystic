<script setup lang="ts">
import { useUserProfile } from '~/composables/useUserProfile'
import { refDebounced } from '@vueuse/core'

const {
  userProfile,
  profileData,
  loading,
  username: computedUsername,
  profileIconUrl,
  signOut,
  fetchProfileData,
  updateProfileAvatar,
  updateUsername: updateUsernameFn,
  updatePassword: updatePasswordFn
} = useUserProfile()

const username = ref(computedUsername.value)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const updateLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Profile icon card selection
const selectedProfileCard = ref(profileData.value?.avatar_card_name || '')
const searchTerm = ref('')
const debouncedSearchTerm = refDebounced(searchTerm, 150)
const profileIconLoading = ref(false)

// Sync username when user profile changes
watch(computedUsername, (newVal) => {
  username.value = newVal
})

// Sync selected card when profile data changes
watch(() => profileData.value?.avatar_card_name, (newVal) => {
  if (newVal) selectedProfileCard.value = newVal
})

// Load card names
const { data: rawCards, status: cardsStatus } = await useFetch('/card-names.min.json', {
  key: 'profile-card-names',
  lazy: true,
  server: false,
  transform: (data: string[]) => data || [],
  default: () => []
})

// Filter cards based on search
const filteredCards = computed(() => {
  if (!debouncedSearchTerm.value || debouncedSearchTerm.value.length < 2) {
    if (selectedProfileCard.value) {
      return [selectedProfileCard.value]
    }
    return []
  }

  const searchLower = debouncedSearchTerm.value.toLowerCase()
  const filtered = [selectedProfileCard.value]

  for (let i = 0; i < rawCards.value.length && filtered.length < 100; i++) {
    const card = rawCards.value[i]
    if (card.toLowerCase().includes(searchLower)) {
      filtered.push(card)
    }
  }

  return filtered
})

const updateProfileCard = async (cardName: string) => {
  if (!cardName) return

  profileIconLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  const { error } = await updateProfileAvatar(cardName)

  profileIconLoading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    selectedProfileCard.value = cardName
    successMessage.value = 'Profile icon updated successfully!'
  }
}

const updateUsername = async () => {
  errorMessage.value = null
  successMessage.value = null

  updateLoading.value = true

  const { error } = await updateUsernameFn(username.value)

  updateLoading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    successMessage.value = 'Username updated successfully!'
  }
}

const updatePassword = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'All password fields are required'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'New passwords do not match'
    return
  }

  updateLoading.value = true

  const { error } = await updatePasswordFn(newPassword.value)

  updateLoading.value = false

  if (error) {
    errorMessage.value = error.message
  } else {
    successMessage.value = 'Password updated successfully!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  }
}

const handleSignOut = async () => {
  await signOut()
  navigateTo('/')
}
</script>

<template>
  <div class="page-wrapper py-4 flex justify-center w-full">
    <!-- Background art layer -->
    <div v-if="profileIconUrl" class="page-background-art" :style="{ backgroundImage: `url(${profileIconUrl})` }"></div>

    <div class="flex flex-col space-y-6 max-w-2xl mx-auto p-6 relative z-10">
    <!-- Skeleton Loading State -->
    <div v-if="loading" class="rounded-xl bg-zinc-900 p-6 shadow-xl">
      <!-- Profile Header Skeleton -->
      <USkeleton class="h-8 w-32 mb-6" />

      <!-- Profile Image and Info Skeleton -->
      <div class="flex items-center space-x-4 mb-6">
        <USkeleton class="w-24 h-24 rounded-full" />
        <div class="flex flex-col space-y-2 flex-1">
          <USkeleton class="h-6 w-40" />
          <USkeleton class="h-4 w-60" />
        </div>
      </div>

      <!-- Username Section Skeleton -->
      <div class="space-y-4 mb-6 pb-6 border-b border-zinc-700">
        <USkeleton class="h-6 w-40" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-10 w-40" />
      </div>

      <!-- Password Section Skeleton -->
      <div class="space-y-4 mb-6 pb-6 border-b border-zinc-700">
        <USkeleton class="h-6 w-40" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-10 w-40" />
      </div>

      <!-- Sign Out Button Skeleton -->
      <USkeleton class="h-10 w-full" />
    </div>

    <!-- Actual Profile Content -->
    <div v-else class="rounded-xl bg-zinc-900 p-6 shadow-xl">
      <h1 class="text-2xl font-bold text-white mb-6">Profile</h1>

      <!-- Profile Image and Basic Info -->
      <div class="flex items-center space-x-4 mb-6">
        <div class="relative w-24 h-24 group">
          <!-- Profile Icon/Image -->
          <div v-if="profileIconUrl"
            class="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 shadow-lg">
            <img :src="profileIconUrl" :alt="profileData?.avatar_card_name || ''" class="w-full h-full object-cover" />
          </div>
          <div v-else
            class="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <UIcon name="i-lucide-user" class="w-12 h-12 text-white" />
          </div>

          <!-- Edit Button Overlay -->
          <UPopover>
            <div
              class="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <UIcon name="i-lucide-pencil" class="w-6 h-6 text-white" />
            </div>

            <template #content>
              <div class="p-4 w-80">
                <h3 class="text-sm font-semibold mb-2">Choose Profile Icon</h3>
                <USelectMenu v-model="selectedProfileCard" v-model:search-term="searchTerm"
                  :loading="cardsStatus === 'pending' || profileIconLoading" :items="filteredCards"
                  placeholder="Search for a card..." icon="i-lucide-search" class="w-full"
                  @update:model-value="updateProfileCard" />
                <p class="text-xs text-zinc-400 mt-2">Search for an MTG card to use as your profile icon</p>
              </div>
            </template>
          </UPopover>
        </div>
        <div class="flex flex-col">
          <p class="text-lg font-semibold text-white">{{ computedUsername }}</p>
          <p class="text-sm text-zinc-400">{{ userProfile?.email }}</p>
        </div>
      </div>

      <!-- Update Username -->
      <div class="space-y-4 mb-6 pb-6 border-b border-zinc-700">
        <h2 class="text-lg font-semibold text-white">Update Username</h2>
        <UInput v-model="username" type="text" placeholder="Username" size="lg" class="w-full" />
        <UButton color="primary" variant="solid" size="md" :loading="updateLoading" :disabled="updateLoading"
          @click="updateUsername">
          Update Username
        </UButton>
      </div>

      <!-- Update Password -->
      <div class="space-y-4 mb-6 pb-6 border-b border-zinc-700">
        <h2 class="text-lg font-semibold text-white">Update Password</h2>
        <UInput v-model="currentPassword" type="password" placeholder="Current Password" size="lg" class="w-full" />
        <UInput v-model="newPassword" type="password" placeholder="New Password" size="lg" class="w-full" />
        <UInput v-model="confirmPassword" type="password" placeholder="Confirm New Password" size="lg" class="w-full" />
        <UButton color="primary" variant="solid" size="md" :loading="updateLoading" :disabled="updateLoading"
          @click="updatePassword">
          Update Password
        </UButton>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="mb-4">
        <p class="text-red-400 text-sm">{{ errorMessage }}</p>
      </div>
      <div v-if="successMessage" class="mb-4">
        <p class="text-green-400 text-sm">{{ successMessage }}</p>
      </div>

      <!-- Sign Out Button -->
      <UButton color="error" variant="outline" size="md" @click="handleSignOut" class="w-full">
        Sign Out
      </UButton>
    </div>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  position: relative;
  min-height: 100vh;
}

.page-background-art {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.2;
  pointer-events: none;
  z-index: 0;
  filter: blur(8px);
  transform: scale(1.1);
}
</style>
