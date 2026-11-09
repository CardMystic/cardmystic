<script setup lang="ts">
import { proExamples } from '~/utils/search-showcase';
import PreviewImage from '~/components/general/PreviewImage.vue';
const changed = ref<string[]>([]);
const message = ref('');
function toggleCard(id: string, name: string, action: string) {
  if (changed.value.includes(id)) {
    changed.value = changed.value.filter((value) => value !== id);
    message.value = `Undid ${action.toLowerCase()} for ${name} in this preview.`;
  } else {
    changed.value = [...changed.value, id];
    message.value = `${name} ${action === 'Add' ? 'added to' : 'cut from'} the preview deck.`;
  }
}
</script>

<template>
  <section
    aria-labelledby="showcase-pro"
    class="grid min-w-0 items-center gap-6 py-10 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-16"
  >
    <div>
      <div class="flex flex-wrap items-center gap-3 md:flex-nowrap">
        <h3 id="showcase-pro" class="min-w-0 text-2xl font-bold sm:text-3xl">
          Pro tools for your decks
        </h3>
        <FeatureAccessBadge pro />
      </div>
      <p class="mt-4 text-base leading-relaxed text-toned">
        <strong>Find cards to add and decide what to cut.</strong> Pro looks at
        your deck to suggest cards that fit and help you make room for them. Set
        <strong>target budgets for deck suggestions</strong>, and get
        <strong>new-card alerts on your decks</strong>.
      </p>
      <p class="mt-4 text-base leading-relaxed text-toned">
        As you search, see
        <strong>which of your decks each card fits best</strong>.
      </p>
      <p class="mt-4 text-base leading-relaxed text-toned">
        <strong>Search within your decks and collections</strong> for the
        effects you need. Find options in the cards you already have, without
        checking each one yourself.
      </p>
      <p class="mt-4 text-base leading-relaxed text-toned">
        <strong>Unlimited Pro searches</strong> use powerful reranking models to
        improve the accuracy of the top results.
      </p>
      <MembershipSearchEvidence stacked compact class="mt-6" />
      <UButton to="/memberships" no-prefetch icon="i-lucide-crown" class="mt-6"
        >Explore Pro features</UButton
      >
    </div>
    <div
      aria-label="Pro tools preview"
      class="min-w-0 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5"
    >
      <UInput
        readonly
        tabindex="-1"
        aria-label="Search within your deck/collection preview"
        placeholder="Search within your deck/collection"
        icon="i-lucide-search"
        class="w-full"
        :ui="{ base: 'text-base h-11' }"
      />

      <div v-for="group in proExamples" :key="group.title" class="mt-5">
        <h4 class="mb-3 flex items-center gap-2 text-sm font-semibold">
          <UIcon
            :name="group.icon"
            class="size-4 text-primary"
            aria-hidden="true"
          />{{ group.title }}
        </h4>
        <div v-if="group.cards.length" class="grid grid-cols-3 gap-2 sm:gap-3">
          <div
            v-for="card in group.cards"
            :key="card.id"
            class="mx-auto w-full max-w-32"
          >
            <NuxtLink
              :to="`/card/${card.id}`"
              :aria-label="card.name"
              no-prefetch
              class="pro-card block aspect-[200/279] overflow-hidden focus-visible:outline-2 focus-visible:outline-primary"
              :class="{ 'opacity-50': changed.includes(card.id) }"
            >
              <PreviewImage
                :src="card.image"
                alt=""
                width="200"
                height="279"
                class="w-full aspect-[200/279]"
              />
            </NuxtLink>
            <UButton
              class="mt-2 min-h-11 w-full justify-center"
              :color="group.color"
              :icon="changed.includes(card.id) ? 'i-lucide-undo-2' : group.icon"
              :variant="changed.includes(card.id) ? 'outline' : 'soft'"
              :aria-label="`${changed.includes(card.id) ? 'Undo ' : ''}${group.action} ${card.name} in preview`"
              :aria-pressed="changed.includes(card.id)"
              @click="toggleCard(card.id, card.name, group.action)"
            >
              {{ changed.includes(card.id) ? 'Undo' : group.action }}
            </UButton>
          </div>
        </div>
        <p v-else class="py-4 text-sm text-toned">
          No example cards match that name.
        </p>
      </div>
      <p role="status" class="sr-only">
        {{ message }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.pro-card {
  border-radius: 5% / 3.6%;
}
</style>
