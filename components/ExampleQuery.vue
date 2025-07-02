<template>
  <div class="example-query-container">
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="32"
      ></v-progress-circular>
      <p class="mt-2 text-white text-caption">Loading example...</p>
    </div>

    <div v-else-if="currentQuery && results.length > 0" class="example-content">
      <!-- Query display and TRY IT button -->
      <div class="query-header">
        <div class="query-text">
          <v-icon class="mr-2" color="primary">mdi-lightbulb-outline</v-icon>
          <span class="query-value">"{{ currentQuery }}"</span>
        </div>
        <div class="button-group">
          <v-btn
            color="white"
            variant="outlined"
            icon="mdi-refresh"
            @click="loadRandomExample"
            :loading="loading"
            class="refresh-button"
            size="small"
          ></v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-magnify"
            @click="tryQuery"
            class="try-button"
          >
            TRY IT!
          </v-btn>
        </div>
      </div>
      <!-- Horizontal scrolling results -->
      <div class="results-container">
        <div class="results-scroll" ref="scrollContainer">
          <div
            v-for="(result, index) in results"
            :key="`${result.card_data.id}-${index}`"
            class="result-card-wrapper"
          >
            <Card
              :card="result"
              :normalization-context="allScores"
              size="small"
              @click="goToCard(result.card_data.id)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { ICardResult } from '~/types/IColbert';

const router = useRouter();

const currentQuery = ref<string>('');
const results = ref<ICardResult[]>([]);
const loading = ref(false);
const scrollContainer = ref<HTMLElement>();
let scrollAnimationId: number | null = null;

// Computed property to get all scores for normalization context
const allScores = computed(() => results.value.map((r) => r.score));

// Example queries to choose from
const exampleQueries = [
  'creatures that draw cards',
  'cheap red burn spells',
  'artifacts that make mana',
  'blue counterspells',
  'green ramp spells',
  'white removal spells',
  'black creatures with flying',
  'creatures with enter the battlefield effects',
  'spells that destroy artifacts',
  'x spells that are board wipes',
  'low cost sultai commanders',
  'finishers for a mono white tokens deck',
  'golgari elves that draw',
  'five color dragon commander',
  'mono red burn spells',
  'creatures that come back from the graveyard',
];

onMounted(async () => {
  await loadRandomExample();
  // Small delay to ensure DOM is fully rendered
  setTimeout(() => {
    startAutoScroll();
  }, 500);
});

onUnmounted(() => {
  if (scrollAnimationId) {
    cancelAnimationFrame(scrollAnimationId);
  }
});

async function loadRandomExample() {
  loading.value = true;

  try {
    // Select random query
    const randomIndex = Math.floor(Math.random() * exampleQueries.length);
    currentQuery.value = exampleQueries[randomIndex];
    // Perform search using the colbert endpoint (index 0)
    const response = await fetch('/api/proxy/search/colbert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: currentQuery.value,
        limit: 80,
        filters: {},
        exclude_card_data: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch example results');
    }

    const data: ICardResult[] = await response.json();
    if (data && data.length > 0) {
      results.value = data.slice(0, 20); // Ensure we only have 10 results
      // Restart scrolling after loading new results
      setTimeout(() => {
        startAutoScroll();
      }, 300);
    }
  } catch (error) {
    console.error('Failed to load example:', error);
  } finally {
    loading.value = false;
  }
}

function startAutoScroll() {
  if (!scrollContainer.value || results.value.length === 0) {
    console.log('Cannot start scroll: container or results missing');
    return;
  }

  // Clear any existing animation
  if (scrollAnimationId) {
    cancelAnimationFrame(scrollAnimationId);
  }
  const scrollSpeed = 1; // pixels per movement
  const baseFrameSkip = 3; // target speed (move every 3 frames)
  let frameCounter = 0;
  let animationFrame = 0; // total frames since start/reset
  const accelerationFrames = 120; // 2 seconds at 60fps to reach full speed
  const pauseFrames = 120; // 2 second pause when resetting or at end
  let isPaused = false;
  let pauseCounter = 0;
  let isAtEnd = false; // track if we're at the end waiting to reset
  let hasReset = false; // track if we just reset and need a second pause

  function animate() {
    if (!scrollContainer.value) return;

    const container = scrollContainer.value;
    const maxScroll = container.scrollWidth - container.clientWidth;

    // Only proceed if there's content to scroll
    if (maxScroll > 0) {
      if (isPaused) {
        pauseCounter++;
        if (pauseCounter >= pauseFrames) {
          isPaused = false;
          pauseCounter = 0;
          if (isAtEnd) {
            // Reset to beginning after end pause
            container.scrollLeft = 0;
            isAtEnd = false;
            hasReset = true; // mark that we just reset
            isPaused = true; // start second pause after reset
          } else if (hasReset) {
            // Finished second pause after reset
            hasReset = false;
            animationFrame = 0; // reset animation frame for smooth acceleration
          } else {
            // Initial pause finished
            animationFrame = 0; // reset animation frame for smooth acceleration
          }
        }
      } else {
        frameCounter++;
        animationFrame++;

        // Calculate current speed based on acceleration curve
        let currentFrameSkip = baseFrameSkip;
        if (animationFrame < accelerationFrames) {
          // Ease-in: start slow and accelerate
          const progress = animationFrame / accelerationFrames;
          const easedProgress = 1 - Math.pow(1 - progress, 3); // cubic ease-in
          currentFrameSkip =
            baseFrameSkip + baseFrameSkip * 3 * (1 - easedProgress); // start 4x slower
        }

        // Only move when frameCounter reaches currentFrameSkip
        if (frameCounter >= currentFrameSkip) {
          frameCounter = 0; // reset counter

          if (container.scrollLeft >= maxScroll) {
            // Reached the end, start pause before reset
            isPaused = true;
            pauseCounter = 0;
            isAtEnd = true;
          } else {
            // Smooth continuous scroll
            container.scrollLeft += scrollSpeed;
          }
        }
      }
    }

    // Schedule next frame
    scrollAnimationId = requestAnimationFrame(animate);
  }
  // Start the animation with initial pause
  isPaused = true;
  pauseCounter = 0;
  animationFrame = 0;
  isAtEnd = false;
  hasReset = false;
  scrollAnimationId = requestAnimationFrame(animate);
}

function tryQuery() {
  // Navigate to search page with the current query
  router.push({
    name: 'search',
    query: {
      q: currentQuery.value,
      endpoint: 0, // Vector search endpoint
      filters: JSON.stringify({
        selectedCardTypes: [],
        selectedColorFilterOption: 'Contains At Most',
        selectedColors: {
          Red: true,
          Blue: true,
          Green: true,
          White: true,
          Black: true,
        },
        selectedRarities: {
          Common: false,
          Uncommon: false,
          Rare: false,
          Mythic: false,
        },
        selectedCMCOption: 'Equal To',
        selectedPowerOption: 'Equal To',
        selectedToughnessOption: 'Equal To',
        selectedCMC: '',
        selectedPower: '',
        selectedToughness: '',
        selectedCardFormats: [],
      }),
    },
  });
}

function goToCard(cardId: string) {
  router.push({
    name: 'cardDetails',
    query: { id: cardId },
  });
}
</script>

<style scoped lang="sass">
.example-query-container
  width: 100%
  max-width: 1072px
  margin: 0 auto

.example-content
  border-radius: 16px
  padding: 12px
  backdrop-filter: blur(10px)
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.9), rgba(66, 66, 66, 0.8))
  border: 1px solid rgba(147, 114, 255, 0.2)

.query-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 6px
  flex-wrap: wrap
  gap: 8px

.button-group
  display: flex
  align-items: center
  gap: 12px
  flex-shrink: 0

.refresh-button
  min-width: 40px !important
  width: 40px !important
  height: 40px !important
  border-radius: 50% !important

.try-button
  flex-shrink: 0

.query-text
  display: flex
  align-items: center
  flex: 1
  min-width: 0

.query-value
  color: rgb(var(--v-theme-primary))
  font-size: 16px
  font-weight: bold
  font-style: italic

.results-container
  width: 100%
  overflow: hidden
  border-radius: 12px

.results-scroll
  display: flex
  gap: 16px
  overflow-x: auto
  padding: 4px

  // Hide scrollbar but keep functionality
  scrollbar-width: none
  -ms-overflow-style: none
  &::-webkit-scrollbar
    display: none

.result-card-wrapper
  flex: 0 0 auto
  cursor: pointer
  transition: all 0.3s ease

  &:hover
    transform: translateY(-4px) scale(1.02)
    box-shadow: 0 8px 24px rgba(147, 114, 255, 0.3)
</style>
