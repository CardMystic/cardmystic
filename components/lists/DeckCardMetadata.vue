<script setup lang="ts">
import type { ScryfallCard } from '~/models/cardModel';
import { deckCardLabelsKey } from '~/composables/useDeckHighlight';
import { getUsdPrice } from '~/utils/cardPrice';
import { collectionPath } from '~/utils/card-collections';

const props = defineProps<{
  card?: ScryfallCard;
  face?: NonNullable<ScryfallCard['card_faces']>[number];
  textView?: boolean;
}>();
const enabled = inject(deckCardLabelsKey, undefined)?.showMetadata;
const castingCost = computed(
  () => props.face?.mana_cost ?? props.card?.mana_cost,
);
const price = computed(() => getUsdPrice(props.card?.prices));
</script>

<template>
  <dl
    v-if="enabled && card"
    aria-label="Card metadata"
    class="my-1 flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5 text-xs text-muted wrap-anywhere"
  >
    <div v-if="!textView" class="min-w-0 flex-1">
      <dt class="sr-only">Name</dt>
      <dd class="text-sm font-semibold text-highlighted">
        <NuxtLink
          :to="`/card/${card.oracle_id}`"
          no-prefetch
          class="hover:underline"
          >{{ face?.name ?? card.name }}</NuxtLink
        >
      </dd>
    </div>
    <div v-if="!textView && castingCost" class="max-w-1/2">
      <dt class="sr-only">Casting cost</dt>
      <dd>
        <span class="sr-only">{{ castingCost }}</span>
        <ManaCost
          :mana-cost="castingCost"
          class="text-base leading-none"
          aria-hidden="true"
        />
      </dd>
    </div>
    <div class="basis-full">
      <dt class="sr-only">Type</dt>
      <dd>{{ face?.type_line ?? card.type_line }}</dd>
    </div>
    <div class="inline">
      <dt class="sr-only">Set</dt>
      <dd class="inline">
        <NuxtLink
          v-if="card.set"
          :to="collectionPath('sets', card.set.toLowerCase())"
          no-prefetch
          class="text-primary hover:underline"
          >{{ card.set_name || card.set.toUpperCase() }}</NuxtLink
        ><template v-else>{{ card.set_name }}</template>
      </dd>
    </div>
    <div class="inline">
      <dt class="sr-only">Price</dt>
      <dd class="inline whitespace-nowrap">
        <span aria-hidden="true"> · </span
        >{{ price === null ? '—' : '$' + price }}
      </dd>
    </div>
  </dl>
  <div v-else-if="enabled" aria-hidden="true" class="my-1 min-w-0 space-y-0.5">
    <div v-if="!textView" class="flex h-5 items-center gap-0.5">
      <USkeleton class="mr-auto h-3.5 w-2/3" />
      <USkeleton v-for="i in 2" :key="i" class="size-3 rounded-full" />
    </div>
    <div class="flex h-4 items-center"><USkeleton class="h-3 w-3/4" /></div>
    <div class="flex h-4 items-center gap-1">
      <USkeleton class="h-3 w-2/5" /><USkeleton class="h-3 w-9" />
    </div>
  </div>
</template>
