<template>
  <v-img
    width="250px"
    :src="card.properties.url"
    alt="Card Image"
    style="border-radius: 12px"
  ></v-img>
  <v-progress-linear
    rounded
    color="black"
    :model-value="card.metadata.score * 100"
    :height="20"
    class="mt-2"
    style="max-width: 220px"
  >
    <template v-slot:default="{ value }">
      <p style="color: white; font-size: 14px">{{ Math.ceil(value) }}%</p>
    </template>
  </v-progress-linear>
</template>

<script setup lang="ts">
const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
});
</script>

<style lang="sass" scoped></style>
