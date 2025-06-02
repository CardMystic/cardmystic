<template>
  <navbar></navbar>
  <v-container
    class="fill-height d-flex align-center justify-center d-flex flex-column"
  >
    <v-card
      class="pa-6 mb-6"
      max-width="600"
      elevation="10"
      rounded="xl"
      color="secondary"
    >
      <v-card-title class="text-h5 font-weight-bold">
        🔮 What is <b class="title">CardMystic</b>?
      </v-card-title>

      <v-card-text class="mt-2 text-body-1">
        CardMystic is an Open Source Vector Search engine for Magic: The
        Gathering cards. We are dedicated to providing powerful tools to the
        amazing MTG community.
      </v-card-text>
    </v-card>
    <v-card
      class="pa-6"
      max-width="600"
      elevation="10"
      rounded="xl"
      color="secondary"
    >
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
  </v-container>
</template>

<script setup lang="ts">
useHead({ title: 'About - CardMystic' });
</script>

<style lang="sass" scoped>
.title
  font-family: "Alfa Slab One", serif
  font-weight: 400
  font-style: normal
  color: rgb(var(--v-theme-primary))
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 1.0)
  margin-top: 6px
  @media (max-width: 600px)
    font-size: 3.0rem
</style>
