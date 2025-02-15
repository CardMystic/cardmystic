<template>
  <div>
    <v-app  class="gradient-background">
      <NuxtLayout >
        <NuxtPage />
      </NuxtLayout>
    </v-app>
  </div>
</template>

<style lang="sass" scoped>
.gradient-background
  min-height: 100vh !important
  background: linear-gradient(180deg, #1E1E1E, #9A499A) !important
</style>