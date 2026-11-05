<script setup lang="ts">
import type { FeaturedPrimer } from '~/models/cardListModel';
defineProps<{ primer: FeaturedPrimer }>();
</script>
<template>
  <CardListLink
    :list="primer.decklist"
    :primer-preview="primer.primer_preview"
    show-author
  />
</template>
