<template>
  <div
    role="status"
    aria-label="Loading printings"
    class="grid grid-cols-2 gap-3 sm:grid-cols-4"
  >
    <div
      v-for="index in 8"
      :key="index"
      aria-hidden="true"
      class="rounded-lg border-2 border-transparent p-2"
    >
      <USkeleton class="aspect-[146/204] w-full rounded-lg" />
      <USkeleton class="mt-2 h-5 w-3/4" />
      <USkeleton class="h-4 w-1/2" />
    </div>
  </div>
</template>
