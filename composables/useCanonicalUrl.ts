import { toValue, type MaybeRefOrGetter } from 'vue';

// Call only for public pages whose preferred URL is their route path.
// A null path leaves ad-hoc search results without a landing-page canonical.
export function useCanonicalUrl(path: MaybeRefOrGetter<string | null>) {
  useHead(() => {
    const value = toValue(path);
    return {
      link: value
        ? [{ rel: 'canonical', href: `https://cardmystic.com${value}` }]
        : [],
    };
  });
}
