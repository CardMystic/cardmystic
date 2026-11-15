<script setup lang="ts">
import {
  cardDirectoryLinks,
  communityDirectoryLinks,
} from '~/utils/site-navigation';

defineProps<{ group: 'cards' | 'community' }>();
</script>

<template>
  <nav
    :aria-label="group === 'cards' ? 'Browse cards' : 'Browse community'"
    class="mb-6 flex flex-wrap justify-center gap-3"
  >
    <UButton
      v-for="link in group === 'cards'
        ? cardDirectoryLinks
        : communityDirectoryLinks"
      :key="link.to"
      :to="link.to"
      :icon="link.icon"
      :label="`Go To ${link.label}`"
      color="neutral"
      variant="outline"
      active-variant="soft"
      exact
      class="min-h-11"
    />
  </nav>
</template>
