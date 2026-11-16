<template>
  <section
    :class="['search-landing', `search-landing--${searchType}`]"
    aria-labelledby="search-landing-title"
  >
    <div class="landing-header">
      <div>
        <h2 id="search-landing-title" class="landing-title">
          {{ config.heading }}
        </h2>
        <p class="landing-description">
          Not sure where to start? Try one of these popular searches.
        </p>
      </div>
    </div>

    <div class="suggestion-grid" aria-label="Suggested searches">
      <NuxtLink
        v-for="suggestion in config.suggestions"
        :key="suggestion.label"
        :to="suggestionLink(suggestion.label)"
        no-prefetch
        @click="saveSuggestion(suggestion.label)"
        class="suggestion-card"
        :aria-label="`Try ${suggestion.label}`"
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
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { landingConfigs, type LandingSearchType } from '~/utils/searchExamples';
import type { LocationQuery } from 'vue-router';
import { getSearchLink } from '~/utils/searchLinks';
import type { Platform } from '~/utils/platformConfig';

const props = defineProps<{
  searchType: LandingSearchType;
  platform: Platform;
  platformName?: string;
}>();

const config = computed(() => landingConfigs[props.searchType]);
const { saveSearchQuery } = useSearchType();

function saveSuggestion(value: string) {
  const query: LocationQuery = { searchType: props.searchType };
  if (
    props.searchType === 'similarity' ||
    props.searchType === 'popular-by-card'
  )
    query.card_name = value;
  else if (
    props.searchType === 'recommend' ||
    props.searchType === 'popular-by-commander'
  )
    query.commander = value;
  else query.query = value;
  saveSearchQuery(props.searchType, query);
}

function suggestionLink(query: string) {
  if (props.searchType === 'popular-by-card') {
    return {
      path: `/popular-by-card/${props.platform}`,
      query: { card_name: query },
    };
  }
  return getSearchLink({
    platform: props.platform,
    searchType: props.searchType,
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

.search-landing--recommend,
.search-landing--popular-by-commander
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
  margin: 0
  font-size: clamp(1.35rem, 2.4vw, 1.75rem)
  font-weight: 750
  line-height: 1.15
  letter-spacing: -0.025em

.landing-description
  margin-top: 0.4rem
  color: var(--ui-text-muted)
  font-size: 0.9rem
  line-height: 1.5

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
html.dark .search-landing--smart,
html.dark .search-landing--popular-by-card
  --landing-color: #c4b5fd

html.dark .search-landing--similarity
  --landing-color: #ffffff
  --landing-rgb: 255, 255, 255

html.dark .search-landing--commander
  --landing-color: #fcd34d

html.dark .search-landing--keyword
  --landing-color: #93c5fd

html.dark .search-landing--recommend,
html.dark .search-landing--popular-by-commander
  --landing-color: #fdba74
</style>
