<script setup lang="ts">
const { userId } = useUserProfile();
</script>

<template>
  <div
    class="grid w-full max-w-320 mx-auto grid-cols-1 items-stretch gap-2 lg:grid-cols-[clamp(300px,32%,420px)_minmax(0,1fr)]"
    role="status"
    aria-label="Loading card details"
    aria-busy="true"
  >
    <div class="flex flex-col items-center lg:items-start" aria-hidden="true">
      <USkeleton
        class="aspect-[5/7] h-84 w-60 rounded-2xl lg:h-auto lg:w-full"
      />
      <USkeleton class="mt-2 h-8 w-60 max-w-full rounded-md lg:w-full" />
      <div class="mt-2 hidden w-full gap-2 lg:flex">
        <USkeleton class="h-9 flex-1 rounded-md" />
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="h-9 w-9 shrink-0 rounded-md"
        />
      </div>
      <div class="mt-2 hidden w-full space-y-4 px-0 py-4 lg:px-4 lg:block">
        <USkeleton class="h-7 w-40" />
        <USkeleton class="h-5 w-full" />
        <USkeleton class="h-5 w-full" />
        <USkeleton class="h-5 w-full" />
      </div>
      <USkeleton v-for="action in 2" :key="action" class="mt-2 hidden h-8 w-full rounded-md lg:block" />
    </div>
    <div
      class="card-details-skeleton-info min-w-0 flex flex-col gap-2 px-4 lg:px-0"
      aria-hidden="true"
    >
      <div class="space-y-2">
        <div class="space-y-3 px-0 py-4 lg:px-4">
          <USkeleton class="h-10 w-3/4" />
          <div class="flex items-center gap-3">
            <USkeleton class="h-5 w-32" />
            <USkeleton class="h-6 w-20 rounded-md" />
          </div>
          <USkeleton class="h-6 w-2/3" />
          <USkeleton class="h-8 w-full lg:hidden" />
          <div class="hidden space-y-3 border-t border-default pt-3 lg:block">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="mt-6 h-4 w-1/2" />
          </div>
        </div>
        <div class="flex gap-2 lg:hidden">
          <USkeleton class="h-9 flex-1 rounded-md" />
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-9 w-9 shrink-0 rounded-md"
          />
        </div>
        <USkeleton v-for="action in 2" :key="action" class="h-8 w-full rounded-md lg:hidden" />
      </div>
      <div class="skeleton-strategy">
        <div class="hidden space-y-4 px-0 py-4 lg:px-4 lg:block">
          <USkeleton class="h-7 w-32" />
          <div class="grid grid-cols-2 gap-x-4 gap-y-1">
            <USkeleton
              v-for="i in 18"
              :key="i"
              class="h-4 w-full max-w-36 rounded-sm"
            />
          </div>
        </div>
        <div class="space-y-4 px-0 py-4 lg:px-4">
          <USkeleton class="h-7 w-32" />
          <div v-for="i in 4" :key="i" class="space-y-2">
            <USkeleton class="h-4 w-1/2" />
            <USkeleton class="h-2 w-full rounded-full" />
          </div>
        </div>
        <div class="skeleton-summary-row">
          <div class="p-2">
            <USkeleton
              class="mx-auto aspect-square w-60 max-w-full rounded-full"
            />
          </div>
          <div class="flex items-center px-0 py-0 lg:px-4">
            <div class="w-full space-y-3">
              <USkeleton class="h-6 w-36" />
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-full" />
              <USkeleton class="h-4 w-2/3" />
              <div class="flex flex-wrap gap-1">
                <USkeleton
                  v-for="i in 6"
                  :key="i"
                  class="h-4 w-12 rounded-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <CardChipRowSkeleton editable v-if="userId" class="py-2" />
    </div>
  </div>
</template>

<style scoped>
.card-details-skeleton-info {
  container: skeleton-info / inline-size;
}
.skeleton-strategy {
  display: grid;
  gap: 8px;
  flex: 1;
  grid-template-columns: minmax(0, 1fr);
  align-items: stretch;
}
.skeleton-summary-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
}
@container skeleton-info (min-width: 600px) {
  .skeleton-strategy {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .skeleton-summary-row {
    grid-template-columns: 256px minmax(0, 1fr);
  }
}
</style>
