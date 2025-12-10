<template>
  <UContainer class="py-12">
    <div class="text-center mb-8">
      <h2 class="text-3xl md:text-4xl font-bold mb-2">Meet The Developers</h2>
      <p class="text-gray-400">The team behind CardMystic</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="(dev, index) in developers" :key="index"
        class="flex flex-col items-center p-6 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors">
        <img :src="dev.profilePicture" :alt="dev.name"
          class="w-24 h-24 rounded-full object-cover mb-4 border-2 border-primary" />
        <h3 class="text-xl font-semibold mb-1">{{ dev.name }}</h3>
        <p class="text-gray-400 text-sm">{{ dev.role }}</p>
      </div>
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
interface Developer {
  name: string;
  role: string;
  profilePicture: string;
}

const developers: Developer[] = [
  {
    name: 'Andrew Morrison',
    role: 'Founder / Software Engineer',
    profilePicture: '/andrew.webp'
  },
];
</script>

<style scoped></style>