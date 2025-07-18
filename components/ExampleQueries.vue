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
                    <v-icon class="mr-2" color="primary" icon="mdi-lightbulb-outline"></v-icon>
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
                <div class="results-scroll" ref="scrollContainer" @mousedown="startDrag" @mousemove="onDrag"
                    @mouseup="endDrag" @mouseleave="endDrag" @touchstart="startTouch" @touchmove="onTouch"
                    @touchend="endTouch">
                    <!-- Cards with lazy loading -->
                    <div v-for="(result, index) in results" :key="`${result.card_data.id}-${index}`"
                        class="result-card-wrapper">
                        <v-lazy :options="{ threshold: 0.5 }" min-height="160" transition="fade-transition"
                            class="lazy-card-container">
                            <Card :card="result" :normalization-context="allScores" size="small"
                                @click="goToCard(result.card_data.id)" class="hoverable-card" />
                        </v-lazy>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useQuery } from '@tanstack/vue-query'
import { WordSearchSchema } from '~/models/searchModel';
import type { Card } from '~/models/cardModel';
const router = useRouter();

const currentQuery = ref<string>('creatures that draw cards');
const scrollContainer = ref<HTMLElement>();
let scrollAnimationId: number | null = null;

// Drag scrolling variables
const isDragging = ref(false);
const dragStart = ref(0);
const scrollStart = ref(0);
const hasDragged = ref(false);
const dragThreshold = 5; // Minimum pixels to consider it a drag

const wordSearch = computed(() =>
    WordSearchSchema.parse({
        query: currentQuery.value,
        limit: 15, // Reduced from DefaultLimit for performance
        exclude_card_data: false, // Default to false, can be overridden by query param
    })
);

// Computed property to get all scores for normalization context
const allScores = computed(() => results.value?.map((r) => r.score || 0) || []);

// Example queries to choose from
const exampleQueries = [
    "creatures that draw cards",
    "stax pieces",
    "blue cantrips",
    "adventure ramp",
    "orzhov removal",
    "black creatures with flying",
    "etb effects",
    "artifact removal",
    "x spell board wipes",
    "low cost sultai commanders",
    "mono white token finishers",
    "golgari elves that draw",
    "five color dragon commander",
    "red burn",
    "graveyard recursion",
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
    // Stop current animation
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }

    const randomIndex = Math.floor(Math.random() * exampleQueries.length);
    currentQuery.value = exampleQueries[randomIndex];

    // Reset scroll position
    if (scrollContainer.value) {
        scrollContainer.value.scrollLeft = 0;
    }

    // The watcher will handle starting the animation when results load
}

const { data: results, isLoading } = useQuery({
    queryKey: [
        'search',
        'colbert',
        wordSearch,
    ],
    queryFn: async () => {
        const response = await fetch('/api/search/colbert', {
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

// Watch for results to change and start auto-scroll when ready
watch([results, isLoading], async ([newResults, newIsLoading]) => {
    if (!newIsLoading && newResults && newResults.length > 0) {
        // Wait for DOM to update
        await nextTick();
        // Add a small delay to ensure rendering is complete
        setTimeout(() => {
            startAutoScroll();
        }, 100);
    }
}, { immediate: true });

// Drag scrolling functions
function startDrag(event: MouseEvent) {
    if (!scrollContainer.value) return;

    isDragging.value = true;
    hasDragged.value = false;
    dragStart.value = event.clientX;
    scrollStart.value = scrollContainer.value.scrollLeft;

    // Pause auto-scroll
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }

    // Prevent text selection
    event.preventDefault();
}

function onDrag(event: MouseEvent) {
    if (!isDragging.value || !scrollContainer.value) return;

    const deltaX = event.clientX - dragStart.value;
    const newScrollLeft = scrollStart.value - deltaX;

    // Check if we've dragged enough to consider it a drag
    if (Math.abs(deltaX) > dragThreshold) {
        hasDragged.value = true;
    }

    // Apply scroll
    scrollContainer.value.scrollLeft = Math.max(0, Math.min(
        newScrollLeft,
        scrollContainer.value.scrollWidth - scrollContainer.value.clientWidth
    ));

    event.preventDefault();
}

function endDrag() {
    if (!isDragging.value) return;

    isDragging.value = false;

    // Resume auto-scroll after a delay
    setTimeout(() => {
        if (!isDragging.value) {
            startAutoScroll();
        }
    }, 1000); // 1 second delay before resuming auto-scroll

    // Reset drag state after a short delay to prevent immediate clicks
    setTimeout(() => {
        hasDragged.value = false;
    }, 100);
}

// Touch event handlers for mobile
function startTouch(event: TouchEvent) {
    if (!scrollContainer.value || event.touches.length === 0) return;

    isDragging.value = true;
    hasDragged.value = false;
    dragStart.value = event.touches[0].clientX;
    scrollStart.value = scrollContainer.value.scrollLeft;

    // Pause auto-scroll
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }

    // Prevent default touch behavior
    event.preventDefault();
}

function onTouch(event: TouchEvent) {
    if (!isDragging.value || !scrollContainer.value || event.touches.length === 0) return;

    const deltaX = event.touches[0].clientX - dragStart.value;
    const newScrollLeft = scrollStart.value - deltaX;

    // Check if we've dragged enough to consider it a drag
    if (Math.abs(deltaX) > dragThreshold) {
        hasDragged.value = true;
    }

    // Apply scroll
    scrollContainer.value.scrollLeft = Math.max(0, Math.min(
        newScrollLeft,
        scrollContainer.value.scrollWidth - scrollContainer.value.clientWidth
    ));

    event.preventDefault();
}

function endTouch() {
    if (!isDragging.value) return;

    isDragging.value = false;

    // Resume auto-scroll after a delay
    setTimeout(() => {
        if (!isDragging.value) {
            startAutoScroll();
        }
    }, 1000); // 1 second delay before resuming auto-scroll

    // Reset drag state after a short delay to prevent immediate clicks
    setTimeout(() => {
        hasDragged.value = false;
    }, 100);
}

function startAutoScroll() {
    if (!scrollContainer.value || !results.value || results.value.length === 0 || isDragging.value) {
        return;
    }

    // Clear any existing animation
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
    }

    // Ensure container has content to scroll
    const container = scrollContainer.value;
    const maxScroll = container.scrollWidth - container.clientWidth;

    if (maxScroll <= 0) {
        // Not enough content to scroll, try again later
        setTimeout(() => startAutoScroll(), 200);
        return;
    }

    const scrollSpeed = 1; // pixels per movement
    const baseFrameSkip = 3; // target speed (move every 3 frames)
    let frameCounter = 0;
    let animationFrame = 0; // total frames since start/reset
    const accelerationFrames = 120; // 2 seconds at 60fps to reach full speed
    const initialPauseFrames = 120; // 2 second pause at the beginning
    const endPauseFrames = 180; // 3 second pause at the end
    let isPaused = true; // start with initial pause
    let pauseCounter = 0;
    let hasReachedEnd = false;

    function animate() {
        if (!scrollContainer.value || !results.value || results.value.length === 0) {
            return;
        }

        const container = scrollContainer.value;
        const currentMaxScroll = container.scrollWidth - container.clientWidth;

        // Only proceed if there's content to scroll
        if (currentMaxScroll > 0) {
            if (isPaused) {
                pauseCounter++;
                const currentPauseFrames = hasReachedEnd ? endPauseFrames : initialPauseFrames;

                if (pauseCounter >= currentPauseFrames) {
                    isPaused = false;
                    pauseCounter = 0;

                    // If we just finished the end pause, reset to beginning
                    if (hasReachedEnd) {
                        container.scrollLeft = 0;
                        hasReachedEnd = false;
                        animationFrame = 0;
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

                    if (container.scrollLeft >= currentMaxScroll) {
                        // Reached the end, start end pause
                        isPaused = true;
                        pauseCounter = 0;
                        hasReachedEnd = true;
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
    hasReachedEnd = false;
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
    // Prevent navigation if user just dragged
    if (hasDragged.value) {
        return;
    }

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
  user-select: none
  cursor: grab
  touch-action: pan-y pinch-zoom

  &:active
    cursor: grabbing

  // Hide scrollbar but keep functionality
  scrollbar-width: none
  -ms-overflow-style: none
  &::-webkit-scrollbar
    display: none

.result-card-wrapper
  flex: 0 0 auto
  cursor: pointer
  position: relative
  z-index: 1

.lazy-card-container
  transition: all 0.3s ease
  transform-origin: center
  display: block
  width: 100%
  height: 100%

  &:hover
    transform: scale(1.02)
    z-index: 10

.hoverable-card
  transition: all 0.3s ease !important
  cursor: pointer

// Lazy loading transition styles
.fade-transition-enter-active,
.fade-transition-leave-active
  transition: opacity 0.3s ease

.fade-transition-enter-from,
.fade-transition-leave-to
  opacity: 0
</style>