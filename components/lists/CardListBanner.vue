<template>
  <!-- Banner Section -->
  <div v-if="list" class="mb-2 relative group" data-testid="deck-banner">
    <!-- Banner Image -->
    <div
      class="deck-banner-surface relative min-h-48 md:min-h-64 rounded-lg overflow-hidden flex flex-col"
    >
      <BannerArtwork v-if="bannerImageUrl" :src="bannerImageUrl" />
      <div
        v-else
        class="absolute inset-0 bg-linear-to-br from-purple-600 to-blue-600"
      ></div>

      <!-- Banner Content -->
      <div
        class="relative mt-auto w-full p-4 pt-16 md:max-w-[72%] md:p-6 md:pt-16 xl:max-w-[65%]"
      >
        <h1
          class="text-2xl md:text-4xl leading-snug font-bold text-white mb-2 break-words line-clamp-2"
        >
          <component
            :is="isOwner ? 'button' : 'span'"
            v-bind="settingsTrigger"
            @click="openSettings"
          >
            {{ list.name }}
          </component>
        </h1>
        <div class="flex flex-wrap items-center gap-3 mb-2">
          <component
            :is="isOwner ? 'button' : 'span'"
            v-bind="settingsTrigger"
            class="text-gray-300 text-sm font-medium"
            @click="openSettings"
            >{{
              list.kind === 'collection'
                ? 'Collection'
                : list.format || 'Commander'
            }}</component
          >
          <DeckBracketBadge
            v-if="list.kind !== 'collection'"
            full-label
            :bracket="list.bracket"
            :editable="isOwner"
            @edit="openSettings"
          />
          <button
            v-if="isOwner && !browser"
            v-bind="settingsTrigger"
            @click="openSettings"
            class="text-gray-300 text-sm font-medium"
          >
            {{ list.visibility === 'public' ? 'Public' : 'Private' }}
          </button>
        </div>
        <p
          v-if="list.description"
          class="text-gray-200 text-base md:text-lg break-words line-clamp-2"
        >
          <component
            :is="isOwner ? 'button' : 'span'"
            v-bind="settingsTrigger"
            @click="openSettings"
          >
            {{ list.description }}
          </component>
        </p>

        <slot name="social">
          <DecklistSocialBar
            v-if="list.visibility === 'public'"
            :list="list"
            :owner="{
              id: list.user_id,
              username: list.username,
              avatar_card_name: list.author_avatar_card_name ?? null,
              avatar_printing_id: list.author_avatar_printing_id ?? null,
            }"
            embedded
          />
        </slot>

        <!-- Mana color distribution -->
        <ColorRatioBar
          v-if="list.color_ratios"
          :ratios="list.color_ratios"
          class="mt-3"
        />
      </div>

      <div class="absolute top-4 right-4 flex items-center gap-2">
        <UButton
          v-if="isOwner"
          icon="i-lucide-settings"
          color="neutral"
          variant="subtle"
          :aria-label="
            list.kind === 'collection' ? 'Collection settings' : 'Deck settings'
          "
          class="cursor-pointer min-h-10 min-w-10 justify-center"
          @click="settingsOpen = true"
        >
        </UButton>
        <slot name="actions" />
      </div>
      <div v-if="$slots.bottom" class="relative flex justify-center px-4 pb-4">
        <slot name="bottom" />
      </div>
    </div>
  </div>

  <!-- Banner Skeleton -->
  <div v-else class="mb-2">
    <USkeleton class="h-48 md:h-64 rounded-lg" />
  </div>

  <LazyDeckSettingsModal
    v-if="isOwner && list && settingsOpen"
    v-model:open="settingsOpen"
    :list="list"
  />
</template>

<script setup lang="ts">
import type { DecklistSummary } from '~/models/cardListModel';

const props = defineProps<{
  list: DecklistSummary | null | undefined;
  isLoading: boolean;
  isOwner?: boolean;
}>();

const browser = useBrowserDeckSource();
const settingsOpen = ref(false);
const settingsTrigger = computed(() =>
  props.isOwner
    ? {
        type: 'button' as const,
        'aria-haspopup': 'dialog' as const,
        class:
          'cursor-pointer text-left hover:underline focus-visible:outline-primary',
      }
    : {},
);
function openSettings() {
  if (props.isOwner) settingsOpen.value = true;
}
const bannerImageUrl = computed(() => {
  const cardName = props.list?.avatar_card_name;
  if (!cardName) return null;
  return scryfallArtCropUrl(cardName, props.list?.avatar_printing_id);
});
</script>

<style scoped>
.deck-banner-surface {
  background: #111827;
}
</style>
