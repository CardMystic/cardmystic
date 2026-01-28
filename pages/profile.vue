<script setup lang="ts">
import UserProfile from '~/components/user/profile.vue'
import { useUserProfile } from '~/composables/useUserProfile'

const { userProfile, loading, fetchUser } = useUserProfile()

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
  <div class="min-h-screen w-full flex justify-center">
    <UserProfile />
  </div>
</template>
