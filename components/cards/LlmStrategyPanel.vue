<template>
  <template v-if="hasAnyData">
    <UCard
      v-if="hasPowerLevelData"
      class="llm-card power-card"
      :ui="{ body: 'px-0 py-4 sm:px-0 sm:py-4 lg:px-4' }"
    >
      <h3 class="llm-title flex items-center gap-2">Power Level</h3>

      <div class="power-section">
        <div class="meter-block">
          <div class="meter-header">
            <span class="meter-label">Overall</span>
            <span class="meter-value">{{ props.llm.power_level }}</span>
          </div>
          <UProgress
            :model-value="overallPowerPercent"
            :color="meterColor(overallPowerPercent)"
            size="lg"
          />
        </div>

        <div v-if="formatMeters.length" class="format-meters">
          <div
            v-for="formatMeter in formatMeters"
            :key="formatMeter.name"
            class="meter-block"
          >
            <div class="meter-header">
              <span class="meter-label">{{ formatMeter.name }}</span>
              <span class="meter-value">{{ formatMeter.value }}</span>
            </div>
            <UProgress
              :model-value="formatMeter.percent"
              :color="meterColor(formatMeter.percent)"
              size="sm"
            />
          </div>
        </div>
      </div>
    </UCard>

    <div v-if="hasStrategyData || hasSummaryData" class="playstyle-summary-row">
      <UCard
        v-if="hasStrategyData"
        class="llm-card playstyle-card"
        :ui="{ body: 'p-2 sm:p-2' }"
      >
        <div class="chart-wrap">
          <svg
            :viewBox="`0 0 ${size} ${size}`"
            class="radar-chart"
            role="img"
            :aria-label="`Playstyle scores: ${labels.map((label, i) => `${label} ${values[i]}`).join(', ')}`"
          >
            <g>
              <polygon
                v-for="(ring, i) in ringPolygons"
                :key="`ring-${i}`"
                :points="ring"
                class="ring"
                :class="{ 'ring-outer': i === ringPolygons.length - 1 }"
              />
            </g>

            <g>
              <line
                v-for="(pt, i) in axisPoints"
                :key="`axis-${i}`"
                :x1="center"
                :y1="center"
                :x2="pt.x"
                :y2="pt.y"
                class="axis"
              />
            </g>

            <polygon :points="valuePolygon" class="value-fill" />
            <polygon :points="valuePolygon" class="value-line" />

            <circle
              v-for="(pt, i) in valuePoints"
              :key="`dot-${i}`"
              :cx="pt.x"
              :cy="pt.y"
              r="3.2"
              class="value-dot"
            />

            <text
              v-for="(label, i) in labels"
              :key="`label-${i}`"
              :x="labelPoints[i].x"
              :y="labelPoints[i].y"
              text-anchor="middle"
              dominant-baseline="middle"
              class="label"
            >
              {{ label }}
            </text>
            <foreignObject
              v-for="(value, i) in values"
              :key="`score-${i}`"
              :x="labelPoints[i].x - 14"
              :y="labelPoints[i].y + (i === 0 ? -34 : 12)"
              width="28"
              height="26"
            >
              <span
                class="flex h-6 w-7 items-center justify-center rounded text-base font-semibold leading-none ring-1 ring-inset"
                :class="
                  commanderBracket(value)?.classes ??
                  'bg-gray-100 text-gray-700 ring-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-600'
                "
                >{{ value }}</span
              >
            </foreignObject>
          </svg>
        </div>
      </UCard>
      <UCard
        v-if="hasSummaryData"
        class="llm-card summary-card"
        :ui="{
          body: 'flex h-full items-center px-0 py-0 sm:px-0 sm:py-0 lg:px-4',
        }"
      >
        <div
          v-if="
            longSummary ||
            cardRoles.length ||
            cardThemes.length ||
            cardSentiment.length
          "
          class="min-w-0"
        >
          <h3 class="llm-title">Card Summary</h3>
          <p v-if="longSummary" class="summary-text">{{ longSummary }}</p>

          <div
            v-if="cardRoles.length || cardThemes.length || cardSentiment.length"
            class="roles-wrap"
          >
            <component
              :is="collectionTagPath('roles', role) ? NuxtLink : 'span'"
              v-for="role in cardRoles"
              :key="role"
              :to="collectionTagPath('roles', role)"
              no-prefetch
              class="rounded focus-visible:outline-2 focus-visible:outline-primary hover:underline"
            >
              <UBadge
                :color="cardLabelColors.roles"
                variant="subtle"
                size="sm"
                class="role-badge"
              >
                {{ role }}
              </UBadge>
            </component>
            <component
              :is="collectionTagPath('themes', theme) ? NuxtLink : 'span'"
              v-for="theme in cardThemes"
              :key="theme"
              :to="collectionTagPath('themes', theme)"
              no-prefetch
              class="rounded focus-visible:outline-2 focus-visible:outline-primary hover:underline"
            >
              <UBadge
                :color="cardLabelColors.themes"
                variant="subtle"
                size="sm"
                class="role-badge"
              >
                {{ theme }}
              </UBadge>
            </component>
            <UBadge
              v-for="sentiment in cardSentiment"
              :key="sentiment"
              color="info"
              variant="subtle"
              size="sm"
              class="role-badge"
            >
              {{ sentiment }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </template>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';
import { collectionTagPath } from '~/utils/card-collections';
import { cardLabelColors } from '~/utils/deckHighlight';
import { commanderBracket } from '~/utils/commanderBrackets';
import type { LlmCardAttributes } from '~/models/llmModel';

const props = defineProps<{
  llm: LlmCardAttributes;
}>();

const labels = ['Aggro', 'Midrange', 'Control', 'Combo'];
const values = computed(() => [
  props.llm.strategy_rankings.aggro,
  props.llm.strategy_rankings.midrange,
  props.llm.strategy_rankings.control,
  props.llm.strategy_rankings.combo,
]);

const longSummary = computed(() => {
  const s = props.llm.long_summary?.trim() ?? '';
  if (s.length <= 500) return s;
  return `${s.slice(0, 497).trimEnd()}...`;
});

const size = 320;
const center = size / 2;
const radius = 74;
const ringCount = 5;
const maxStrategyScore = 5;

function pointAt(index: number, r: number) {
  const angle = (-90 + (index * 360) / labels.length) * (Math.PI / 180);
  return {
    x: center + Math.cos(angle) * r,
    y: center + Math.sin(angle) * r,
  };
}

const axisPoints = computed(() => labels.map((_, i) => pointAt(i, radius)));

const ringPolygons = computed(() => {
  const rings: string[] = [];
  for (let i = 1; i <= ringCount; i++) {
    const r = (radius * i) / ringCount;
    const pts = labels.map((_, idx) => pointAt(idx, r));
    rings.push(pts.map((p) => `${p.x},${p.y}`).join(' '));
  }
  return rings;
});

const valuePoints = computed(() => {
  return values.value.map((v, i) => {
    const ratio = Math.max(0, Math.min(1, v / maxStrategyScore));
    return pointAt(i, radius * ratio);
  });
});

const valuePolygon = computed(() =>
  valuePoints.value.map((p) => `${p.x},${p.y}`).join(' '),
);

const labelPoints = computed(() =>
  labels.map((_, i) => pointAt(i, radius + (i % 2 === 0 ? 20 : 47))),
);

function toMeterPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, (value / 5) * 100));
}

const overallPowerPercent = computed(() =>
  toMeterPercent(props.llm.power_level),
);

const formatMeters = computed(() => {
  return Object.entries(props.llm.format_strength || {})
    .map(([name, value]) => ({
      name,
      value,
      percent: toMeterPercent(value),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
});

const cardRoles = computed(() => {
  return (props.llm.roles || [])
    .map((role) => role.trim())
    .filter(Boolean)
    .slice(0, 5);
});

const cardThemes = computed(() => {
  return (props.llm.themes || [])
    .map((theme) => theme.trim())
    .filter(Boolean)
    .slice(0, 5);
});

const cardSentiment = computed(() => {
  return (props.llm.community_sentiment || [])
    .map((sentiment) => sentiment.trim())
    .filter(Boolean)
    .slice(0, 5);
});

const hasPowerLevelData = computed(() => props.llm.power_level > 0);

const hasStrategyData = computed(() => values.value.some((v) => v > 0));

const hasSummaryData = computed(
  () =>
    !!longSummary.value ||
    cardRoles.value.length > 0 ||
    cardThemes.value.length > 0 ||
    cardSentiment.value.length > 0,
);

const hasAnyData = computed(
  () =>
    hasPowerLevelData.value || hasStrategyData.value || hasSummaryData.value,
);

function meterColor(percent: number) {
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
}
</script>

<style scoped lang="sass">
.playstyle-summary-row
  display: grid
  grid-column: 1 / -1
  grid-template-columns: minmax(0, 1fr)
  gap: 8px
  min-width: 0

@container card-info (min-width: 600px)
  .playstyle-summary-row:has(.playstyle-card):has(.summary-card)
    grid-template-columns: 256px minmax(0, 1fr)

.llm-card
  border-radius: 0
  border: 0
  background: transparent
  color: var(--ui-text)
  box-shadow: none

.power-card
  width: 100%

  @media (min-width: 1024px)
    max-width: 24rem

.llm-title
  font-size: 1.25rem
  font-weight: 700
  margin-bottom: 8px

.power-section
  display: flex
  flex-direction: column
  gap: 10px

.format-meters
  display: grid
  grid-template-columns: 1fr
  gap: 8px

.meter-block
  display: flex
  flex-direction: column
  gap: 4px

.meter-header
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px

.meter-label
  font-size: 0.9rem
  font-weight: 600
  color: var(--ui-text-toned)

.meter-value
  font-size: 0.85rem
  font-weight: 700
  color: var(--ui-text)

.chart-wrap
  display: flex
  justify-content: center
  align-items: center

.radar-chart
  width: 100%
  max-width: 240px
  height: auto

.ring
  fill: transparent
  stroke: rgba(255, 255, 255, 0.12)
  stroke-width: 1

.ring-outer
  stroke: rgba(255, 255, 255, 0.2)

.axis
  stroke: rgba(255, 255, 255, 0.14)
  stroke-width: 1

.value-fill
  fill: rgba(134, 239, 172, 0.24)

.value-line
  fill: none
  stroke: rgba(134, 239, 172, 0.95)
  stroke-width: 2

.value-dot
  fill: rgba(187, 247, 208, 1)
  stroke: rgba(134, 239, 172, 1)
  stroke-width: 1

.label
  fill: var(--ui-text-toned)
  font-size: 1rem
  font-weight: 600

.summary-text
  font-size: 1rem
  line-height: 1.35
  color: var(--ui-text)

.roles-wrap
  display: flex
  flex-wrap: wrap
  gap: 6px
  margin-top: 10px

.role-badge
  font-weight: 600

@media (max-width: 1023px)
  .llm-title
    font-size: 1.25rem

  .summary-text
    font-size: 0.9rem
</style>
