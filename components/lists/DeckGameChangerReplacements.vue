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
  <UModal
    v-model:open="open"
    title="Replace Gamechangers"
    description="Find replacements within your deck's colors."
    :close="{ 'aria-label': 'Close game changer replacements' }"
    :ui="{ content: 'sm:max-w-3xl lg:max-w-5xl', description: 'sr-only' }"
  >
    <template #body>
      <div v-if="open" class="mx-auto w-full max-w-3xl space-y-6">
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
    </template>
  </UModal>
</template>
