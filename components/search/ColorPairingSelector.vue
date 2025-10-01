<template>
  <div>
    <!-- Chip for selected pairing -->
    <div v-if="selectedPairingName.length > 0" class="mb-2 flex flex-wrap gap-2">
      <UButton class="cursor-pointer rounded-pill" size="sm" color="neutral" variant="outline" icon="i-lucide-circle-x"
        @click="clearPairing">
        <span class="flex items-center gap-1">
          <ManaIcon v-for="color in selectedPairingColors" :type="colorToSymbol(color)" size="16" />
          {{ selectedPairingName[0] }}
        </span>
      </UButton>
    </div>
    <UCollapsible class="flex flex-col gap-2">
      <UButton class="cursor-pointer" label="Select Color Identity" color="primary" variant="subtle"
        trailing-icon="i-lucide-chevron-down" icon="i-lucide-palette"
        :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }" block />
      <template #content>
        <UAccordion type="multiple" :unmount-on-hide="false" :items="accordionItems">
          <template v-for="group in groupedPairings" #[group.slot]>
            <div class="accordion-item flex flex-wrap gap-2">
              <UButton v-for="pairing in group.pairings" :key="pairing.name" variant="outline"
                :color="selectedPairingName.includes(pairing.name) ? 'primary' : 'neutral'"
                @click="togglePairing(pairing)" size="sm" class="mb-2">
                <span class="flex items-center gap-1">
                  <ManaIcon v-for="color in pairing.colors" :type="colorToSymbol(color)" size="16" />
                  {{ pairing.name }}
                </span>
              </UButton>
            </div>
          </template>
        </UAccordion>
      </template>
    </UCollapsible>
  </div>
</template>

<script setup lang="ts">
import ManaIcon from '~/components/ManaIcon.vue';
import { groupedPairings, pairings, type Pairing } from '@/utils/colorPairings';

const accordionItems = groupedPairings.map(group => ({
  label: group.label,
  slot: group.slot
}));

const props = defineProps<{
  colors: ("White" | "Blue" | "Black" | "Red" | "Green" | "Colorless")[];
}>();
const emit = defineEmits(['update:colors']);

// Compute pairing name from colors prop
const selectedPairingName = computed(() => {
  if (!props.colors || props.colors.length === 0) return [];
  const match = pairings.find(
    p =>
      p.colors.length === props.colors.length &&
      p.colors.every(c => props.colors.includes(c)) &&
      props.colors.every(c => p.colors.includes(c))
  );
  return match ? [match.name] : [];
});

const selectedPairingColors = computed(() => props.colors ?? []);

function togglePairing(pairing: Pairing) {
  if (selectedPairingName.value.includes(pairing.name)) {
    emit('update:colors', []);
  } else {
    emit('update:colors', pairing.colors);
  }
}

function clearPairing() {
  emit('update:colors', []);
}

// Helper for ManaIcon
function colorToSymbol(color: string) {
  switch (color) {
    case 'White': return 'W';
    case 'Blue': return 'U';
    case 'Black': return 'B';
    case 'Red': return 'R';
    case 'Green': return 'G';
    case 'Colorless': return 'C';
    default: return color;
  }
}
</script>

<style scoped>
.accordion-item {
  margin-bottom: 8px;
}
</style>
