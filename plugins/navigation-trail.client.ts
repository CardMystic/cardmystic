import { watch } from 'vue';
import {
  advanceNavigationTrail,
  inferredNavigationAction,
  navigationActionStateKey,
  navigationTrailEntry,
  restoredNavigationTrail,
  type NavigationTrailEntry,
} from '../utils/navigation-trail';

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter();
  const entries = useState<NavigationTrailEntry[]>(
    'navigation-trail',
    () => [],
  );
  const historyKey = 'cardmysticNavigationTrail';

  function persist() {
    try {
      window.history.replaceState(
        {
          ...window.history.state,
          [historyKey]: entries.value.map((entry) => ({ ...entry })),
        },
        '',
      );
    } catch (error) {
      console.warn(
        '[navigation] Unable to preserve breadcrumbs in browser history.',
        error,
      );
    }
  }

  function synchronize() {
    const destination = navigationTrailEntry(router.currentRoute.value);
    const restored = destination
      ? restoredNavigationTrail(
          window.history.state?.[historyKey],
          destination.to,
        )
      : undefined;
    const action = window.history.state?.[navigationActionStateKey];
    entries.value =
      restored ??
      advanceNavigationTrail(
        entries.value,
        destination,
        action === 'drill-down' || action === 'refine' || action === 'return'
          ? action
          : inferredNavigationAction(entries.value.at(-1), destination),
      );
  }

  let stopRoutes = () => {};
  let stopEntries = () => {};
  function start() {
    synchronize();
    persist();
    stopEntries = watch(entries, persist, { flush: 'sync' });
    stopRoutes = router.afterEach((_to, _from, failure) => {
      if (!failure) synchronize();
    });
  }
  // app:mounted can precede hydration of the async layout and card page.
  const stopReady = nuxtApp.isHydrating
    ? nuxtApp.hooks.hookOnce('app:suspense:resolve', start)
    : undefined;
  if (!nuxtApp.isHydrating) start();
  function dispose() {
    stopReady?.();
    stopRoutes();
    stopEntries();
  }
  nuxtApp.vueApp.onUnmount(dispose);
  if (import.meta.hot) import.meta.hot.dispose(dispose);
});
