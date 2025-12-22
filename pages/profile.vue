<script setup lang="ts">
import UserProfile from '~/components/user/profile.vue'
import { useUserProfile } from '~/composables/useUserProfile'

const { userProfile, fetchUser } = useUserProfile()

// Fetch user on page load
onMounted(async () => {
  await fetchUser()

  // Redirect to home if not logged in
  if (!userProfile.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <UserProfile v-if="userProfile" />
    <div v-else class="flex items-center justify-center min-h-screen">
      <p class="text-white">Loading...</p>
    </div>
  </div>
</template>
