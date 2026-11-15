<script setup lang="ts">
defineProps<{ isOwner: boolean; extraRoles?: number }>();
</script>

<template>
  <div class="space-y-6">
    <span class="sr-only" role="status">Loading deck stats…</span>
    <slot name="roles">
      <div class="space-y-3" aria-hidden="true">
        <USkeleton class="h-7 w-32" />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="n in 5 + (extraRoles ?? 0)"
            :key="n"
            class="rounded-lg border border-default p-3"
          >
            <USkeleton class="my-1 h-3 w-2/3" /><USkeleton
              class="my-1 h-6 w-8"
            />
          </div>
        </div>
      </div>
    </slot>
    <slot name="tags" />
    <div
      v-for="group in ['themes', 'sets']"
      :key="group"
      class="space-y-3"
      aria-hidden="true"
    >
      <USkeleton class="h-7 w-28" />
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div
          v-for="n in 4"
          :key="n"
          class="rounded-lg border border-default p-3"
        >
          <USkeleton class="my-1 h-3 w-2/3" /><USkeleton class="my-1 h-6 w-8" />
        </div>
      </div>
    </div>
    <slot name="charts">
      <div class="grid gap-8 sm:grid-cols-2" aria-hidden="true">
        <div class="space-y-4">
          <USkeleton class="h-6 w-36" /><USkeleton class="h-48 w-full" />
        </div>
        <div class="space-y-4">
          <USkeleton class="h-6 w-28" /><USkeleton
            class="mx-auto size-44 rounded-full"
          />
        </div>
      </div>
    </slot>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-hidden="true">
      <div v-for="n in 4" :key="n" class="rounded-lg border border-default p-3">
        <USkeleton class="my-1 h-3 w-3/4" /><USkeleton class="my-1 h-6 w-12" />
      </div>
    </div>
    <div class="space-y-3" aria-hidden="true">
      <USkeleton class="h-7 w-32" />
      <USkeleton class="h-4 w-36" />
      <div class="flex flex-wrap items-center gap-3">
        <USkeleton class="h-9 w-full sm:w-72" /><USkeleton
          class="h-5 w-48 max-w-full"
        />
      </div>
    </div>
    <div class="space-y-3 border-t border-default pt-5" aria-hidden="true">
      <div class="flex items-center justify-between">
        <USkeleton class="h-7 w-24" /><USkeleton class="h-4 w-20" />
      </div>
      <div class="divide-y divide-default">
        <div
          v-for="n in 5"
          :key="n"
          class="flex items-center gap-2 py-1 sm:gap-3"
        >
          <USkeleton class="mr-auto h-4 w-36 max-w-1/2" /><USkeleton
            class="h-4 w-12"
          /><USkeleton class="h-3 w-14" /><USkeleton
            v-if="isOwner"
            class="size-6"
          />
        </div>
      </div>
    </div>
  </div>
</template>
