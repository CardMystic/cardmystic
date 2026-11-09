<script setup lang="ts">
import type { SearchDemo } from '~/utils/search-showcase';

const props = defineProps<{ demo: SearchDemo }>();
const stage = useTemplateRef<HTMLElement>('stage');
const typedLength = ref(0);
const typedQueryLength = ref(0);
const resultsReady = ref(false);
const revealedCount = ref(0);
const loadedCards = ref<boolean[]>([]);
const failedCards = ref<boolean[]>([]);
let observer: IntersectionObserver | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let revealTimer: ReturnType<typeof setTimeout> | undefined;
let started = false;

function revealNext() {
  if (revealTimer || !loadedCards.value[revealedCount.value]) return;
  revealTimer = setTimeout(() => {
    revealedCount.value++;
    revealTimer = undefined;
    revealNext();
  }, 300);
}
function imageReady(index: number, failed = false) {
  loadedCards.value[index] = true;
  failedCards.value[index] = failed;
  revealNext();
}
function play() {
  if (started) return;
  started = true;
  observer?.disconnect();
  const typeNext = () => {
    if (typedLength.value < props.demo.input.length) {
      typedLength.value++;
      timer = setTimeout(typeNext, 75);
    } else if (typedQueryLength.value < (props.demo.query?.length ?? 0)) {
      typedQueryLength.value++;
      timer = setTimeout(typeNext, 100);
    } else {
      timer = setTimeout(() => {
        resultsReady.value = true;
      }, 200);
    }
  };
  timer = setTimeout(typeNext, 350);
}
onMounted(() => {
  if (!('IntersectionObserver' in window)) {
    play();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35,
        )
      )
        play();
    },
    { threshold: [0, 0.35] },
  );
  if (stage.value) observer.observe(stage.value);
});
onBeforeUnmount(() => {
  clearTimeout(timer);
  clearTimeout(revealTimer);
  observer?.disconnect();
});
</script>

<template>
  <figure class="search-demo min-w-0" :aria-label="`${demo.title} example`">
    <div
      ref="stage"
      class="demo-stage rounded-xl border border-accented bg-elevated p-4 sm:p-5"
    >
      <p class="mb-2 text-sm text-toned">{{ demo.inputLabel }}</p>
      <NuxtLink
        :to="demo.to"
        no-prefetch
        :aria-label="`Search: ${demo.input}`"
        class="demo-input flex min-h-12 min-w-0 items-center gap-2 rounded-lg border border-accented bg-default px-3 py-2 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
      >
        <UIcon
          :name="demo.icon"
          class="size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <span class="sr-only">{{ demo.input }}</span>
        <span class="demo-typed min-w-0 font-medium" aria-hidden="true">
          {{ demo.input.slice(0, typedLength)
          }}<span v-if="typedLength < demo.input.length" class="demo-cursor"
            >|</span
          >
        </span>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="ml-auto size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
      </NuxtLink>
      <template v-if="demo.query">
        <p class="mt-3 mb-2 text-sm text-toned">Describe what you need</p>
        <NuxtLink
          :to="demo.to"
          no-prefetch
          :aria-label="`Search recommendations for ${demo.query}`"
          class="demo-query flex min-h-12 items-center gap-2 rounded-lg border border-accented bg-default px-3 py-2 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          <UIcon
            name="i-lucide-search"
            class="size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span class="sr-only">{{ demo.query }}</span>
          <span class="demo-query-typed font-medium" aria-hidden="true"
            >{{ demo.query.slice(0, typedQueryLength)
            }}<span v-if="typedLength === demo.input.length && !resultsReady"
              >|</span
            ></span
          >
          <UIcon
            name="i-lucide-arrow-up-right"
            class="ml-auto size-4 text-primary"
            aria-hidden="true"
          />
        </NuxtLink>
      </template>
      <div
        class="mt-5 grid grid-cols-3 items-start gap-2 sm:gap-3"
        role="group"
        :aria-label="`${demo.title} example cards`"
      >
        <div v-for="(card, index) in demo.cards" :key="card.id" class="min-w-0">
          <div class="relative aspect-[200/279] rounded-[5%/3.6%] bg-elevated">
            <USkeleton
              v-if="index >= revealedCount"
              class="demo-skeleton absolute inset-0 size-full rounded-[5%/3.6%] bg-accented"
            />
            <NuxtLink
              :to="`/card/${card.id}`"
              no-prefetch
              :aria-label="card.name"
              :tabindex="index < revealedCount ? undefined : -1"
              :aria-hidden="index >= revealedCount || undefined"
              class="demo-result block aspect-[200/279] overflow-hidden focus-visible:outline-2 focus-visible:outline-primary"
              :class="{
                'results-ready': index < revealedCount,
                'searched-card': card.searched,
              }"
            >
              <img
                v-if="resultsReady && !failedCards[index]"
                :src="card.image"
                alt=""
                width="200"
                height="279"
                loading="lazy"
                fetchpriority="low"
                decoding="async"
                class="block w-full aspect-[200/279]"
                @load="imageReady(index)"
                @error="imageReady(index, true)"
              />
              <span
                v-else-if="failedCards[index]"
                class="flex aspect-[200/279] items-center justify-center bg-elevated text-muted"
                ><UIcon
                  name="i-lucide-image-off"
                  class="size-6"
                  aria-hidden="true"
              /></span>
            </NuxtLink>
          </div>
          <div
            class="mt-2 min-h-9 demo-score"
            :class="{ 'invisible opacity-0': index >= revealedCount }"
          >
            <p
              v-if="card.searched"
              class="text-center text-xs font-semibold text-primary"
            >
              Searched Card
            </p>
            <template v-else-if="card.score !== undefined">
              <div class="flex items-center gap-1.5" :title="demo.scoreLabel">
                <progress
                  :value="card.score"
                  max="100"
                  :aria-label="`${card.name}: ${demo.scoreLabel}`"
                  :data-color="
                    card.score >= 70
                      ? 'success'
                      : card.score >= 40
                        ? 'warning'
                        : 'error'
                  "
                />
                <span
                  class="flex shrink-0 items-center gap-0.5 text-xs tabular-nums"
                >
                  <UIcon
                    :name="
                      demo.id === 'recommend'
                        ? 'i-lucide-layers-2'
                        : 'i-lucide-brain'
                    "
                    class="size-3 shrink-0"
                    aria-hidden="true"
                  />{{ Math.round(card.score) }}%
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </figure>
</template>

<style scoped>
progress {
  appearance: none;
  display: block;
  flex: 1;
  width: 100%;
  min-width: 0;
  height: 0.5rem;
  overflow: hidden;
  border: 0;
  border-radius: 9999px;
  background: var(--ui-bg-accented);
}
progress::-webkit-progress-bar {
  background: var(--ui-bg-accented);
}
progress::-webkit-progress-value {
  background: var(--score-color);
  border-radius: 9999px;
}
progress::-moz-progress-bar {
  background: var(--score-color);
  border-radius: 9999px;
}
progress[data-color='success'] {
  --score-color: var(--ui-success);
}
progress[data-color='warning'] {
  --score-color: var(--ui-warning);
}
progress[data-color='error'] {
  --score-color: var(--ui-error);
}

.demo-typed {
  font-size: clamp(0.8rem, 1.4vw, 1rem);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.demo-result {
  border-radius: 5% / 3.6%;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.demo-score {
  transition: opacity 0.4s ease;
}
.demo-result.results-ready {
  opacity: 1;
}
.searched-card {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}
</style>
