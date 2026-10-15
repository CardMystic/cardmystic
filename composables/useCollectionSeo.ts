import type { ComputedRef } from 'vue';
const FALLBACK_OG_IMAGE = 'https://cardmystic.com/cardmystic_preview.png';

export function useCollectionSeo(
  title: string,
  description: string,
  path: string,
  noindex: ComputedRef<boolean>,
) {
  const origin = 'https://cardmystic.com';
  const canonical = new URL(path, origin).href;
  useSeoMeta({
    title: `${title} | CardMystic`,
    description,
    robots: () => (noindex.value ? 'noindex, follow' : 'index, follow'),
    ogType: 'website',
    ogTitle: `${title} | CardMystic`,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: FALLBACK_OG_IMAGE,
    ogImageAlt: title,
    twitterCard: 'summary_large_image',
    twitterTitle: `${title} | CardMystic`,
    twitterDescription: description,
    twitterImage: FALLBACK_OG_IMAGE,
  });
  useHead({ link: [{ rel: 'canonical', href: canonical }] });
}
