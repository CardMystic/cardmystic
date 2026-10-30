<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from 'vue';
import {
  collectionPath,
  type CardCollectionEntry,
  type CardCollectionKind,
} from '~/utils/card-collections';

const props = defineProps<{
  kind: CardCollectionKind;
  entry: CardCollectionEntry;
  eager: boolean;
}>();
const imageFailed = shallowRef(false);
const imageLoaded = shallowRef(false);
const image = useTemplateRef<HTMLImageElement>('image');
onMounted(() => {
  imageLoaded.value = !!image.value?.complete && image.value.naturalWidth > 0;
  if (image.value?.complete && image.value.naturalWidth === 0)
    imageFailed.value = true;
});
watch(
  () => props.entry.imageUrl,
  () => {
    imageFailed.value = false;
    imageLoaded.value = false;
  },
);
const releaseDate = computed(() =>
  props.entry.releasedAt
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${props.entry.releasedAt}T00:00:00Z`))
    : null,
);
</script>

<template>
  <NuxtLink
    data-testid="collection-tile"
    :to="collectionPath(kind, entry.slug)"
    :aria-label="`${entry.name} ${entry.cardCount} cards`"
    no-prefetch
    class="flex h-full flex-col rounded-lg border border-default bg-default hover:bg-elevated focus-visible:outline-primary"
  >
    <div
      class="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-t-lg bg-elevated"
    >
      <USkeleton
        v-if="entry.imageUrl && !imageLoaded && !imageFailed"
        class="absolute inset-0 size-full rounded-none"
        aria-hidden="true"
      />
      <img
        v-if="entry.imageUrl && !imageFailed"
        ref="image"
        :src="entry.imageUrl"
        :alt="entry.imageCardName ? `Artwork from ${entry.imageCardName}` : ''"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        width="626"
        height="457"
        class="h-full w-full object-cover"
        @error="imageFailed = true"
        @load="imageLoaded = true"
      />
      <div
        v-else
        class="flex h-full items-center justify-center p-4 text-sm text-toned"
      >
        Artwork unavailable
      </div>
    </div>
    <div class="flex flex-1 flex-col gap-3 p-4">
      <h2 class="font-semibold leading-6 wrap-anywhere">
        <SetSymbol v-if="kind === 'sets'" :code="entry.slug" class="mr-2" />
        {{ entry.name }}
      </h2>
      <div
        class="mt-auto flex flex-wrap items-center justify-between gap-2 text-sm text-toned"
      >
        <span>{{ entry.cardCount.toLocaleString('en-US') }} cards</span>
        <time
          v-if="kind === 'sets' && releaseDate"
          :datetime="entry.releasedAt!"
          >{{ releaseDate }}</time
        >
      </div>
    </div>
  </NuxtLink>
</template>
