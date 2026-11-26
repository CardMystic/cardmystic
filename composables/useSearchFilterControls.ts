import { shallowRef, type ComputedRef, type ShallowRef } from 'vue';

type SearchFilterControls = {
  path: string;
  count: ComputedRef<number>;
  open: (trigger: HTMLElement) => void;
};

// Keep the active drawer on this app instance, outside serialized page data.
export function useSearchFilterControls() {
  const app = useNuxtApp() as ReturnType<typeof useNuxtApp> & {
    searchFilterControls?: ShallowRef<SearchFilterControls | undefined>;
  };
  return (app.searchFilterControls ??= shallowRef<SearchFilterControls>());
}
