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
