export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return; // don't redirect during SSR
  const { userProfile, loading } = useUserProfile();

  // If auth state is known immediately, act on it
  if (!loading.value) {
    if (!userProfile.value) {
      return navigateTo('/');
    }
    return;
  }

  // Auth state still loading — wait up to 3 seconds, then redirect if unresolved
  await Promise.race([
    new Promise<void>((resolve) => {
      const unwatch = watch(loading, (isLoading) => {
        if (!isLoading) {
          unwatch();
          resolve();
        }
      });
    }),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);

  // Redirect to home if not authenticated
  if (!userProfile.value) {
    return navigateTo('/');
  }
});
