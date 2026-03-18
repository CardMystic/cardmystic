<template>
  <div class="flex flex-wrap justify-center gap-2 mb-2">
    <UButton v-for="filter in visibleFilters" :key="filter.key" size="sm"
      :variant="isActive(filter) ? 'solid' : 'outline'" :color="isActive(filter) ? 'primary' : 'neutral'"
      class="cursor-pointer rounded-pill" @click="toggle(filter)">
      <UIcon :name="filter.icon" class="w-3.5 h-3.5 mr-1" />
      {{ filter.label }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { CardSearchFilters } from '~/models/searchModel'

const props = defineProps<{
  show?: string[]
}>()

const modelValue = defineModel<Partial<CardSearchFilters> | undefined>({ required: true })

interface QuickFilter {
  key: string
  label: string
  icon: string
  apply: (filters: Partial<CardSearchFilters>) => Partial<CardSearchFilters>
  remove: (filters: Partial<CardSearchFilters>) => Partial<CardSearchFilters>
  check: (filters: Partial<CardSearchFilters>) => boolean
}

const quickFilters: QuickFilter[] = [
  {
    key: 'arena',
    label: 'Arena',
    icon: 'i-lucide-monitor',
    apply: (f) => ({ ...f, isArena: true, isMTGO: undefined, isPaper: undefined }),
    remove: (f) => ({ ...f, isArena: undefined }),
    check: (f) => !!f.isArena,
  },
  {
    key: 'mtgo',
    label: 'MTGO',
    icon: 'i-lucide-monitor',
    apply: (f) => ({ ...f, isMTGO: true, isArena: undefined, isPaper: undefined }),
    remove: (f) => ({ ...f, isMTGO: undefined }),
    check: (f) => !!f.isMTGO,
  },
  {
    key: 'paper',
    label: 'Paper',
    icon: 'i-lucide-scroll-text',
    apply: (f) => ({ ...f, isPaper: true, isArena: undefined, isMTGO: undefined }),
    remove: (f) => ({ ...f, isPaper: undefined }),
    check: (f) => !!f.isPaper,
  },
  {
    key: 'modern',
    label: 'Modern',
    icon: 'i-lucide-layers',
    apply: (f) => ({
      ...f,
      selectedCardFormats: [{ format: 'Modern' as const, status: 'Legal' as const }],
    }),
    remove: (f) => ({ ...f, selectedCardFormats: undefined }),
    check: (f) =>
      !!f.selectedCardFormats?.some(
        (fmt) => fmt.format === 'Modern' && fmt.status === 'Legal',
      ),
  },
  {
    key: 'commander',
    label: 'Commander',
    icon: 'i-lucide-crown',
    apply: (f) => ({
      ...f,
      selectedCardFormats: [{ format: 'Commander' as const, status: 'Legal' as const }],
    }),
    remove: (f) => ({ ...f, selectedCardFormats: undefined }),
    check: (f) =>
      !!f.selectedCardFormats?.some(
        (fmt) => fmt.format === 'Commander' && fmt.status === 'Legal',
      ),
  },
]

function isActive(filter: QuickFilter): boolean {
  return filter.check(modelValue.value ?? {})
}

const visibleFilters = computed(() =>
  props.show ? quickFilters.filter((f) => props.show!.includes(f.key)) : quickFilters,
)

function toggle(filter: QuickFilter) {
  if (isActive(filter)) {
    modelValue.value = filter.remove(modelValue.value ?? {})
  } else {
    modelValue.value = filter.apply(modelValue.value ?? {})
  }
}
</script>
