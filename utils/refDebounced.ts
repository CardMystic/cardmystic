import { ref, watch, type Ref } from 'vue';

/**
 * Returns a ref that mirrors `source` after `delayMs` of inactivity.
 * Drop-in replacement for `@vueuse/core`'s `refDebounced`.
 */
export function refDebounced<T>(source: Ref<T>, delayMs = 200): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(source, (value) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = value;
      timer = null;
    }, delayMs);
  });

  return debounced;
}
