import { computed, shallowRef } from 'vue';
import type { AnalysisCard } from '~/utils/deckAnalysis';
import {
  createPlaytest,
  playtestAction,
  type PlaytestState,
  type PlaytestAction,
  type CardDefinitions,
} from '~/utils/playtest';

export function usePlaytest() {
  const state = shallowRef<PlaytestState | null>(null);
  const definitions = shallowRef<CardDefinitions>({});
  const past = shallowRef<PlaytestState[]>([]);
  const future = shallowRef<PlaytestState[]>([]);
  function start(entries: AnalysisCard[], format: string) {
    const game = createPlaytest(entries, format);
    state.value = game.state;
    definitions.value = game.definitions;
    past.value = [];
    future.value = [];
  }
  function act(action: PlaytestAction) {
    if (!state.value) return;
    const next = playtestAction(state.value, action, definitions.value);
    if (next === state.value) return;
    past.value = [...past.value.slice(-49), state.value];
    state.value = next;
    future.value = [];
  }
  function undo() {
    if (!state.value || !past.value.length) return;
    future.value = [...future.value, state.value];
    state.value = past.value[past.value.length - 1];
    past.value = past.value.slice(0, -1);
  }
  function redo() {
    if (!state.value || !future.value.length) return;
    past.value = [...past.value, state.value];
    state.value = future.value[future.value.length - 1];
    future.value = future.value.slice(0, -1);
  }
  return {
    state,
    definitions,
    start,
    act,
    undo,
    redo,
    canUndo: computed(() => !!past.value.length),
    canRedo: computed(() => !!future.value.length),
  };
}
