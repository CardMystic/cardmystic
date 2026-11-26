import { afterEach, expect, it, vi } from 'vitest';
import { createSearchResultVisibility } from '~/composables/useSearchResultVisibility';

afterEach(() => vi.unstubAllGlobals());

it('shares one observer and mounts each visible result only once', () => {
  let callback!: IntersectionObserverCallback;
  const observer = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
  const constructor = vi.fn(function (onEntries: IntersectionObserverCallback) {
    callback = onEntries;
    return observer;
  });
  vi.stubGlobal('IntersectionObserver', constructor);
  const visibility = createSearchResultVisibility();
  const elements = Array.from({ length: 200 }, () => ({}) as Element);
  const show = elements.map(() => vi.fn());
  const stop = elements.map((element, index) =>
    visibility.observe(element, show[index]),
  );
  expect(constructor).toHaveBeenCalledOnce();
  expect(observer.observe).toHaveBeenCalledTimes(200);
  const entries = [
    { target: elements[0], isIntersecting: true },
    { target: elements[1], isIntersecting: false },
    { target: elements[2], isIntersecting: true },
  ] as IntersectionObserverEntry[];
  stop[2]();
  callback(entries, observer as unknown as IntersectionObserver);
  callback(entries, observer as unknown as IntersectionObserver);
  expect(show[0]).toHaveBeenCalledOnce();
  expect(show[1]).not.toHaveBeenCalled();
  expect(show[2]).not.toHaveBeenCalled();
  visibility.disconnect();
  expect(observer.disconnect).toHaveBeenCalledOnce();
});

it('renders immediately when observers are unavailable', () => {
  vi.stubGlobal('IntersectionObserver', undefined);
  const show = vi.fn();
  const stop = createSearchResultVisibility().observe({} as Element, show);
  expect(show).toHaveBeenCalledOnce();
  expect(stop).not.toThrow();
});
