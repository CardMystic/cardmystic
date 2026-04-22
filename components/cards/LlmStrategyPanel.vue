<template>
  <div class="llm-stack">
    <UCard class="llm-card">
      <h3 class="llm-title flex items-center gap-2">
        <UIcon name="i-lucide-biceps-flexed" />AI Power Level
      </h3>

      <div class="power-section">
        <div class="meter-block">
          <div class="meter-header">
            <span class="meter-label">Overall</span>
            <span class="meter-value">{{ props.llm.power_level }}</span>
          </div>
          <UProgress :model-value="overallPowerPercent" :color="meterColor(overallPowerPercent)" size="lg" />
        </div>

        <div v-if="formatMeters.length" class="format-meters">
          <div v-for="formatMeter in formatMeters" :key="formatMeter.name" class="meter-block">
            <div class="meter-header">
              <span class="meter-label">{{ formatMeter.name }}</span>
              <span class="meter-value">{{ formatMeter.value }}</span>
            </div>
            <UProgress :model-value="formatMeter.percent" :color="meterColor(formatMeter.percent)" size="sm" />
          </div>
        </div>
      </div>
    </UCard>

    <UCard class="llm-card">
      <h3 class="llm-title flex items-center gap-2">
        <UIcon name="i-lucide-brain" />AI Summary
      </h3>

      <div class="chart-wrap">
        <svg :viewBox="`0 0 ${size} ${size}`" class="radar-chart" role="img" aria-label="AI strategy radar chart">
          <g>
            <polygon v-for="(ring, i) in ringPolygons" :key="`ring-${i}`" :points="ring" class="ring"
              :class="{ 'ring-outer': i === ringPolygons.length - 1 }" />
          </g>

          <g>
            <line v-for="(pt, i) in axisPoints" :key="`axis-${i}`" :x1="center" :y1="center" :x2="pt.x" :y2="pt.y"
              class="axis" />
          </g>

          <polygon :points="valuePolygon" class="value-fill" />
          <polygon :points="valuePolygon" class="value-line" />

          <circle v-for="(pt, i) in valuePoints" :key="`dot-${i}`" :cx="pt.x" :cy="pt.y" r="3.2" class="value-dot" />

          <text v-for="(label, i) in labels" :key="`label-${i}`" :x="labelPoints[i].x" :y="labelPoints[i].y"
            text-anchor="middle" dominant-baseline="middle" class="label">
            {{ label }}
          </text>
        </svg>
      </div>

      <div v-if="combinedSummary">
        <p class="summary-text">{{ combinedSummary }}</p>

        <div v-if="cardRoles.length" class="roles-wrap">
          <UBadge v-for="role in cardRoles" :key="role" color="primary" variant="subtle" size="sm" class="role-badge">
            {{ role }}
          </UBadge>
          <UBadge v-for="sentiment in cardSentiment" :key="sentiment" color="info" variant="subtle" size="sm"
            class="role-badge">
            {{ sentiment }}
          </UBadge>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
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

const combinedSummary = computed(() => {
  const parts = [props.llm.one_line_summary?.trim(), props.llm.why_to_play?.trim()].filter(Boolean);
  const summary = parts.join(' ');
  if (summary.length <= 500) return summary;
  return `${summary.slice(0, 497).trimEnd()}...`;
});

const chartPadding = 18;
const size = 240 + chartPadding * 2;
const center = size / 2;
const radius = 78;
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

const valuePolygon = computed(() => valuePoints.value.map((p) => `${p.x},${p.y}`).join(' '));

const labelPoints = computed(() => labels.map((_, i) => {
  const extraOffset = i === 1 || i === 3 ? 8 : 0; // Midrange + Combo
  return pointAt(i, radius + 20 + extraOffset);
}));

function toMeterPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 5) return Math.max(0, Math.min(100, (value / 5) * 100));
  if (value <= 10) return Math.max(0, Math.min(100, (value / 10) * 100));
  return Math.max(0, Math.min(100, value));
}

const overallPowerPercent = computed(() => toMeterPercent(props.llm.power_level));

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
    .map(role => role.trim())
    .filter(Boolean)
    .slice(0, 5);
});

const cardSentiment = computed(() => {
  return (props.llm.community_sentiment || [])
    .map(sentiment => sentiment.trim())
    .filter(Boolean)
    .slice(0, 5);
});

function meterColor(percent: number) {
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
}
</script>

<style scoped lang="sass">
.llm-stack
  display: flex
  flex-direction: column
  gap: 8px

.llm-card
  border-radius: 24px
  border: 1px solid rgba(147, 114, 255, 0.3)
  background: var(--ui-bg)
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1)

.llm-title
  font-size: 1.6rem
  font-weight: 700

.power-section
  display: flex
  flex-direction: column
  gap: 10px
  margin-bottom: 12px

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
  color: rgba(255, 255, 255, 0.9)

.meter-value
  font-size: 0.85rem
  font-weight: 700
  color: rgba(187, 247, 208, 0.95)

.chart-wrap
  display: flex
  justify-content: center
  align-items: center

.radar-chart
  width: 100%
  max-width: 260px
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
  fill: rgba(255, 255, 255, 0.9)
  font-size: 11px
  font-weight: 600

.summary-text
  font-size: 1rem
  line-height: 1.35
  color: rgba(255, 255, 255, 0.95)

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