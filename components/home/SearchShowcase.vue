<script setup lang="ts">
import { searchDemos } from '~/utils/search-showcase';
</script>

<template>
  <section aria-labelledby="search-showcase-title">
    <header class="mx-auto mb-12 max-w-6xl text-center sm:mb-20">
      <h2
        id="search-showcase-title"
        class="text-3xl font-bold tracking-tight sm:text-4xl"
      >
        Your next deck starts here
      </h2>
      <p class="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-toned">
        CardMystic brings
        <strong>modern tools for card search and deckbuilding</strong> together
        in one place. Our custom tools help you find the right effects, compare
        your options, and shape your deck with
        <strong>personalized recommendations</strong>. Save time while building
        smarter decks!
      </p>
      <ol
        class="mx-auto mt-8 grid max-w-3xl grid-cols-4 items-start gap-2"
        aria-label="CardMystic workflow"
      >
        <li
          v-for="(step, index) in [
            { label: 'Search', icon: 'i-lucide-search' },
            { label: 'Compare', icon: 'i-mdi-cards-outline' },
            { label: 'Build', icon: 'i-lucide-layers' },
            { label: 'Recommend', icon: 'i-lucide-list-plus' },
          ]"
          :key="step.label"
          class="relative flex flex-col items-center gap-3"
        >
          <span
            class="flex size-10 items-center justify-center rounded-xl border border-accented bg-default text-primary sm:size-16"
          >
            <UIcon
              :name="step.icon"
              class="size-5 sm:size-7"
              aria-hidden="true"
            />
          </span>
          <span class="text-xs font-medium sm:text-sm">{{ step.label }}</span>
          <UIcon
            v-if="index < 3"
            name="i-lucide-arrow-right"
            class="absolute left-[calc(100%+0.25rem)] top-5 size-4 -translate-x-1/2 -translate-y-1/2 text-primary sm:top-8 sm:size-5"
            aria-hidden="true"
          />
        </li>
      </ol>
    </header>

    <CustomModels />
    <Testimonials />
    <slot name="community" />

    <section
      v-for="demo in searchDemos"
      :key="demo.id"
      :aria-labelledby="`showcase-${demo.id}`"
      class="showcase-row mb-6 grid min-w-0 items-center gap-6 py-10 md:mb-8 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-16"
    >
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-3 md:flex-nowrap">
          <h3
            :id="`showcase-${demo.id}`"
            class="min-w-0 text-2xl font-bold sm:text-3xl"
          >
            {{ demo.title }}
          </h3>
          <FeatureAccessBadge />
        </div>
        <p class="mt-4 max-w-prose text-base leading-relaxed text-toned">
          <template v-for="(part, index) in demo.description" :key="index"
            ><strong v-if="part.bold">{{ part.text }}</strong
            ><template v-else>{{ part.text }}</template></template
          >
        </p>
        <nav :aria-label="`${demo.title} examples`" class="mt-6">
          <p class="mb-2 text-sm font-semibold">Try an example</p>
          <ul class="flex flex-col items-start">
            <li v-for="example in demo.examples" :key="example.to">
              <NuxtLink
                :to="example.to"
                no-prefetch
                class="example-link inline-flex min-h-11 items-center gap-2 rounded py-2 text-sm underline decoration-primary/60 underline-offset-4 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <UIcon
                  :name="demo.icon"
                  class="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />{{ example.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
      <LazySearchDemo
        :demo="demo"
        :hydrate-on-visible="{ rootMargin: '200px' }"
      />
    </section>
    <LazyBuilderShowcase :hydrate-on-visible="{ rootMargin: '200px' }" />
    <LazyCompareShowcase :hydrate-on-visible="{ rootMargin: '200px' }" />
    <LazyBusinessCardShowcase :hydrate-on-visible="{ rootMargin: '200px' }" />
    <LazyProShowcase :hydrate-on-visible="{ rootMargin: '200px' }" />
  </section>
</template>
