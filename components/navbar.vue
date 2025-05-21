<template>
  <v-app-bar app dark elevation="0" color="#1e1e1e">
    <!-- Hamburger only visible on small screens -->
    <v-app-bar-nav-icon
      class="d-sm-none"
      @click="drawer = !drawer"
    ></v-app-bar-nav-icon>

    <!-- Centered nav for larger screens -->
    <div class="nav-center d-none d-sm-flex">
      <NuxtLink
        to="/"
        class="nav-link"
        :class="{ active: $route.path === '/' }"
      >
        <v-btn>Home</v-btn>
      </NuxtLink>
      <NuxtLink
        v-if="searchStore.results.length > 0"
        to="/search"
        class="nav-link"
        :class="{ active: $route.path === '/search' }"
      >
        <v-btn>Results</v-btn>
      </NuxtLink>
      <NuxtLink
        v-if="cardStore.card"
        to="/cardDetails"
        class="nav-link"
        :class="{ active: $route.path === '/cardDetails' }"
      >
        <v-btn>{{ cardStore.card?.properties.name }}</v-btn>
      </NuxtLink>
      <NuxtLink
        to="/about"
        class="nav-link"
        :class="{ active: $route.path === '/about' }"
      >
        <v-btn>About</v-btn>
      </NuxtLink>
      <NuxtLink
        to="/contact"
        class="nav-link"
        :class="{ active: $route.path === '/contact' }"
      >
        <v-btn>Contact</v-btn>
      </NuxtLink>
    </div>

    <!-- Right-side icons -->
    <template v-if="showActions" v-slot:append>
      <v-btn
        icon
        variant="text"
        href="https://github.com/imdarkmode?tab=repositories"
        target="_blank"
        rel="noopener"
      >
        <v-icon size="28" color="white">mdi-github</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        href="https://patreon.com/ImDarkMode"
        target="_blank"
        rel="noopener"
      >
        <v-icon size="28" color="white">mdi-patreon</v-icon>
      </v-btn>

      <v-btn
        icon
        variant="text"
        href="https://discord.gg/GmPZ3e7tZH"
        target="_blank"
        rel="noopener"
      >
        <v-img
          src="@/public/discord-icon.png"
          width="28"
          height="28"
          alt="Discord"
          contain
        />
      </v-btn>

      <v-btn
        icon
        variant="text"
        href="https://www.youtube.com/@imdarkmode"
        target="_blank"
        rel="noopener"
      >
        <v-icon size="30" color="white">mdi-youtube</v-icon>
      </v-btn>
    </template>
  </v-app-bar>

  <!-- Drawer for mobile -->
  <v-navigation-drawer v-model="drawer" temporary app class="d-sm-none">
    <v-list nav>
      <v-list-item to="/" @click="drawer = false">Home</v-list-item>
      <v-list-item
        v-if="searchStore.results.length > 0"
        to="/search"
        @click="drawer = false"
        >Results</v-list-item
      >
      <v-list-item
        v-if="cardStore.card"
        to="/cardDetails"
        @click="drawer = false"
        >{{ cardStore.card?.properties.name }}</v-list-item
      >
      <v-list-item to="/about" @click="drawer = false">About</v-list-item>
      <v-list-item to="/contact" @click="drawer = false">Contact</v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>
<script setup lang="ts">
const searchStore = useSearchStore();
const cardStore = useCardStore();

const drawer = ref(false); // toggle for mobile drawer

// No script logic needed for basic navbar
const props = defineProps({
  showActions: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.nav-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
}

.v-btn {
  margin: 0 0px;
  color: white;
  padding: 0px;
}

.nav-link.active .v-btn {
  color: rgb(var(--v-theme-primary));
}
</style>
