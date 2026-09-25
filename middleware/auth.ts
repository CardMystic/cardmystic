export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return; // don't redirect during SSR
  const { userProfile, loading, fetchUser } = useUserProfile();

  // A slow session lookup is still pending authentication, not a logout.
  // Join the existing query (including retries) before deciding to redirect.
  if (loading.value) {
    await fetchUser({ cancelRefetch: false });
  }

  if (!userProfile.value) {
    return navigateTo('/');
  }
});
