<template>
  <section
    :class="['search-landing', `search-landing--${searchType}`]"
    aria-labelledby="search-landing-title"
  >
    <div class="landing-header">
      <p id="search-landing-title" class="landing-title">
        Not sure what to search?
      </p>
    </div>

    <div class="suggestion-grid" aria-label="Suggested searches">
      <button
        v-for="suggestion in config.suggestions"
        :key="suggestion.label"
        type="button"
        class="suggestion-card"
        :aria-label="`Try ${suggestion.label}`"
        @click="runSuggestion(suggestion.label)"
      >
        <span class="suggestion-icon-wrap">
          <UIcon
            :name="suggestion.icon"
            class="suggestion-icon"
            aria-hidden="true"
          />
        </span>
        <span class="suggestion-label">{{ suggestion.label }}</span>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="suggestion-arrow"
          aria-hidden="true"
        />
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { LocationQueryRaw } from 'vue-router';
import type { Platform } from '~/utils/platformConfig';

type LandingSearchType =
  'smart' | 'similarity' | 'commander' | 'keyword' | 'recommend';

interface Suggestion {
  label: string;
  icon: string;
}

interface LandingConfig {
  suggestions: Suggestion[];
}

const props = defineProps<{
  searchType: LandingSearchType;
  platform: Platform;
  platformName: string;
}>();

const landingConfigs: Record<LandingSearchType, LandingConfig> = {
  smart: {
    suggestions: [
      {
        label: 'Creatures that draw cards',
        icon: 'i-lucide-book-open',
      },
      {
        label: 'Two-mana mana rocks',
        icon: 'i-lucide-gem',
      },
      {
        label: 'Instant-speed protection',
        icon: 'i-lucide-shield',
      },
      {
        label: 'Graveyard recursion',
        icon: 'i-lucide-refresh-cw',
      },
      {
        label: 'Token doublers',
        icon: 'i-lucide-copy-plus',
      },
      {
        label: 'Exile board wipes',
        icon: 'i-lucide-sparkles',
      },
    ],
  },
  similarity: {
    suggestions: [
      {
        label: 'Lightning Bolt',
        icon: 'i-lucide-zap',
      },
      { label: 'Sol Ring', icon: 'i-lucide-circle-dot' },
      {
        label: 'Rhystic Study',
        icon: 'i-lucide-book-open',
      },
      {
        label: 'Swords to Plowshares',
        icon: 'i-lucide-swords',
      },
      {
        label: 'Cyclonic Rift',
        icon: 'i-lucide-waves',
      },
      {
        label: 'Counterspell',
        icon: 'i-lucide-shield-x',
      },
    ],
  },
  commander: {
    suggestions: [
      {
        label: 'Graveyard recursion',
        icon: 'i-lucide-refresh-cw',
      },
      {
        label: 'Spellslinger',
        icon: 'i-lucide-wand-sparkles',
      },
      {
        label: 'Artifact combo',
        icon: 'i-lucide-cog',
      },
      {
        label: 'Group hug',
        icon: 'i-lucide-hand-heart',
      },
      {
        label: 'Voltron',
        icon: 'i-lucide-swords',
      },
      {
        label: 'Token army',
        icon: 'i-lucide-users',
      },
    ],
  },
  keyword: {
    suggestions: [
      {
        label: 'Draw a card',
        icon: 'i-lucide-book-open',
      },
      {
        label: 'Create a token',
        icon: 'i-lucide-copy-plus',
      },
      {
        label: 'Destroy target creature',
        icon: 'i-lucide-skull',
      },
      {
        label: 'Counter target spell',
        icon: 'i-lucide-shield-x',
      },
      {
        label: 'Whenever a creature dies',
        icon: 'i-lucide-refresh-ccw',
      },
      {
        label: 'Enters the battlefield',
        icon: 'i-lucide-log-in',
      },
    ],
  },
  recommend: {
    suggestions: [
      {
        label: 'Korvold, Fae-Cursed King',
        icon: 'i-mdi-crown',
      },
      {
        label: 'Kaalia of the Vast',
        icon: 'i-mdi-crown',
      },
      {
        label: "Atraxa, Praetors' Voice",
        icon: 'i-mdi-crown',
      },
      {
        label: 'Muldrotha, the Gravetide',
        icon: 'i-mdi-crown',
      },
      {
        label: 'Isshin, Two Heavens as One',
        icon: 'i-mdi-crown',
      },
      {
        label: "Yuriko, the Tiger's Shadow",
        icon: 'i-mdi-crown',
      },
    ],
  },
};

const config = computed(() => landingConfigs[props.searchType]);
const router = useRouter();

function runSuggestion(value: string) {
  const segment =
    props.searchType === 'recommend' ? 'deckbuilder' : props.searchType;
  const query: LocationQueryRaw = { searchType: props.searchType };

  if (props.searchType === 'similarity') query.card_name = value;
  else if (props.searchType === 'recommend') query.commander = value;
  else query.query = value;

  router.push({
    path: `/search/${props.platform}/${segment}`,
    query,
  });
}
</script>

<style scoped lang="sass">
.search-landing
  --landing-color: #6d28d9
  --landing-rgb: 139, 92, 246
  width: 100%
  max-width: 80rem
  margin: 1.25rem auto 3rem
  padding: clamp(1.25rem, 3vw, 2rem)
  border: 1px solid rgba(var(--landing-rgb), 0.2)
  border-radius: 1rem
  background: var(--ui-bg)

.search-landing--similarity
  --landing-color: #111827
  --landing-rgb: 17, 24, 39

.search-landing--commander
  --landing-color: #b45309
  --landing-rgb: 245, 158, 11

.search-landing--keyword
  --landing-color: #1d4ed8
  --landing-rgb: 59, 130, 246

.search-landing--recommend
  --landing-color: #c2410c
  --landing-rgb: 249, 115, 22

.landing-header
  display: flex
  align-items: flex-start
  gap: 1rem
  max-width: 52rem

.landing-icon-wrap,
.suggestion-icon-wrap
  display: inline-flex
  align-items: center
  justify-content: center
  flex: 0 0 auto
  color: var(--landing-color)
  background: rgba(var(--landing-rgb), 0.12)

.landing-icon-wrap
  width: 3rem
  height: 3rem
  border-radius: 0.9rem

.landing-icon
  width: 1.5rem
  height: 1.5rem

.landing-eyebrow
  font-family: monospace
  font-size: 0.72rem
  font-weight: 700
  letter-spacing: 0.16em
  text-transform: uppercase
  color: var(--landing-color)

.landing-title
  margin-top: 0.2rem
  font-size: 1.2rem
  font-weight: 600
  line-height: 1.15
  letter-spacing: -0.02em

.landing-description
  margin-top: 0.55rem
  color: var(--ui-text-muted)
  font-size: 0.95rem
  line-height: 1.6

.suggestion-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 0.7rem
  margin-top: 1.5rem

.suggestion-card
  display: grid
  grid-template-columns: auto minmax(0, 1fr) auto
  align-items: center
  gap: 0.7rem
  min-height: 3.9rem
  padding: 0.7rem 0.8rem
  border: 1px solid var(--ui-border)
  border-radius: 0.85rem
  background: color-mix(in srgb, var(--ui-bg) 90%, transparent)
  color: var(--ui-text-highlighted)
  font: inherit
  text-align: left
  cursor: pointer
  transition: transform 170ms ease, border-color 170ms ease, background 170ms ease
  &:hover
    transform: translateY(-2px)
    border-color: rgba(var(--landing-rgb), 0.45)
    background: rgba(var(--landing-rgb), 0.05)
  &:focus-visible
    outline: 2px solid rgba(var(--landing-rgb), 0.75)
    outline-offset: 2px

.suggestion-icon-wrap
  width: 2.1rem
  height: 2.1rem
  border-radius: 0.65rem

.suggestion-icon
  width: 1.05rem
  height: 1.05rem

.suggestion-label
  min-width: 0
  color: var(--landing-color)
  font-size: 0.84rem
  font-weight: 700
  line-height: 1.25

.suggestion-arrow
  width: 0.95rem
  height: 0.95rem
  color: var(--landing-color)
  opacity: 0.45
  transition: transform 170ms ease, opacity 170ms ease

.suggestion-card:hover .suggestion-arrow
  transform: translate(2px, -2px)
  opacity: 0.9

.keyboard-tip
  display: flex
  align-items: center
  justify-content: center
  gap: 0.35rem
  margin-top: 1.5rem
  color: var(--ui-text-muted)
  font-size: 0.75rem
  text-align: center
  kbd
    display: inline-flex
    align-items: center
    justify-content: center
    min-width: 1.4rem
    height: 1.4rem
    padding: 0 0.35rem
    border: 1px solid var(--ui-border)
    border-bottom-width: 2px
    border-radius: 0.35rem
    background: var(--ui-bg)
    color: var(--ui-text-highlighted)
    font-family: monospace

@media (max-width: 900px)
  .suggestion-grid
    grid-template-columns: repeat(2, minmax(0, 1fr))

@media (max-width: 640px)
  .search-landing
    border-radius: 1rem

  .landing-header
    gap: 0.75rem

  .landing-icon-wrap
    width: 2.5rem
    height: 2.5rem

  .suggestion-grid
    grid-template-columns: 1fr

  .keyboard-tip
    flex-wrap: wrap
</style>

<style lang="sass">
html.dark .search-landing--smart
  --landing-color: #c4b5fd

html.dark .search-landing--similarity
  --landing-color: #ffffff
  --landing-rgb: 255, 255, 255

html.dark .search-landing--commander
  --landing-color: #fcd34d

html.dark .search-landing--keyword
  --landing-color: #93c5fd

html.dark .search-landing--recommend
  --landing-color: #fdba74
</style>
