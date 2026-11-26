<template>
  <div ref="element" :data-deferred="rendered ? undefined : ''">
    <slot v-if="rendered" />
    <CardSkeleton
      v-else-if="view === 'grid'"
      :show-card-info="true"
      :hide-progress-bar="hideProgressBar"
    />
    <div
      v-else
      class="h-9 flex items-center gap-2 px-1.5 border-b border-default"
      aria-hidden="true"
    >
      <USkeleton class="h-3.5 w-5 shrink-0" />
      <USkeleton class="h-3.5 w-2/3" />
      <USkeleton class="h-4 w-10 ml-auto shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchResultVisibility } from '~/composables/useSearchResultVisibility';

const props = defineProps<{
  eager?: boolean;
  view: 'grid' | 'text';
  hideProgressBar?: boolean;
}>();

const visibility = useSearchResultVisibility();
const element = ref<HTMLElement | null>(null);
// Public server-rendered results keep their full card links and hydrate with
// identical markup. Results arriving after mount only build cards near the view.
const rendered = ref(
  props.eager || import.meta.server || useNuxtApp().isHydrating,
);
let stopObserving: (() => void) | undefined;
onMounted(() => {
  if (rendered.value) return;
  if (!visibility || !element.value) {
    rendered.value = true;
    return;
  }
  stopObserving = visibility.observe(element.value, () => {
    rendered.value = true;
  });
});
onBeforeUnmount(() => stopObserving?.());
</script>
