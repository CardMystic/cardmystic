import { ref, watch, onScopeDispose, type Ref } from 'vue';

/**
 * Returns a ref that mirrors `source` after `delayMs` of inactivity.
 * Drop-in replacement for `@vueuse/core`'s `refDebounced`.
 *
 * The watcher and any pending timer are automatically cleaned up when the
 * owning effect scope (component, composable, etc.) is disposed.
 */
export function refDebounced<T>(source: Ref<T>, delayMs = 200): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stopWatch = watch(source, (value) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = value;
      timer = null;
    }, delayMs);
  });

  onScopeDispose(() => {
    stopWatch();
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  });

  return debounced;
}
