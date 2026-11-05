<script setup lang="ts">
import { formatShortDate } from '~/utils/dateFormatter';
import type { DecklistSummary } from '~/models/cardListModel';

const props = withDefaults(
  defineProps<{
    list: DecklistSummary;
    showSettingsButton?: boolean;
    showAuthor?: boolean;
    primerPreview?: string;
  }>(),
  { showSettingsButton: false, showAuthor: false, primerPreview: undefined },
);
defineEmits<{ settings: [] }>();
const artwork = computed(() => {
  const name = props.list.avatar_card_name || props.list.commanders?.[0];
  return name ? scryfallArtCropUrl(name) : undefined;
});
const priceLabel = computed(() =>
  props.list.estimated_price_usd == null
    ? 'Price unavailable'
    : `~$${props.list.estimated_price_usd.toFixed(2)}`,
);
const priceDescription = computed(() =>
  props.list.price_estimate_incomplete
    ? 'Incomplete estimate: some cards or prices are missing. USD, all boards.'
    : 'Estimated USD price from Scryfall, including all boards. Actual prices may vary.',
);
const updated = computed(() => props.list.updated_at || props.list.created_at);
const socialCounts = computed(() => [
  { label: 'views', icon: 'i-lucide-eye', count: props.list.view_count },
  { label: 'likes', icon: 'i-lucide-heart', count: props.list.like_count },
  {
    label: 'comments',
    icon: 'i-lucide-message-circle',
    count: props.list.comment_count,
  },
  { label: 'saves', icon: 'i-lucide-bookmark', count: props.list.save_count },
]);
</script>

<template>
  <article
    class="dark deck-link relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-default text-white transition-colors hover:border-primary group"
  >
    <NuxtLink
      :to="`/lists/${list.id}${primerPreview !== undefined ? '/primer' : ''}`"
      :aria-label="
        list.name ||
        (list.kind === 'collection' ? 'Untitled collection' : 'Untitled deck')
      "
      :draggable="false"
      no-prefetch
      class="absolute inset-0 z-10 rounded-lg focus-visible:outline-2 focus-visible:outline-primary focus-visible:-outline-offset-2"
    />
    <header
      class="deck-link-header relative flex-1 p-4"
      :class="{ 'deck-link-header-primer': primerPreview !== undefined }"
    >
      <PreviewImage
        v-if="artwork"
        :src="artwork"
        alt=""
        class="absolute inset-0 size-full object-cover object-[center_25%]"
      />
      <div class="relative">
        <div class="flex items-start justify-between gap-3">
          <h3
            class="relative z-[1] min-w-0 text-lg font-extrabold leading-snug break-words"
          >
            {{
              list.name ||
              (list.kind === 'collection'
                ? 'Untitled collection'
                : 'Untitled deck')
            }}
          </h3>
          <div
            class="deck-link-meta relative z-20 shrink-0 text-right text-xs font-medium"
          >
            <div
              class="flex flex-wrap min-h-6 items-center justify-end gap-1.5"
            >
              <span>{{
                list.kind === 'collection' ? 'Collection' : list.format
              }}</span>
              <DeckBracketBadge
                v-if="list.kind !== 'collection'"
                :bracket="list.bracket"
                class="relative z-20"
              />
            </div>
            <DeckColorIdentity
              v-if="list.color_ratios"
              :ratios="list.color_ratios"
              class="mt-1"
            />
            <span
              v-if="list.kind !== 'collection'"
              class="mt-1 block text-xs"
              :title="priceDescription"
              :aria-label="`${priceLabel}. ${priceDescription}`"
            >
              {{ priceLabel
              }}<span
                v-if="
                  list.estimated_price_usd != null &&
                  list.price_estimate_incomplete
                "
                class="ml-1 text-amber-300"
                >(partial)</span
              >
            </span>
            <div v-if="showSettingsButton" class="mt-1 flex justify-end">
              <UButton
                @click.stop="$emit('settings')"
                color="neutral"
                variant="ghost"
                icon="i-lucide-settings"
                size="sm"
                class="relative z-20 min-h-11 min-w-11 justify-center text-white hover:bg-white/15 focus-visible:ring-white"
                :aria-label="`Settings for ${list.name}`"
              />
            </div>
          </div>
        </div>
        <p
          v-if="list.kind !== 'collection' && list.commanders?.length"
          class="relative z-[1] mt-1 text-sm line-clamp-1"
        >
          {{ list.commanders.join(', ') }}
        </p>
        <p
          v-if="list.description && primerPreview === undefined"
          class="relative z-[1] mt-3 text-sm leading-relaxed line-clamp-3 break-words"
        >
          {{ list.description }}
        </p>
        <p
          v-if="primerPreview"
          class="relative z-[1] mt-3 text-sm italic leading-relaxed line-clamp-8 whitespace-pre-line break-words"
        >
          {{ primerPreview }}
        </p>
      </div>
    </header>
    <div
      class="deck-link-footer relative mx-4 flex min-h-13 min-w-0 items-center gap-3 border-t border-white/30 py-1"
    >
      <div
        v-if="list.visibility === 'public'"
        class="flex flex-wrap items-center gap-2 text-xs text-gray-300"
      >
        <span
          v-for="stat in socialCounts"
          :key="stat.label"
          class="inline-flex items-center gap-1"
          :aria-label="`${stat.count ?? 0} ${stat.label}`"
          :title="stat.label"
        >
          <UIcon :name="stat.icon" class="size-3.5" aria-hidden="true" />{{
            stat.count ?? 0
          }}
        </span>
      </div>
      <time
        :datetime="updated"
        class="text-xs text-gray-300"
        :class="{
          'sr-only': list.visibility === 'public' && showAuthor,
          'ml-auto': list.visibility === 'public' && !showAuthor,
        }"
        >{{ formatShortDate(updated) }}</time
      >
      <NuxtLink
        v-if="showAuthor && list.username"
        :to="`/user/${list.user_id}`"
        :draggable="false"
        no-prefetch
        class="relative z-20 ml-auto inline-flex min-h-11 min-w-0 items-center gap-1 rounded text-xs hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        :title="list.username"
      >
        <UAvatar
          :src="
            list.author_avatar_card_name
              ? scryfallArtCropUrl(list.author_avatar_card_name)
              : undefined
          "
          alt=""
          icon="i-lucide-circle-user-round"
          class="size-6 shrink-0"
        />
        <span class="truncate">{{ list.username }}</span>
      </NuxtLink>
      <span v-else-if="showAuthor" class="ml-auto text-xs text-gray-300"
        >Anonymous</span
      >
    </div>
    <ColorRatioBar
      v-if="list.color_ratios"
      :ratios="list.color_ratios"
      edge
      class="relative z-20 mt-auto"
    />
  </article>
</template>

<style scoped>
.deck-link {
  background: #090d19;
}
.deck-link-header {
  min-height: 10rem;
}
.deck-link-header::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgb(24 24 24 / 62%),
    rgb(24 24 24 / 66%) 55%,
    #181818
  );
  pointer-events: none;
}
.deck-link-header-primer {
  min-height: 18rem;
}
.deck-link-meta {
  max-width: 48%;
}
</style>
