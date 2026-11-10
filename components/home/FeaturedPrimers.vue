<script setup lang="ts">
const {
  primers,
  isLoading: isLoadingPrimers,
  isFetching: isFetchingPrimers,
  error: primersError,
  refetch: refetchPrimers,
} = useFeaturedPrimers(2);
const visiblePrimers = computed(() => primers.value.slice(0, 2));
</script>

<template>
  <section aria-label="Suggested primers">
    <ClientOnly>
      <!-- Primers row -->
      <template
        v-if="isLoadingPrimers || primersError || visiblePrimers.length > 0"
      >
        <h2 class="mb-4 text-center text-2xl font-bold md:text-3xl">
          Suggested Primer Reads
        </h2>

        <SearchError
          v-if="primersError"
          :error="primersError"
          title="Could not load suggested primers"
          description="Please try again."
          retry-label="Retry"
          :is-retrying="isFetchingPrimers"
          @retry="refetchPrimers()"
          class="mb-4"
        />

        <div
          v-if="isLoadingPrimers"
          class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4"
        >
          <CardListLinkSkeleton v-for="i in 2" :key="i" primer />
        </div>

        <div
          v-else-if="visiblePrimers.length > 0"
          class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4"
        >
          <FeaturedPrimerLink
            v-for="primer in visiblePrimers"
            :key="primer.decklist.id"
            :primer="primer"
          />
        </div>
      </template>

      <template #fallback>
        <h2 class="mb-4 text-center text-2xl font-bold md:text-3xl">
          Suggested Primer Reads
        </h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardListLinkSkeleton v-for="i in 2" :key="i" primer />
        </div>
      </template>
    </ClientOnly>
  </section>
</template>
