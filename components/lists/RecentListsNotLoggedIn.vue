<template>
  <div class="relative">
    <h2 class="section-title">Recent Lists</h2>

    <!-- Fake real-looking list cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
      <div v-for="item in fakeItems" :key="item.id"
        class="relative border border-black-300 dark:border-gray-400 rounded-lg overflow-hidden select-none">
        <!-- Background placeholder while loading -->
        <USkeleton v-if="!loadedImages[item.id]" class="absolute inset-0 rounded-none" />
        <!-- Hidden img to detect load -->
        <img :src="item.image" class="hidden" @load="loadedImages[item.id] = true" />
        <!-- Background art (shown once loaded) -->
        <div class="absolute inset-0 bg-cover bg-center opacity-60 dark:opacity-50 transition-opacity duration-500"
          :class="loadedImages[item.id] ? 'opacity-60 dark:opacity-50' : 'opacity-0'"
          :style="{ backgroundImage: `url(${item.image})` }" />
        <div
          class="absolute inset-0 bg-gradient-to-t from-white/80 via-white/40 dark:from-black/80 dark:via-black/40 to-transparent" />

        <!-- Content -->
        <div class="relative p-2 md:p-4">
          <h3 class="text-base md:text-xl font-semibold mb-1 md:mb-2">{{ item.name }}</h3>
          <p class="text-xs md:text-sm mb-2 md:mb-3 line-clamp-1">{{ item.description }}</p>
          <div class="flex items-center justify-between text-xs md:text-sm">
            <span>{{ item.date }}</span>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4" />
          </div>
        </div>
      </div>

      <!-- See More button -->
      <NuxtLink class="flex">
        <UButton color="primary" variant="outline" class="h-full w-full justify-center" icon="i-lucide-arrow-right">
          See More
        </UButton>
      </NuxtLink>
    </div>

    <div class="flex gap-3 mt-2 md:mt-4 justify-center">
      <UButton color="neutral" variant="outline" icon="i-lucide-search">
        Recent Searches
      </UButton>
      <UButton color="neutral" variant="outline" icon="i-lucide-eye">
        Recent Cards
      </UButton>
    </div>

    <!-- Login overlay -->
    <NuxtLink to="/login">
      <div class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer backdrop-blur-[1px] ">
        <UIcon name="i-lucide-lock" class="text-4xl mb-3 text-primary" />
        <div class="login-container">
          <p class="text-lg font-bold text-white drop-shadow">Login To Create Card Lists!</p>
        </div>

      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const loadedImages = reactive<Record<number, boolean>>({});

const fakeItems = [
  {
    id: 1,
    name: 'Planeswalkers!!!',
    description: 'Super friends!',
    date: 'Feb 11, 2026',
    image: 'https://api.scryfall.com/cards/named?exact=Atraxa%2C+Praetors%27+Voice&format=image&version=art_crop',
  },
  {
    id: 2,
    name: 'Commander Deck',
    description: 'My favorite build',
    date: 'Feb 11, 2026',
    image: 'https://api.scryfall.com/cards/named?exact=Korvold%2C+Fae-Cursed+King&format=image&version=art_crop',
  },
  {
    id: 3,
    name: 'Best Stax Pieces',
    description: 'Make my opponents sad. The more sad...',
    date: 'Feb 2, 2026',
    image: 'https://api.scryfall.com/cards/named?exact=Smokestack&format=image&version=art_crop',
  },
];
</script>

<style scoped lang="sass">
.section-title
  font-size: 2rem
  font-weight: 700
  margin-bottom: 1.5rem
  text-align: center
  @media (max-width: 768px)
    font-size: 1.5rem
    margin-bottom: 0.75rem

.login-container
  background: var(--color-primary)
  padding: 0.5rem 1rem
  border-radius: 9999px
</style>
