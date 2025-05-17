<template>
  <div class="card-container" :class="{ expanded }" @click="toggleExpanded">
    <!-- Left side: image + score -->
    <v-col class="card-left" cols="3">
      <!-- FIXME:-->
      <v-img
        class="card-image"
        :src="card.properties.url"
        alt="Card Image"
      ></v-img>

      <v-progress-linear
        rounded
        color="black"
        :model-value="card.metadata.score * 100"
        :height="20"
        class="mt-2"
      >
        <template v-slot:default="{ value }">
          <p style="color: white; font-size: 14px">{{ Math.ceil(value) }}%</p>
        </template>
      </v-progress-linear>
    </v-col>

    <!-- Right side: details (conditionally shown) -->
    <transition name="fade">
      <v-col
        v-if="expanded"
        class="card-details d-flex flex-wrap align-center mb-2"
      >
        <div class="metadata-container">
          <h3 class="card-name">Bruenor Battlehammer <span>2{R}{W}</span></h3>
          <p class="card-type">Legendary Creature — Dwarf Warrior</p>

          <p class="card-text">
            Each creature you control gets +2/+0 for each Equipment attached to
            it.<br />
            {T}: Attach target Equipment you control to target creature you
            control. Activate only as a sorcery and only once each turn.
          </p>

          <p class="card-power-toughness">5/4</p>

          <p class="illustrator">Illustrated by Wayne Reynolds</p>

          <div class="legality-grid">
            <div class="legality-row">
              <span class="not-legal">NOT LEGAL</span> <span>Standard</span>
              <span class="not-legal">NOT LEGAL</span> <span>Pioneer</span>
              <span class="not-legal">NOT LEGAL</span> <span>Modern</span>
              <span class="not-legal">NOT LEGAL</span> <span>Legacy</span>
            </div>
            <div class="legality-row">
              <span class="not-legal">NOT LEGAL</span> <span>Vintage</span>
              <span class="not-legal">NOT LEGAL</span> <span>Commander</span>
              <span class="not-legal">NOT LEGAL</span> <span>Oathbreaker</span>
              <span class="not-legal">NOT LEGAL</span> <span>Alchemy</span>
            </div>
            <div class="legality-row">
              <span class="legal">LEGAL</span> <span>Historic</span>
              <span class="legal">LEGAL</span> <span>Brawl</span>
              <span class="not-legal">NOT LEGAL</span> <span>Timeless</span>
              <span class="not-legal">NOT LEGAL</span> <span>Pauper</span>
            </div>
            <div class="legality-row">
              <span class="not-legal">NOT LEGAL</span> <span>Penny</span>
            </div>
          </div>
        </div>
      </v-col>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
});

const expanded = ref(false);

function toggleExpanded() {
  expanded.value = !expanded.value;
}

function formatValue(val: any): string {
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
</script>

<style scoped>
.card-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background-color: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
  padding: 6px;
  margin: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
}
.card-container.expanded {
  min-width: 100%;
}

.card-left {
  flex-shrink: 0;
  width: 268px;
}

.card-image {
  border-radius: 12px;
  width: 100%;
}

.card-details {
  flex-grow: 1;
  margin-left: 24px;
  overflow-y: auto;
  transition: opacity 0.3s ease;
}

/* Optional fade-in transition for the details */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.metadata-container {
  font-family: Arial, sans-serif;
  width: 100%;
}

.card-name {
  font-size: 1.2rem;
  font-weight: bold;
}

.card-type,
.card-text,
.card-power-toughness,
.illustrator {
  margin: 0.3em 0;
}

.legality-grid {
  margin-top: 1em;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legality-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 6px;
  font-size: 0.9rem;
  align-items: center;
}

.legal {
  background-color: lightgreen;
  padding: 2px 6px;
  border-radius: 4px;
  color: black;
}

.not-legal {
  background-color: lightgray;
  padding: 2px 6px;
  border-radius: 4px;
  color: black;
}
</style>
