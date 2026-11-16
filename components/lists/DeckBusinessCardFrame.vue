<script setup lang="ts">
const frame = useTemplateRef('frame');
let observer: ResizeObserver | undefined;

function fitDesktopScreenshot() {
  const card = frame.value?.firstElementChild as HTMLElement | null;
  if (!card || !frame.value) return;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const availableHeight = window.innerHeight - 6 * rem;
  // Keep the portrait proportions on short laptops. Enlarged text can scroll.
  const scale =
    window.innerWidth >= 48 * rem && rem <= 16 && card.offsetHeight
      ? Math.min(1, Math.max(0.75, availableHeight / card.offsetHeight))
      : 1;
  frame.value.style.setProperty('--portrait-scale', String(scale));
}

onMounted(() => {
  fitDesktopScreenshot();
  observer = new ResizeObserver(fitDesktopScreenshot);
  if (frame.value?.firstElementChild)
    observer.observe(frame.value.firstElementChild);
  window.addEventListener('resize', fitDesktopScreenshot);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('resize', fitDesktopScreenshot);
});
</script>

<template>
  <div ref="frame" class="business-card-frame"><slot /></div>
</template>

<style>
@media screen {
  .business-card-frame > article {
    zoom: var(--portrait-scale, 1);
    width: 100%;
    max-width: 24.375rem;
    margin-inline: auto;
    font-family: Arial, sans-serif;
  }
  .business-card-frame > article .business-brand {
    flex-wrap: wrap;
    padding: 0.375rem 0.625rem;
    gap: 0.5rem;
  }
  .business-card-frame > article .business-brand > img {
    width: 3rem;
    height: auto;
  }
  .business-card-frame > article .business-brand strong {
    font-size: 1rem;
  }
  .business-card-frame > article .business-logo {
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  .business-card-frame > article .business-content {
    padding: 0.625rem;
    display: grid;
    grid-template-columns: minmax(0, min(26%, 6rem)) minmax(0, 1fr);
    gap: 0.625rem;
  }
  .business-card-frame > article .business-art {
    width: 100%;
    align-self: start;
  }
  .business-card-frame > article .business-hero-surface {
    width: 100%;
  }
  .business-card-frame > article .business-details {
    display: contents;
  }
  .business-card-frame > article .business-intro {
    min-width: 0;
  }
  .business-card-frame > article .business-details .business-core {
    grid-column: 1 / -1;
    margin: 0;
  }
  .business-card-frame > article .business-meta {
    gap: 0.25rem 0.375rem;
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
  }
  .business-card-frame > article .business-format {
    font-size: 0.75rem;
    white-space: normal;
  }
  .business-card-frame > article .business-colors {
    font-size: 1rem;
  }
  .business-card-frame > article .business-name {
    margin: 0;
    font-size: 1.375rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .business-card-frame > article .business-labels {
    margin-top: 0.375rem;
    gap: 0.25rem;
  }
  .business-card-frame > article .business-labels span {
    padding: 0.0625rem 0.3125rem;
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }
  .business-card-frame > article .business-summary {
    margin-top: 0.375rem;
    font-size: 1rem;
    line-height: 1.3;
  }
  .business-card-frame > article .business-section-title {
    margin: 0 0 0.25rem;
    padding-bottom: 0.125rem;
    font-size: 0.875rem;
  }
  .business-card-frame > article .business-core-grid {
    margin: 0.25rem auto 0;
    max-width: 20rem;
    gap: 0.375rem;
  }
  .business-card-frame > article .business-win-plan,
  .business-card-frame > article .business-charts {
    padding: 0 0.625rem 0.5rem;
  }
  .business-card-frame > article .business-win-plan p {
    margin: 0;
    font-size: 1rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .business-card-frame > article footer {
    padding: 0.375rem 0.625rem;
    font-size: 0.75rem;
    overflow-wrap: anywhere;
  }
}
</style>
