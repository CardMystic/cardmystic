import { nextTick } from 'vue';

/** Keep keyboard focus in the panel when a successful action removes its card. */
export function captureSuggestionFocus(section: HTMLElement | null) {
  const trigger = document.activeElement as HTMLElement | null;
  const restore =
    !!trigger?.matches('[data-suggestion-action]') &&
    !!section?.contains(trigger);
  return async () => {
    await nextTick();
    if (
      !restore ||
      !section?.isConnected ||
      (document.activeElement !== document.body &&
        document.activeElement !== trigger)
    )
      return;
    const next = trigger?.isConnected
      ? trigger
      : (section.querySelector<HTMLElement>(
          '[data-suggestion-action]:not([disabled])',
        ) ?? section);
    next?.focus();
  };
}
