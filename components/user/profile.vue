<script setup lang="ts">
import { useUserProfile } from '~/composables/useUserProfile'
import { useSupabase } from '~/composables/useSupabase'

const supabase = useSupabase()
const { userProfile, loading, signOut } = useUserProfile()

const username = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const updateLoading = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Initialize username from user metadata or email
watchEffect(() => {
  if (userProfile.value) {
    username.value = userProfile.value.user_metadata?.username || userProfile.value.email?.split('@')[0] || ''
  }
})

const updateUsername = async () => {
  if (!username.value.trim()) {
    errorMessage.value = 'Username cannot be empty'
    return
  }

  updateLoading.value = true
  errorMessage.value = null
  successMessage.value = null

  const { error } = await supabase.auth.updateUser({
    data: { username: username.value }
  })

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

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    return
  }

  updateLoading.value = true

  const { error } = await supabase.auth.updateUser({
    password: newPassword.value
  })

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
  <div class="flex flex-col space-y-6 max-w-2xl mx-auto p-6">
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
        <div
          class="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <UIcon name="i-lucide-user" class="w-12 h-12 text-white" />
        </div>
        <div class="flex flex-col">
          <p class="text-lg font-semibold text-white">{{ username }}</p>
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
</template>
