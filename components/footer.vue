<template>
  <v-footer color="black" class="footer">
    <v-container class="footer-content">
      <!-- Social Links -->
      <div class="social-links d-flex justify-center align-center gap-4 mb-3">
        <a
          href="https://github.com/imdarkmode"
          target="_blank"
          aria-label="GitHub"
          rel="noopener"
        >
          <v-icon color="white" size="24">mdi-github</v-icon>
        </a>

        <a
          href="https://discord.gg/GmPZ3e7tZH"
          target="_blank"
          aria-label="Discord"
          rel="noopener"
        >
          <v-img
            src="@/public/discord-icon.png"
            width="24"
            height="24"
            alt="Discord"
            contain
          />
        </a>

        <a
          href="https://www.youtube.com/@imdarkmode"
          target="_blank"
          aria-label="YouTube"
          rel="noopener"
        >
          <v-icon color="white" size="24">mdi-youtube</v-icon>
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
      </div>
    </v-container>
  </v-footer>
</template>

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
</style>
