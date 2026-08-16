<template>
  <div class="w-full h-[97vh] flex flex-col mx-auto relative z-10 pt-4">
    <!-- Page Background Image (blurred, behind all content) -->
    <div v-if="bannerImageUrl" class="fixed inset-0 -z-10">
      <div
        class="absolute inset-0 bg-cover bg-position-[center_10%] opacity-40 dark:opacity-20 blur-sm"
        :style="{ backgroundImage: `url(${bannerImageUrl})` }"
      ></div>
    </div>

    <!-- Back button -->
    <div class="mb-4">
      <UButton
        :to="`/lists/${listId}`"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="outline"
        label="Back to Decklist"
        class="cursor-pointer"
      />
    </div>

    <!-- Primer editor / viewer -->
    <ClientOnly>
      <MarkdownEditor
        v-model="primerContent"
        :editable="isCreator"
        :is-saving="isSaving"
        :save-handler="handleSave"
      />
      <template #fallback>
        <USkeleton class="h-[60vh] w-full rounded-md" />
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { useOwnedDecklist } from '~/composables/useCardLists';
import { usePublicDecklist } from '~/composables/useDiscovery';
import { usePrimer } from '~/composables/usePrimer';
import { useSupabase } from '~/composables/useSupabase';
import { useToast } from '#imports';

const route = useRoute();
const listId = route.params.id as string;
const toast = useToast();
const config = useRuntimeConfig();
const supabase = process.server ? null : useSupabase();
const queryClient = useQueryClient();

const listIdRef = computed(() => listId);
const { decklist: ownedList, isLoading: isLoadingLists } =
  useOwnedDecklist(listIdRef);

// Non-owners viewing a public primer still get the deck metadata (name,
// commanders, avatar art) so the primer page can render rich SEO/social
// previews. usePublicDecklist is a no-op for private decks.
const { decklist: publicDecklist } = usePublicDecklist(listIdRef);

const list = computed(() => ownedList.value ?? publicDecklist.value ?? null);

const isCreator = computed(() => !!ownedList.value);

const bannerImageUrl = computed(() => {
  const cardName = list.value?.avatar_card_name;
  if (!cardName) return null;
  return scryfallArtCropUrl(cardName);
});

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
    await $fetch(`${config.public.backendUrl}/supabase/card-lists/primer`, {
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
const FALLBACK_OG_IMAGE = 'https://cardmystic.com/cardmystic_cards.png';

const canonicalUrl = computed(
  () => `https://cardmystic.com/lists/${listId}/primer`,
);

// The primer endpoint only returns text for public lists (or to the
// owner). If we have primer text server-side, the list is public.
const hasPrimerText = computed(() => !!primerText.value?.trim());

const seoTitle = computed(() => {
  if (!list.value) return 'Deck Primer | CardMystic';
  return `${list.value.name || 'Untitled deck'} — Primer | CardMystic`;
});

// Description is the first ~200 chars of the primer text (plain), or a
// synthesized fallback keyed off the deck name / commanders.
const seoDescription = computed(() => {
  const text = primerText.value?.trim() ?? '';
  if (text) {
    const plain = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^>\s?/gm, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/[*_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const snippet = plain.length > 200 ? `${plain.slice(0, 199)}…` : plain;
    if (snippet) return snippet;
  }
  if (!list.value) {
    return 'Read Magic: The Gathering deck primers on CardMystic.';
  }
  const cmds = (list.value.commanders as string[] | undefined) ?? [];
  const cmdLine = cmds.length ? ` led by ${cmds.join(' & ')}` : '';
  return `Primer for ${list.value.name || 'this deck'}${cmdLine}. Read the strategy, mulligans, and card choices on CardMystic.`;
});

const seoImage = computed(() => bannerImageUrl.value || FALLBACK_OG_IMAGE);

// Only index primers that have real content — owner-only drafts and
// private decks return no primer text to anonymous crawlers and stay out
// of the index.
const seoRobots = computed(() =>
  hasPrimerText.value ? 'index, follow' : 'noindex, nofollow',
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
    list.value
      ? `Art for ${list.value.name || 'Untitled deck'}`
      : 'CardMystic decklist primer',
  ogSiteName: 'CardMystic',
  twitterCard: 'summary_large_image',
  twitterTitle: () => seoTitle.value,
  twitterDescription: () => seoDescription.value,
  twitterImage: () => seoImage.value,
});

useHead({
  link: [{ rel: 'canonical', href: () => canonicalUrl.value }],
});
</script>
