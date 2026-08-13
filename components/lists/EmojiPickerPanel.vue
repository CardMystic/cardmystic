<template>
  <div class="w-72 p-3">
    <UInput
      :model-value="search"
      icon="i-lucide-search"
      placeholder="Search emojis…"
      size="sm"
      class="w-full"
      @update:model-value="emit('update:search', String($event))"
    />
    <div
      class="mt-2 grid grid-cols-8 gap-1 max-h-64 overflow-y-auto"
      role="group"
      aria-label="Emoji choices"
    >
      <button
        v-for="e in emojis"
        :key="e.name"
        type="button"
        :title="`:${e.name}:`"
        class="text-xl leading-none rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        @click="emit('select', e.name)"
      >
        {{ e.emoji }}
      </button>
      <p
        v-if="emojis.length === 0"
        class="col-span-full text-center text-xs text-gray-500 dark:text-gray-400 py-4"
      >
        No emojis match "{{ search }}"
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  search: string;
  emojis: { name: string; emoji: string }[];
}>();

const emit = defineEmits<{
  (e: 'update:search', value: string): void;
  (e: 'select', name: string): void;
}>();
</script>
