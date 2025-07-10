<template>
  <v-footer color="black" class="footer">
    <v-container class="footer-content">
      <!-- Social Links -->
      <div class="social-links d-flex justify-center align-center gap-4 mb-3">
        <a href="https://github.com/CardMystic" target="_blank" aria-label="GitHub" rel="noopener">
          <v-icon color="white" size="24" icon="mdi-github"></v-icon>
        </a>

        <a href="https://discord.gg/GmPZ3e7tZH" target="_blank" aria-label="Discord" rel="noopener">
          <v-img src="@/public/discord-icon.svg" width="24" height="24" alt="Discord" contain />
        </a>

        <a href="https://www.youtube.com/@imdarkmode" target="_blank" aria-label="YouTube" rel="noopener">
          <v-icon color="white" size="24" icon="mdi-youtube"></v-icon>
        </a>

        <a href="https://www.patreon.com/thecardmystic" target="_blank" aria-label="Patreon" rel="noopener">
          <v-icon color="white" size="24" icon="mdi-patreon"></v-icon>
        </a>
      </div>

      <!-- Disclaimer -->
      <div class="text-left">
        <p class="disclaimer-text">
          CardMystic uses fan-created content under the Wizards of the Coast Fan
          Content Policy. Magic: The Gathering cards, images, and mana symbols
          shown here are copyrighted by Wizards of the Coast, LLC. CardMystic is
          an independent project and is not affiliated with or endorsed by
          Wizards of the Coast.
        </p>
        <p class="disclaimer-text mt-2">
          Card prices are estimates provided by Scryfall and are not guaranteed
          to be accurate. See stores for official prices.
        </p>
        <p class="disclaimer-text mt-2">
          All other content © 2025 Fiasco Games LLC
        </p>
        <p class="disclaimer-text mt-2">
          <a :href="commitUrl" target="_blank" rel="noopener" class="commit-link">
            Version: {{ commitHash }}
          </a>
        </p>
      </div>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Get commit hash from runtime config
const { public: { commitHash: fullCommitHash } } = useRuntimeConfig();

const commitHash = computed(() => {
  // Show only first 7 characters for display
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
  position: relative; // Remove app positioning
}

.footer-content {
  text-align: center;
}

.social-links a {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: transform 0.2s;
  text-decoration: none;
  margin-left: 10px;
  margin-right: 10px;

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
