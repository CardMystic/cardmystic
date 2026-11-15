<script setup lang="ts">
import { getUsdPrice, isBasicLand } from '~/utils/cardPrice';
import { analyzeDeck } from '~/utils/deckAnalysis';
import type { AnalysisCard } from '~/utils/deckAnalysis';
import type { DeckBusinessCardDetails } from '~/utils/deckBusinessCard';
import { getCardImageUrl } from '~/utils/scryfall';
const { columns, details: detailsColumn } = useBusinessCardColumns();
const props = defineProps<{
  name: string;
  format: string;
  bracket?: number | null;
  hasPrimer?: boolean;
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
      <div class="ml-auto text-right">
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
      <img
        v-if="qrImage"
        :src="qrImage"
        alt="QR code linking to this deck"
        width="64"
        height="64"
        class="business-qr"
      />
    </header>
    <div ref="columns" class="business-content">
      <div class="business-art">
        <div
          v-if="hero"
          class="card-finish business-hero-surface rounded-xl"
          :data-card-finish="hero.card.selected_finish"
        >
          <img
            :src="getCardImageUrl(hero.card, false, 'normal')"
            :alt="hero.card.name"
            width="488"
            height="680"
            class="business-hero"
          />
        </div>
        <div v-else class="business-no-art">
          <img
            src="/android-chrome-512x512.png"
            alt="CardMystic"
            width="160"
            height="160"
          />
        </div>
      </div>
      <div ref="detailsColumn" class="business-details">
        <div class="business-meta">
          <div
            v-if="colors.length"
            class="business-colors"
            :aria-label="`Deck colors: ${colors.join(', ')}`"
          >
            <ManaColorIcon v-for="color in colors" :key="color" :type="color" />
          </div>
          <p class="business-format">{{ format }} · {{ cardCount }} cards</p>
          <UBadge
            v-if="hasPrimer"
            color="info"
            variant="soft"
            size="sm"
            icon="i-lucide-notebook-text"
            label="Primer"
          />
          <DeckBracketBadge v-if="bracket" :bracket="bracket" full-label />
        </div>
        <h2>{{ name || 'Untitled deck' }}</h2>
        <div v-if="details.playstyles?.length" class="business-labels">
          <span v-for="tag in details.playstyles" :key="tag">{{ tag }}</span>
        </div>
        <p v-if="details.summary" class="business-summary line-clamp-2">
          {{ details.summary }}
        </p>
        <section v-if="coreCards.length" class="business-core">
          <h3 class="business-section-title">Core cards</h3>
          <div class="business-core-grid">
            <figure
              v-for="card in coreCards"
              :key="card.oracle_id"
              class="card-finish rounded-lg"
              :data-card-finish="card.selected_finish"
            >
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
      v-if="details.win_plan"
      class="business-win-plan px-4 sm:px-6 pb-6"
    >
      <h3 class="business-section-title">How it wins / plays</h3>
      <p>{{ details.win_plan }}</p>
    </section>
    <section
      class="px-4 sm:px-6 pb-6 business-charts"
      aria-label="Business card deck stats"
    >
      <DeckCharts :curve="stats.curve" :colors="stats.colors" compact />
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
  display: flex;
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
  grid-template-columns: minmax(0, var(--business-art-width, 0.8fr)) minmax(
      0,
      1.3fr
    );
  align-items: start;
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
  flex-shrink: 0;
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
.business-details p,
.business-win-plan p {
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
.business-win-plan p {
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

.business-charts :deep(.text-muted) {
  color: #b6c4db;
}
.business-charts,
.business-win-plan {
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
  .business-hero-surface {
    width: 45%;
    flex-shrink: 0;
  }
  footer {
    padding: 12px 16px;
  }
}
</style>
