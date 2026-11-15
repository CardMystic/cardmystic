import { FALLBACK_OG_IMAGE } from '~/utils/seoMeta';
import { safeJsonLd } from '~/utils/safeJsonLd';

export function usePublicPageSeo(options: {
  title: MaybeRefOrGetter<string>;
  description: MaybeRefOrGetter<string>;
  path: MaybeRefOrGetter<string | null>;
  schemaType?: 'AboutPage' | 'WebPage';
}) {
  const title = () => toValue(options.title);
  const description = () => toValue(options.description);
  useCanonicalUrl(options.path);
  useSeoMeta({
    title,
    description,
    ogType: 'website',
    ogSiteName: 'CardMystic',
    ogTitle: title,
    ogDescription: description,
    ogImage: FALLBACK_OG_IMAGE,
    ogImageAlt: 'CardMystic preview',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: FALLBACK_OG_IMAGE,
    twitterImageAlt: 'CardMystic preview',
  });
  if (options.schemaType) {
    useHead(() => {
      const path = toValue(options.path);
      if (!path) return {};
      return {
        script: [
          {
            key: 'public-page',
            type: 'application/ld+json',
            innerHTML: safeJsonLd({
              '@context': 'https://schema.org',
              '@type': options.schemaType,
              name: title(),
              description: description(),
              url: new URL(path, 'https://cardmystic.com').href,
              isPartOf: { '@id': 'https://cardmystic.com/#website' },
            }),
          },
        ],
      };
    });
  }
}
