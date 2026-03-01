<template>
  <footer
    class="w-full bg-secondary dark:bg-gray-950/75 backdrop-blur border-t border-gray-200 dark:border-gray-800 z-50">
    <UContainer class="py-6 text-left">
      <!-- Social Links -->
      <div class="flex justify-center items-start gap-4 mb-4">
        <NuxtLink to="https://github.com/CardMystic" target="_blank" aria-label="GitHub" rel="noopener">
          <UIcon name="i-simple-icons-github" size="24" class="text-white" />
        </NuxtLink>
        <NuxtLink to="https://discord.gg/GmPZ3e7tZH" target="_blank" aria-label="Discord" rel="noopener">
          <img src="/discord-icon.svg" width="24" height="24" alt="Discord" class="inline-block" />
        </NuxtLink>
        <NuxtLink to="https://www.youtube.com/@cardmystic" target="_blank" aria-label="YouTube" rel="noopener">
          <UIcon name="i-simple-icons-youtube" size="24" class="text-white" />
        </NuxtLink>
        <NuxtLink to="https://www.patreon.com/thecardmystic" target="_blank" aria-label="Patreon" rel="noopener">
          <UIcon name="i-simple-icons-patreon" size="24" class="text-white" />
        </NuxtLink>
      </div>

      <!-- Disclaimer -->
      <div class="text-xs text-white dark:text-gray-400 space-y-1 max-w-6xl mx-auto leading-relaxed">
        <p>
          CardMystic uses fan-created content under the Wizards of the Coast Fan Content Policy. Magic: The Gathering
          cards, images, and mana symbols shown here are copyrighted by Wizards of the Coast, LLC. CardMystic is an
          independent project and is not affiliated with or endorsed by Wizards of the Coast.
        </p>
        <p>
          Card prices are estimates provided by Scryfall and are not guaranteed to be accurate. See stores for official
          prices.
        </p>
        <p>All other content © 2025 Fiasco Games LLC</p>
        <p class="text-xs opacity-70">
          This site is protected by reCAPTCHA and the Google
          <a class="text-purple-400" href="https://policies.google.com/privacy">Privacy Policy</a> and
          <a class="text-purple-400" href="https://policies.google.com/terms">Terms of Service</a> apply.
        </p>
        <p>
          <NuxtLink :to="commitUrl" target="_blank" rel="noopener"
            class="text-purple-400 hover:text-purple-300 underline text-[10px]">
            Version: {{ commitHash }}
          </NuxtLink>
          <NuxtLink to="/privacyPolicy" rel="noopener"
            class="ml-2 text-purple-400 hover:text-purple-300 underline text-[10px]">Privacy Policy
          </NuxtLink>
        </p>
        <p class="mt-2">
          Experiencing issues? Contact us at
          <a href="mailto:thecardmystic@gmail.com"
            class="text-purple-400 hover:text-purple-300 underline">thecardmystic@gmail.com</a>
        </p>
      </div>
    </UContainer>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const { public: { commitHash: fullCommitHash } } = useRuntimeConfig();

const commitHash = computed(() =>
  typeof fullCommitHash === 'string' ? fullCommitHash.substring(0, 7) : 'dev'
);

const commitUrl = computed(() => {
  const hash = typeof fullCommitHash === 'string' ? fullCommitHash : 'main';
  return `https://github.com/CardMystic/cardmystic/commit/${hash}`;
});
</script>
