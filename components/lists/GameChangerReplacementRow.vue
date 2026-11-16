<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import type { Card, ScryfallCard } from '~/models/cardModel';
import { filterGameChangerReplacements } from '~/utils/gameChangerReplacements';

const props = defineProps<{
  card: ScryfallCard;
  colors: string[];
  deckOracleIds: string[];
}>();
const config = useRuntimeConfig();
const expanded = ref(false);
const { data, isPending, error, refetch } = useQuery({
  queryKey: computed(() => ['game-changer-replacements', props.card.oracle_id]),
  queryFn: async ({ signal }) => {
    const result = await $fetch<Card[] | undefined>(
      `${config.public.backendPath}/search/game-changer-replacements`,
      {
        method: 'POST',
        body: { card_name: props.card.name },
        signal,
      },
    );
    return result ?? [];
  },
  staleTime: 15 * 60 * 1000,
  retry: false,
  refetchOnWindowFocus: false,
});
const replacements = computed(() =>
  filterGameChangerReplacements(data.value ?? [], props.colors, [
    ...props.deckOracleIds,
    props.card.oracle_id,
  ]),
);
const visible = computed(() =>
  expanded.value ? replacements.value : replacements.value.slice(0, 3),
);
watch(
  () => [
    props.card.oracle_id,
    props.colors.join(','),
    props.deckOracleIds.join(','),
  ],
  () => {
    expanded.value = false;
  },
);
</script>

<template>
  <section
    :aria-label="`Replacements for ${card.name}`"
    class="game-changer-row"
  >
    <div
      class="game-changer-source rounded-xl border-2 border-purple-500 p-1 self-start"
    >
      <Card
        :card="{ card_data: card, card_name: card.name }"
        hide-progress-bar
        hide-thumbs-down-button
      />
    </div>
    <div class="min-w-0">
      <p v-if="isPending" role="status" class="text-muted py-4">
        Finding replacements…
      </p>
      <div v-else-if="error" role="alert" class="py-4 space-y-2">
        <p>Could not load replacements.</p>
        <UButton label="Retry" variant="outline" @click="refetch()" />
      </div>
      <p v-else-if="!replacements.length" class="text-muted py-4">
        No Replacements In These Colors
      </p>
      <template v-else>
        <div class="replacement-cards">
          <Card
            v-for="replacement in visible"
            :key="replacement.card_data.oracle_id"
            :card="replacement"
            hide-progress-bar
            hide-thumbs-down-button
          />
        </div>
        <UButton
          v-if="replacements.length > 3"
          class="mt-3"
          :label="expanded ? 'Show fewer results' : 'See more results'"
          :aria-expanded="expanded"
          variant="ghost"
          @click="expanded = !expanded"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.game-changer-row {
  display: grid;
  grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
  gap: 2rem;
  align-items: start;
}
.replacement-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 10rem));
  gap: 0.75rem;
}
@media (max-width: 639px) {
  .game-changer-row {
    grid-template-columns: 7rem minmax(0, 1fr);
    gap: 1.5rem;
  }
  .replacement-cards {
    grid-template-columns: repeat(3, 7rem);
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }
}
</style>
