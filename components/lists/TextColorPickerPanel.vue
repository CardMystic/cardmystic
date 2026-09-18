<template>
  <div class="w-64 p-3">
    <p class="mb-2 text-sm font-medium">Text color</p>
    <div class="grid grid-cols-4 gap-2" role="group" aria-label="Text colors">
      <button
        v-for="color in colors"
        :key="color.value"
        type="button"
        :aria-label="color.name"
        :title="color.name"
        class="flex h-9 cursor-pointer items-center justify-center rounded border border-default hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
        @click="emit('select', color.value)"
      >
        <span
          class="h-5 w-5 rounded-full"
          :style="{ backgroundColor: color.value }"
        />
      </button>
    </div>
    <div class="mt-3 flex items-center gap-2">
      <label class="flex items-center gap-2 text-sm">
        Custom
        <input
          v-model="customColor"
          type="color"
          aria-label="Custom text color"
          class="h-8 w-10 cursor-pointer rounded border border-default"
        />
      </label>
      <UButton
        label="Apply color"
        size="sm"
        @click="emit('select', customColor)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ select: [color: string] }>();
const customColor = ref('#dc2626');
const colors = [
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Amber', value: '#a16207' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Pink', value: '#db2777' },
];
</script>
