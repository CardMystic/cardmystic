<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import UserProfile from '~/components/user/profile.vue'
import { useUserProfile } from '~/composables/useUserProfile'

const { userProfile, loading } = useUserProfile()
</script>

<template>
  <div class="min-h-screen w-full flex justify-center">
    <UserProfile />
  </div>
</template>
