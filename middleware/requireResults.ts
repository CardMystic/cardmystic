// middleware/requireCard.ts
export default defineNuxtRouteMiddleware(() => {
  const searchStore = useSearchStore();

  if (searchStore.results.length == 0) {
    return navigateTo('/');
  }
});
