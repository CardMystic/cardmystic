<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

</script>

<template>
  <div class="min-h-screen w-full flex justify-center">
    <Profile />
  </div>
</template>
