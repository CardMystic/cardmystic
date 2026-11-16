<script setup lang="ts">
import { searchDemos } from '~/utils/search-showcase';
defineOptions({ name: 'HomeTestimonials' });
const testimonials = [
  {
    username: 'nailz92002',
    url: 'https://www.youtube.com/watch?v=akmSqk5z32k&lc=UgzO--HhpEOvBcCPUoN4AaABAg',
    avatar: searchDemos[0].cards[0].image.replace('/normal/', '/art_crop/'),
    quote: 'You are making my deck building process way better.',
  },
  {
    username: 'Epic3556',
    url: 'https://www.youtube.com/watch?v=tmOhu35GE10&lc=UgznDxzTKVtDX6LOHUF4AaABAg',
    avatar: searchDemos[0].cards[1].image.replace('/normal/', '/art_crop/'),
    quote: 'The "find similar cards" tool is so useful',
  },
  {
    username: 'TurnOneWin',
    url: 'https://www.youtube.com/watch?v=akmSqk5z32k&lc=UgxE4nVkKEI7_ppV3Sh4AaABAg',
    avatar: searchDemos[0].cards[2].image.replace('/normal/', '/art_crop/'),
    quote:
      'Just played around with it for a bit, absolutely loved it: very useful!',
  },
  {
    username: 'ricardofabilareyes',
    url: 'https://www.youtube.com/watch?v=tmOhu35GE10&lc=UgwCNCzJU_h4uNYCZ8Z4AaABAg',
    avatar: searchDemos[1].cards[0].image.replace('/normal/', '/art_crop/'),
    quote: 'Just tested it. And it rocks!',
  },
  {
    username: 'ericgillespie2812',
    url: 'https://www.youtube.com/watch?v=tmOhu35GE10&lc=Ugw5OEoXuJ0kRzvZXQd4AaABAg.AMjLu0nHVfXAMjMLCusKXa',
    avatar: searchDemos[1].cards[1].image.replace('/normal/', '/art_crop/'),
    quote:
      'Just checked it out holy crap this site is amazing! Thank you for this!',
  },
  {
    username: 'LoveSosa31',
    url: 'https://www.youtube.com/watch?v=tmOhu35GE10&lc=UgyWod2UrZH6mVutHUt4AaABAg.AMkK4OQR21FAd-vDIGIw4m',
    avatar: searchDemos[1].cards[2].image.replace('/normal/', '/art_crop/'),
    quote: 'my deck building just got a whole lot easier!',
  },
];
</script>

<template>
  <section
    aria-labelledby="testimonials-title"
    class="mx-auto mb-12 w-full min-w-0 max-w-6xl sm:mb-20"
  >
    <div class="mb-6 flex flex-wrap items-center justify-center gap-3">
      <h3 id="testimonials-title" class="text-2xl font-bold sm:text-3xl">
        What Our Users Say
      </h3>
    </div>
    <div class="testimonial-ticker">
      <div class="testimonial-track">
        <div
          v-for="copy in 2"
          :key="copy"
          class="testimonial-group"
          :aria-hidden="copy === 2 ? true : undefined"
        >
          <figure
            v-for="testimonial in testimonials"
            :key="testimonial.username"
            class="testimonial-card relative flex flex-col rounded-2xl border border-default bg-elevated/40 px-5 py-4"
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
              <a
                v-if="testimonial.url"
                :href="testimonial.url"
                target="_blank"
                rel="noopener noreferrer"
                :tabindex="copy === 2 ? -1 : undefined"
                class="text-sm font-semibold hover:underline"
                >@{{ testimonial.username }}</a
              >
              <span v-else class="text-sm font-semibold"
                >@{{ testimonial.username }}</span
              >
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonial-ticker {
  overflow: hidden;
  mask-image: linear-gradient(
    to right,
    transparent,
    black clamp(1.5rem, 5vw, 4rem),
    black calc(100% - clamp(1.5rem, 5vw, 4rem)),
    transparent
  );
}
.testimonial-track {
  display: flex;
  width: max-content;
  animation: testimonial-scroll 80s linear infinite;
}
.testimonial-group {
  display: flex;
  flex-shrink: 0;
  gap: 1rem;
  padding-right: 1rem;
}
.testimonial-card {
  flex: 0 0 auto;
  width: clamp(16rem, 70vw, 22rem);
}
.testimonial-ticker:hover .testimonial-track,
.testimonial-ticker:focus-within .testimonial-track {
  animation-play-state: paused;
}
@keyframes testimonial-scroll {
  to {
    transform: translateX(-50%);
  }
}
</style>
