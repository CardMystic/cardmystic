<script setup lang="ts"></script>

<template>
  <!-- Skeleton Loading State -->
  <div class="rounded-xl p-6 shadow-xl">
    <!-- Identity + Patreon header skeleton -->
    <div
      class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6 pb-6"
    >
      <div class="flex items-center space-x-4">
        <USkeleton class="w-24 h-24 rounded-full" />
        <div class="flex flex-col space-y-2">
          <USkeleton class="h-6 w-40" />
          <USkeleton class="h-4 w-60" />
        </div>
      </div>
      <div class="space-y-3 lg:max-w-sm">
        <USkeleton class="h-6 w-44" />
        <USkeleton class="h-10 w-40" />
      </div>
    </div>

    <!-- Username + Email sections skeleton -->
    <div class="grid gap-6 md:grid-cols-2 mb-6 pb-6">
      <div class="space-y-4">
        <USkeleton class="h-6 w-40" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-10 w-40" />
      </div>
      <div class="space-y-4">
        <USkeleton class="h-6 w-40" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-10 w-40" />
      </div>
    </div>

    <!-- Password Section Skeleton -->
    <div class="space-y-4 mb-6 pb-6">
      <USkeleton class="h-6 w-40" />
      <div class="grid gap-4 md:grid-cols-3">
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-12 w-full" />
        <USkeleton class="h-12 w-full" />
      </div>
      <USkeleton class="h-10 w-40" />
    </div>

    <!-- Footer (contact + sign out) skeleton -->
    <div class="flex items-center justify-between gap-4">
      <USkeleton class="h-4 w-64" />
      <USkeleton class="h-10 w-28" />
    </div>
  </div>
</template>

<style scoped></style>
