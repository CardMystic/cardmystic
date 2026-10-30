<script setup lang="ts"></script>

<template>
  <!-- Skeleton Loading State -->
  <UCard class="shadow-2xl" aria-hidden="true">
    <!-- Profile identity skeleton -->
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 pb-6 border-b"
    >
      <div class="flex items-center space-x-4">
        <USkeleton class="w-24 h-24 shrink-0 rounded-full" />
        <div class="flex min-w-0 flex-1 flex-col space-y-2">
          <USkeleton class="h-6 w-40" />
          <USkeleton class="h-4 w-60 max-w-full" />
        </div>
      </div>
    </div>

    <!-- Username + Email sections skeleton -->
    <div class="grid gap-6 md:grid-cols-2 mb-6 pb-6 border-b">
      <div class="space-y-4">
        <USkeleton class="h-6 w-40" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-8 w-40" />
      </div>
      <div class="space-y-4">
        <USkeleton class="h-6 w-40" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-8 w-40" />
      </div>
    </div>

    <!-- Password Section Skeleton -->
    <div class="space-y-4 mb-6 pb-6 border-b">
      <USkeleton class="h-6 w-40" />
      <div class="grid gap-4 md:grid-cols-3">
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>
      <USkeleton class="h-8 w-40" />
    </div>

    <!-- Footer (contact + sign out) skeleton -->
    <div class="flex items-center justify-between gap-4">
      <USkeleton class="h-4 w-64 max-w-full" />
      <USkeleton class="h-8 w-20 shrink-0" />
    </div>
  </UCard>
</template>

<style scoped></style>
