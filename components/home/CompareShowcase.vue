<script setup lang="ts">
import { proExamples } from '~/utils/search-showcase';
const stage = useTemplateRef<HTMLElement>('stage');
const phase = ref(0);
const decks = [
  { label: 'Your deck', name: 'Artifact Workshop', selectedAt: 2, opensAt: 1 },
  {
    label: 'Compare with',
    name: 'Iron Man Living Forge',
    selectedAt: 4,
    opensAt: 3,
  },
];
let observer: IntersectionObserver | undefined;
let started = false;
const timers: ReturnType<typeof setTimeout>[] = [];

function play() {
  if (started) return;
  started = true;
  observer?.disconnect();
  [350, 1000, 1600, 2250, 2800].forEach((delay, index) => {
    timers.push(
      setTimeout(() => {
        phase.value = index + 1;
      }, delay),
    );
  });
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
  timers.forEach(clearTimeout);
  observer?.disconnect();
});

const show = ref('all');
const rows = [
  {
    ...proExamples[1].cards[1],
    kind: 'extra',
    label: 'Only in your deck',
    color: 'error',
    icon: 'i-lucide-minus',
    action: 'Remove',
    count: '1 copy',
    style: 'border-red-500/50 bg-red-500/10',
  },
  {
    ...proExamples[0].cards[1],
    kind: 'missing',
    label: 'Missing from your deck',
    color: 'success',
    icon: 'i-lucide-plus',
    action: 'Add',
    count: '1 copy',
    style: 'border-green-500/50 bg-green-500/10',
  },
  {
    ...proExamples[0].cards[0],
    kind: 'missing',
    label: 'Missing from your deck',
    color: 'success',
    icon: 'i-lucide-plus',
    action: 'Add',
    count: '1 copy',
    style: 'border-green-500/50 bg-green-500/10',
  },
  {
    ...proExamples[0].cards[2],
    kind: 'both',
    label: 'In Both Decks',
    color: 'neutral',
    icon: 'i-lucide-check',
    action: '',
    count: '1 copy',
    style: 'border-neutral-500/50 bg-neutral-500/10',
  },
] as const;
const showOptions = [
  { value: 'all', label: 'All (4)' },
  { value: 'differences', label: 'Differences (3)' },
  ...(['extra', 'missing', 'both'] as const).map((kind) => {
    const cards = rows.filter((row) => row.kind === kind);
    return { value: kind, label: `${cards[0].label} (${cards.length})` };
  }),
];
const visibleRows = computed(() =>
  rows.filter(
    (row) =>
      show.value === 'all' ||
      (show.value === 'differences'
        ? row.kind !== 'both'
        : row.kind === show.value),
  ),
);
const preview = ref<(typeof rows)[number]>(rows[2]);
const applied = ref<string[]>([]);
const message = ref('');
function toggle(id: string, action: string, name: string) {
  if (applied.value.includes(id)) {
    applied.value = applied.value.filter((value) => value !== id);
    message.value = `Undid the change to ${name}.`;
  } else {
    applied.value = [...applied.value, id];
    message.value = `${action} ${name}: updated the comparison preview.`;
  }
}
</script>

<template>
  <section
    aria-labelledby="showcase-compare"
    class="mb-6 grid min-w-0 items-center gap-6 py-10 md:mb-8 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-16"
  >
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-3">
        <h3 id="showcase-compare" class="text-2xl font-bold sm:text-3xl">
          Comparing Decks
        </h3>
        <FeatureAccessBadge />
      </div>
      <p class="mt-4 text-base leading-relaxed text-toned">
        <strong>See what's different between two decks.</strong> Compare a saved
        deck, pasted decklist, or deck URL. Spot
        <strong>missing cards and cards unique to your deck</strong>, then add
        or remove cards from your own deck.
      </p>
    </div>
    <figure
      ref="stage"
      aria-label="Deck comparison preview"
      class="min-w-0 rounded-xl border border-accented bg-elevated p-4 shadow-xl shadow-black/35 sm:p-5"
    >
      <figcaption class="mb-4 flex items-center gap-2 font-semibold">
        <UIcon
          name="i-lucide-scale"
          class="size-5 text-primary"
          aria-hidden="true"
        />
        Compare decks
      </figcaption>
      <div class="mb-4 grid min-w-0 grid-cols-2 gap-3" aria-hidden="true">
        <div v-for="deck in decks" :key="deck.label" class="relative min-w-0">
          <p class="mb-2 text-xs text-toned">{{ deck.label }}</p>
          <div
            class="compare-deck flex min-h-14 min-w-0 items-center gap-2 rounded-lg border border-accented bg-default px-3 py-2"
            :class="{
              'deck-active': phase === deck.opensAt,
              'deck-selected': phase >= deck.selectedAt,
            }"
          >
            <UIcon
              name="i-lucide-layers"
              class="size-4 shrink-0 text-primary"
            />
            <span class="grid min-w-0 flex-1 text-sm font-medium">
              <span
                class="col-start-1 row-start-1"
                :class="{ invisible: phase < deck.selectedAt }"
                >{{ deck.name }}</span
              >
              <span
                v-if="phase < deck.selectedAt"
                class="col-start-1 row-start-1 self-center"
                >Select a deck</span
              >
            </span>
            <UIcon
              :name="
                phase >= deck.selectedAt
                  ? 'i-lucide-check'
                  : 'i-lucide-chevron-down'
              "
              class="size-4 shrink-0 text-primary"
            />
          </div>
          <div
            v-if="phase === deck.opensAt"
            class="compare-choice absolute inset-x-0 top-full z-10 mt-1 flex items-center gap-2 rounded-lg border border-primary bg-default p-3 text-sm shadow-lg"
          >
            <span class="min-w-0 flex-1">{{ deck.name }}</span>
            <UIcon
              name="i-lucide-mouse-pointer-2"
              class="size-4 shrink-0 text-primary"
            />
          </div>
        </div>
      </div>
      <div class="relative">
        <div
          v-if="phase < 5"
          aria-hidden="true"
          class="absolute inset-0 grid gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]"
        >
          <USkeleton class="hidden h-full rounded-xl bg-accented lg:block" />
          <div class="flex flex-col gap-3">
            <USkeleton class="h-8 rounded-lg bg-accented" />
            <USkeleton
              v-for="index in 4"
              :key="index"
              class="min-h-14 flex-1 rounded-lg bg-accented"
            />
          </div>
        </div>
        <div
          class="compare-results grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,1fr)]"
          :class="{ 'comparison-ready': phase === 5 }"
          :inert="phase < 5"
          :aria-hidden="phase < 5 || undefined"
        >
          <div class="hidden items-center justify-center lg:flex">
            <NuxtLink
              :to="`/card/${preview.id}`"
              :aria-label="`${preview.name} preview`"
              no-prefetch
              class="block w-full overflow-hidden rounded-[5%/3.6%]"
            >
              <PreviewImage
                :src="preview.image"
                alt=""
                width="200"
                height="279"
                class="aspect-[200/279] w-full"
              />
            </NuxtLink>
          </div>
          <div
            class="min-w-0 space-y-3 rounded-xl bg-black/5 p-3 dark:bg-black/20"
          >
            <label class="flex items-center gap-2 text-sm font-medium">
              Show:
              <USelect
                v-model="show"
                :items="showOptions"
                aria-label="Comparison preview cards"
                class="min-w-0 flex-1"
              />
            </label>
            <ul aria-label="Card differences" class="min-w-0 space-y-2">
              <li
                v-for="card in visibleRows"
                :key="card.id"
                class="flex"
                :class="
                  card.kind === 'missing'
                    ? 'justify-end'
                    : card.kind === 'extra'
                      ? 'justify-start'
                      : 'justify-center'
                "
                @mouseenter="preview = card"
                @focusin="preview = card"
              >
                <div
                  class="flex w-[92%] min-w-0 items-center gap-2 rounded-lg border p-2"
                  :class="[
                    card.style,
                    {
                      'flex-row-reverse': card.kind === 'missing',
                      'opacity-50': applied.includes(card.id),
                    },
                  ]"
                >
                  <NuxtLink
                    :to="`/card/${card.id}`"
                    :aria-label="card.name"
                    no-prefetch
                    class="flex min-w-0 flex-1 items-center gap-2 hover:underline"
                    :class="{
                      'flex-row-reverse text-right': card.kind === 'missing',
                    }"
                  >
                    <PreviewImage
                      :src="card.image"
                      alt=""
                      width="40"
                      height="56"
                      class="w-8 shrink-0 aspect-[5/7] overflow-hidden rounded-[5%/3.6%] sm:w-10"
                    />
                    <span class="min-w-0">
                      <span class="block text-sm font-medium">{{
                        card.name
                      }}</span>
                      <span class="block text-xs">{{ card.count }}</span>
                    </span>
                  </NuxtLink>
                  <UButton
                    v-if="card.kind !== 'both'"
                    :icon="
                      applied.includes(card.id) ? 'i-lucide-undo-2' : card.icon
                    "
                    :color="card.color"
                    variant="soft"
                    size="sm"
                    class="shrink-0"
                    :aria-label="`${applied.includes(card.id) ? 'Undo ' : ''}${card.action} ${card.name} in comparison preview`"
                    :aria-pressed="applied.includes(card.id)"
                    @click="toggle(card.id, card.action, card.name)"
                  />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <p role="status" class="sr-only">{{ message }}</p>
    </figure>
  </section>
</template>

<style scoped>
.compare-deck {
  transition:
    border-color 0.25s ease,
    background-color 0.25s ease;
}
.deck-active,
.deck-selected {
  border-color: var(--ui-primary);
}
.deck-selected {
  background-color: color-mix(in srgb, var(--ui-primary) 8%, var(--ui-bg));
}
.compare-choice {
  animation: deck-choice-appear 0.25s ease both;
}
.compare-results {
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.comparison-ready {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}
@keyframes deck-choice-appear {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
