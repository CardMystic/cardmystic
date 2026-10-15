<script setup lang="ts">
import { membershipPlans } from '~/utils/membershipPlans';
const columns = [
  { tier: 'normal', name: 'Free', price: 0 },
  ...membershipPlans,
];
const rows: { label: string; values: (string | boolean)[] }[] = [
  { label: 'Normal search', values: [true, true] },
  {
    label: 'Enhanced searches',
    values: [
      '10 / day',
      ...membershipPlans.map(
        (plan) => `${plan.enhancedSearches.toLocaleString('en-US')} / month`,
      ),
    ],
  },
  { label: 'Eligible for featured rotation', values: [true, true] },
];
const visibleOnMobile = () => true;
</script>

<template>
  <section class="membership-comparison" aria-label="Plan features">
    <table aria-label="Compare memberships">
      <thead>
        <tr>
          <th scope="col">Feature</th>
          <th
            v-for="column in columns"
            :key="column.tier"
            scope="col"
            :data-tier="column.tier"
            :class="{
              'comparison-mobile-hidden': !visibleOnMobile(column.tier),
            }"
          >
            <span class="comparison-tier">{{ column.name }}</span
            ><span class="comparison-price"
              >${{ column.price
              }}<span v-if="column.price"> / month</span></span
            >
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <th scope="row">{{ row.label }}</th>
          <td
            v-for="(value, index) in row.values"
            :key="columns[index]!.tier"
            :data-tier="columns[index]!.tier"
            :class="{
              'comparison-mobile-hidden': !visibleOnMobile(
                columns[index]!.tier,
              ),
            }"
          >
            <template v-if="typeof value === 'boolean'"
              ><UIcon
                :name="value ? 'i-lucide-check' : 'i-lucide-x'"
                class="comparison-symbol"
                :class="{ 'comparison-excluded': !value }"
                aria-hidden="true"
              /><span class="sr-only">{{
                value ? 'Included' : 'Not included'
              }}</span></template
            >
            <span v-else class="comparison-allowance">{{ value }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.membership-comparison {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding-bottom: 0.75rem;
}
.comparison-select {
  max-width: 22rem;
  font-size: 0.875rem;
}
table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.875rem;
}
th,
td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--ui-border);
  text-align: center;
  vertical-align: middle;
  overflow-wrap: anywhere;
}
th:first-child {
  width: 43%;
  text-align: left;
  padding-left: 0;
}
thead th {
  vertical-align: top;
}
tbody th {
  font-weight: 500;
}
.comparison-tier,
.comparison-price {
  display: block;
}
.comparison-tier {
  font-weight: 700;
}
.comparison-price {
  margin-top: 0.375rem;
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
  font-weight: 400;
}
.comparison-allowance {
  font-weight: 600;
}
.comparison-symbol {
  width: 1.25rem;
  height: 1.25rem;
  vertical-align: middle;
}
[data-tier='enhanced'] {
  color: #6d28d9;
}
[data-tier='pro'],
[data-tier='pro-plus'] {
  color: #924e11;
}
.comparison-excluded {
  color: var(--ui-text-muted);
}
.comparison-mobile-hidden {
  display: none;
}
:global(.dark .membership-comparison [data-tier='enhanced']) {
  color: #c1a3ff;
}
:global(.dark .membership-comparison [data-tier='pro']),
:global(.dark .membership-comparison [data-tier='pro-plus']) {
  color: #ffc878;
}
@media (min-width: 768px) {
  .comparison-select {
    display: none;
  }
  .comparison-mobile-hidden {
    display: table-cell;
  }
  th:first-child {
    width: 30%;
  }
  th,
  td {
    padding: 0.875rem 0.625rem;
  }
}
@media (min-width: 1100px) {
  th,
  td {
    padding: 0.875rem 1rem;
  }
  .comparison-tier {
    font-size: 1rem;
  }
}
</style>
