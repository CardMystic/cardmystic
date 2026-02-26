<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

</script>

<template>
  <div class="w-full flex justify-center">
    <Profile />
  </div>
</template>
