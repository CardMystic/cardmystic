<template>
  <v-container class="fill-height d-flex align-center justify-center d-flex flex-column">
    <v-card class="pa-2 mb-6 text-card" max-width="600" elevation="10" rounded="xl">
      <v-card-title class="text-h5 font-weight-bold">
        🔮 What is <b class="title">CardMystic</b>?
      </v-card-title>

      <v-card-text class="mt-2 text-body-1">
        CardMystic is an Open Source Vector Search engine for Magic: The
        Gathering cards. We are dedicated to providing powerful tools to the
        amazing MTG community.
      </v-card-text>
    </v-card>
    <v-card class="pa-2 mb-6 text-card" max-width="600" elevation="10" rounded="xl">
      <v-card-title class="text-h5 font-weight-bold">
        🧙‍♂️ Why <b class="title">CardMystic</b>?
      </v-card-title>

      <v-card-text class="mt-2 text-body-1">
        Magic: The Gathering is a complex and intricate game, but finding cards
        shouldn't be. Our developers decided that traditional keywork search
        engines fall short. They require exact wording and an intimate knowledge
        of Magic terms.
        <br /><br />
        CardMystic makes card discovery effortless with natural language search.
        Just type what you're thinking: “a blue creature that draws cards” or “a
        cheap red burn spell” and let CardMystic handle the rest. Whether you're
        a seasoned deckbuilder or brand new to the game, CardMystic helps you
        find the perfect card without the guesswork.
      </v-card-text>
    </v-card>
    <v-card class="pa-2 text-card" max-width="600" elevation="10" rounded="xl">
      <v-card-title class="text-h5 font-weight-bold">
        💬 Contact Us
      </v-card-title>

      <v-card-text class="mt-2 text-body-1">
        Have questions, feedback, or ideas for CardMystic? We'd love to hear
        from you!
        <br /><br />
        👾 Discord:
        <a href="https://discord.gg/GmPZ3e7tZH" target="_blank">Join our server</a>
        <br />
        📧 Email:
        <a href="mailto:thecardmystic@gmail.com"> thecardmystic@gmail.com </a>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
useHead({ title: 'About - CardMystic' });
const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/about',
  page_name: 'About Page',
  query: '',
  card_name: '',
  filters: undefined,
});

</script>

<style lang="sass" scoped>
.title
  font-family: "Alfa Slab One", serif
  font-weight: 400
  font-style: normal
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  margin-top: 6px

.text-card
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8))
  border: 1px solid rgba(147, 114, 255, 0.2)
</style>
