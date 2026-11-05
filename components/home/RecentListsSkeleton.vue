<template>
  <div aria-label="Loading recent decklists" role="status" aria-busy="true">
    <h2 class="text-2xl md:text-[2rem] font-bold text-center">
      Recent Decklists
    </h2>
    <USkeleton class="h-5 w-64 max-w-full mx-auto mt-1 mb-4" />
    <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2 md:gap-4">
      <CardListLinkSkeleton v-for="i in 3" :key="i" />
    </div>
    <USkeleton class="h-11 w-40 mx-auto mt-4" />
    <div class="flex gap-3 mt-4 justify-center">
      <USkeleton class="h-9 w-32" /><USkeleton class="h-9 w-32" />
    </div>
  </div>
</template>
