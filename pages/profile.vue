<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import UserProfile from '~/components/user/profile.vue'
</script>

<template>
  <div class="min-h-screen w-full flex justify-center">
    <UserProfile />
  </div>
</template>
