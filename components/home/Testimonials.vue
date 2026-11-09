<script setup lang="ts">
import { searchDemos } from '~/utils/search-showcase';
defineOptions({ name: 'HomeTestimonials' });
// Replace these placeholders with approved quotes and usernames before publishing.
const testimonials = [
  {
    username: 'username_1',
    avatar: searchDemos[0].cards[0].image.replace('/normal/', '/art_crop/'),
    quote: 'A player’s quote about finding the right cards will go here.',
  },
  {
    username: 'username_2',
    avatar: searchDemos[0].cards[1].image.replace('/normal/', '/art_crop/'),
    quote: 'A player’s quote about building their deck will go here.',
  },
  {
    username: 'username_3',
    avatar: searchDemos[0].cards[2].image.replace('/normal/', '/art_crop/'),
    quote: 'A player’s quote about discovering new options will go here.',
  },
];
</script>

<template>
  <section
    aria-labelledby="testimonials-title"
    class="mx-auto mb-12 max-w-6xl sm:mb-20"
  >
    <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
      <h3 id="testimonials-title" class="text-2xl font-bold sm:text-3xl">
        What Our Users Say
      </h3>
    </div>
    <div class="grid gap-4 md:grid-cols-3">
      <figure
        v-for="testimonial in testimonials"
        :key="testimonial.username"
        class="relative flex flex-col rounded-2xl border border-default bg-elevated/40 px-5 py-4"
      >
        <UIcon
          name="i-lucide-quote"
          class="absolute right-4 bottom-4 size-5 text-primary/60"
          aria-hidden="true"
        />
        <blockquote class="grow text-base leading-relaxed text-toned">
          <p>“{{ testimonial.quote }}”</p>
        </blockquote>
        <figcaption class="mt-3 flex items-center gap-2 pr-6">
          <img
            :src="testimonial.avatar"
            alt=""
            width="32"
            height="32"
            loading="lazy"
            decoding="async"
            class="size-8 shrink-0 rounded-full border border-primary/30 object-cover"
          />
          <span class="text-sm font-semibold">@{{ testimonial.username }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>
