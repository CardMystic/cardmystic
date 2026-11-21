export type CardSize = 'large' | 'medium' | 'small';

export function useCardSize() {
  const size = useState<CardSize>('card-size', () => 'medium');
  onMounted(() => {
    try {
      const saved = localStorage.getItem('cm.card-size');
      if (saved === 'large' || saved === 'medium' || saved === 'small')
        size.value = saved;
    } catch {
      /* Storage may be unavailable. */
    }
  });
  function setSize(value: CardSize) {
    size.value = value;
    try {
      localStorage.setItem('cm.card-size', value);
    } catch {
      /* Keep the current selection. */
    }
  }
  return { size, setSize };
}
