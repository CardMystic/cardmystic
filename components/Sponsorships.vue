<template>
  <UContainer class="py-12">
    <div class="text-center mb-8">
      <h2 class="text-3xl md:text-4xl font-bold mb-2">Proud Sponsors Of MTG Creators</h2>
      <p class="text-gray-400">Supporting The Community</p>
    </div>

    <div
      :class="sponsors.length === 1 ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'">
      <div v-for="(sponsor, index) in sponsors" :key="index"
        class="flex flex-col items-center p-6 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors"
        :class="{ 'max-w-md w-full': sponsors.length === 1 }">
        <img :src="sponsor.profileIcon" :alt="sponsor.name"
          class="w-24 h-24 rounded-full object-cover mb-4 border-2 border-primary" />
        <h3 class="text-xl font-semibold mb-3">{{ sponsor.name }}</h3>

        <div class="flex gap-3">
          <UButton v-for="(link, platform) in sponsor.socialLinks" :key="platform" :to="link" target="_blank"
            color="neutral" variant="ghost" size="sm" :icon="getSocialIcon(platform)" square />
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
interface Sponsor {
  name: string;
  profileIcon: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    youtube?: string;
    twitch?: string;
  };
}

const sponsors: Sponsor[] = [
  {
    name: 'Modular Cocoon',
    profileIcon: '/modularcocoon.png',
    socialLinks: {
      youtube: 'https://www.youtube.com/@modularcocoon',
    }
  }
];

const getSocialIcon = (platform: string): string => {
  const iconMap: Record<string, string> = {
    twitter: 'i-lucide-twitter',
    github: 'i-lucide-github',
    linkedin: 'i-lucide-linkedin',
    website: 'i-lucide-globe',
    youtube: 'i-lucide-youtube',
    twitch: 'i-lucide-twitch'
  };
  return iconMap[platform] || 'i-lucide-link';
};
</script>

<style scoped></style>