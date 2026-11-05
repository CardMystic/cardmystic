<script setup lang="ts">
import type { ScryfallCard } from '~/models/cardModel';
import type { PlaytestCard, PlaytestDrag } from '~/utils/playtest';
import { getCardImageUrl } from '~/utils/scryfall';

const props = defineProps<{
  instance: PlaytestCard;
  card?: ScryfallCard;
  name: string;
  tappable?: boolean;
}>();
const emit = defineEmits<{
  tap: [];
  options: [];
  hover: [id: string | null];
}>();
const image = computed(() =>
  props.card ? getCardImageUrl(props.card, !!props.instance.face) : '',
);
let hold: ReturnType<typeof setTimeout> | undefined;
let origin = { x: 0, y: 0 };
let suppressClick = false;
let dragging = false;
let pointerActive = false;
let dragOrigin = { offsetX: 0, offsetY: 0, width: 90 };
const touchDrag = inject<((event: PlaytestDrag) => void) | undefined>(
  'playtestDrag',
  undefined,
);
const touch = ref(false);
function cancelHold() {
  clearTimeout(hold);
  hold = undefined;
}
function pointerDown(event: PointerEvent) {
  cancelHold();
  suppressClick = false;
  touch.value = event.pointerType !== 'mouse';
  if (!touch.value || event.button !== 0) return;
  pointerActive = true;
  dragging = false;
  const target = event.currentTarget as HTMLElement;
  const rect = target.closest('.playtest-card')!.getBoundingClientRect();
  dragOrigin = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
  };
  if (target.hasPointerCapture?.(event.pointerId) === false) {
    try {
      target.setPointerCapture(event.pointerId);
    } catch {
      /* Synthetic events have no active pointer. */
    }
  }
  origin = { x: event.clientX, y: event.clientY };
  hold = setTimeout(() => {
    suppressClick = true;
    emit('options');
  }, 450);
}
function pointerMove(event: PointerEvent) {
  if (!pointerActive || (suppressClick && !dragging)) return;
  if (
    !dragging &&
    Math.hypot(event.clientX - origin.x, event.clientY - origin.y) <= 10
  )
    return;
  cancelHold();
  dragging = true;
  suppressClick = true;
  touchDrag?.({
    id: props.instance.id,
    x: event.clientX,
    y: event.clientY,
    ...dragOrigin,
    phase: 'move',
  });
}
function pointerEnd(event: PointerEvent, cancelled = false) {
  cancelHold();
  if (
    pointerActive &&
    !dragging &&
    !suppressClick &&
    !cancelled &&
    props.tappable
  ) {
    // Handle a short touch directly; browsers can omit the synthetic click
    // immediately after a drag. Suppress it so a tap cannot fire twice.
    suppressClick = true;
    emit('tap');
  }
  if (dragging)
    touchDrag?.({
      id: props.instance.id,
      x: event.clientX,
      y: event.clientY,
      ...dragOrigin,
      phase: cancelled ? 'cancel' : 'end',
    });
  dragging = false;
  pointerActive = false;
}
function touchEnd(event: TouchEvent) {
  // The modal can appear under the finger before it lifts. Cancel the synthetic
  // click at its source so it cannot activate a newly revealed modal button.
  if (suppressClick && event.cancelable) event.preventDefault();
  cancelHold();
}
function activate(event: MouseEvent) {
  if (suppressClick && event.detail !== 0) return;
  if (props.tappable) emit('tap');
  else emit('options');
}
function context(event: MouseEvent) {
  event.preventDefault();
  cancelHold();
  if (!suppressClick) {
    suppressClick = true;
    emit('options');
  }
}
function drag(event: DragEvent) {
  cancelHold();
  suppressClick = true;
  const rect = (event.currentTarget as HTMLElement)
    .closest('.playtest-card')!
    .getBoundingClientRect();
  event.dataTransfer?.setData(
    'application/x-cardmystic-playtest',
    props.instance.id,
  );
  event.dataTransfer?.setData(
    'application/x-cardmystic-playtest-offset',
    JSON.stringify({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      width: rect.width,
    }),
  );
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}
onBeforeUnmount(cancelHold);
</script>

<template>
  <div
    class="playtest-card relative shrink-0"
    :data-instance="instance.id"
    :data-tapped="instance.tapped"
    @mouseenter="emit('hover', instance.id)"
    @mouseleave="emit('hover', null)"
  >
    <button
      type="button"
      class="card-face relative block w-full rounded-lg border border-default bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
      :class="{ 'is-tapped': instance.tapped }"
      :aria-label="
        tappable
          ? `${instance.tapped ? 'Untap' : 'Tap'} ${name}`
          : `Options for ${name}`
      "
      :aria-pressed="tappable ? instance.tapped : undefined"
      :draggable="!touch"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerEnd($event)"
      @touchend="touchEnd"
      @pointercancel="pointerEnd($event, true)"
      @pointerleave="cancelHold"
      @click="activate"
      @contextmenu="context"
      @dragstart="drag"
      @keydown.enter.shift.prevent="emit('options')"
    >
      <div
        v-if="instance.faceDown"
        class="flex h-full items-center justify-center rounded-lg border-4 border-primary/40 bg-primary/10 px-2 text-sm font-semibold"
      >
        Face down
      </div>
      <img
        v-else-if="image"
        :src="image"
        :alt="name"
        width="146"
        height="204"
        class="h-full w-full rounded-lg object-cover"
        draggable="false"
      />
      <div
        v-else
        class="flex h-full flex-col justify-between rounded-lg border-4 border-primary/30 p-2 text-left"
      >
        <span class="text-sm font-semibold leading-tight break-words">{{
          name
        }}</span>
        <span v-if="instance.token" class="text-xs"
          >{{ instance.token.type }}<br />{{
            instance.token.power && instance.token.toughness
              ? `${instance.token.power}/${instance.token.toughness}`
              : ''
          }}</span
        >
      </div>
      <span
        v-if="instance.token"
        class="absolute bottom-1 left-1 rounded bg-black/80 px-1 text-[10px] text-white"
        >Token</span
      >
    </button>
    <div
      v-if="Object.keys(instance.counters).length"
      class="absolute bottom-1 right-1 flex max-w-full flex-col items-end gap-0.5 pointer-events-none"
    >
      <span
        v-for="(count, label) in instance.counters"
        :key="label"
        class="max-w-full truncate rounded bg-primary px-1 text-xs font-bold text-inverted"
        >{{ count }} {{ label }}</span
      >
    </div>
    <span v-if="instance.tapped" class="sr-only">Tapped</span>
  </div>
</template>

<style scoped>
.playtest-card {
  width: var(--playtest-card-width, 100px);
  margin: 7px;
}
.card-face {
  aspect-ratio: 488 / 680;
  transition: transform 120ms ease;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
.is-tapped {
  transform: rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  .card-face {
    transition: none;
  }
}
</style>
