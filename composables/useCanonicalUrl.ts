import { toValue, type MaybeRefOrGetter } from 'vue';

// Call only for public pages whose preferred URL is their route path.
// A null path leaves ad-hoc search results without a landing-page canonical.
export function useCanonicalUrl(path: MaybeRefOrGetter<string | null>) {
  const canonical = computed(() => {
    const value = toValue(path);
    return value ? `https://cardmystic.com${value}` : undefined;
  });
  useSeoMeta({ ogUrl: () => canonical.value });
  useHead(() => {
    return {
      link: canonical.value
        ? [{ rel: 'canonical', href: canonical.value }]
        : [],
    };
  });
}
