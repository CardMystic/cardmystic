<script setup lang="ts">
import { collectionPath, collectionSlug } from '~/utils/card-collections';
import {
  cardLabelColors,
  cardLabelGroups,
  type VisibleLabelGroup,
} from '~/utils/deckHighlight';
const props = defineProps<{ kind: VisibleLabelGroup; names: string[] }>();
const emit = defineEmits<{ navigate: [] }>();
const title = computed(() => cardLabelGroups[props.kind]);
const expanded = ref(false);
const id = useId();
</script>

<template>
  <section
    :aria-label="title"
    class="flex min-w-0 flex-wrap items-center gap-1.5"
  >
    <div class="flex flex-wrap items-center gap-2">
      <h3 class="text-xs font-medium text-muted">
        <NuxtLink
          v-if="kind !== 'tags'"
          :to="collectionPath(kind)"
          no-prefetch
          class="hover:underline"
          @click="emit('navigate')"
          >{{ title }}</NuxtLink
        >
        <template v-else>{{ title }}</template>
      </h3>
      <slot />
    </div>
    <ul :id="id" role="list" class="contents">
      <li
        v-for="name in expanded ? names : names.slice(0, 3)"
        :key="name"
        class="min-w-0 max-w-full"
      >
        <UBadge
          v-if="kind === 'tags'"
          size="md"
          variant="subtle"
          :color="cardLabelColors.tags"
          class="max-w-full whitespace-normal wrap-anywhere"
          >{{ name }}</UBadge
        >
        <NuxtLink
          v-else
          :to="collectionPath(kind, collectionSlug(name, kind))"
          no-prefetch
          @click="emit('navigate')"
        >
          <UBadge
            size="md"
            :color="cardLabelColors[kind]"
            variant="subtle"
            class="max-w-full whitespace-normal wrap-anywhere hover:underline"
            >{{ name }}</UBadge
          >
        </NuxtLink>
      </li>
    </ul>
    <button
      v-if="names.length > 3"
      type="button"
      :aria-controls="id"
      :aria-expanded="expanded"
      :aria-label="`${expanded ? 'Show fewer' : 'Show more'} ${kind}`"
      class="rounded px-1 py-1 text-sm text-primary hover:underline focus-visible:outline-2"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Show more' }}
    </button>
  </section>
</template>
