<template>
  <UContainer class="py-12">
    <div class="text-center mb-8">
      <h2 class="text-3xl md:text-4xl font-bold mb-2">Join Our Community</h2>
      <p class="text-gray-600 dark:text-gray-400">Connect with us and support our mission</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <a v-for="(item, index) in communityItems" :key="index" :href="item.link" target="_blank"
        class="flex flex-col items-center justify-center p-8 rounded-lg border border-gray-700 transition-all hover:scale-105 cursor-pointer min-h-[200px]"
        :style="{ backgroundColor: item.bgColor }">
        <UIcon :name="item.icon" class="text-6xl mb-4" />
        <h3 class="text-2xl font-bold text-center">{{ item.title }}</h3>
      </a>
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
interface CommunityItem {
  title: string;
  icon: string;
  bgColor: string;
  link: string;
}

const communityItems: CommunityItem[] = [
  {
    title: 'Support Us On Patreon!',
    icon: 'i-lucide-heart',
    bgColor: '#FF424D',
    link: 'https://patreon.com/thecardmystic'
  },
  {
    title: 'Chat With Us On Discord!',
    icon: 'i-lucide-message-circle',
    bgColor: '#5865F2',
    link: 'https://discord.gg/GmPZ3e7tZH'
  }
];
</script>

<style scoped></style>