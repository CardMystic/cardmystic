<template>
  <UContainer class="py-12">
    <div class="text-center mb-8">
      <h2 class="text-3xl md:text-4xl font-bold mb-2">Meet The Team</h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="(dev, index) in developers" :key="index"
        class="flex flex-col items-center p-6 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors">
        <img :src="dev.profilePicture" :alt="dev.name"
          class="w-24 h-24 rounded-full object-cover mb-4 border-2 border-primary" />
        <h3 class="text-xl font-semibold mb-1">{{ dev.name }}</h3>
        <p class="text-gray-400 text-sm mb-3">{{ dev.role }}</p>

        <div v-if="dev.socialLinks" class="flex gap-3">
          <UButton v-for="(link, platform) in dev.socialLinks" :key="platform" :to="link" target="_blank"
            color="neutral" variant="ghost" size="sm" :icon="getSocialIcon(platform)" square />
        </div>
      </div>
    </div>
  </UContainer>
</template>

<script lang="ts" setup>
interface Developer {
  name: string;
  role: string;
  profilePicture: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
    youtube?: string;
    twitch?: string;
  };
}

const developers: Developer[] = [
  {
    name: 'Andrew Morrison',
    role: 'Founder / Software Engineer',
    profilePicture: '/devIcons/andrew.webp',
    socialLinks: {
    }
  },
  {
    name: 'Julian Pinzer',
    role: 'Architect / Software Engineer',
    profilePicture: '/devIcons/droplit.webp',
    socialLinks: {
    }
  },
  {
    name: 'Benjamin Chislett',
    role: 'ML/AI Expert',
    profilePicture: '/devIcons/ben.webp',
    socialLinks: {
    }
  },
  {
    name: 'Brandon Terry',
    role: 'Business Strategist',
    profilePicture: '/devIcons/terry.webp',
    socialLinks: {
    }
  },
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