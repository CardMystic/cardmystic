<script setup lang="ts">
import benchmark from '~~/public/benchmarks/search-quality-graded-2026-09-28.json';
const headingId = useId();
const captionId = useId();
const modes = benchmark.modes
  .filter((mode) => mode.id !== 'pro')
  .map((mode) => ({
    ...mode,
    score:
      mode.subjectiveNdcgAt10 * benchmark.suiteWeights.subjective +
      mode.technicalNdcgAt10 * benchmark.suiteWeights.technical,
  }));
const normal = modes.find((mode) => mode.id === 'normal')!;
const enhanced = modes.find((mode) => mode.id === 'enhanced')!;
const relativeLift = (score: number, baseline: number) =>
  Math.round((score / baseline - 1) * 100);
const displayScore = (score: number) =>
  (score * benchmark.displayScale).toFixed(1);
</script>

<template>
  <section class="search-evidence" :aria-labelledby="headingId">
    <div class="evidence-intro">
      <h3 :id="headingId">Better matches near the top</h3>
      <p class="evidence-lift" data-mode="enhanced">
        Enhanced:
        <strong
          >{{ relativeLift(enhanced.score, normal.score) }}% higher ranking
          score</strong
        >
        than Normal.
      </p>
      <p class="evidence-scope">
        Across {{ benchmark.scoredQueries }} graded benchmark queries. Results
        vary.
      </p>
    </div>
    <figure class="evidence-chart" :aria-labelledby="captionId">
      <figcaption :id="captionId">
        Ranking quality score <span>(out of 100)</span>
      </figcaption>
      <dl class="evidence-bars">
        <div
          v-for="mode in modes"
          :key="mode.id"
          class="evidence-row"
          :data-mode="mode.id"
        >
          <dt>{{ mode.name }}</dt>
          <dd>
            <span class="evidence-value">{{ displayScore(mode.score) }}</span
            ><span class="evidence-track" aria-hidden="true"
              ><span
                class="evidence-fill"
                :style="{ width: `${mode.score * 100}%` }"
            /></span>
          </dd>
        </div>
      </dl>
      <div class="evidence-axis" aria-hidden="true">
        <span>0</span><span>50</span><span>100</span>
      </div>
    </figure>
  </section>
</template>

<style scoped>
.search-evidence {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--ui-border);
}
.evidence-intro {
  display: grid;
  align-content: start;
  gap: 0.75rem;
}
.search-evidence h3 {
  font-size: 1.125rem;
  font-weight: 700;
}
.evidence-lift {
  font-size: 0.9375rem;
  line-height: 1.6;
  max-width: 44ch;
}
.evidence-lift strong {
  color: #6d28d9;
}
.evidence-scope {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
  line-height: 1.6;
}
.evidence-chart {
  min-width: 0;
}
.evidence-chart figcaption {
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}
.evidence-chart figcaption span {
  color: var(--ui-text-muted);
  font-weight: 400;
}
.evidence-bars {
  display: grid;
  gap: 0.75rem;
}
.evidence-row {
  --bar-color: #64748b;
  position: relative;
}
.evidence-row[data-mode='enhanced'] {
  --bar-color: #6d28d9;
}
.evidence-row dt {
  font-weight: 600;
  padding-inline-end: 5rem;
}
.evidence-value {
  position: absolute;
  inset-inline-end: 0;
  top: 0;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--bar-color);
}
.evidence-track {
  display: block;
  height: 0.75rem;
  margin-top: 0.25rem;
  background: var(--ui-bg-accented);
  border-radius: 0.125rem;
  overflow: hidden;
}
.evidence-fill {
  display: block;
  height: 100%;
  background: var(--bar-color);
}
.evidence-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}
:global(.dark .evidence-lift strong) {
  color: #c1a3ff;
}
:global(.dark .evidence-row) {
  --bar-color: #94a3b8;
}
:global(.dark .evidence-row[data-mode='enhanced']) {
  --bar-color: #c1a3ff;
}
@media (min-width: 768px) {
  .search-evidence {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.75rem 2rem;
  }
}
@media (min-width: 1100px) {
  .search-evidence {
    column-gap: 3rem;
  }
}
</style>
