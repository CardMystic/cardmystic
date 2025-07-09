<template>
  <div class="navbar-container">
    <v-app-bar app dark elevation="3" color="#383d7a" class="navbar">
      <div class="navbar-inner">
        <!-- Left side: Hamburger & nav -->
        <div class="left-section">
          <v-app-bar-nav-icon class="d-sm-none" @click="drawer = !drawer" />
          <div class="d-none d-sm-flex">
            <NuxtLink v-for="item in filteredNavItems" :key="item.to" :to="item.to" class="nav-link"
              :class="{ active: $route.path === item.to }">
              <v-btn>
                <v-icon start size="20">{{ item.icon }}</v-icon>
                {{ item.label }}
              </v-btn>
            </NuxtLink>
          </div>
        </div>

        <!-- Right side: Patreon button -->
        <div v-if="showActions" class="right-actions">
          <v-btn href="https://www.patreon.com/thecardmystic" target="_blank" rel="noopener" class="patreon-btn"
            variant="outlined">
            <div class="btn-left">Support us on Patreon!</div>
            <div class="btn-right">
              <v-icon size="24" color="black">mdi-patreon</v-icon>
            </div>
          </v-btn>
        </div>
      </div>
    </v-app-bar>

    <!-- Drawer for mobile -->
    <client-only>
      <v-navigation-drawer v-model="drawer" temporary app class="d-sm-none">
        <v-list nav>
          <v-list-item v-for="item in filteredNavItems" :key="item.to" :to="item.to" @click="drawer = false">
            <template #prepend>
              <v-icon>{{ item.icon }}</v-icon>
            </template>
            {{ item.label }}
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </client-only>
  </div>
</template>

<script setup lang="ts">
const drawer = ref(false);

const navItems = [
  { to: '/', label: 'Home', icon: 'mdi-home' },
  { to: '/about', label: 'About', icon: 'mdi-information' },
];

const filteredNavItems = computed(() => navItems);

const props = defineProps({
  showActions: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped lang="scss">
.navbar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.navbar {
  background-color: #1e1e1e;

  .navbar-inner {
    max-width: 1096px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0px;
  }

  .left-section {
    display: flex;
    align-items: center;
  }

  .right-actions {
    display: flex;
    align-items: center;
  }
}

.v-btn {
  margin: 0;
  color: white;
  padding-left: 12px;
  padding-right: 12px;
}

.nav-link {
  margin-left: 0px;
}

.nav-link.active .v-btn {
  border: 1px solid white;
}

.patreon-btn {
  display: flex;
  padding: 0;
  border: 2px solid white;
  overflow: hidden;
  text-transform: none;

  .btn-left {
    padding: 8px 12px;
    background-color: transparent;
    color: white;
    display: flex;
    align-items: center;
    font-weight: 500;
    flex-grow: 1;
  }

  .btn-right {
    background-color: white;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
