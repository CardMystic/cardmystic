<template>
  <section class="pro-features" aria-labelledby="home-pro-title">
    <div class="min-w-0">
      <h2 id="home-pro-title" class="text-2xl font-bold text-(--pro-accent)">
        Pro Features
      </h2>
      <p class="mt-2 text-lg font-semibold">Get More out of CardMystic</p>
      <p class="mt-2 text-sm text-muted max-w-xl">
        Unlimited Pro searches, deck suggestions, and search within your decks
        and collections.
      </p>
      <NuxtLink to="/memberships" class="pro-features-link mt-4">
        View Pro features
        <UIcon name="i-lucide-arrow-right" class="size-4" aria-hidden="true" />
      </NuxtLink>
    </div>
    <img
      src="/images/cardmystic-pro.svg"
      alt="CardMystic Pro"
      width="448"
      height="448"
      loading="lazy"
      class="w-full h-auto"
    />
  </section>
</template>

<style scoped>
.pro-features {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(5rem, 20vw, 12rem);
  align-items: center;
  gap: 1rem;
  padding: clamp(1rem, 3vw, 2rem);
  border: 1px solid var(--pro-border);
  border-radius: 0.75rem;
  background: var(--pro-bg);
}
.pro-features-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.625rem 0.875rem;
  border-radius: 0.375rem;
  background: var(--pro-button);
  color: var(--pro-button-text);
  font-size: 0.875rem;
  font-weight: 600;
}
.pro-features-link:hover {
  filter: brightness(0.95);
}
.pro-features-link:focus-visible {
  outline: 2px solid var(--pro-accent);
  outline-offset: 3px;
}
</style>
