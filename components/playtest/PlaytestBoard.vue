<script setup lang="ts">
import type { AnalysisCard } from '~/utils/deckAnalysis';
import {
  cardName,
  cardType,
  manaColors,
  zoneOf,
  type PlaytestAction,
  type PlaytestZone,
  type Destination,
  type PlaytestDrag,
  type FieldPosition,
  type TokenDetails,
} from '~/utils/playtest';
import { useElementSize, useMediaQuery } from '@vueuse/core';
import { getCardImageUrl } from '~/utils/scryfall';

const props = defineProps<{
  entries: AnalysisCard[];
  format: string;
  name: string;
}>();
const open = defineModel<boolean>('open', { default: false });
const { state, definitions, start, act, undo, redo, canUndo, canRedo } =
  usePlaytest();
const selectedId = ref<string | null>(null),
  hoveredId = ref<string | null>(null);
const browser = ref<PlaytestZone | 'scry' | null>(null),
  libraryQuery = ref('');
const tokenOpen = ref(false),
  resetOpen = ref(false),
  helpOpen = ref(false),
  settingsOpen = ref(false),
  countersOpen = ref(false);
const amount = ref(1),
  cardSize = ref('180'),
  counterName = ref('+1/+1');
const scryAmount = ref(2),
  drawNextTurn = ref(true),
  showPreviews = ref(true),
  shortcuts = ref(true);
const canvas = ref<HTMLElement | null>(null);
const toolbar = ref<HTMLElement | null>(null);
const { height: toolbarHeight } = useElementSize(
  toolbar,
  { width: 0, height: 0 },
  { box: 'border-box' },
);
const zonesRow = ref<HTMLElement | null>(null);
const handRow = ref<HTMLElement | null>(null);
const mobileZones = [
  'battlefield',
  'hand',
  'library',
  'graveyard',
  'exile',
  'command',
] as const;
const isMobile = useMediaQuery('(max-width: 1023px)');
const mobileZone = ref<Exclude<PlaytestZone, 'battlefield'>>('hand');
const panelZone = computed(() =>
  isMobile.value && mobileZone.value !== 'library' ? mobileZone.value : 'hand',
);
const panelCards = computed(() => {
  const ids = state.value?.zones[panelZone.value] ?? [];
  return ['graveyard', 'exile'].includes(panelZone.value)
    ? [...ids].reverse()
    : ids;
});
async function showZone(zone: PlaytestZone) {
  if (zone !== 'battlefield') mobileZone.value = zone;
  await nextTick();
  const element = zone === 'battlefield' ? canvas.value : zonesRow.value;
  element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function scrollHand(direction: number) {
  handRow.value?.scrollBy({
    left: direction * (fieldCardWidth.value + 14) * 2,
    behavior: 'smooth',
  });
}
const { width: fieldWidth, height: fieldHeight } = useElementSize(canvas);
const fieldCardWidth = computed(() =>
  isMobile.value
    ? Math.min(100, Math.max(44, (fieldWidth.value || 390) / 4 - 14))
    : Number(cardSize.value),
);
const dragging = ref<PlaytestDrag | null>(null);
const error = ref(''),
  sessionFingerprint = ref('');
const fingerprint = computed(() =>
  JSON.stringify([
    props.format,
    props.entries.map((e) => [e.card.id, e.quantity, e.commander]),
  ]),
);
const changed = computed(
  () => !!state.value && sessionFingerprint.value !== fingerprint.value,
);
function newGame() {
  try {
    start(props.entries, props.format);
    sessionFingerprint.value = fingerprint.value;
    error.value = '';
    selectedId.value = null;
    browser.value = null;
    mobileZone.value = 'hand';
    resetOpen.value = false;
  } catch {
    error.value =
      'Could not start this deck. Playtesting supports up to 1,000 cards.';
  }
}
watch(
  open,
  (value) => {
    if (value && !state.value) newGame();
    if (!value) {
      selectedId.value = null;
      browser.value = null;
      tokenOpen.value =
        resetOpen.value =
        helpOpen.value =
        settingsOpen.value =
        countersOpen.value =
          false;
      dragging.value = null;
      hoveredId.value = null;
    }
  },
  { immediate: true },
);
const label = (id: string) =>
  state.value?.cards[id]
    ? cardName(state.value.cards[id], definitions.value)
    : 'Card';
const selected = computed(() =>
  selectedId.value ? state.value?.cards[selectedId.value] : undefined,
);
const selectedZone = computed(() =>
  state.value && selectedId.value
    ? zoneOf(state.value, selectedId.value)
    : undefined,
);
const selectedData = computed(() =>
  selected.value ? definitions.value[selected.value.definition] : undefined,
);
const selectedImage = computed(() =>
  selectedData.value
    ? getCardImageUrl(selectedData.value, !!selected.value?.face)
    : '',
);
const selectedText = computed(
  () =>
    selected.value?.token?.text ||
    selectedData.value?.card_faces?.[selected.value?.face ?? 0]?.oracle_text ||
    selectedData.value?.oracle_text ||
    '',
);
const previewCard = computed(() =>
  hoveredId.value ? state.value?.cards[hoveredId.value] : undefined,
);
const previewData = computed(() =>
  previewCard.value
    ? definitions.value[previewCard.value.definition]
    : undefined,
);
const previewImage = computed(() =>
  previewData.value
    ? getCardImageUrl(previewData.value, !!previewCard.value?.face)
    : '',
);
const zoneLabels: Record<PlaytestZone, string> = {
  library: 'Library',
  hand: 'Hand',
  battlefield: 'Battlefield',
  graveyard: 'Graveyard',
  exile: 'Exile',
  command: 'Commander',
};
const scryIds = ref<string[]>([]);
const browseIds = computed(() => {
  if (!state.value || !browser.value) return [];
  const ids =
    browser.value === 'scry'
      ? scryIds.value.filter((id) => state.value?.zones.library.includes(id))
      : state.value.zones[browser.value];
  if (browser.value === 'scry') return ids;
  const filtered = ids.filter((id) =>
    label(id).toLowerCase().includes(libraryQuery.value.toLowerCase()),
  );
  // Library search should not reveal the shuffled order. Scry explicitly does.
  return browser.value === 'library'
    ? [...filtered].sort((a, b) => label(a).localeCompare(label(b)))
    : ['graveyard', 'exile'].includes(browser.value)
      ? [...filtered].reverse()
      : filtered;
});
function browse(zone: PlaytestZone | 'scry') {
  libraryQuery.value = '';
  browser.value = zone;
  if (zone === 'scry')
    scryIds.value =
      state.value?.zones.library.slice(
        0,
        Math.max(1, Math.min(100, Number(scryAmount.value) || 1)),
      ) ?? [];
}
function dispatch(action: PlaytestAction) {
  act({
    ...action,
    ...(action.type === 'next-turn' ? { draw: drawNextTurn.value } : {}),
    layout: {
      columns: Math.max(
        1,
        Math.floor(fieldWidth.value / (fieldCardWidth.value + 14)),
      ),
      rows: Math.max(
        1,
        Math.floor(
          fieldHeight.value / ((fieldCardWidth.value * 680) / 488 + 14),
        ),
      ),
    },
  });
  if (selectedId.value && !state.value?.cards[selectedId.value])
    selectedId.value = null;
}
function moveSelected(to: Destination) {
  if (selectedId.value) dispatch({ type: 'move', id: selectedId.value, to });
  selectedId.value = null;
}
function positionAt(
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
): FieldPosition | undefined {
  const rect = canvas.value?.getBoundingClientRect();
  if (!rect) return undefined;
  return {
    x:
      (x - rect.left - offsetX - 7) /
      Math.max(1, rect.width - fieldCardWidth.value - 14),
    y:
      (y - rect.top - offsetY - 7) /
      Math.max(1, rect.height - (fieldCardWidth.value * 680) / 488 - 14),
  };
}
function drop(event: DragEvent, to: Destination) {
  const id = event.dataTransfer?.getData('application/x-cardmystic-playtest');
  if (!id || !state.value?.cards[id]) return;
  let offset = {
    x: fieldCardWidth.value / 2,
    y: (fieldCardWidth.value * 680) / 488 / 2,
  };
  try {
    const raw = JSON.parse(
      event.dataTransfer?.getData('application/x-cardmystic-playtest-offset') ||
        '{}',
    );
    if (Number.isFinite(raw.x) && Number.isFinite(raw.y)) {
      const scale = raw.width > 0 ? fieldCardWidth.value / raw.width : 1;
      offset = { x: raw.x * scale, y: raw.y * scale };
    }
  } catch {
    /* External drags have no card offset. */
  }
  dispatch({
    type: 'move',
    id,
    to,
    position:
      to === 'battlefield'
        ? positionAt(event.clientX, event.clientY, offset.x, offset.y)
        : undefined,
  });
}
provide('playtestDrag', (event: PlaytestDrag) => {
  if (!open.value || browser.value || selectedId.value) {
    dragging.value = null;
    return;
  }
  hoveredId.value = null;
  if (event.phase === 'move') {
    dragging.value = event;
    return;
  }
  dragging.value = null;
  if (event.phase !== 'end') return;
  const destination = document
    .elementFromPoint(event.x, event.y)
    ?.closest<HTMLElement>('[data-playtest-zone]')?.dataset.playtestZone as
    PlaytestZone | undefined;
  if (!destination) return;
  dispatch({
    type: 'move',
    id: event.id,
    to: destination,
    position:
      destination === 'battlefield'
        ? positionAt(
            event.x,
            event.y,
            (event.offsetX * fieldCardWidth.value) / event.width,
            (event.offsetY * fieldCardWidth.value) / event.width,
          )
        : undefined,
  });
});
function fieldStyle(position: FieldPosition) {
  const width = fieldCardWidth.value + 14,
    height = (fieldCardWidth.value * 680) / 488 + 14;
  return {
    left: `calc(${position.x * 100}% - ${position.x * width}px)`,
    top: `calc(${position.y * 100}% - ${position.y * height}px)`,
  };
}
const ghostCard = computed(() =>
  dragging.value ? state.value?.cards[dragging.value.id] : undefined,
);
const ghostImage = computed(() =>
  ghostCard.value &&
  !ghostCard.value.faceDown &&
  definitions.value[ghostCard.value.definition]
    ? getCardImageUrl(
        definitions.value[ghostCard.value.definition],
        !!ghostCard.value.face,
        'small',
      )
    : '',
);
const pileCards = (zone: 'graveyard' | 'exile' | 'command') =>
  zone === 'command'
    ? (state.value?.zones.command ?? [])
    : (state.value?.zones[zone].slice(-1) ?? []);
watch(scryAmount, () => {
  if (browser.value === 'scry') browse('scry');
});
const libraryActions = computed(() => [
  {
    label: 'Scry',
    icon: 'i-lucide-eye',
    disabled: !state.value?.zones.library.length,
    onSelect: () => browse('scry'),
  },
  {
    label: `Mill ${Number(amount.value) || 1}`,
    icon: 'i-lucide-arrow-down',
    disabled: !state.value?.zones.library.length,
    onSelect: () =>
      dispatch({ type: 'mill', count: Number(amount.value) || 1 }),
  },
  {
    label: 'Shuffle',
    icon: 'i-lucide-shuffle',
    disabled: !state.value?.zones.library.length,
    onSelect: () => dispatch({ type: 'shuffle' }),
  },
  {
    label: 'Search',
    icon: 'i-lucide-search',
    disabled: !state.value?.zones.library.length,
    onSelect: () => browse('library'),
  },
]);
const moveOptions: { value: Destination; label: string }[] = [
  { value: 'battlefield', label: 'Battlefield' },
  { value: 'hand', label: 'Hand' },
  { value: 'graveyard', label: 'Graveyard' },
  { value: 'exile', label: 'Exile' },
  { value: 'library', label: 'Top of library' },
  { value: 'library-bottom', label: 'Bottom of library' },
  { value: 'command', label: 'Command zone' },
];
const tokenPresets: TokenDetails[] = [
  {
    name: 'Treasure',
    type: 'Artifact — Treasure',
    power: '',
    toughness: '',
    text: 'Tap, sacrifice: add one mana of any color.',
  },
  {
    name: 'Clue',
    type: 'Artifact — Clue',
    power: '',
    toughness: '',
    text: 'Pay 2 and sacrifice: draw a card.',
  },
  {
    name: 'Food',
    type: 'Artifact — Food',
    power: '',
    toughness: '',
    text: 'Pay 2, tap, sacrifice: gain 3 life.',
  },
  {
    name: 'Soldier',
    type: 'Creature — Soldier',
    power: '1',
    toughness: '1',
    text: '',
  },
  {
    name: 'Zombie',
    type: 'Creature — Zombie',
    power: '2',
    toughness: '2',
    text: '',
  },
  {
    name: 'Spirit',
    type: 'Creature — Spirit',
    power: '1',
    toughness: '1',
    text: 'Flying',
  },
  {
    name: 'Goblin',
    type: 'Creature — Goblin',
    power: '1',
    toughness: '1',
    text: '',
  },
];
const token = ref<TokenDetails>({ ...tokenPresets[0] }),
  tokenCount = ref(1);
const relatedTokens = computed(() => {
  const tokens = new Map<string, TokenDetails>();
  for (const card of Object.values(definitions.value))
    for (const part of card.all_parts ?? []) {
      if (part.component === 'token')
        tokens.set(part.name, {
          name: part.name,
          type: part.type_line,
          power: '',
          toughness: '',
          text: '',
        });
    }
  return [...tokens.values()];
});
function createTokens() {
  dispatch({
    type: 'token',
    token: { ...token.value },
    count: Number(tokenCount.value) || 1,
  });
  tokenOpen.value = false;
}
function keydown(event: KeyboardEvent) {
  if (
    !open.value ||
    !shortcuts.value ||
    !state.value ||
    event.defaultPrevented ||
    event.repeat ||
    event.altKey
  )
    return;
  const target = event.target as HTMLElement;
  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], [role="menu"], [role="menuitem"]',
    )
  )
    return;
  if (
    selectedId.value ||
    browser.value ||
    tokenOpen.value ||
    helpOpen.value ||
    resetOpen.value ||
    settingsOpen.value ||
    countersOpen.value
  )
    return;
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
    return;
  }
  if (event.metaKey || event.ctrlKey) return;
  const handlers: Record<string, () => void> = {
    d: () => dispatch({ type: 'draw', count: 1 }),
    u: () => dispatch({ type: 'untap' }),
    n: () => dispatch({ type: 'next-turn' }),
    s: () => dispatch({ type: 'shuffle' }),
    m: () => dispatch({ type: 'mulligan' }),
    t: () => {
      tokenOpen.value = true;
    },
    '?': () => {
      helpOpen.value = true;
    },
  };
  if (handlers[key]) {
    event.preventDefault();
    handlers[key]();
  }
}
onMounted(() => window.addEventListener('keydown', keydown));
onBeforeUnmount(() => window.removeEventListener('keydown', keydown));
</script>

<template>
  <UModal
    v-model:open="open"
    fullscreen
    title="Playtest"
    :description="name"
    :ui="{
      body: 'p-0 sm:p-0 min-h-0',
      header: 'py-2 min-h-14',
      content: 'playtest-modal',
    }"
  >
    <template #body>
      <p v-if="error" role="alert" class="p-4 text-error">{{ error }}</p>
      <div
        v-if="state"
        class="playtest-board flex min-h-full min-w-0 flex-col"
        :style="{
          '--playtest-card-width': `${fieldCardWidth}px`,
          '--playtest-card-height': `${(fieldCardWidth * 680) / 488}px`,
          '--playtest-toolbar-height': `${toolbarHeight}px`,
        }"
      >
        <div
          ref="toolbar"
          class="playtest-toolbar sticky top-0 z-20 grid grid-cols-[1fr_auto] gap-2 border-b border-default bg-default/95 p-2 backdrop-blur min-[375px]:grid-cols-[1fr_auto_1fr]"
        >
          <div
            class="flex items-center gap-1"
            role="group"
            aria-label="Life total"
          >
            <span class="hidden text-sm lg:inline">Life</span>
            <UButton
              aria-label="Lose 1 life"
              icon="i-lucide-minus"
              color="neutral"
              variant="ghost"
              @click="dispatch({ type: 'player', field: 'life', delta: -1 })"
            />
            <output
              data-testid="playtest-life"
              class="min-w-8 text-center text-xl font-semibold"
              >{{ state.life }}</output
            >
            <UButton
              aria-label="Gain 1 life"
              icon="i-lucide-plus"
              color="neutral"
              variant="ghost"
              @click="dispatch({ type: 'player', field: 'life', delta: 1 })"
            />
          </div>
          <div
            class="order-3 col-span-2 flex items-center justify-center gap-2 min-[375px]:order-2 min-[375px]:col-span-1"
            aria-label="Turn controls"
          >
            <UTooltip
              :text="
                state.landDrops
                  ? `${state.landDrops} land${state.landDrops === 1 ? '' : 's'} played this turn`
                  : 'No land played this turn'
              "
            >
              <span
                role="img"
                :aria-label="
                  state.landDrops
                    ? 'Land played this turn'
                    : 'No land played this turn'
                "
                :class="state.landDrops ? 'text-error' : 'text-success'"
                class="inline-flex shrink-0"
                tabindex="0"
                ><UIcon name="i-lucide-mountain" class="size-5"
              /></span>
            </UTooltip>
            <span class="font-semibold tabular-nums"
              >Turn {{ state.turn }}</span
            >
            <UButton
              aria-label="Next turn"
              icon="i-lucide-arrow-right"
              variant="ghost"
              @click="dispatch({ type: 'next-turn' })"
              ><span class="hidden lg:inline">Next turn</span></UButton
            >
          </div>
          <div
            class="order-2 flex items-center justify-end gap-1 min-[375px]:order-3"
          >
            <UButton
              aria-label="Undo"
              class="hidden lg:inline-flex"
              icon="i-lucide-undo-2"
              color="neutral"
              variant="ghost"
              :disabled="!canUndo"
              @click="undo"
            />
            <UButton
              aria-label="Redo"
              class="hidden lg:inline-flex"
              icon="i-lucide-redo-2"
              color="neutral"
              variant="ghost"
              :disabled="!canRedo"
              @click="redo"
            />
            <UPopover v-model:open="settingsOpen" :content="{ align: 'end' }">
              <UButton
                aria-label="Playtest settings"
                icon="i-lucide-settings"
                color="neutral"
                variant="ghost"
              />
              <template #content
                ><div class="w-72 space-y-4 p-4">
                  <div class="flex gap-2 lg:hidden">
                    <UButton
                      label="Undo"
                      icon="i-lucide-undo-2"
                      color="neutral"
                      variant="ghost"
                      :disabled="!canUndo"
                      @click="undo"
                    />
                    <UButton
                      label="Redo"
                      icon="i-lucide-redo-2"
                      color="neutral"
                      variant="ghost"
                      :disabled="!canRedo"
                      @click="redo"
                    />
                  </div>
                  <UFormField v-if="!isMobile" label="Card size"
                    ><USelect
                      v-model="cardSize"
                      :items="[
                        { label: 'Small', value: '140' },
                        { label: 'Medium', value: '180' },
                        { label: 'Large', value: '220' },
                      ]"
                      aria-label="Playtest card size"
                      class="w-full"
                  /></UFormField>
                  <UCheckbox
                    v-model="drawNextTurn"
                    label="Draw a card on next turn"
                    :ui="{ label: 'ml-2' }"
                  />
                  <UCheckbox
                    v-model="showPreviews"
                    label="Show hover previews"
                    :ui="{ label: 'ml-2' }"
                  />
                  <UCheckbox
                    v-model="shortcuts"
                    label="Keyboard shortcuts"
                    :ui="{ label: 'ml-2' }"
                  />
                  <div class="flex gap-2">
                    <UButton
                      label="Restart"
                      variant="outline"
                      color="neutral"
                      @click="
                        settingsOpen = false;
                        resetOpen = true;
                      "
                    /><UButton
                      label="Help"
                      aria-label="Playtest help"
                      variant="ghost"
                      color="neutral"
                      @click="
                        settingsOpen = false;
                        helpOpen = true;
                      "
                    />
                  </div></div
              ></template>
            </UPopover>
          </div>
          <nav
            aria-label="Playtest zones"
            class="order-4 col-span-2 grid grid-cols-6 gap-1 border-t border-default pt-1 min-[375px]:col-span-3 lg:hidden"
          >
            <button
              v-for="zone in mobileZones"
              :key="zone"
              type="button"
              class="min-h-11 min-w-0 rounded-md text-xs hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary"
              :class="{ 'bg-primary/15 text-primary': zone === mobileZone }"
              :aria-pressed="zone === mobileZone"
              :aria-label="`Show ${zoneLabels[zone]}`"
              :data-playtest-zone="zone"
              @click="showZone(zone)"
              @dragover.prevent
              @drop.prevent="drop($event, zone)"
            >
              <span class="block">{{
                zone === 'battlefield'
                  ? 'Board'
                  : zone === 'command'
                    ? 'Cmdr'
                    : zoneLabels[zone]
              }}</span>
              <span class="block font-semibold tabular-nums">{{
                state.zones[zone].length
              }}</span>
            </button>
          </nav>
        </div>
        <p
          v-if="changed"
          class="m-3 rounded border border-warning/40 bg-warning/10 p-3 text-sm"
        >
          The saved deck changed. Restart to use its latest cards; this practice
          game is still intact.
        </p>
        <section
          aria-label="Battlefield"
          class="relative min-w-0 border-b border-default bg-primary/[0.03]"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
          >
            <h3 class="font-semibold">
              Battlefield
              <span class="text-muted">{{
                state.zones.battlefield.length
              }}</span>
            </h3>
            <div class="flex flex-wrap gap-1">
              <UButton
                label="Untap all"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="dispatch({ type: 'untap' })"
              />
              <UButton
                label="Add token"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="tokenOpen = true"
              />
              <UButton
                label="Counters"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="countersOpen = true"
              />
            </div>
          </div>
          <div
            ref="canvas"
            data-testid="playtest-battlefield"
            data-playtest-zone="battlefield"
            class="playtest-field relative"
            @dragover.prevent
            @drop.prevent="drop($event, 'battlefield')"
          >
            <p
              v-if="!state.zones.battlefield.length"
              class="pointer-events-none absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted"
            >
              Drag cards onto the battlefield. Tap a card for actions.
            </p>
            <div
              v-for="id in state.zones.battlefield"
              :key="id"
              class="absolute"
              :style="fieldStyle(state.cards[id].position)"
            >
              <PlaytestCard
                :instance="state.cards[id]"
                :card="definitions[state.cards[id].definition]"
                :name="label(id)"
                @options="selectedId = id"
                @hover="hoveredId = $event"
              />
            </div>
          </div>
          <img
            v-if="
              showPreviews &&
              previewImage &&
              !previewCard?.faceDown &&
              !dragging &&
              !selected
            "
            :src="previewImage"
            :alt="hoveredId ? label(hoveredId) : ''"
            width="180"
            height="251"
            class="pointer-events-none absolute right-3 top-12 z-10 hidden w-44 rounded-lg shadow-xl xl:block"
          />
        </section>
        <div class="min-w-0 overflow-x-auto p-3">
          <div ref="zonesRow" class="playtest-zones">
            <section
              v-show="!isMobile || mobileZone !== 'library'"
              :aria-label="zoneLabels[panelZone]"
              :data-playtest-zone="panelZone"
              class="hand-zone min-w-0 rounded-lg border border-primary/30 bg-primary/5 p-2"
              @dragover.prevent
              @drop.prevent="drop($event, panelZone)"
            >
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold whitespace-nowrap">
                  {{ zoneLabels[panelZone] }}
                  <span class="text-muted">{{ panelCards.length }}</span>
                </h3>
                <template v-if="panelZone === 'hand'">
                  <UButton
                    label="Draw"
                    icon="i-lucide-plus"
                    size="sm"
                    variant="ghost"
                    :disabled="!state.zones.library.length"
                    @click="
                      dispatch({ type: 'draw', count: Number(amount) || 1 })
                    "
                  />
                  <UInput
                    v-model="amount"
                    type="number"
                    min="1"
                    max="100"
                    aria-label="Number of cards to draw"
                    class="w-14 sm:w-16"
                  />
                  <UButton
                    aria-label="Redraw hand"
                    icon="i-lucide-refresh-cw"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="dispatch({ type: 'mulligan' })"
                  />
                </template>
                <div class="ml-auto hidden gap-1 lg:flex">
                  <UButton
                    aria-label="Previous hand cards"
                    icon="i-lucide-chevron-left"
                    color="neutral"
                    variant="ghost"
                    class="min-h-11 min-w-11 justify-center"
                    @click="scrollHand(-1)"
                  />
                  <UButton
                    aria-label="Next hand cards"
                    icon="i-lucide-chevron-right"
                    color="neutral"
                    variant="ghost"
                    class="min-h-11 min-w-11 justify-center"
                    @click="scrollHand(1)"
                  />
                </div>
              </div>
              <div
                ref="handRow"
                class="zone-cards flex min-h-36 overflow-x-auto py-1"
                :style="{
                  '--zone-columns': Math.max(1, Math.min(7, panelCards.length)),
                }"
                data-testid="playtest-hand-cards"
              >
                <PlaytestCard
                  v-for="id in panelCards"
                  :key="id"
                  :instance="state.cards[id]"
                  :card="definitions[state.cards[id].definition]"
                  :name="label(id)"
                  @options="selectedId = id"
                  @hover="hoveredId = $event"
                />
                <p
                  v-if="!panelCards.length"
                  class="self-center p-3 text-sm text-muted"
                >
                  {{
                    panelZone === 'hand'
                      ? 'Your hand is empty.'
                      : `No cards in ${zoneLabels[panelZone].toLowerCase()}.`
                  }}
                </p>
              </div>
            </section>
            <section
              v-for="zone in [
                'library',
                'graveyard',
                'exile',
                'command',
              ] as const"
              :key="zone"
              :aria-label="zoneLabels[zone]"
              :data-playtest-zone="zone"
              class="pile-zone rounded-lg border border-default bg-elevated/30 p-2"
              :class="{
                'mobile-library':
                  zone === 'library' && mobileZone === 'library',
              }"
              @dragover.prevent
              @drop.prevent="drop($event, zone)"
            >
              <div
                v-if="zone === 'library'"
                class="flex min-h-9 items-center justify-between gap-1"
              >
                <h3 class="text-sm font-semibold">
                  Library
                  <span class="text-muted">{{
                    state.zones.library.length
                  }}</span>
                </h3>
                <UDropdownMenu
                  :items="libraryActions"
                  :content="{ align: 'end' }"
                >
                  <UButton
                    aria-label="Library actions"
                    icon="i-lucide-ellipsis"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                  />
                </UDropdownMenu>
              </div>
              <button
                v-else
                type="button"
                class="flex min-h-9 w-full items-center justify-between gap-2 text-sm font-semibold"
                :aria-label="`Browse ${zoneLabels[zone]} (${state.zones[zone].length})`"
                @click="browse(zone)"
              >
                <span>{{ zoneLabels[zone] }}</span
                ><span>{{ state.zones[zone].length }}</span>
              </button>
              <template v-if="zone === 'library'">
                <button
                  type="button"
                  aria-label="Draw top card"
                  class="pile-placeholder bg-primary/10"
                  :disabled="!state.zones.library.length"
                  @click="dispatch({ type: 'draw', count: 1 })"
                >
                  <UIcon
                    name="i-mdi-cards-outline"
                    class="size-8 text-primary"
                  />
                </button>
              </template>
              <template v-else>
                <PlaytestCard
                  v-for="id in pileCards(zone)"
                  :key="id"
                  :instance="state.cards[id]"
                  :card="definitions[state.cards[id].definition]"
                  :name="label(id)"
                  @options="selectedId = id"
                  @hover="hoveredId = $event"
                />
                <div
                  v-if="!state.zones[zone].length"
                  class="pile-placeholder bg-muted/30"
                  role="img"
                  :aria-label="`Empty ${zoneLabels[zone].toLowerCase()}`"
                />
              </template>
            </section>
          </div>
        </div>
        <div class="px-3 pb-3 text-sm">
          <p role="status" class="min-h-5">
            {{ state.log[state.log.length - 1] }}
          </p>
          <details class="mt-2">
            <summary class="cursor-pointer text-muted">Action history</summary>
            <ol class="mt-2 space-y-1 text-xs">
              <li
                v-for="(entry, index) in [...state.log].reverse()"
                :key="index"
              >
                {{ entry }}
              </li>
            </ol>
          </details>
        </div>
        <p class="mt-auto border-t border-default p-3 text-xs text-muted">
          Solo practice. You handle mana costs, abilities, combat and triggers.
          This game does not edit your saved deck.
        </p>
      </div>
    </template>
  </UModal>
  <Teleport to="body"
    ><div
      v-if="dragging"
      class="pointer-events-none fixed z-[200] opacity-80"
      :style="{
        left: `${dragging.x - dragging.offsetX}px`,
        top: `${dragging.y - dragging.offsetY}px`,
        width: `${dragging.width}px`,
      }"
    >
      <img
        v-if="ghostImage"
        :src="ghostImage"
        alt=""
        class="w-full rounded-lg"
      />
      <div
        v-else
        class="aspect-[488/680] rounded-lg border bg-elevated p-2 text-sm"
      >
        {{ ghostCard?.faceDown ? 'Face down' : label(dragging.id) }}
      </div>
    </div></Teleport
  >
  <UModal v-model:open="countersOpen" title="Mana and player counters"
    ><template #body>
      <div class="mt-2 space-y-1">
        <div
          v-for="color in manaColors"
          :key="color"
          class="flex items-center justify-between"
        >
          <span class="w-6 font-semibold">{{ color }}</span
          ><UButton
            :aria-label="`Remove ${color} mana`"
            icon="i-lucide-minus"
            variant="ghost"
            color="neutral"
            @click="dispatch({ type: 'mana', color, delta: -1 })"
          /><output>{{ state.mana[color] }}</output
          ><UButton
            :aria-label="`Add ${color} mana`"
            icon="i-lucide-plus"
            variant="ghost"
            color="neutral"
            @click="dispatch({ type: 'mana', color, delta: 1 })"
          />
        </div>
        <UButton
          label="Clear mana"
          variant="ghost"
          @click="dispatch({ type: 'clear-mana' })"
        />
        <div
          v-for="field in ['poison', 'energy'] as const"
          :key="field"
          class="flex items-center justify-between"
        >
          <span class="capitalize">{{ field }}</span
          ><UButton
            :aria-label="`Remove ${field}`"
            icon="i-lucide-minus"
            variant="ghost"
            @click="dispatch({ type: 'player', field, delta: -1 })"
          /><output>{{ state[field] }}</output
          ><UButton
            :aria-label="`Add ${field}`"
            icon="i-lucide-plus"
            variant="ghost"
            @click="dispatch({ type: 'player', field, delta: 1 })"
          />
        </div>
      </div>
      <div class="mt-4 flex gap-2">
        <UButton
          label="Flip coin"
          variant="outline"
          @click="dispatch({ type: 'roll', sides: 2 })"
        /><UButton
          label="Roll d20"
          variant="outline"
          @click="dispatch({ type: 'roll', sides: 20 })"
        /></div></template
  ></UModal>

  <UModal
    :open="!!browser"
    :title="
      browser === 'scry'
        ? 'Scry / surveil'
        : browser
          ? zoneLabels[browser]
          : 'Cards'
    "
    :description="
      browser === 'scry'
        ? 'Top cards, in library order. Put cards on top, on the bottom, or in the graveyard.'
        : 'Inspect cards and move them between zones.'
    "
    :ui="{ content: 'sm:max-w-4xl' }"
    @update:open="!$event && (browser = null)"
  >
    <template #body>
      <UFormField v-if="browser === 'scry'" label="Cards to scry" class="mb-4"
        ><UInputNumber
          v-model="scryAmount"
          :min="1"
          :max="Math.min(100, state?.zones.library.length || 1)"
          aria-label="Cards to scry"
          class="w-36"
      /></UFormField>
      <UInput
        v-else
        v-model="libraryQuery"
        aria-label="Find card in zone"
        placeholder="Find a card…"
        class="mb-4 w-full"
      />
      <p v-if="browser === 'library'" class="mb-3 text-sm text-muted">
        Cards are listed alphabetically. Shuffle after searching if the card
        tells you to.
      </p>
      <div
        v-if="state"
        class="flex flex-wrap"
        style="--playtest-card-width: clamp(140px, 38vw, 180px)"
      >
        <div v-for="(id, index) in browseIds" :key="id">
          <p v-if="browser === 'scry'" class="text-center text-xs">
            {{ index === 0 ? 'Top' : index + 1 }}
          </p>
          <PlaytestCard
            :instance="state.cards[id]"
            :card="definitions[state.cards[id].definition]"
            :name="label(id)"
            @options="selectedId = id"
          />
          <div
            v-if="browser === 'scry'"
            class="mx-1 flex max-w-28 flex-wrap gap-1"
          >
            <UButton
              label="Top"
              size="xs"
              variant="soft"
              @click="
                dispatch({ type: 'move', id, to: 'library' });
                scryIds = scryIds.filter((card) => card !== id);
              "
            />
            <UButton
              label="Bottom"
              size="xs"
              variant="soft"
              @click="
                dispatch({ type: 'move', id, to: 'library-bottom' });
                scryIds = scryIds.filter((card) => card !== id);
              "
            />
            <UButton
              label="Graveyard"
              size="xs"
              variant="ghost"
              @click="
                dispatch({ type: 'move', id, to: 'graveyard' });
                scryIds = scryIds.filter((card) => card !== id);
              "
            />
          </div>
        </div>
      </div>
      <p v-if="!browseIds.length" class="py-4 text-muted">No cards here.</p>
    </template>
    <template #footer
      ><UButton
        v-if="browser === 'library'"
        label="Shuffle and close"
        @click="
          dispatch({ type: 'shuffle' });
          browser = null;
        " /><UButton
        label="Done"
        color="neutral"
        variant="outline"
        @click="browser = null"
    /></template>
  </UModal>

  <UModal
    :open="!!selected"
    :title="selectedId ? label(selectedId) : 'Card options'"
    description="Actions apply only to this practice game."
    :ui="{ content: 'sm:max-w-2xl' }"
    @update:open="!$event && (selectedId = null)"
  >
    <template #body>
      <div v-if="selected && state" class="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div>
          <img
            v-if="selectedImage"
            :src="selectedImage"
            :alt="selectedId ? label(selectedId) : ''"
            width="488"
            height="680"
            class="mx-auto w-36 rounded-lg sm:w-full"
          />
          <p class="mt-2 whitespace-pre-line text-sm">{{ selectedText }}</p>
          <p v-if="selected.commander" class="mt-2 text-sm">
            Cast from command zone {{ selected.casts }} time(s). Next commander
            tax: {{ selected.casts * 2 }}.
          </p>
        </div>
        <div class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <UButton
              v-if="selectedZone === 'battlefield'"
              :label="selected.tapped ? 'Untap' : 'Tap'"
              @click="dispatch({ type: 'tap', id: selected.id })"
            />
            <UButton
              v-else-if="selectedZone !== 'library'"
              label="Play card"
              @click="
                dispatch({ type: 'play', id: selected.id });
                selectedId = null;
              "
            />
            <UButton
              v-if="(selectedData?.card_faces?.length ?? 0) > 1"
              label="Other face"
              variant="outline"
              @click="dispatch({ type: 'flip', id: selected.id })"
            />
            <UButton
              :label="selected.faceDown ? 'Turn face up' : 'Turn face down'"
              variant="outline"
              @click="dispatch({ type: 'face-down', id: selected.id })"
            />
            <UButton
              label="Create token copy"
              variant="outline"
              @click="dispatch({ type: 'copy', id: selected.id })"
            />
          </div>
          <div>
            <h4 class="mb-2 text-sm font-semibold">Move to</h4>
            <div class="grid grid-cols-2 gap-2">
              <UButton
                v-for="option in moveOptions.filter(
                  (item) =>
                    (item.value !== 'command' || selected?.commander) &&
                    (item.value !== selectedZone || item.value === 'library'),
                )"
                :key="option.value"
                :label="option.label"
                variant="soft"
                color="neutral"
                @click="moveSelected(option.value)"
              />
            </div>
          </div>
          <p v-if="selected.token" class="text-xs text-muted">
            Tokens disappear when they leave play.
          </p>
          <div>
            <h4 class="mb-2 text-sm font-semibold">Counters</h4>
            <div
              v-for="(count, name) in selected.counters"
              :key="name"
              class="flex items-center gap-2 text-sm"
            >
              <span class="mr-auto">{{ name }}: {{ count }}</span
              ><UButton
                :aria-label="`Remove ${name} counter`"
                icon="i-lucide-minus"
                variant="ghost"
                @click="
                  dispatch({
                    type: 'counter',
                    id: selected.id,
                    name: String(name),
                    delta: -1,
                  })
                "
              /><UButton
                :aria-label="`Add ${name} counter`"
                icon="i-lucide-plus"
                variant="ghost"
                @click="
                  dispatch({
                    type: 'counter',
                    id: selected.id,
                    name: String(name),
                    delta: 1,
                  })
                "
              />
            </div>
            <div class="flex gap-2">
              <UInput
                v-model="counterName"
                aria-label="Counter name"
                placeholder="+1/+1, loyalty…"
                class="min-w-0 flex-1"
                maxlength="40"
              /><UButton
                label="Add counter"
                :disabled="!counterName.trim()"
                @click="
                  dispatch({
                    type: 'counter',
                    id: selected.id,
                    name: counterName,
                    delta: 1,
                  })
                "
              />
            </div>
          </div>

          <p class="text-xs text-muted">
            {{ cardType(selected, definitions) }}
          </p>
        </div>
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="tokenOpen"
    title="Add tokens"
    description="Choose a token or create your own."
  >
    <template #body
      ><form
        id="playtest-token-form"
        class="space-y-3"
        @submit.prevent="createTokens"
      >
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="preset in [
              ...tokenPresets,
              ...relatedTokens.filter(
                (item) =>
                  !tokenPresets.some((preset) => preset.name === item.name),
              ),
            ]"
            :key="preset.name"
            :label="preset.name"
            size="sm"
            variant="soft"
            @click="token = { ...preset }"
          />
        </div>
        <label class="block text-sm"
          >Name<UInput
            v-model="token.name"
            aria-label="Token name"
            required
            maxlength="100"
            class="mt-1 w-full"
        /></label>
        <label class="block text-sm"
          >Type<UInput
            v-model="token.type"
            aria-label="Token type"
            maxlength="100"
            class="mt-1 w-full"
        /></label>
        <div class="grid grid-cols-3 gap-2">
          <label class="text-sm"
            >Power<UInput
              v-model="token.power"
              aria-label="Token power"
              maxlength="8"
              class="mt-1 w-full" /></label
          ><label class="text-sm"
            >Toughness<UInput
              v-model="token.toughness"
              aria-label="Token toughness"
              maxlength="8"
              class="mt-1 w-full" /></label
          ><label class="text-sm"
            >Quantity<UInput
              v-model="tokenCount"
              aria-label="Token quantity"
              type="number"
              min="1"
              max="100"
              class="mt-1 w-full"
          /></label>
        </div>
        <label class="block text-sm"
          >Abilities<UTextarea
            v-model="token.text"
            aria-label="Token abilities"
            maxlength="1000"
            class="mt-1 w-full"
        /></label></form
    ></template>
    <template #footer
      ><UButton
        type="submit"
        form="playtest-token-form"
        label="Create tokens"
        :disabled="!token.name.trim()"
    /></template>
  </UModal>
  <UModal
    v-model:open="resetOpen"
    title="Restart playtest?"
    description="This clears the practice game and draws a new hand from the latest saved deck."
    ><template #footer
      ><UButton label="Restart game" @click="newGame" /><UButton
        label="Cancel"
        color="neutral"
        variant="outline"
        @click="resetOpen = false" /></template
  ></UModal>
  <UModal
    v-model:open="helpOpen"
    title="Playtest controls"
    description="A manual solo playtester; card rules are up to you."
    ><template #body
      ><ul class="space-y-3 text-sm">
        <li>
          Tap or click a card to open its actions, including tap and untap. All
          cards play directly onto the battlefield; move spells to the graveyard
          when finished.
        </li>
        <li>
          Hold a card on mobile or right-click on desktop to move it, change
          faces, add counters, or copy it.
        </li>
        <li>
          Drag cards anywhere on the battlefield and between zones, on desktop
          or touch. Dragging out of the graveyard or exile takes its top card.
          Use the card modal for keyboard moves.
        </li>
        <li>
          Next turn untaps everything, clears mana, and optionally draws a card.
          Card size, hover previews and automatic draws are under Settings.
        </li>
        <li>
          Set the number next to Draw to draw or mill that many cards. Scry has
          its own count selector, and also supports putting cards in the
          graveyard for surveil.
        </li>
        <li>
          Your opening hand is ready to play. Redraw hand shuffles it back and
          draws seven; put any mulligan cards on the bottom manually.
        </li>
        <li>
          D: draw · U: untap all · N: next turn · M: mulligan · S: shuffle · T:
          add token · ?: help · Ctrl/⌘ Z: undo · Ctrl/⌘ Shift Z: redo. Shortcuts
          pause while typing or using a dialog.
        </li>
        <li>
          Closing the playtester keeps this game while the deck page stays open.
          Restart uses the latest deck. Refreshing or leaving the deck page ends
          the practice session.
        </li>
      </ul></template
    ></UModal
  >
</template>

<style scoped>
.playtest-field {
  height: clamp(calc(var(--playtest-card-height) + 7rem), 48dvh, 42rem);
  scroll-margin-top: calc(var(--playtest-toolbar-height) + 0.75rem);
}
.playtest-zones {
  display: flex;
  gap: 0.75rem;
  min-width: max-content;
  align-items: stretch;
}
.hand-zone {
  flex: 1 0 20rem;
  width: calc(100vw - 4 * (var(--playtest-card-width) + 2.5rem) - 5rem);
}
.pile-zone {
  flex: 0 0 auto;
  width: calc(var(--playtest-card-width) + 2rem);
}
.pile-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--playtest-card-width);
  aspect-ratio: 488 / 680;
  margin: 7px;
  border: 1px dashed var(--ui-border);
  border-radius: 0.5rem;
}
@media (max-width: 1023px) {
  .playtest-board :deep(button) {
    min-height: 2.75rem;
    min-width: 2.75rem;
  }
  .playtest-field {
    height: clamp(13rem, 32dvh, 24rem);
  }
  .playtest-zones {
    display: block;
    min-width: 0;
    scroll-margin-top: calc(var(--playtest-toolbar-height) + 0.75rem);
  }
  .hand-zone,
  .pile-zone {
    width: 100%;
  }
  .pile-zone {
    display: none;
  }
  .pile-zone.mobile-library {
    display: block;
  }
  .zone-cards {
    display: grid;
    grid-template-columns: repeat(var(--zone-columns), minmax(0, 1fr));
    gap: 3px;
    min-height: 0;
    overflow: visible;
  }
  .zone-cards :deep(.playtest-card) {
    width: 100%;
    max-width: 100px;
    margin: 0;
  }
  .zone-cards :deep(.card-face) {
    min-width: 0;
    min-height: 0;
  }
  .zone-cards > p {
    grid-column: 1 / -1;
  }
  .pile-placeholder {
    margin-inline: auto;
  }
}
@media (max-width: 1023px) and (max-height: 500px) {
  .playtest-toolbar {
    position: static;
  }
  .playtest-field,
  .playtest-zones {
    scroll-margin-top: 0.75rem;
  }
}
</style>
