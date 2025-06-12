<template>
  <v-footer app color="black" class="footer" height="48">
    <v-container class="text-center d-flex justify-center align-center gap-4">
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
    </v-container>
  </v-footer>
</template>

<style scoped lang="scss">
.footer {
  height: 48px;
  padding: 0;
  background-color: #161616;
}

a {
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
</style>
