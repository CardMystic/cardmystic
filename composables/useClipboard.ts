// /composables/useClipboard.ts
import { computed, onMounted } from 'vue';

export type CardClip = {
  id: string;
  name: string;
  set?: string;
  imageUrl?: string;
};

const STORAGE_KEY = 'cm.clipboard.v1';

type PersistShape = {
  items: Record<string, CardClip>;
  order: string[];
};

export function useClipboard() {
  // Global, SSR-safe state
  const items = useState<Record<string, CardClip>>(
    'clipboard:items',
    () => ({}),
  );
  const order = useState<string[]>('clipboard:order', () => []);
  const capacity = useState<number>('clipboard:cap', () => 500);

  // One-time guards (also SSR-safe)
  const hydrated = useState<boolean>('clipboard:hydrated', () => false);
  const listenerAttached = useState<boolean>('clipboard:listener', () => false);

  // Derived
  const count = computed(() => order.value.length);
  const list = computed(() =>
    order.value.map((id) => items.value[id]).filter(Boolean),
  );
  const has = (id: string) => !!items.value[id];

  // Persistence
  function persist() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: items.value,
          order: order.value,
        } as PersistShape),
      );
    } catch {
      /* ignore quota/serialization errors */
    }
  }

  function hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistShape>;
        items.value = parsed.items ?? {};
        order.value = parsed.order ?? [];
      }
    } catch {
      /* ignore parse errors */
    }
    hydrated.value = true;
  }

  function attachListener() {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as PersistShape;
        items.value = parsed.items ?? {};
        order.value = parsed.order ?? [];
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    listenerAttached.value = true;
  }

  // Actions
  function add(card: CardClip) {
    if (!card?.id || has(card.id)) return;
    if (order.value.length >= capacity.value) {
      const oldest = order.value.shift();
      if (oldest) delete items.value[oldest];
    }
    items.value[card.id] = card;
    order.value.push(card.id);
    persist();
  }

  function remove(id: string) {
    if (!has(id)) return;
    delete items.value[id];
    const i = order.value.indexOf(id);
    if (i !== -1) order.value.splice(i, 1);
    persist();
  }

  function toggle(card: CardClip) {
    has(card.id) ? remove(card.id) : add(card);
  }

  function clear() {
    items.value = {};
    order.value = [];
    persist();
  }

  function setCapacity(n: number) {
    capacity.value = Math.max(0, n | 0);
    while (order.value.length > capacity.value) {
      const oldest = order.value.shift();
      if (oldest) delete items.value[oldest];
    }
    persist();
  }

  // Client-only work without process.client (no deprecation warnings)
  onMounted(() => {
    if (!hydrated.value) hydrate();
    if (!listenerAttached.value) attachListener();
  });

  return {
    // state
    items,
    order,
    capacity,
    // derived
    count,
    list,
    has,
    // actions
    add,
    remove,
    toggle,
    clear,
    setCapacity,
  };
}
