import type { ComputedRef } from 'vue';
import { FALLBACK_OG_IMAGE } from '~/utils/seoMeta';

export function useCollectionSeo(
  title: string,
  description: string,
  path: string,
  noindex: ComputedRef<boolean>,
  image?: string | null,
) {
  const origin = 'https://cardmystic.com';
  const canonical = new URL(path, origin).href;
  useSeoMeta({
    title: `${title} | CardMystic`,
    description,
    robots: () => (noindex.value ? 'noindex, follow' : 'index, follow'),
    ogType: 'website',
    ogSiteName: 'CardMystic',
    ogTitle: `${title} | CardMystic`,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: image || FALLBACK_OG_IMAGE,
    ogImageAlt: title,
    twitterCard: 'summary_large_image',
    twitterTitle: `${title} | CardMystic`,
    twitterDescription: description,
    twitterImage: image || FALLBACK_OG_IMAGE,
    twitterImageAlt: image ? title : 'CardMystic preview',
  });
  useHead({ link: [{ rel: 'canonical', href: canonical }] });
}
