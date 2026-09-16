const isMobile = ref(false);
let initialized = false;
let mediaQuery: MediaQueryList | null = null;

function updateMobile(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = !e.matches;
}

export function useIsMobile() {
  if (import.meta.client && !initialized) {
    initialized = true;
    mediaQuery = window.matchMedia('(min-width: 640px)');
    isMobile.value = !mediaQuery.matches;
    mediaQuery.addEventListener('change', updateMobile);
  }
  return isMobile;
}

/** Match the preview rail's xl breakpoint after hydration; no hidden images on mobile. */
export function useDesktopPreview() {
  const isDesktop = ref(false);
  let query: MediaQueryList | undefined;
  const update = () => {
    isDesktop.value = query?.matches ?? false;
  };
  onMounted(() => {
    query = window.matchMedia('(min-width: 1280px)');
    update();
    query.addEventListener('change', update);
  });
  onBeforeUnmount(() => query?.removeEventListener('change', update));
  return readonly(isDesktop);
}
