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
    <details class="evidence-context">
      <summary>How we measured this</summary>
      <div class="evidence-method">
        <p>
          We scored relevance and ordering in the first 10 results using
          nDCG@10, with grades from 0 to 3. Technical and subjective scores
          contribute equally; topics have equal weight within each set. These
          are ranking scores, not accuracy percentages.
        </p>
        <table aria-label="Ranking scores by query type">
          <thead>
            <tr>
              <th scope="col">Mode</th>
              <th scope="col">Technical</th>
              <th scope="col">Subjective</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mode in modes" :key="mode.id">
              <th scope="row">{{ mode.name }}</th>
              <td>{{ displayScore(mode.technicalNdcgAt10) }}</td>
              <td>{{ displayScore(mode.subjectiveNdcgAt10) }}</td>
            </tr>
          </tbody>
        </table>
        <p>
          September 28, 2026: model-assisted grading of the same
          {{ benchmark.scoredQueries }} queries per mode, with saved fallbacks
          included. We excluded
          {{ benchmark.totalQueries - benchmark.scoredQueries }} queries with
          unresolved judgments. A score of 100 means the ideal order within the
          reviewed card pool, which is not exhaustive. This is not an
          independent human evaluation.
        </p>
        <p>
          Natural-language searches only. Commander, Similarity and deck
          recommendations were not separately benchmarked. The full data
          includes the scoring method, source hashes and limitations.
        </p>
        <a
          class="evidence-download"
          href="/benchmarks/search-quality-graded-2026-09-28.json"
          download
          >Download benchmark data and methodology</a
        >
      </div>
    </details>
  </section>
</template>

<style scoped>
.search-evidence {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  padding-block: 1rem;
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
.evidence-lift[data-mode='pro'] strong {
  color: #924e11;
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
.evidence-row[data-mode='pro'] {
  --bar-color: #924e11;
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
.evidence-context {
  grid-column: 1 / -1;
  font-size: 0.875rem;
  line-height: 1.6;
}
.evidence-context summary {
  padding-block: 0.625rem;
  min-height: 2.75rem;
  width: fit-content;
  cursor: pointer;
  font-weight: 600;
}
.evidence-method {
  display: grid;
  gap: 0.75rem;
  max-width: 80ch;
}
.evidence-method table {
  width: 100%;
  max-width: 32rem;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
.evidence-method th,
.evidence-method td {
  padding: 0.5rem 0.375rem;
  border-bottom: 1px solid var(--ui-border);
  text-align: right;
}
.evidence-method th:first-child {
  text-align: left;
  padding-left: 0;
}
.evidence-download {
  min-height: 2.75rem;
  text-decoration: underline;
}
:global(.dark .evidence-lift strong) {
  color: #c1a3ff;
}
:global(.dark .evidence-lift[data-mode='pro'] strong) {
  color: #ffc878;
}
:global(.dark .evidence-row) {
  --bar-color: #94a3b8;
}
:global(.dark .evidence-row[data-mode='enhanced']) {
  --bar-color: #c1a3ff;
}
:global(.dark .evidence-row[data-mode='pro']) {
  --bar-color: #ffc878;
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
