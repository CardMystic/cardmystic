<script setup lang="ts">
</script>

<template>
  <!-- Skeleton Loading State -->
  <div class="rounded-xl p-6 shadow-xl">
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
    <div class="space-y-4 mb-6 pb-6 border-b">
      <USkeleton class="h-6 w-40" />
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-10 w-40" />
    </div>

    <!-- Password Section Skeleton -->
    <div class="space-y-4 mb-6 pb-6 border-b">
      <USkeleton class="h-6 w-40" />
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-10 w-40" />
    </div>

    <!-- Sign Out Button Skeleton -->
    <USkeleton class="h-10 w-full" />
  </div>
</template>

<style scoped></style>
