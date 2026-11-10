<script setup lang="ts">
import { getUsdPrice, isBasicLand } from '~/utils/cardPrice';
import { analyzeDeck } from '~/utils/deckAnalysis';
import type { AnalysisCard } from '~/utils/deckAnalysis';
import type { DeckBusinessCardDetails } from '~/utils/deckBusinessCard';
import { getCardImageUrl } from '~/utils/scryfall';
const props = defineProps<{
  name: string;
  format: string;
  bracket?: number | null;
  details: DeckBusinessCardDetails;
  entries: AnalysisCard[];
  qrImage: string;
  deckUrl: string;
}>();
const hero = computed(
  () =>
    props.entries.find(
      (entry) => entry.card.oracle_id === props.details.hero_oracle_id,
    ) ??
    props.entries.find((entry) => entry.commander) ??
    props.entries[0],
);
const coreCards = computed(() =>
  props.details.core_oracle_ids.flatMap((id) => {
    const entry = props.entries.find((value) => value.card.oracle_id === id);
    return entry ? [entry.card] : [];
  }),
);
const colors = computed(() => {
  const identities = new Set(
    props.entries.flatMap((entry) => entry.card.color_identity ?? []),
  );
  return ['W', 'U', 'B', 'R', 'G'].filter((color) => identities.has(color));
});
const cardCount = computed(() =>
  props.entries.reduce((sum, entry) => sum + entry.quantity, 0),
);
const stats = computed(() => analyzeDeck(props.entries));
const price = computed(() => {
  let cents = 0,
    missing = 0;
  for (const { card, quantity } of props.entries) {
    if (isBasicLand(card)) continue;
    const raw = getUsdPrice(card.prices);
    const value = raw == null ? NaN : Number(raw);
    if (Number.isFinite(value) && value >= 0)
      cents += Math.round(value * 100) * quantity;
    else missing += quantity;
  }
  return {
    amount: (cents / 100).toFixed(2),
    missing,
    date: new Date().toLocaleDateString(),
  };
});
const openingHand = computed(() => {
  const counts = new Map<string, number>();
  return (props.details.opening_hand ?? []).flatMap((id) => {
    const entry = props.entries.find(
      (entry) => entry.card.oracle_id === id && !entry.commander,
    );
    const used = counts.get(id) ?? 0;
    if (!entry || used >= entry.quantity) return [];
    counts.set(id, used + 1);
    return [entry.card];
  });
});
const combos = computed(() =>
  (props.details.combos ?? [])
    .map((combo) => ({
      ...combo,
      cards: combo.oracle_ids.flatMap((id) => {
        const entry = props.entries.find(
          (entry) => entry.card.oracle_id === id,
        );
        return entry ? [entry.card] : [];
      }),
    }))
    .filter((combo) => combo.cards.length >= 2),
);
</script>
<template>
  <article
    id="deck-business-card-print"
    class="deck-business-card"
    aria-label="Deck business card"
  >
    <header class="business-brand">
      <div class="business-logo">
        <img
          src="/android-chrome-192x192.png"
          alt=""
          width="28"
          height="28"
        /><span>CardMystic</span>
      </div>
      <img
        v-if="qrImage"
        :src="qrImage"
        alt="QR code linking to this deck"
        width="64"
        height="64"
        class="business-qr"
      />
      <div class="text-right">
        <strong class="text-lg tabular-nums"
          >{{ price.missing ? 'From ' : '' }}${{ price.amount }}</strong
        >
        <p class="text-xs font-normal text-slate-300">
          Est. USD · {{ price.date }}
        </p>
        <p v-if="price.missing" class="text-xs font-normal text-slate-300">
          {{ price.missing }} copies without prices
        </p>
      </div>
    </header>
    <div class="business-content">
      <div class="business-art">
        <img
          v-if="hero"
          :src="getCardImageUrl(hero.card, false, 'normal')"
          :alt="hero.card.name"
          width="488"
          height="680"
          class="business-hero"
        />
        <div v-else class="business-no-art">
          <img
            src="/android-chrome-512x512.png"
            alt="CardMystic"
            width="160"
            height="160"
          />
        </div>
      </div>
      <div class="business-details">
        <div class="business-meta">
          <div
            v-if="colors.length"
            class="business-colors"
            :aria-label="`Deck colors: ${colors.join(', ')}`"
          >
            <ManaColorIcon v-for="color in colors" :key="color" :type="color" />
          </div>
          <p class="business-format">{{ format }} · {{ cardCount }} cards</p>
        </div>
        <h2>{{ name || 'Untitled deck' }}</h2>
        <div
          v-if="details.playstyles?.length || bracket"
          class="business-labels"
        >
          <span v-for="tag in details.playstyles" :key="tag">{{ tag }}</span
          ><span v-if="bracket">Bracket {{ bracket }}</span>
        </div>
        <p v-if="details.summary" class="business-summary">
          {{ details.summary }}
        </p>
        <section v-if="details.win_plan">
          <h3 class="business-section-title">How it wins</h3>
          <p>{{ details.win_plan }}</p>
        </section>
        <section v-if="coreCards.length" class="business-core">
          <h3 class="business-section-title">Core cards</h3>
          <div class="business-core-grid">
            <figure v-for="card in coreCards" :key="card.oracle_id">
              <img
                :src="getCardImageUrl(card, false, 'normal')"
                :alt="card.name"
                width="488"
                height="680"
              />
            </figure>
          </div>
        </section>
      </div>
    </div>
    <section
      class="px-4 sm:px-6 pb-6 business-charts"
      aria-label="Business card deck stats"
    >
      <DeckCharts :curve="stats.curve" :colors="stats.colors" compact />
    </section>
    <section v-if="openingHand.length" class="px-4 sm:px-6 pb-6">
      <h3 class="business-section-title">Example opening hand</h3>
      <div class="business-hand-grid">
        <img
          v-for="(card, index) in openingHand"
          :key="index"
          :src="getCardImageUrl(card)"
          :alt="card.name"
          width="488"
          height="680"
          class="w-full rounded-md"
        />
      </div>
    </section>
    <section v-if="combos.length" class="px-4 sm:px-6 pb-6 space-y-4">
      <h3 class="business-section-title">Combos</h3>
      <article
        v-for="(combo, index) in combos"
        :key="index"
        class="business-combo"
      >
        <h4 class="font-medium">{{ combo.name }}</h4>
        <p class="text-sm text-slate-300 whitespace-pre-wrap break-words my-2">
          {{ combo.description }}
        </p>
        <div class="flex flex-wrap gap-2">
          <img
            v-for="card in combo.cards"
            :key="card.oracle_id"
            :src="getCardImageUrl(card)"
            :alt="card.name"
            width="96"
            height="134"
            class="w-20 rounded-md"
          />
        </div>
      </article>
    </section>
    <footer>
      <a :href="deckUrl">{{ deckUrl.replace('https://', '') }}</a>
    </footer>
  </article>
</template>
<style scoped>
.deck-business-card {
  color: #f8fafc;
  background: #11182c;
  border: 1px solid #525075;
  border-radius: 16px;
  overflow: hidden;
  font-family: Arial, sans-serif;
}
.business-brand {
  padding: 8px 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  background: #1e203a;
  border-bottom: 2px solid #ac89f3;
  font-weight: 700;
}
.business-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}
.business-brand > .text-right {
  grid-column: 3;
}
.business-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 12px;
}
.business-format {
  color: #d5c5f5;
  font-size: 13px;
  white-space: nowrap;
  font-weight: 400;
}
.business-content {
  padding: 24px;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.3fr);
  gap: 28px;
}
.business-art,
.business-details {
  min-width: 0;
}
.business-hero {
  width: 100%;
  height: auto;
  aspect-ratio: 488 / 680;
  object-fit: contain;
  border-radius: 12px;
}
.business-no-art {
  min-height: 180px;
  display: grid;
  place-items: center;
}
.business-qr {
  grid-column: 2;
  width: 64px;
  height: auto;
  background: white;
  border-radius: 6px;
}
.business-colors {
  display: flex;
  gap: 4px;
  font-size: 26px;
}
.business-details h2 {
  font-size: clamp(22px, 3vw, 36px);
  line-height: 1.15;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.business-labels {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 16px;
}
.business-labels span {
  padding: 5px 10px;
  border: 1px solid #8d6fc4;
  border-radius: 6px;
  color: #decafc;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.business-summary {
  margin-top: 18px;
}
.business-details p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
}
.business-details section {
  margin-top: 20px;
}
.business-section-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgb(255 255 255 / 15%);
}
.business-details section p {
  font-size: 14px;
  color: #d6dfec;
}
.business-core-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.business-core-grid img {
  width: 100%;
  height: auto;
  aspect-ratio: 488 / 680;
  object-fit: contain;
  border-radius: 6px;
}

.business-hand-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 8px;
}
.business-charts :deep(.text-muted) {
  color: #b6c4db;
}
.business-charts,
.business-combo {
  break-inside: avoid;
}
footer {
  padding: 12px 24px;
  background: #0b1120;
  color: #b6c4db;
  font-size: 11px;
  overflow-wrap: anywhere;
}
@media (max-width: 639px) {
  .business-hand-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .business-brand {
    padding: 8px 12px;
  }
  .business-logo {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    font-size: 13px;
  }
  .business-content {
    padding: 16px;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
  }
  .business-details {
    grid-row: 1;
  }
  .business-art {
    display: flex;
    justify-content: center;
  }
  .business-hero {
    width: 45%;
    flex-shrink: 0;
  }
  footer {
    padding: 12px 16px;
  }
}
</style>
