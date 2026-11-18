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
const { previewCount, expandThreshold } = useDeckSuggestionGrid();
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
  expanded.value
    ? replacements.value
    : replacements.value.slice(0, previewCount.value - 1),
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
  <section :aria-label="`Replacements for ${card.name}`">
    <DeckSuggestionGrid
      :expanded="expanded"
      class="replacement-cards"
      :aria-busy="isPending"
    >
      <div
        class="game-changer-source relative rounded-[14px] self-start"
        role="group"
        :aria-label="`Original Game Changer: ${card.name}`"
      >
        <Card
          :card="{ card_data: card, card_name: card.name }"
          flush
          hide-progress-bar
          hide-thumbs-down-button
        />
        <span
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 z-10 rounded-[14px] border-[3px] border-purple-500"
        />
      </div>
      <template v-if="isPending">
        <USkeleton
          v-for="n in previewCount - 1"
          :key="n"
          class="w-full aspect-[488/680] rounded-[14px]"
        />
      </template>
      <template v-else-if="!error">
        <Card
          v-for="replacement in visible"
          :key="replacement.card_data.oracle_id"
          :card="replacement"
          flush
          hide-progress-bar
          hide-thumbs-down-button
        />
      </template>
    </DeckSuggestionGrid>
    <p v-if="isPending" role="status" class="sr-only">Finding replacements…</p>
    <div v-else-if="error" role="alert" class="py-4 space-y-2">
      <p>Could not load replacements.</p>
      <UButton label="Retry" variant="outline" @click="refetch()" />
    </div>
    <p v-else-if="!replacements.length" class="text-muted py-4">
      No Replacements In These Colors
    </p>
    <UButton
      v-if="
        !isPending &&
        !error &&
        (expanded || replacements.length + 1 > expandThreshold)
      "
      class="mt-3"
      :label="expanded ? 'Show fewer results' : 'See more results'"
      :aria-expanded="expanded"
      variant="ghost"
      @click="expanded = !expanded"
    />
  </section>
</template>
