<script setup lang="ts">
defineProps<{ id: string; title: string }>();
</script>

<template>
  <section
    :aria-labelledby="id"
    class="mb-6 grid min-w-0 items-center gap-6 py-10 md:mb-8 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-16"
  >
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-3">
        <h3 :id="id" class="text-2xl font-bold sm:text-3xl">{{ title }}</h3>
        <FeatureAccessBadge pro />
      </div>
      <div class="mt-4 text-base leading-relaxed text-toned"><slot /></div>
    </div>
    <div
      class="min-w-0 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xl shadow-black/35 sm:p-5"
    >
      <slot name="preview" />
    </div>
  </section>
</template>
