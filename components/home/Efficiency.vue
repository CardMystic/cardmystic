<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard v-for="item in items" :key="item.title" class="border border-green-500/20" :ui="{ body: 'p-4 md:p-5' }">
        <div class="flex items-start gap-3">
          <UIcon :name="item.icon" class="text-xl text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold mb-1">{{ item.title }}</h3>
            <p class="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {{ item.description }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    icon: 'i-lucide-cpu',
    title: 'Optimized Models',
    description:
      'We use in-depth testing to select the most accurate models at the smallest possible size, cutting energy use without sacrificing quality.',
  },
  {
    icon: 'i-lucide-database',
    title: 'Smart Caching',
    description:
      'Common queries are carefully cached so repeated searches return instantly. This reduces compute costs and loading times.',
  },
  {
    icon: 'i-lucide-zap',
    title: 'Pre-run Searches',
    description:
      'Every similarity search is pre-computed ahead of time, so results are served instantly without ever querying a model.',
  },
];
</script>
