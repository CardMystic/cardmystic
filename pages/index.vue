<template>
  <div class="hero px-0 h-full w-full justify-center flex flex-col items-center" @mousemove="handleMouseMove"
    @mousedown="handleMouseDown" @mouseup="handleMouseUp">
    <div class="hero-bg"></div>
    <div v-for="dot in dots" :key="dot.id" class="mouse-dot"
      :style="{ left: dot.x + 'px', top: dot.y + 'px', opacity: dot.opacity, width: dot.size + 'px', height: dot.size + 'px' }">
    </div>
    <UContainer class="flex flex-col items-center justify-center text-center max-w-[1000px] h-full relative z-10">
      <div class="header-layout">
        <div class="title-container">
          <img src="/wizard.webp" class="image w-[120px] h-[120px] object-cover" alt="Wizard" />
          <h2 class="subtitle">
            The <b class="text-primary">A.I. Powered Search Engine</b> For <b class="text-primary">MTG</b>
          </h2>
        </div>
      </div>

      <!-- Search -->
      <SearchForm />

      <!-- Explore text + icon -->
      <div class="explore mt-6 mb-2 flex flex-col items-center gap-1">
        <span class="text-md opacity-100">Explore More</span>
        <UIcon name="i-lucide-chevron-down" class="text-xl opacity-100" />
      </div>

    </UContainer>
  </div>

  <!-- Everything below the fold -->
  <UContainer class="mt-14 mb-10">
    <QueryCount class="mb-14"></QueryCount>
    <!-- How To Use & How It Works Section -->
    <div class="mb-22 grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- How To Use -->
      <div
        class="p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div class="flex items-start gap-4">
          <UIcon name="i-lucide-book-open" class="text-3xl text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 class="text-2xl md:text-3xl font-bold mb-3 text-primary">How To Use</h3>
            <p class="text-base md:text-lg text-gray-300 leading-relaxed">
              Simply describe the cards you want in plain English, and let our
              intelligent search engine do the rest. Still not sure? Try the
              example query below!
            </p>
          </div>
        </div>
      </div>

      <!-- How It Works -->
      <div
        class="p-6 md:p-8 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div class="flex items-start gap-4">
          <UIcon name="i-lucide-sparkles" class="text-3xl text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 class="text-2xl md:text-3xl font-bold mb-3 text-primary">How It Works</h3>
            <p class="text-base md:text-lg text-gray-300 leading-relaxed">
              Our A.I. experts custom trained state-of-the-art models to understand the nuances of Magic including
              slang, synergies, and game mechanics.
            </p>
          </div>
        </div>
      </div>
    </div>

    <ExampleQueries class="mb-10" />
    <TopQueries class="mb-10" />
    <MeetTheDevs class="mb-10" />
    <Sponsorships class="mb-10" />
    <JoinUs class="mb-10" />
    <ProductPromotionButtons />
  </UContainer>
</template>

<script setup lang="ts">
defineOptions({ name: 'HomePage' });
definePageMeta({
  layout: 'home'
});
import SearchForm from '~/components/search/Search.vue';
import ProductPromotionButtons from '~/components/ProductPromotionButtons.vue';

// Use search type composable to check if AI search is active
const { isAiSearch } = useSearchType();

// Mouse trail effect
interface Dot {
  id: number;
  x: number;
  y: number;
  opacity: number;
  size: number;
}

const dots = ref<Dot[]>([]);
let dotId = 0;
let lastDotTime = 0;
const isDragging = ref(false);

const handleMouseDown = () => {
  isDragging.value = true;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseMove = (e: MouseEvent) => {
  const now = Date.now();
  // When dragging, create dots more frequently (30ms), otherwise 120ms
  const threshold = isDragging.value ? 30 : 120;
  if (now - lastDotTime < threshold) return;
  lastDotTime = now;

  // Add random offset between -30 and 30 pixels for scatter effect
  const randomOffsetX = (Math.random() - 0.5) * 60;
  const randomOffsetY = (Math.random() - 0.5) * 60;

  // Random size between 4 and 10 pixels
  const randomSize = 6 + Math.random() * 6;

  const newDot: Dot = {
    id: dotId++,
    x: e.clientX + randomOffsetX,
    y: e.clientY + randomOffsetY,
    opacity: 0.5,
    size: randomSize
  };

  dots.value.push(newDot);

  // Remove after animation completes (CSS handles the animation)
  setTimeout(() => {
    dots.value = dots.value.filter(d => d.id !== newDot.id);
  }, 600);

  // When dragging, allow more dots (10), otherwise limit to 3
  const maxDots = isDragging.value ? 10 : 3;
  if (dots.value.length > maxDots) {
    dots.value = dots.value.slice(-maxDots);
  }
};

useHead({
  title: 'CardMystic',
});

const { setPageInfo } = usePageInfo();
setPageInfo({
  page_url: '/',
  page_name: 'Home Page',
  query: '',
  card_name: '',
  filters: undefined,
});

</script>

<style lang="sass" scoped>
.secondary
  color: rgb(var(--color-secondary-500))

.hero
  position: relative
  min-height:  100vh
  padding-top: 0px
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  border-bottom: 3px solid white
  background-color: black

.hero-bg
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  background-image: url('/space.webp')
  background-position: center
  background-attachment: fixed  // <-- the parallax magic
  opacity: 0.10
  z-index: 0

.image
  width: 200px
  height: 200px
  position: relative
  bottom: 10px
  left: 0px
  @media (max-width: 768px)
    width: 120px
    height: 120px

.header-layout
  display: flex
  align-items: center
  justify-content: center
  gap: 24px
  margin-bottom: 48px
  @media (max-width: 768px)
    margin-bottom: 24px
    flex-direction: column
    gap: 12px

.title-container
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  text-align: center
  min-width: 372px
  position: relative

.subtitle
  font-size: 2.0rem
  font-style: italic
  line-height: 1.2
  @media (max-width: 768px)
    font-size: 1.2rem
    text-align: center

.mouse-dot
  position: fixed
  width: 8px
  height: 8px
  background-color: white
  pointer-events: none
  z-index: 5
  transform: translate(-50%, -50%)
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.8)
  clip-path: polygon(50% 0%, 61% 35%, 100% 50%, 61% 65%, 50% 100%, 39% 65%, 0% 50%, 39% 35%)
  animation: starFall 0.6s ease-out forwards

@keyframes starFall
  0%
    opacity: 0.5
    transform: translate(-50%, -50%)
  100%
    opacity: 0
    transform: translate(-50%, calc(-50% + 3px))
</style>
