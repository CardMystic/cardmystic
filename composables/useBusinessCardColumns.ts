export function useBusinessCardColumns() {
  const columns = ref<HTMLElement | null>(null);
  const details = ref<HTMLElement | null>(null);
  let observer: ResizeObserver | undefined;
  let frame = 0;
  let previousSize = '';

  function fitColumns() {
    const container = columns.value;
    const content = details.value;
    if (!container || !content) return;
    const style = getComputedStyle(container);
    if (style.gridTemplateColumns.split(' ').length < 2) {
      container.style.removeProperty('--business-art-width');
      previousSize = '';
      return;
    }
    const available =
      container.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      parseFloat(style.columnGap);
    const size = `${available}:${content.getBoundingClientRect().height}`;
    if (size === previousSize || available <= 0) return;

    // Balance the image's natural aspect ratio against the text and core cards.
    // Keep at least half the row for details when unusually long copy cannot fit.
    let low = available * 0.28;
    let high = available * 0.5;
    let bestWidth = low;
    let bestDifference = Infinity;
    for (let step = 0; step < 12; step++) {
      const width = (low + high) / 2;
      container.style.setProperty('--business-art-width', `${width}px`);
      const difference =
        content.getBoundingClientRect().height - (width * 680) / 488;
      if (Math.abs(difference) < bestDifference) {
        bestDifference = Math.abs(difference);
        bestWidth = width;
      }
      if (difference > 0) low = width;
      else high = width;
    }
    container.style.setProperty('--business-art-width', `${bestWidth}px`);
    previousSize = `${available}:${content.getBoundingClientRect().height}`;
  }

  onMounted(() => {
    fitColumns();
    observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fitColumns);
    });
    if (columns.value) observer.observe(columns.value);
    if (details.value) observer.observe(details.value);
  });
  onBeforeUnmount(() => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
  });
  return { columns, details };
}
