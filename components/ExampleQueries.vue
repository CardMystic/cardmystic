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
                    @mouseup="endDrag" @mouseleave="endDrag">
                    <!-- Cards with lazy loading and scroll fade effects -->
                    <div v-for="(result, index) in results" :key="`${result.card_data.id}-${index}`"
                        class="result-card-wrapper" :ref="(el) => setCardRef(el, index)"
                        :style="{ opacity: cardOpacities[index] || 0.8, transform: `scale(${cardScales[index] || 0.95})` }">
                        <v-lazy :options="{ threshold: 0.5 }" transition="fade-transition" class="lazy-card-container">
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick, type ComponentPublicInstance } from 'vue';
import { useQuery } from '@tanstack/vue-query'
import { WordSearchSchema } from '~/models/searchModel';
import type { Card } from '~/models/cardModel';
const router = useRouter();

const currentQuery = ref<string>('creatures that draw cards');
const scrollContainer = ref<HTMLElement>();
let scrollAnimationId: number | null = null;

// Scroll-based fade effect variables
const cardRefs = ref<HTMLElement[]>([]);
const cardOpacities = ref<Record<number, number>>({});
const cardScales = ref<Record<number, number>>({});
let fadeObserver: IntersectionObserver | null = null;
let scrollHandler: (() => void) | null = null;

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

// Function to set card refs and setup fade observer
function setCardRef(el: Element | ComponentPublicInstance | null, index: number) {
    if (el && 'getBoundingClientRect' in el) {
        cardRefs.value[index] = el as HTMLElement;
        // Initialize opacity and scale
        cardOpacities.value[index] = 0.8;
        cardScales.value[index] = 0.95;
    }
}

// Setup intersection observer for fade effects
function setupFadeObserver() {
    if (!scrollContainer.value) return;

    // Clean up existing observer and scroll handler
    if (fadeObserver) {
        fadeObserver.disconnect();
    }
    if (scrollHandler && scrollContainer.value) {
        scrollContainer.value.removeEventListener('scroll', scrollHandler);
    }

    // Create scroll event handler
    scrollHandler = () => {
        updateCardFadeEffects();
    };

    scrollContainer.value.addEventListener('scroll', scrollHandler, { passive: true });

    fadeObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const index = cardRefs.value.findIndex(ref => ref === entry.target);
                if (index !== -1) {
                    updateCardFadeEffects();
                }
            });
        },
        {
            root: scrollContainer.value,
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            rootMargin: '0px'
        }
    );

    // Observe all card elements
    cardRefs.value.forEach(cardRef => {
        if (cardRef) {
            fadeObserver?.observe(cardRef);
        }
    });

    // Initial fade effect calculation
    updateCardFadeEffects();
}

// Update fade effects based on card positions
function updateCardFadeEffects() {
    if (!scrollContainer.value) return;

    const containerRect = scrollContainer.value.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    cardRefs.value.forEach((cardRef, index) => {
        if (cardRef) {
            const rect = cardRef.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;

            // Extend the fade zone beyond the container edges
            const extendedWidth = containerRect.width * 1.2; // 20% larger fade zone
            const maxDistance = extendedWidth / 2;
            const distance = Math.abs(cardCenter - containerCenter);

            // Calculate fade ratio with smooth easing
            const fadeRatio = Math.max(0, Math.min(1, 1 - (distance / maxDistance)));
            const easedRatio = fadeRatio * fadeRatio * (3 - 2 * fadeRatio); // Smooth step function

            // Apply opacity and scale with better visibility ranges
            const opacity = 0.8 + (easedRatio * 0.2); // Range from 0.8 to 1.0 (much more visible)
            const scale = 0.95 + (easedRatio * 0.05); // Range from 0.95 to 1.0

            cardOpacities.value[index] = opacity;
            cardScales.value[index] = scale;
        }
    });
}

onMounted(async () => {
    await loadRandomExample();
});

onUnmounted(() => {
    if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
    }
    if (fadeObserver) {
        fadeObserver.disconnect();
    }
    // Clean up scroll event listener
    if (scrollHandler && scrollContainer.value) {
        scrollContainer.value.removeEventListener('scroll', scrollHandler);
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
            // Setup fade observer after a short delay to ensure refs are set
            setTimeout(() => {
                setupFadeObserver();
            }, 100);
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
  border-radius: 24px
  padding: 16px
  backdrop-filter: blur(20px) saturate(180%)
  background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
  border: 1px solid rgba(147, 114, 255, 0.3)
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)
  position: relative

  &::before
    content: ''
    position: absolute
    top: 0
    left: 0
    right: 0
    bottom: 0
    border-radius: 24px
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(255, 255, 255, 0.02))
    pointer-events: none

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
  border-radius: 16px
  background: linear-gradient(90deg, 
    rgba(0, 0, 0, 0.1) 0%, 
    transparent 15%, 
    transparent 85%, 
    rgba(0, 0, 0, 0.1) 100%)
  position: relative

  &::before,
  &::after
    content: ''
    position: absolute
    top: 0
    bottom: 0
    width: 32px
    pointer-events: none
    z-index: 2

  &::before
    left: 0
    background: linear-gradient(90deg, rgba(44, 44, 44, 0.8), transparent)

  &::after
    right: 0
    background: linear-gradient(270deg, rgba(44, 44, 44, 0.8), transparent)

.results-scroll
  display: flex
  gap: 16px
  overflow-x: auto
  padding: 4px
  user-select: none
  cursor: grab
  touch-action: auto

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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)
  will-change: transform, opacity
  background: transparent
  border: none
  outline: none

.lazy-card-container
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1)
  transform-origin: center
  display: block
  width: 100%
  height: 100%
  background: transparent
  border: none
  outline: none

  &:hover
    transform: scale(1.05) !important
    z-index: 10

.hoverable-card
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important
  cursor: pointer
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))

  &:hover
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4)) saturate(110%) brightness(105%)

// Lazy loading transition styles
.fade-transition-enter-active,
.fade-transition-leave-active
  transition: opacity 0.3s ease

.fade-transition-enter-from,
.fade-transition-leave-to
  opacity: 0
</style>