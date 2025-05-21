// middleware/requireCard.ts
export default defineNuxtRouteMiddleware(() => {
  const cardStore = useCardStore();

  if (!cardStore.card) {
    return navigateTo('/');
  }
});
