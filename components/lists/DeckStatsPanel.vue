<script setup lang="ts">
import { analyzeDeck, type AnalysisCard } from '~/utils/deckAnalysis';
import { collectionPath, collectionSlug } from '~/utils/card-collections';
import type { DeckAnalytics } from '~/utils/deckAnalytics';
const props = defineProps<{
  listId: string;
  revision: string;
  entries: AnalysisCard[];
  loading: boolean;
  isOwner: boolean;
  initialAnalytics?: DeckAnalytics;
}>();
const optionalRoles = defineModel<string[]>('optionalRoles');
const gameChangers = computed(() =>
  props.entries.reduce(
    (total, { card, quantity }) => total + (card.game_changer ? quantity : 0),
    0,
  ),
);
const details = useTemplateRef<HTMLDetailsElement>('details');
defineExpose({
  open: () => {
    if (details.value) details.value.open = true;
  },
});
const stats = computed(() => analyzeDeck(props.entries));
const entrySets = computed(() => {
  const sets = new Map<string, { code: string; name: string; count: number }>();
  for (const { card, quantity } of props.entries) {
    if (!card.set) continue;
    const code = card.set.toLowerCase();
    sets.set(code, {
      code,
      name: card.set_name || code.toUpperCase(),
      count: (sets.get(code)?.count ?? 0) + quantity,
    });
  }
  return [...sets.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 4);
});
</script>
<template>
  <details
    open
    ref="details"
    id="deck-stats"
    class="my-4 rounded-lg border border-default p-4"
    data-testid="deck-stats"
  >
    <summary class="cursor-pointer font-semibold">Deck Stats</summary>
    <div class="mt-4 space-y-6">
      <DeckStatsSkeleton
        v-if="loading && !initialAnalytics"
        :is-owner="isOwner"
        :extra-roles="optionalRoles?.length"
      >
        <template #tags><slot name="tags" /></template>
      </DeckStatsSkeleton>
      <DeckAnalytics
        v-else-if="entries.length || initialAnalytics"
        :initial-data="initialAnalytics"
        :list-id="listId"
        :revision="revision"
        :is-owner="isOwner"
      >
        <template #roles="{ mainboardRoles, pending }">
          <DeckRoleCounts
            :loading="pending"
            v-model:optional-roles="optionalRoles"
            :counts="mainboardRoles"
            :game-changers="
              entries.length ? gameChangers : mainboardRoles?.['Game Changers']
            "
          />
        </template>
        <template #tags><slot name="tags" /></template>
        <template #themes="{ topThemes, topSets }">
          <section
            v-if="topThemes !== undefined"
            aria-labelledby="deck-top-themes-title"
            class="space-y-3"
          >
            <h3 id="deck-top-themes-title" class="text-lg font-semibold">
              <NuxtLink to="/themes" class="hover:underline"
                >Top Themes</NuxtLink
              >
            </h3>
            <dl
              v-if="topThemes?.length"
              class="grid grid-cols-2 gap-3 lg:grid-cols-4"
            >
              <div
                v-for="theme in topThemes"
                :key="theme.name"
                class="rounded-lg border border-default p-3"
              >
                <dt class="text-sm">
                  <NuxtLink
                    :to="
                      collectionPath(
                        'themes',
                        collectionSlug(theme.name, 'themes'),
                      )
                    "
                    class="text-success hover:underline"
                    >{{ theme.name }}</NuxtLink
                  >
                </dt>
                <dd class="text-2xl font-semibold tabular-nums">
                  {{ theme.count }}
                </dd>
              </div>
            </dl>
            <p v-else class="text-sm text-muted">
              {{
                topThemes === null
                  ? 'Theme counts are temporarily unavailable.'
                  : 'No themes found in this deck.'
              }}
            </p>
          </section>
          <section
            v-if="(topSets ?? entrySets).length"
            aria-labelledby="deck-top-sets-title"
            class="space-y-3"
          >
            <h3 id="deck-top-sets-title" class="text-lg font-semibold">
              <NuxtLink to="/sets" class="hover:underline">Top Sets</NuxtLink>
            </h3>
            <dl class="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div
                v-for="set in topSets ?? entrySets"
                :key="set.code"
                class="rounded-lg border border-default p-3"
              >
                <dt class="text-sm">
                  <NuxtLink
                    :to="collectionPath('sets', set.code)"
                    no-prefetch
                    class="text-primary hover:underline"
                    >{{ set.name }}</NuxtLink
                  >
                </dt>
                <dd class="text-2xl font-semibold tabular-nums">
                  {{ set.count }}
                </dd>
              </div>
            </dl>
          </section>
        </template>
        <template #charts>
          <LazyDeckCharts
            v-if="entries.length"
            :curve="stats.curve"
            :colors="stats.colors"
          />
        </template>
      </DeckAnalytics>
    </div>
  </details>
</template>
