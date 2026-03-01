<template>
  <div class="top-queries-container mt-2 mb-2">
    <div class="top-queries-content">
      <div class="queries-header">
        <USkeleton class="h-6 w-6 mr-2" :ui="{ rounded: 'rounded-full' }" />
        <USkeleton class="h-6 w-48" />
      </div>

      <div class="queries-grid">
        <!-- Left column skeleton -->
        <div class="queries-column">
          <div v-for="index in 5" :key="`left-${index}`" class="query-item-skeleton">
            <USkeleton class="h-6 w-6" :ui="{ rounded: 'rounded-full' }" />
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-8 w-12" />
          </div>
        </div>

        <!-- Right column skeleton -->
        <div class="queries-column">
          <div v-for="index in 5" :key="`right-${index}`" class="query-item-skeleton">
            <USkeleton class="h-6 w-6" :ui="{ rounded: 'rounded-full' }" />
            <USkeleton class="h-4 flex-1" />
            <USkeleton class="h-8 w-12" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">
.top-queries-container
  width: 100%

.top-queries-content
  border-radius: 24px
  padding: 16px
  backdrop-filter: blur(20px) saturate(180%)
  border: 1px solid rgba(147, 114, 255, 0.3)
  position: relative

  @media (prefers-color-scheme: light)
    background: linear-gradient(135deg, rgba(147, 114, 255, 0.12), rgba(199, 170, 255, 0.08))
    box-shadow: 0 8px 32px rgba(147, 114, 255, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)

  @media (prefers-color-scheme: dark)
    background: linear-gradient(135deg, rgba(44, 44, 44, 0.25), rgba(66, 66, 66, 0.15))
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)

.queries-header
  display: flex
  align-items: center
  margin-bottom: 16px

.queries-grid
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 16px

  @media (max-width: 768px)
    grid-template-columns: 1fr
    gap: 8px

.queries-column
  display: flex
  flex-direction: column
  gap: 8px

.query-item-skeleton
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 16px
  border-radius: 12px
  background: linear-gradient(135deg, rgba(147, 114, 255, 0.05), rgba(147, 114, 255, 0.02))
  border: 1px solid rgba(147, 114, 255, 0.1)
</style>
