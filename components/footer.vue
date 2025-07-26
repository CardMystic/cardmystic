<template>
  <div class="footer">
    <UContainer class="footer-content">
      <!-- Social Links -->
      <div class="social-links mb-3">
        <a href="https://github.com/CardMystic" target="_blank" aria-label="GitHub" rel="noopener">
          <UIcon name="i-simple-icons-github" class="icon" size="24" color="white" />
        </a>

        <a href="https://discord.gg/GmPZ3e7tZH" target="_blank" aria-label="Discord" rel="noopener">
          <img src="/discord-icon.svg" width="24" height="24" alt="Discord" style="vertical-align: middle;" />
        </a>

        <a href="https://www.youtube.com/@imdarkmode" target="_blank" aria-label="YouTube" rel="noopener">
          <UIcon name="i-simple-icons-youtube" class="icon" size="24" color="white" />
        </a>

        <a href="https://www.patreon.com/thecardmystic" target="_blank" aria-label="Patreon" rel="noopener">
          <UIcon name="i-simple-icons-patreon" class="icon" size="24" color="white" />
        </a>
      </div>

      <!-- Disclaimer -->
      <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-w-6xl mx-auto leading-relaxed">
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
        <p>
          <NuxtLink :to="commitUrl" target="_blank" rel="noopener"
            class="text-purple-400 hover:text-purple-300 underline text-[10px]">
            Version: {{ commitHash }}
          </NuxtLink>
        </p>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// Nuxt UI icons and container

const { public: { commitHash: fullCommitHash } } = useRuntimeConfig();

const commitHash = computed(() => {
  return typeof fullCommitHash === 'string' ? fullCommitHash.substring(0, 7) : 'dev';
});

const commitUrl = computed(() => {
  const hash = typeof fullCommitHash === 'string' ? fullCommitHash : 'main';
  return `https://github.com/CardMystic/cardmystic/commit/${hash}`;
});
</script>

<style scoped lang="scss">
.footer {
  padding: 16px 0;
  background-color: #161616;
  height: auto;
  margin-top: auto; // This ensures the footer pushes to the bottom
}

.footer-content {
  text-align: center;
}

.social-links {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: transform 0.2s;
  text-decoration: none;

  &:hover {
    transform: scale(1.15);
  }
}

.disclaimer-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
  max-width: 800px;
  margin: 0 auto;
}

.commit-link {
  color: rgba(147, 114, 255, 0.8);
  text-decoration: none;
  font-size: 10px;
  transition: color 0.2s;

  &:hover {
    color: rgb(147, 114, 255);
    text-decoration: underline;
  }
}
</style>
