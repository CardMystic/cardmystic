import { inject, onScopeDispose, provide, type InjectionKey } from 'vue';

const visibilityKey: InjectionKey<
  ReturnType<typeof createSearchResultVisibility>
> = Symbol('search-result-visibility');

// A single observer serves the entire result list, including all expanded groups.
export function createSearchResultVisibility() {
  const pending = new Map<Element, () => void>();
  let observer: IntersectionObserver | undefined;

  function observe(element: Element, show: () => void) {
    if (typeof IntersectionObserver === 'undefined') {
      show();
      return () => {};
    }
    observer ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const render = pending.get(entry.target);
          pending.delete(entry.target);
          observer?.unobserve(entry.target);
          render?.();
        }
      },
      { rootMargin: '600px 0px' },
    );
    pending.set(element, show);
    observer.observe(element);
    return () => {
      pending.delete(element);
      observer?.unobserve(element);
    };
  }

  function disconnect() {
    observer?.disconnect();
    pending.clear();
  }

  return { observe, disconnect };
}

export function provideSearchResultVisibility() {
  const visibility = createSearchResultVisibility();
  provide(visibilityKey, visibility);
  onScopeDispose(visibility.disconnect);
  return visibility;
}

export function useSearchResultVisibility() {
  return inject(visibilityKey, null);
}
