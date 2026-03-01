export default defineNuxtRouteMiddleware(async (to, from) => {
  if (import.meta.server) return; // don't redirect during SSR
  const { userProfile, loading } = useUserProfile();

  // Wait for user data to load
  if (loading.value) {
    await new Promise((resolve) => {
      const unwatch = watch(loading, (isLoading) => {
        if (!isLoading) {
          unwatch();
          resolve(undefined);
        }
      });
    });
  }

  // Redirect to home if not authenticated
  if (!userProfile.value) {
    return navigateTo('/');
  }
});
