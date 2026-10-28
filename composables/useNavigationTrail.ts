import { readonly } from 'vue';
import type { NavigationTrailEntry } from '../utils/navigation-trail';

export function useNavigationTrail() {
  const entries = useState<NavigationTrailEntry[]>(
    'navigation-trail',
    () => [],
  );

  const labels = useState<Record<string, string>>(
    'navigation-labels',
    () => ({}),
  );

  function setCardLabel(oracleId: string, label: string) {
    const path = `/card/${oracleId}`;
    labels.value[path] = label;
    if (
      !entries.value.some(
        (entry) => entry.path === path && entry.label !== label,
      )
    )
      return;
    entries.value = entries.value.map((entry) =>
      entry.path === path ? { ...entry, label } : entry,
    );
  }

  return { entries: readonly(entries), labels: readonly(labels), setCardLabel };
}
