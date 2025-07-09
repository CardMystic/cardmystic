<template>
    <div class="example-query-container">
        <div v-if="isLoading" class="text-center">
            <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
            <p class="mt-2 text-white text-caption">Loading example...</p>
        </div>

        <div v-else-if="results && results.length > 0" class="example-content">
            <!-- Query display and TRY IT button -->
            <div class="query-header">
                <div class="query-text">
                    <v-icon class="mr-2" color="primary">mdi-lightbulb-outline</v-icon>
                    <span class="query-value">"{{ wordSearch.query }}"</span>
                </div>
                <div class="button-group">
                    <v-btn color="white" variant="outlined" icon="mdi-refresh" @click="loadRandomExample"
                        :loading="isLoading" class="refresh-button" size="small"></v-btn>
                    <v-btn color="primary" variant="outlined" @click="tryQuery" class="try-button"
                        prepend-icon="mdi-magnify">
                        TRY
                    </v-btn>
                </div>
            </div>
            <!-- Horizontal scrolling results -->
            <div class="results-container">
                <div class="results-scroll" ref="scrollContainer">
                    <!-- First set of cards -->
                    <div v-for="(result, index) in results" :key="`${result.card_data.id}-${index}`"
                        class="result-card-wrapper">
                        <Card :card="result" :normalization-context="allScores" size="small"
                            @click="goToCard(result.card_data.id)" />
                    </div>
                    <!-- Loop divider -->
                    <div class="loop-divider">
                        <div class="divider-line"></div>
                        <div class="divider-icon">
                            <v-icon color="primary" size="20">mdi-repeat</v-icon>
                        </div>
                        <div class="divider-line"></div>
                    </div>
                    <!-- Duplicate set for seamless looping -->
                    <div v-for="(result, index) in results" :key="`${result.card_data.id}-${index}-duplicate`"
                        class="result-card-wrapper">
                        <Card :card="result" :normalization-context="allScores" size="small"
                            @click="goToCard(result.card_data.id)" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useQuery } from '@tanstack/vue-query'
import { DefaultLimit, WordSearchSchema } from '~/models/searchModel';
import type { Card } from '~/models/cardModel';
const router = useRouter();

const currentQuery = ref<string>('creatures that draw cards');
const scrollContainer = ref<HTMLElement>();
let scrollAnimationId: number | null = null;

const wordSearch = computed(() =>
    WordSearchSchema.parse({
        query: currentQuery.value,
        limit: DefaultLimit,
        exclude_card_data: false, // Default to false, can be overridden by query param
    })
);

// Computed property to get all scores for normalization context
const allScores = computed(() => results.value?.map((r) => r.score || 0) || []);

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
});

onUnmounted(() => {
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
    }
});

async function loadRandomExample() {
    const randomIndex = Math.floor(Math.random() * exampleQueries.length);
    currentQuery.value = exampleQueries[randomIndex];

    // Reset scroll position and start auto-scrolling
    if (scrollContainer.value) {
        scrollContainer.value.scrollLeft = 0;
    }
    startAutoScroll();
}

const { data: results, isLoading } = useQuery({
    queryKey: [
        'search',
        'colbert',
        wordSearch,
    ],
    queryFn: async () => {
        const response = await fetch('/api/proxy/search/colbert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wordSearch.value),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json() as Promise<Array<Card>>;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
});

function startAutoScroll() {
    if (!scrollContainer.value || results.value?.length === 0) {
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
    const initialPauseFrames = 120; // 2 second pause at the beginning
    let isPaused = true; // start with initial pause
    let pauseCounter = 0;

    function animate() {
        if (!scrollContainer.value) return;

        const container = scrollContainer.value;
        const singleSetWidth = container.scrollWidth / 2; // Width of one set of cards

        // Only proceed if there's content to scroll
        if (singleSetWidth > 0) {
            if (isPaused) {
                pauseCounter++;
                if (pauseCounter >= initialPauseFrames) {
                    isPaused = false;
                    pauseCounter = 0;
                    animationFrame = 0; // reset animation frame for smooth acceleration
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

                    // Check if we've scrolled through the first set of cards
                    if (container.scrollLeft >= singleSetWidth) {
                        // Reset to beginning for seamless loop
                        container.scrollLeft = 0;
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
    scrollAnimationId = requestAnimationFrame(animate);
}

function tryQuery() {
    // Navigate to search page with the current query
    router.push({
        name: 'search',
        query: {
            query: wordSearch.value.query,
        },
    });
}

function goToCard(cardId: string | undefined) {
    if (!cardId) {
        console.warn('Cannot navigate to card: ID is undefined');
        return;
    }
    router.push(`/card/${cardId}`);
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
  min-width: 30px
  width: 30px
  height: 30px
  border-radius: 50%

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
  @media (max-width: 768px)
    font-size: 12px

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

.loop-divider
  flex: 0 0 auto
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  height: 100%
  min-height: 200px
  margin: 0 16px
  opacity: 0.6

.divider-line
  width: 2px
  flex: 1
  background: linear-gradient(to bottom, transparent, rgb(var(--v-theme-primary)), transparent)
  min-height: 60px

.divider-icon
  padding: 8px 0
  display: flex
  align-items: center
  justify-content: center
</style>