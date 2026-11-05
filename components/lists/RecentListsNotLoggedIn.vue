<template>
  <div class="relative">
    <h2 class="section-title">Recent Decklists</h2>
    <p class="text-sm opacity-70 mb-4 text-center">
      Built with CardMystic's powerful deck building tools!
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2 md:gap-4">
      <div
        v-for="item in fakeItems"
        :key="item.id"
        class="dark relative flex flex-col min-h-55 border border-default rounded-lg overflow-hidden select-none bg-[#090d19] text-white"
      >
        <div class="relative min-h-40 flex-1 p-4">
          <PreviewImage
            :src="item.image"
            alt=""
            class="absolute inset-0 size-full object-cover object-[center_25%]"
          />
          <div
            class="absolute inset-0 bg-linear-to-b from-black/60 to-[#181818]"
          />
          <div class="relative">
            <div class="flex items-start justify-between gap-3">
              <h3
                class="min-w-0 text-lg font-extrabold leading-snug break-words"
              >
                {{ item.name }}
              </h3>
              <span class="shrink-0 text-xs">Commander</span>
            </div>
            <p class="mt-1 text-sm line-clamp-1">{{ item.commander }}</p>
            <p class="mt-3 text-sm leading-relaxed line-clamp-3">
              {{ item.description }}
            </p>
          </div>
        </div>
        <div
          class="relative mx-4 flex min-h-13 items-center justify-between border-t border-white/30 py-1 text-xs text-gray-300"
        >
          <span>{{ item.date }}</span
          ><UIcon name="i-lucide-chevron-right" class="size-4" />
        </div>
        <div class="h-1.5 bg-primary/70" />
      </div>
    </div>

    <div class="relative z-20 flex justify-center mt-4">
      <UButton
        color="primary"
        variant="solid"
        size="lg"
        icon="i-lucide-lock"
        disabled
      >
        Build a New Deck
      </UButton>
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
    <NuxtLink to="/user/login">
      <div
        class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer backdrop-blur-[1px]"
      >
        <UIcon name="i-lucide-lock" class="text-4xl mb-3 text-primary" />
        <div class="login-container">
          <p class="text-lg font-bold text-white drop-shadow">
            Login To Create Decklists!
          </p>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const fakeItems = [
  {
    id: 1,
    name: 'Planeswalkers!!!',
    description: 'Super friends!',
    commander: "Atraxa, Praetors' Voice",
    date: 'Feb 11, 2026',
    image:
      'https://api.scryfall.com/cards/named?exact=Atraxa%2C+Praetors%27+Voice&format=image&version=art_crop',
  },
  {
    id: 2,
    name: 'Commander Deck',
    description: 'My favorite build',
    commander: 'Korvold, Fae-Cursed King',
    date: 'Feb 11, 2026',
    image:
      'https://api.scryfall.com/cards/named?exact=Korvold%2C+Fae-Cursed+King&format=image&version=art_crop',
  },
  {
    id: 3,
    name: 'Best Stax Pieces',
    description: 'Make my opponents sad. The more sad...',
    commander: 'Grand Arbiter Augustin IV',
    date: 'Feb 2, 2026',
    image:
      'https://api.scryfall.com/cards/named?exact=Smokestack&format=image&version=art_crop',
  },
];
</script>

<style scoped lang="sass">
.section-title
  font-size: 2rem
  font-weight: 700
  text-align: center
  @media (max-width: 768px)
    font-size: 1.5rem

.login-container
  background: var(--color-primary)
  padding: 0.5rem 1rem
  border-radius: 9999px
</style>
