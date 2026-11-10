<script setup lang="ts">
import {
  proExamples,
  deckSearchCards,
  type SearchDemo as SearchDemoConfig,
} from '~/utils/search-showcase';
import PreviewImage from '~/components/general/PreviewImage.vue';
import SearchDemo from './SearchDemo.vue';
const deckSearchDemo: SearchDemoConfig = {
  id: 'within-deck',
  title: 'Search within your deck',
  input: 'Non artifact board wipe',
  inputLabel: '',
  icon: 'i-lucide-search',
  cards: deckSearchCards,
  to: '',
  scoreLabel: '',
  description: [],
  examples: [],
};
const changed = ref<string[]>([]);
const message = ref('');
const artifactCards = proExamples[0].cards;
const deckMatches = [
  {
    name: 'Iron Man Living Forge',
    theme: 'Artifact creatures and sacrifice',
    to: '/lists/e8cde3f9-5cb3-41d6-8d9c-c07fd2aed77a',
  },
  { name: 'Emry Artifacts', theme: 'Recast artifacts from your graveyard' },
  { name: 'Urza Artifacts', theme: 'Build a board of artifacts' },
];
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
  <div aria-label="Pro tools preview">
    <ProFeature id="showcase-pro-search" title="Pro Search">
      <p>
        <strong>Unlimited Pro searches</strong> add another pass over the
        results. A reranking model compares your query with each candidate to
        bring <strong>closer matches to the top</strong>.
      </p>
      <UButton to="/memberships" no-prefetch icon="i-lucide-crown" class="mt-6"
        >Explore Pro features</UButton
      >
      <template #preview><MembershipSearchEvidence stacked compact /></template>
    </ProFeature>

    <ProFeature id="showcase-pro-within" title="Search within your deck">
      <p>
        <strong
          >Find the effects you need in the cards you already have.</strong
        >
        Search a specific deck or collection in your own words, without checking
        each card yourself.
      </p>
      <template #preview>
        <div>
          <p class="mb-3 flex items-center gap-2 font-semibold">
            <UIcon
              name="i-lucide-layers"
              class="size-5 text-primary"
              aria-hidden="true"
            />
            Artifact Workshop
          </p>
          <SearchDemo :demo="deckSearchDemo" embedded preview-only />
        </div>
      </template>
    </ProFeature>

    <ProFeature
      v-for="group in proExamples"
      :id="`showcase-pro-${group.action.toLowerCase()}`"
      :key="group.action"
      :title="group.title"
    >
      <p v-if="group.action === 'Add'">
        <strong>Find cards that fit your deck.</strong> Get personalized
        suggestions based on what you're building, and set
        <strong>a target budget</strong> to keep the options affordable.
        <strong>New-card alerts</strong> help you spot additions as new cards
        come out.
      </p>
      <p v-else>
        <strong>Make room for your next addition.</strong> See suggested cuts
        based on how cards fit the rest of your deck. Compare your options and
        choose what to remove.
      </p>
      <template #preview>
        <figure :aria-label="`${group.title} preview`">
          <figcaption
            class="mb-4 flex items-center gap-2 text-sm font-semibold"
          >
            <UIcon
              :name="group.icon"
              class="size-4"
              :class="group.action === 'Add' ? 'text-success' : 'text-error'"
              aria-hidden="true"
            />
            Artifact Workshop
          </figcaption>
          <div class="grid grid-cols-3 gap-2 sm:gap-3">
            <div
              v-for="card in group.cards"
              :key="card.id"
              class="mx-auto w-full max-w-40"
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
                :icon="
                  changed.includes(card.id) ? 'i-lucide-undo-2' : group.icon
                "
                :variant="changed.includes(card.id) ? 'outline' : 'soft'"
                :aria-label="`${changed.includes(card.id) ? 'Undo ' : ''}${group.action} ${card.name} in preview`"
                :aria-pressed="changed.includes(card.id)"
                @click="toggleCard(card.id, card.name, group.action)"
              >
                {{ changed.includes(card.id) ? 'Undo' : group.action }}
              </UButton>
            </div>
          </div>
        </figure>
      </template>
    </ProFeature>

    <ProFeature id="showcase-pro-decks" title="Recommended decks for each card">
      <p>
        <strong>See where a card fits among your decks.</strong> While
        searching, get deck suggestions for each card so you can put a useful
        find straight into the right deck.
      </p>
      <template #preview>
        <figure aria-label="Recommended decks for Foundry Inspector">
          <figcaption class="mb-4 text-sm font-semibold">
            Recommended decks
          </figcaption>
          <div
            class="grid grid-cols-[0.65fr_1.35fr] items-center gap-3 sm:gap-5"
          >
            <NuxtLink
              :to="`/card/${artifactCards[0].id}`"
              :aria-label="artifactCards[0].name"
              no-prefetch
              class="pro-card block overflow-hidden"
            >
              <PreviewImage
                :src="artifactCards[0].image"
                alt=""
                width="200"
                height="279"
                class="w-full aspect-[200/279]"
              />
            </NuxtLink>
            <ul class="min-w-0 space-y-3">
              <li
                v-for="deck in deckMatches"
                :key="deck.name"
                class="rounded-lg border border-accented bg-default p-3"
              >
                <div class="flex items-start gap-2">
                  <UIcon
                    name="i-lucide-layers"
                    class="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <div class="min-w-0">
                    <NuxtLink
                      v-if="deck.to"
                      :to="deck.to"
                      no-prefetch
                      class="text-sm font-semibold hover:underline"
                      >{{ deck.name }}</NuxtLink
                    >
                    <p v-else class="text-sm font-semibold">{{ deck.name }}</p>
                    <p class="mt-1 text-xs text-toned">{{ deck.theme }}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </figure>
      </template>
    </ProFeature>
    <p role="status" class="sr-only">{{ message }}</p>
  </div>
</template>

<style scoped>
.pro-card {
  border-radius: 5% / 3.6%;
}
</style>
