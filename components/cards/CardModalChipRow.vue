<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core';
import { collectionPath, collectionSlug } from '~/utils/card-collections';
import {
  cardLabelColors,
  cardLabelGroups,
  type VisibleLabelGroup,
} from '~/utils/deckHighlight';

const props = defineProps<{
  kind: VisibleLabelGroup;
  names: string[];
}>();
const emit = defineEmits<{ navigate: [] }>();
const title = computed(() => cardLabelGroups[props.kind]);
const expanded = ref(false);
const visibleCount = ref(props.names.length);
const overflow = computed(() => visibleCount.value < props.names.length);
const row = useTemplateRef<HTMLElement>('row');
const heading = useTemplateRef<HTMLElement>('heading');
const sizing = useTemplateRef<HTMLElement>('sizing');
const toggle = useTemplateRef<HTMLButtonElement>('toggle');
const id = useId();

function measure() {
  if (!row.value || !sizing.value || !heading.value || !toggle.value) return;
  const gap = parseFloat(getComputedStyle(row.value).columnGap);
  const chipGap = parseFloat(getComputedStyle(sizing.value).columnGap);
  const space = row.value.clientWidth - heading.value.offsetWidth - gap;
  const chips = Array.from(
    sizing.value.children,
    (chip) => (chip as HTMLElement).getBoundingClientRect().width,
  );
  const total =
    chips.reduce((sum, width) => sum + width, 0) + (chips.length - 1) * chipGap;
  if (total <= space) {
    visibleCount.value = chips.length;
    expanded.value = false;
    return;
  }
  let remaining = space - toggle.value.offsetWidth - gap;
  let count = 0;
  for (const width of chips) {
    if (width > remaining) break;
    remaining -= width + chipGap;
    count++;
  }
  visibleCount.value = count;
}

useResizeObserver(
  () => [
    row.value,
    heading.value,
    toggle.value,
    ...Array.from(sizing.value?.children ?? []),
  ],
  measure,
);
watch(() => props.names, measure, { flush: 'post' });
</script>

<template>
  <section
    ref="row"
    :aria-label="title"
    class="relative flex min-w-0 items-start gap-2"
  >
    <div ref="heading" class="flex shrink-0 items-center gap-1">
      <h3 class="pt-1 text-xs font-medium text-muted">
        <NuxtLink
          v-if="kind !== 'tags'"
          :to="collectionPath(kind)"
          no-prefetch
          class="hover:underline"
          @click="emit('navigate')"
          >{{ title }}</NuxtLink
        ><template v-else>{{ title }}</template>
      </h3>
      <slot />
    </div>
    <ul
      :id="id"
      class="flex min-w-0 flex-1 gap-1.5"
      :class="expanded ? 'flex-wrap' : 'overflow-hidden'"
    >
      <li
        v-for="name in expanded ? names : names.slice(0, visibleCount)"
        :key="name"
        class="max-w-full shrink-0"
      >
        <UBadge
          v-if="kind === 'tags'"
          size="sm"
          variant="subtle"
          :color="cardLabelColors.tags"
          class="max-w-full gap-1"
        >
          <span
            :class="
              expanded
                ? 'min-w-0 whitespace-normal wrap-anywhere'
                : 'whitespace-nowrap'
            "
            >{{ name }}</span
          >
        </UBadge>
        <NuxtLink
          v-else
          :to="collectionPath(kind, collectionSlug(name, kind))"
          no-prefetch
          @click="emit('navigate')"
        >
          <UBadge
            size="sm"
            :color="cardLabelColors[kind]"
            variant="subtle"
            class="hover:underline"
            :class="
              expanded
                ? 'max-w-full whitespace-normal wrap-anywhere'
                : 'whitespace-nowrap'
            "
            >{{ name }}</UBadge
          >
        </NuxtLink>
      </li>
    </ul>
    <button
      ref="toggle"
      type="button"
      :aria-controls="id"
      :aria-expanded="expanded"
      :aria-label="`${expanded ? 'Show fewer' : 'Show more'} ${kind}`"
      class="shrink-0 rounded px-1 py-0.5 text-sm text-primary hover:underline"
      :class="{ 'invisible absolute right-0': !overflow }"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : 'Show more' }}
    </button>
    <div
      ref="sizing"
      aria-hidden="true"
      class="invisible pointer-events-none absolute inset-x-0 top-0 flex h-0 gap-1.5 overflow-hidden"
    >
      <UBadge
        v-for="name in names"
        :key="name"
        size="sm"
        variant="subtle"
        :color="cardLabelColors[kind]"
        class="shrink-0 gap-1 whitespace-nowrap"
        >{{ name }}</UBadge
      >
    </div>
  </section>
</template>
