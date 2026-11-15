<script setup lang="ts">
import { business as example } from '~/utils/home-examples.json';
import qrImage from '~/assets/images/home-deck-qr.svg';
const { columns, details } = useBusinessCardColumns();
</script>

<template>
  <section
    aria-labelledby="showcase-business-card"
    class="mb-6 min-w-0 py-10 md:mb-8 md:py-16"
  >
    <header class="mx-auto mb-8 max-w-2xl text-center">
      <h3 id="showcase-business-card" class="text-2xl font-bold sm:text-3xl">
        Create Your Deck's Business Card
      </h3>
      <p class="mt-1 text-base leading-relaxed text-toned">
        Share your deck's strategy, key cards, and stats in one printable card.
      </p>
    </header>
    <article
      aria-label="Deck business card preview"
      class="business-card-example mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#525075] bg-[#11182c] text-slate-50 shadow-xl shadow-black/25"
    >
      <header
        class="flex items-center gap-3 border-b-2 border-[#ac89f3] bg-[#1e203a] px-4 py-3 sm:px-6"
      >
        <div
          class="flex flex-col gap-1 font-bold sm:flex-row sm:items-center sm:gap-2"
        >
          <img
            src="/android-chrome-192x192.png"
            alt=""
            width="28"
            height="28"
            loading="lazy"
            decoding="async"
          />
          <span class="text-sm sm:text-base">CardMystic</span>
        </div>
        <div class="ml-auto text-right">
          <strong class="text-sm tabular-nums sm:text-lg">{{
            example.price
          }}</strong>
          <p class="text-xs text-slate-300">
            Est. USD · {{ example.priceDate }}
          </p>
        </div>
        <img
          :src="qrImage"
          alt="QR code linking to Iron Man Living Forge"
          width="64"
          height="64"
          loading="lazy"
          decoding="async"
          class="shrink-0 rounded-md bg-white"
        />
      </header>
      <div
        ref="columns"
        class="grid items-start gap-6 p-4 sm:grid-cols-[minmax(0,var(--business-art-width,0.8fr))_minmax(0,1.3fr)] sm:p-6"
      >
        <img
          :src="example.hero.image"
          :alt="example.hero.name"
          width="488"
          height="680"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          class="mx-auto w-full max-w-52 rounded-xl sm:max-w-none"
        />
        <div ref="details" class="min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-sm text-[#d5c5f5]">
            <span class="flex text-2xl" aria-label="Blue and red"
              ><ManaColorIcon type="U" /><ManaColorIcon type="R"
            /></span>
            <span>{{ example.format }} · {{ example.count }} cards</span>
            <UBadge
              v-if="example.hasPrimer"
              color="info"
              variant="soft"
              size="sm"
              icon="i-lucide-notebook-text"
              label="Primer"
            />
            <DeckBracketBadge :bracket="example.bracket" full-label />
          </div>
          <h4 class="mt-3 text-2xl font-bold leading-tight sm:text-3xl">
            {{ example.name }}
          </h4>
          <div class="mt-4 flex flex-wrap gap-2 text-xs text-[#decafc]">
            <span
              v-for="tag in example.playstyles"
              :key="tag"
              class="rounded-md border border-[#8d6fc4] px-2.5 py-1"
              >{{ tag }}</span
            >
          </div>
          <p class="mt-4 line-clamp-2 leading-relaxed">{{ example.summary }}</p>
          <h5 class="mt-5 border-b border-white/15 pb-2 font-semibold">
            Core cards
          </h5>
          <div class="mt-3 grid grid-cols-3 gap-2">
            <img
              v-for="card in example.core"
              :key="card.name"
              :src="card.image"
              :alt="card.name"
              width="488"
              height="680"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              class="w-full rounded-md"
            />
          </div>
        </div>
      </div>
      <section class="px-4 pb-6 sm:px-6">
        <h5 class="border-b border-white/15 pb-2 font-semibold">
          How it wins / plays
        </h5>
        <p class="mt-2 text-sm leading-relaxed text-slate-300">
          {{ example.winPlan }}
        </p>
      </section>
      <div class="px-4 pb-6 sm:px-6">
        <DeckCharts :curve="example.curve" :colors="example.colors" compact />
      </div>
      <footer
        class="bg-[#0b1120] px-4 py-3 text-center text-xs text-slate-300 sm:px-6"
      >
        <NuxtLink
          :to="`/lists/${example.url.split('/').at(-1)}`"
          no-prefetch
          class="underline underline-offset-4"
          >View {{ example.name }}</NuxtLink
        >
      </footer>
    </article>
  </section>
</template>

<style scoped>
.business-card-example :deep(.text-muted) {
  color: #b6c4db;
}
</style>
