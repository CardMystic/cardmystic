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
import ManaIcon from '~/components/manaIcon.vue';

// Use CardColor values for colors
type CardColor = "White" | "Blue" | "Black" | "Red" | "Green" | "Colorless";
type Pairing = { name: string; colors: CardColor[] };

const pairings: Pairing[] = [
  { name: 'White', colors: ['White'] },
  { name: 'Blue', colors: ['Blue'] },
  { name: 'Black', colors: ['Black'] },
  { name: 'Red', colors: ['Red'] },
  { name: 'Green', colors: ['Green'] },
  { name: 'Azorius', colors: ['White', 'Blue'] },
  { name: 'Dimir', colors: ['Blue', 'Black'] },
  { name: 'Rakdos', colors: ['Black', 'Red'] },
  { name: 'Gruul', colors: ['Red', 'Green'] },
  { name: 'Selesnya', colors: ['Green', 'White'] },
  { name: 'Orzhov', colors: ['White', 'Black'] },
  { name: 'Izzet', colors: ['Blue', 'Red'] },
  { name: 'Golgari', colors: ['Black', 'Green'] },
  { name: 'Boros', colors: ['Red', 'White'] },
  { name: 'Simic', colors: ['Green', 'Blue'] },
  { name: 'Esper', colors: ['White', 'Blue', 'Black'] },
  { name: 'Grixis', colors: ['Blue', 'Black', 'Red'] },
  { name: 'Jund', colors: ['Black', 'Red', 'Green'] },
  { name: 'Naya', colors: ['Red', 'Green', 'White'] },
  { name: 'Bant', colors: ['Green', 'White', 'Blue'] },
  { name: 'Abzan', colors: ['White', 'Black', 'Green'] },
  { name: 'Jeskai', colors: ['Blue', 'Red', 'White'] },
  { name: 'Sultai', colors: ['Black', 'Green', 'Blue'] },
  { name: 'Mardu', colors: ['Red', 'White', 'Black'] },
  { name: 'Temur', colors: ['Green', 'Blue', 'Red'] },
  { name: 'Yore-Tiller', colors: ['White', 'Blue', 'Black', 'Red'] },
  { name: 'Glint-Eye', colors: ['Blue', 'Black', 'Red', 'Green'] },
  { name: 'Dune-Brood', colors: ['Black', 'Red', 'Green', 'White'] },
  { name: 'Ink-Treader', colors: ['Red', 'Green', 'White', 'Blue'] },
  { name: 'Witch-Maw', colors: ['Green', 'White', 'Blue', 'Black'] },
  { name: 'Five-Color', colors: ['White', 'Blue', 'Black', 'Red', 'Green'] },
];

const groupedPairings = [
  { label: 'Mono-color', slot: 'mono', pairings: pairings.filter(p => p.colors.length === 1) },
  { label: 'Two-color', slot: 'two', pairings: pairings.filter(p => p.colors.length === 2) },
  { label: 'Three-color', slot: 'three', pairings: pairings.filter(p => p.colors.length === 3) },
  { label: 'Four-color', slot: 'four', pairings: pairings.filter(p => p.colors.length === 4) },
  { label: 'Five-color', slot: 'five', pairings: pairings.filter(p => p.colors.length === 5) },
];

const accordionItems = groupedPairings.map(group => ({
  label: group.label,
  slot: group.slot
}));

const props = defineProps<{
  modelValue: {
    name: string;
    colors: ("White" | "Blue" | "Black" | "Red" | "Green" | "Colorless")[];
  }
}>();
const emit = defineEmits(['update:modelValue']);

// For chip display
const selectedPairingName = computed(() => props.modelValue?.name ?? []);
const selectedPairingColors = computed(() => props.modelValue?.colors ?? []);

function togglePairing(pairing: Pairing) {
  if (selectedPairingName.value.includes(pairing.name)) {
    emit('update:modelValue', { name: [], colors: [] });
  } else {
    emit('update:modelValue', { name: [pairing.name], colors: pairing.colors });
  }
}

function clearPairing() {
  emit('update:modelValue', { name: [], colors: [] });
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
