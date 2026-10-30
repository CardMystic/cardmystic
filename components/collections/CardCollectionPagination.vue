<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import {
  collectionLabels,
  type CardCollectionKind,
} from '~/utils/card-collections';

defineProps<{
  kind: CardCollectionKind;
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  to: (page: number) => RouteLocationRaw;
  position: 'top' | 'bottom';
}>();
</script>

<template>
  <nav
    :aria-label="`${collectionLabels[kind]} pages ${position}`"
    class="flex flex-col items-center gap-2"
  >
    <p role="status" class="text-sm text-toned">
      {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }} of
      {{ total }} {{ collectionLabels[kind].toLowerCase() }}
    </p>
    <UPagination
      v-if="pageCount > 1"
      :page="page"
      :total="total"
      :items-per-page="pageSize"
      :sibling-count="1"
      show-edges
      :show-controls="false"
      :to="to"
      :ui="{
        list: 'flex-wrap justify-center gap-2',
        item: 'min-h-11 min-w-11 justify-center',
        prev: 'min-h-11 min-w-11 justify-center',
        next: 'min-h-11 min-w-11 justify-center',
      }"
    >
      <template #prev>
        <UButton
          :to="page > 1 ? to(page - 1) : undefined"
          :disabled="page === 1"
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-left"
          aria-label="Previous page"
        />
      </template>
      <template #next>
        <UButton
          :to="page < pageCount ? to(page + 1) : undefined"
          :disabled="page === pageCount"
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-right"
          aria-label="Next page"
        />
      </template>
    </UPagination>
  </nav>
</template>
