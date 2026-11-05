import type { InjectionKey, Ref } from 'vue';

interface MultiTagSelection {
  active: Ref<boolean>;
  selected: Ref<Set<string>>;
  saving: Ref<boolean>;
  close: () => void;
}
const multiTagKey: InjectionKey<MultiTagSelection> = Symbol('multiTag');
export function provideMultiTag() {
  const active = ref(false);
  const selected = ref(new Set<string>());
  const saving = ref(false);
  const state = {
    active,
    selected,
    saving,
    close() {
      if (saving.value) return;
      active.value = false;
      selected.value = new Set();
    },
  };
  provide(multiTagKey, state);
  return state;
}
export function useMultiTag() {
  return inject(multiTagKey, null);
}
