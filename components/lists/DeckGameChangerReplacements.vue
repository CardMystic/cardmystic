<script setup lang="ts">
import type { AnalysisCard } from '~/utils/deckAnalysis';
import {
  gameChangersInDeck,
  replacementColors,
} from '~/utils/gameChangerReplacements';
const props = defineProps<{ entries: AnalysisCard[] }>();
const open = defineModel<boolean>('open', { default: false });
const gameChangers = computed(() => gameChangersInDeck(props.entries));
const colors = computed(() => replacementColors(props.entries));
const oracleIds = computed(() =>
  props.entries.map(({ card }) => card.oracle_id),
);
</script>

<template>
  <section
    v-if="open"
    aria-label="Replace Gamechangers"
    class="my-4 rounded-lg border border-primary/25 bg-primary/5 p-4"
  >
    <div class="flex items-start justify-between gap-3 mb-3">
      <h2 class="min-w-0 wrap-anywhere font-semibold">Replace Gamechangers</h2>
      <UButton
        icon="i-lucide-x"
        aria-label="Close game changer replacements"
        variant="ghost"
        class="shrink-0"
        @click="open = false"
      />
    </div>
    <div class="space-y-6">
      <p v-if="!gameChangers.length" class="text-muted">
        No game changers in this deck.
      </p>
      <GameChangerReplacementRow
        v-for="card in gameChangers"
        :key="card.oracle_id"
        :card="card"
        :colors="colors"
        :deck-oracle-ids="oracleIds"
      />
    </div>
  </section>
</template>
