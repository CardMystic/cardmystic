<template>
  <div
    class="w-full flex flex-col relative z-10"
    :class="{
      'max-w-[2000px] mx-auto': !isCreator || editorMode === 'preview',
    }"
  >
    <div class="mb-4 w-full max-w-[2000px] mx-auto">
      <CardListBanner
        :list="list"
        :is-loading="isLoadingLists"
        :is-owner="isCreator"
      >
        <template #bottom>
          <UButton
            :to="`/lists/${listId}`"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="subtle"
            label="Back to Decklist"
          />
        </template>
      </CardListBanner>
    </div>

    <!-- Primer editor / viewer -->
    <div class="flex flex-col mb-5">
      <MarkdownEditor
        v-model="primerContent"
        :primer-list-id="listId"
        :editable="isCreator"
        :is-saving="isSaving"
        :save-handler="handleSave"
        @mode-change="editorMode = $event"
      />
    </div>
    <RelatedContent
      v-if="list && primerText?.trim() && editorMode === 'preview'"
      :source-id="listId"
      kind="primer"
    />
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { excerptFromMarkdown, FALLBACK_OG_IMAGE } from '~/utils/seoMeta';
import { safeJsonLd } from '~/utils/safeJsonLd';
import { useOwnedDecklist } from '~/composables/useCardLists';
import { usePublicDecklistSummaries } from '~/composables/useDiscovery';
import { usePrimer } from '~/composables/usePrimer';
import { useSupabase } from '~/composables/useSupabase';
import {
  GetPrimerResponseSchema,
  GetFeaturedDecklistsResponseSchema,
} from '~/models/cardListModel';
import { fetchDirectArtCropUrl } from '~/utils/scryfall';
import { useToast } from '#imports';

definePageMeta({ layout: 'editor' });

const route = useRoute();
const requestFetch = useRequestFetch();
const listId = route.params.id as string;
const toast = useToast();
const config = useRuntimeConfig();
const supabase = process.server ? null : useSupabase();
const queryClient = useQueryClient();

// Block SSR on the public deck and primer requests so link unfurlers receive
// the real title, excerpt, and image in the initial HTML. Seed the matching
// vue-query caches to avoid immediately repeating either request on hydration.
const ssrPublicList = await useSsrQuerySeed({
  cacheKey: `primer-list-ssr-${listId}`,
  path: `/supabase/card-lists/summaries?ids=${encodeURIComponent(listId)}`,
  schema: GetFeaturedDecklistsResponseSchema,
  queryKey: ['discovery', 'public-list-summaries', [listId]],
});

const { data: ssrPrimerResponse } = await useAsyncData(
  `primer-content-ssr-${listId}`,
  async () => {
    try {
      const raw = await requestFetch(
        `${config.public.backendPath}/supabase/card-lists/primer/${encodeURIComponent(listId)}`,
      );
      return GetPrimerResponseSchema.parse(raw);
    } catch {
      return null;
    }
  },
);
if (ssrPrimerResponse.value) {
  queryClient.setQueryData(
    ['primer', listId],
    ssrPrimerResponse.value.text ?? null,
  );
}

// Resolve the deck's selected avatar to a direct CDN URL because Discord does
// not reliably follow Scryfall's named-card redirect for og:image.
const ssrSocialCardName = computed(() => {
  const decklist = ssrPublicList.value?.decklists[0];
  return decklist?.avatar_card_name || null;
});
const { data: ssrOgImageUrl } = await useAsyncData(
  `primer-og-image-${listId}`,
  async () => {
    if (!ssrSocialCardName.value) return null;
    return fetchDirectArtCropUrl(
      ssrSocialCardName.value,
      config.public.backendPath,
      requestFetch,
      ssrPublicList.value?.decklists[0]?.avatar_printing_id,
    );
  },
);

const listIdRef = computed(() => listId);
const { decklist: ownedList, isLoading: isLoadingLists } =
  useOwnedDecklist(listIdRef);

// Non-owners viewing a public primer still get the deck metadata (name,
// commanders, avatar art) so the primer page can render rich SEO/social
// previews without downloading all the cards in the deck.
const { decklists: publicDecklists } = usePublicDecklistSummaries(
  computed(() => [listId]),
);

const list = computed(
  () => ownedList.value ?? publicDecklists.value[0] ?? null,
);

const isCreator = computed(() => !!ownedList.value);

const editorMode = ref<'edit' | 'split' | 'preview'>('preview');
const primerContent = ref('');
const isSaving = ref(false);

// Load primer via the shared query (public primers need no auth). Seed the
// editable ref once so refetches don't clobber in-progress edits.
const { primerText } = usePrimer(listIdRef);
let seeded = false;
watch(
  primerText,
  (text) => {
    if (!seeded && text !== null) {
      primerContent.value = text;
      seeded = true;
    }
  },
  { immediate: true },
);

async function handleSave(value: string) {
  isSaving.value = true;
  try {
    if (!supabase) throw new Error('Not authenticated');
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Not authenticated');
    await $fetch(`${config.public.backendPath}/supabase/card-lists/primer`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: { listId, text: value },
    });
    toast.add({ title: 'Primer saved', icon: 'i-lucide-check' });
    queryClient.invalidateQueries({ queryKey: ['primer', listId] });
  } catch (e: any) {
    toast.add({
      title: 'Error saving primer',
      description: e?.message,
      color: 'error',
    });
    // Rethrow so MarkdownEditor keeps the draft dirty and re-enables retry.
    throw e;
  } finally {
    isSaving.value = false;
  }
}

// ---- SEO ----

const canonicalUrl = computed(
  () => `https://cardmystic.com/lists/${listId}/primer`,
);

const publicList = computed(() =>
  list.value?.visibility === 'public' ? list.value : null,
);
const hasPublicPrimer = computed(
  () => !!publicList.value && !!primerText.value?.trim(),
);

const seoTitle = computed(() =>
  publicList.value
    ? `${publicList.value.name || 'Untitled deck'} — Primer | CardMystic`
    : 'Deck Primer | CardMystic',
);

const seoDescription = computed(() => {
  if (!publicList.value)
    return 'Read Magic: The Gathering deck primers on CardMystic.';
  const snippet = excerptFromMarkdown(primerText.value ?? '');
  if (snippet) return snippet;
  const cmds = publicList.value.commanders ?? [];
  const cmdLine = cmds.length ? ` led by ${cmds.join(' & ')}` : '';
  return `Primer for ${publicList.value.name || 'this deck'}${cmdLine}. Read the strategy, mulligans, and card choices on CardMystic.`;
});

const seoImage = computed(() => ssrOgImageUrl.value || FALLBACK_OG_IMAGE);

// Only index primers that have real content — owner-only drafts and
// private decks return no primer text to anonymous crawlers and stay out
// of the index.
const seoRobots = computed(() =>
  hasPublicPrimer.value ? 'index, follow' : 'noindex, nofollow',
);

useSeoMeta({
  title: () => seoTitle.value,
  description: () => seoDescription.value,
  robots: () => seoRobots.value,
  ogTitle: () => seoTitle.value,
  ogDescription: () => seoDescription.value,
  ogType: 'article',
  ogUrl: () => canonicalUrl.value,
  ogImage: () => seoImage.value,
  ogImageAlt: () =>
    publicList.value
      ? `Art for ${publicList.value.name || 'Untitled deck'}`
      : 'CardMystic decklist primer',
  ogSiteName: 'CardMystic',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => seoImage.value,
});

useHead(() => ({
  link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
  script: hasPublicPrimer.value
    ? [
        {
          key: 'deck-primer',
          type: 'application/ld+json',
          innerHTML: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${publicList.value?.name || 'Untitled deck'} — Primer`,
            description: seoDescription.value,
            url: canonicalUrl.value,
            image: seoImage.value,
            about: { '@id': `https://cardmystic.com/lists/${listId}` },
            author: publicList.value?.username
              ? { '@type': 'Person', name: publicList.value.username }
              : undefined,
          }),
        },
      ]
    : [],
}));
</script>
